import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete audit logs older than 12 months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12);

    const { count, error } = await supabaseAdmin
      .from("audit_logs")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      console.error("Cleanup error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also clean up old login attempts (older than 48 hours as extra safety)
    await supabaseAdmin
      .from("login_attempts")
      .delete()
      .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    // Clean up old read notifications (older than 90 days)
    const notifCutoff = new Date();
    notifCutoff.setDate(notifCutoff.getDate() - 90);

    const { count: notifCount } = await supabaseAdmin
      .from("notifications")
      .delete({ count: "exact" })
      .eq("is_read", true)
      .lt("created_at", notifCutoff.toISOString());

    console.log(`Cleanup complete: ${count ?? 0} audit logs, ${notifCount ?? 0} old notifications removed`);

    return new Response(
      JSON.stringify({
        success: true,
        audit_logs_deleted: count ?? 0,
        notifications_deleted: notifCount ?? 0,
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
