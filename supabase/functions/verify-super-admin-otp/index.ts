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

    // Mark OTP as used
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
          JSON.stringify({ 
            success: true,
            requiresPassword: true,
            message: "OTP verified. Please create your password."
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      // User exists - check if they need to set password
      const hasLoggedIn = !!user.last_sign_in_at;
      
      if (!hasLoggedIn && !newPassword) {
        return new Response(
          JSON.stringify({ 
            success: true,
            requiresPassword: true,
            message: "OTP verified. Please create your password."
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (newPassword) {
        // Update the password
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
    }

    // Verify user has super_admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      // Add super_admin role if not present
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: user.id, role: "super_admin" });
    }

    // Generate a session for the user
    // Use signInWithPassword to create a session
    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
    });

    if (signInError) {
      console.error("Error generating session:", signInError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: newPassword ? "Password created successfully. You can now login." : "OTP verified successfully.",
        userId: user.id,
        canLogin: true,
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
