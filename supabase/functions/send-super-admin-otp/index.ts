import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || "unknown";
    const { email, password, resend } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
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

    if (typeof password !== "string" || password.length < 1 || password.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Rate limit: 5 OTP requests per IP per 5 minutes
    const { data: rateLimit } = await supabaseAdmin.rpc("check_rate_limit", {
      _ip: clientIp,
      _type: "otp_request",
      _max_attempts: 5,
      _window_minutes: 5,
    });

    if (rateLimit && !rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Too many attempts. Please try again later.",
          retry_after_seconds: rateLimit.retry_after_seconds 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Check if this email is a super_admin
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let isSuperAdmin = false;
    let needsPasswordSetup = true;
    let existingUser = null;

    if (profileData) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", profileData.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleData) {
        isSuperAdmin = true;
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (existingUser?.last_sign_in_at) {
          needsPasswordSetup = false;
        }
      }
    } else {
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

    // Allow initial super admin setup
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

    // Step 2: Verify password BEFORE sending OTP (skip for initial setup)
    if (!needsPasswordSetup && existingUser) {
      const verifyClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        await verifyClient.auth.signOut();
        return new Response(
          JSON.stringify({ error: "Invalid credentials. Please check your email and password." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await verifyClient.auth.signOut();
    }

    // Step 3: Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate existing unused OTPs
    await supabaseAdmin
      .from("super_admin_otp")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Store hashed OTP
    const { error: insertError } = await supabaseAdmin
      .from("super_admin_otp")
      .insert({
        email: email.toLowerCase(),
        otp_code: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via Hostinger SMTP
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    if (!smtpPassword) {
      console.error("SMTP_PASSWORD not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.hostinger.com",
        port: 465,
        tls: true,
        auth: {
          username: "admin@ourschooltech.com",
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: "OurSchoolTech <noreply@ourschooltech.com>",
      to: email.toLowerCase(),
      subject: "Your Super Admin Login OTP",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a2e; font-size: 22px; margin: 0;">OurSchoolTech</h1>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Super Admin Verification</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 28px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">Your credentials have been verified.</p>
            <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Your one-time verification code is:</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; font-family: 'Courier New', monospace; background: #ffffff; display: inline-block; padding: 12px 28px; border-radius: 8px; border: 2px dashed #cbd5e1;">
              ${otpCode}
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0;">This code expires in <strong>5 minutes</strong>.</p>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
              ⚠️ If you did not request this code, please ignore this email. Never share your OTP with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} OurSchoolTech. All rights reserved.</p>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">support@ourschooltech.in</p>
          </div>
        </div>
      `,
    });

    await client.close();

    console.log(`OTP sent to ${email} via SMTP (credentials verified first)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Credentials verified. OTP sent to your email.",
        needsPasswordSetup,
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
