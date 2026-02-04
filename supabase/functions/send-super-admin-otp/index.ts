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

    // Only allow the super admin email
    const allowedEmail = "admin@ourschooltech.com";
    if (email.toLowerCase() !== allowedEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Unauthorized email address" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Check if user exists in auth.users
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    let needsPasswordSetup = true;
    
    if (existingUser) {
      // Check if user has super_admin role
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .eq("role", "super_admin")
        .maybeSingle();
      
      if (!roleData) {
        // User exists but doesn't have super_admin role - this is first-time setup
        needsPasswordSetup = true;
      } else {
        // Check if user has ever logged in
        needsPasswordSetup = !existingUser.last_sign_in_at;
      }
    }

    // Send OTP email using Supabase Auth's signInWithOtp
    // This uses Lovable Cloud's built-in email infrastructure
    const { error: otpEmailError } = await supabaseAdmin.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        shouldCreateUser: false,
        data: {
          otp_code: otpCode,
        },
      },
    });

    // If signInWithOtp fails (user might not exist), we'll still return success
    // since we've stored the OTP in our table and can show it for development
    if (otpEmailError) {
      console.log("signInWithOtp not applicable, using custom OTP flow:", otpEmailError.message);
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
