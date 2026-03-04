import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user exists in auth
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: "No account found with this email address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure user is NOT a super_admin (they have their own flow)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", existingUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleData) {
      return new Response(
        JSON.stringify({ error: "Super Admins must use the dedicated login flow" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: max 3 OTP requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from("password_reset_otp")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again after some time." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate existing unused OTPs
    await supabaseAdmin
      .from("password_reset_otp")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Store new OTP
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_otp")
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

    // Send OTP via SMTP
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
      subject: "Password Reset OTP - OurSchoolTech",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a2e; font-size: 22px; margin: 0;">OurSchoolTech</h1>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Password Reset Verification</p>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 28px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Your password reset verification code is:</p>
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

    console.log(`Password reset OTP sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to your email" }),
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
