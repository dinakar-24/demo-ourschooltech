import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from("super_admin_otp")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_code", otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used immediately
    await supabaseAdmin
      .from("super_admin_otp")
      .update({ used: true })
      .eq("id", otpData.id);

    // Check if user exists
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    let user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Create the super admin user if they don't exist
      if (!newPassword) {
        return new Response(
          JSON.stringify({ error: "Password is required for new account setup" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user with password
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: "Super Admin",
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      user = newUserData.user;

      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: "Super Admin" })
        .eq("id", user.id);

      // Insert super_admin role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: user.id, role: "super_admin" });

    } else {
      // User exists
      const hasLoggedIn = !!user.last_sign_in_at;
      
      // If user has never logged in and a new password is provided, set it
      if (!hasLoggedIn && newPassword) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error("Error updating password:", updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Ensure user has super_admin role
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!roleData) {
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: user.id, role: "super_admin" });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        userId: user.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
