import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(otp));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || "unknown";
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    if (typeof email !== "string" || email.length > 254 || !EMAIL_RE.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof otp !== "string" || !OTP_RE.test(otp)) {
      return new Response(
        JSON.stringify({ error: "OTP must be a 6-digit code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword !== undefined && newPassword !== null) {
      if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 200) {
        return new Response(
          JSON.stringify({ error: "Password must be between 8 and 200 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Rate limit: 5 OTP verify attempts per IP per 5 minutes
    const { data: rateLimit } = await supabaseAdmin.rpc("check_rate_limit", {
      _ip: clientIp,
      _type: "otp_verify",
      _max_attempts: 5,
      _window_minutes: 5,
    });

    if (rateLimit && !rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Too many verification attempts. Please try again later.",
          retry_after_seconds: rateLimit.retry_after_seconds 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the submitted OTP and compare against stored hash
    const otpHash = await hashOtp(otp);

    // Verify OTP by hash
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from("super_admin_otp")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_code", otpHash)
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
          JSON.stringify({ error: "Failed to create account. Please try again." }),
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
            JSON.stringify({ error: "Failed to set password. Please try again." }),
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
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
