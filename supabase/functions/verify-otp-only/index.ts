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
    const { email, otp, deviceId } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.toLowerCase();
    const safeDeviceId = typeof deviceId === "string" && deviceId.length > 0 && deviceId.length <= 128 ? deviceId : null;

    // ── Rate limit by EMAIL (max 5 verify attempts per 5 min) ──
    const { data: emailRateLimit } = await supabaseAdmin.rpc("check_email_rate_limit", {
      _email: normalizedEmail,
      _type: "otp_verify",
      _max_attempts: 5,
      _window_minutes: 5,
    });

    if (emailRateLimit && !emailRateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many verification attempts for this email. Please try again later.",
          retry_after_seconds: emailRateLimit.retry_after_seconds,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Rate limit by DEVICE (max 8 verify attempts per 5 min) ──
    if (safeDeviceId) {
      const { data: deviceRateLimit } = await supabaseAdmin.rpc("check_device_rate_limit", {
        _device_id: safeDeviceId,
        _type: "otp_verify",
        _max_attempts: 8,
        _window_minutes: 5,
      });

      if (deviceRateLimit && !deviceRateLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: "Too many attempts from this device. Please try again later.",
            retry_after_seconds: deviceRateLimit.retry_after_seconds,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const otpHash = await hashOtp(otp);

    // Get the latest unused OTP for this email
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from("password_reset_otp")
      .select("id, verification_attempts")
      .eq("email", normalizedEmail)
      .eq("otp_code", otpHash)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      // Check if there's any OTP for this email to increment its attempt counter
      const { data: anyOtp } = await supabaseAdmin
        .from("password_reset_otp")
        .select("id, verification_attempts")
        .eq("email", normalizedEmail)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyOtp) {
        const newAttempts = (anyOtp.verification_attempts || 0) + 1;
        await supabaseAdmin
          .from("password_reset_otp")
          .update({ verification_attempts: newAttempts })
          .eq("id", anyOtp.id);

        // If max attempts (5) reached, invalidate the OTP
        if (newAttempts >= 5) {
          await supabaseAdmin
            .from("password_reset_otp")
            .update({ used: true })
            .eq("id", anyOtp.id);

          return new Response(
            JSON.stringify({ error: "Too many failed attempts. This OTP has been invalidated. Please request a new one." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            error: "Invalid OTP. Please check and try again.",
            remaining_attempts: 5 - newAttempts,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check per-OTP attempt limit
    if ((otpData.verification_attempts || 0) >= 5) {
      await supabaseAdmin
        .from("password_reset_otp")
        .update({ used: true })
        .eq("id", otpData.id);

      return new Response(
        JSON.stringify({ error: "This OTP has been invalidated due to too many attempts. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP verified for ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP verified successfully" }),
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
