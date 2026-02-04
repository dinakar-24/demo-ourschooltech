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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
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

    // Check if this email is associated with a super_admin role
    // First, find user by email in profiles
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let isSuperAdmin = false;
    let needsPasswordSetup = true;
    let existingUser = null;

    if (profileData) {
      // Check if this user has super_admin role
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", profileData.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleData) {
        isSuperAdmin = true;
        
        // Get user from auth to check last sign in
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser?.last_sign_in_at) {
          needsPasswordSetup = false;
        }
      }
    } else {
      // Check if this is a designated super admin email that hasn't been set up yet
      // For initial setup, we allow specific pre-registered super admin emails
      // This check uses the user_roles table to see if any entry exists for this email
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", existingUser.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (roleData) {
          isSuperAdmin = true;
          needsPasswordSetup = !existingUser.last_sign_in_at;
        }
      }
    }

    // For very first super admin setup, allow the initial email
    const initialSuperAdminEmail = "admin@ourschooltech.com";
    if (!isSuperAdmin && email.toLowerCase() === initialSuperAdminEmail.toLowerCase()) {
      isSuperAdmin = true;
      needsPasswordSetup = true;
    }

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "This email is not registered as a Super Admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate any existing unused OTPs for this email
    await supabaseAdmin
      .from("super_admin_otp")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Store the new OTP
    const { error: insertError } = await supabaseAdmin
      .from("super_admin_otp")
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP generated for ${email}: ${otpCode}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        needsPasswordSetup,
        // Always include OTP for now since email delivery isn't configured
        debugOtp: otpCode
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
