const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    // Export public key as raw (uncompressed point)
    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    // Export private key as PKCS8
    const privateKeyPkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyPkcs8)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    return new Response(
      JSON.stringify({
        publicKey: publicKeyB64,
        privateKey: privateKeyB64,
        instructions: "Add publicKey as VAPID_PUBLIC_KEY and privateKey as VAPID_PRIVATE_KEY secrets",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
