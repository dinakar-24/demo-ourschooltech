import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const schoolCode = url.searchParams.get("school");

  if (!schoolCode) {
    return new Response("Missing ?school= parameter", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc("get_school_by_code", {
    _code: schoolCode,
  });

  if (error || !data) {
    return new Response("School not found", { status: 404, headers: corsHeaders });
  }

  const school = data as {
    id: string;
    name: string;
    code: string;
    subdomain: string;
    logo: string | null;
    app_display_name: string | null;
    is_active: boolean;
  };

  if (!school.is_active) {
    return new Response("School is inactive", { status: 404, headers: corsHeaders });
  }

  const displayName = escapeHtml(school.app_display_name || school.name);
  const description = escapeHtml(`${school.app_display_name || school.name} - School Portal`);
  const subdomain = school.subdomain || school.code.toLowerCase();
  const schoolUrl = `https://${subdomain}.ourschooltech.com`;
  const image = school.logo || `${schoolUrl}/favicon.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${displayName}</title>
  <meta property="og:title" content="${displayName}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(schoolUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${displayName}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${displayName}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(schoolUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(schoolUrl)}">${displayName}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
