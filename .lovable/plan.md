

## Dynamic Open Graph Metadata for School Subdomains

### The Core Challenge

Social crawlers (WhatsApp, Facebook, Twitter) do **not execute JavaScript**. They read raw HTML meta tags from the initial HTTP response. Since this is a client-side SPA served by Lovable's CDN, we cannot intercept the HTML response at the server level to inject dynamic tags before the page reaches the crawler.

**Two-layer approach:**

1. **Client-side meta injection** — Update all OG/Twitter meta tags when tenant resolves. This helps JS-capable platforms (some messaging apps, browsers generating link previews in-app) and ensures tags are correct once the page loads.

2. **Edge function OG proxy** — Create a dedicated endpoint that returns a minimal HTML page with correct OG tags for any school. Social platforms can be pointed to this via `og:url` or a reverse proxy setup.

### Layer 1: Client-Side Meta Tag Injection

**File: `src/contexts/TenantContext.tsx`** — Extend `applyTenantBranding()` to set all OG and Twitter meta tags:

```typescript
// Inside applyTenantBranding():
const schoolUrl = `https://${tenant.subdomain}.ourschooltech.com`;
const description = `${tenant.appDisplayName || tenant.name} - School Portal`;

setMeta('og:title', tenant.appDisplayName || tenant.name);
setMeta('og:description', description);
setMeta('og:image', tenant.logo || '/favicon.png');
setMeta('og:url', schoolUrl);
setMeta('og:type', 'website');
setMeta('og:site_name', tenant.appDisplayName || tenant.name);

setMeta('twitter:title', tenant.appDisplayName || tenant.name);
setMeta('twitter:description', description);
setMeta('twitter:image', tenant.logo || '/favicon.png');
setMeta('twitter:card', 'summary_large_image');

// Remove any platform branding
setMeta('author', tenant.appDisplayName || tenant.name);
```

A helper `setMeta(name, content)` will find-or-create the meta element. Also remove hardcoded "Our School Tech" / "Lovable" references from the tags that get overwritten.

### Layer 2: Edge Function OG Proxy

**File: `supabase/functions/og-metadata/index.ts`** — New edge function

When called with `?school=greenwood`, it:
1. Fetches school data via `get_school_by_code`
2. Returns a minimal HTML page with proper OG tags
3. Includes a redirect to the actual subdomain URL for human visitors

```html
<!-- Returned by edge function -->
<html>
<head>
  <meta property="og:title" content="Greenwood Academy" />
  <meta property="og:description" content="Greenwood Academy - School Portal" />
  <meta property="og:image" content="https://...logo.png" />
  <meta property="og:url" content="https://greenwood.ourschooltech.com" />
  <meta http-equiv="refresh" content="0;url=https://greenwood.ourschooltech.com" />
</head>
</html>
```

This gives a shareable URL (`https://{supabase-url}/functions/v1/og-metadata?school=greenwood`) that renders correct OG tags for any crawler while redirecting humans to the actual app.

### Layer 3: Remove Platform Branding

**File: `index.html`** — Change hardcoded fallback OG tags to be generic (no "Lovable" or "Our School Tech" in the meta tags that subdomain users would see). The client-side injection overwrites these immediately for subdomain access.

### Files to create/modify

| File | Change |
|------|--------|
| `src/contexts/TenantContext.tsx` | Add full OG/Twitter meta tag injection in `applyTenantBranding()` |
| `supabase/functions/og-metadata/index.ts` | **New** — edge function returning OG-compliant HTML |
| `index.html` | Remove "Lovable" branding from fallback meta tags |

### Important Limitation

For WhatsApp/Facebook crawlers to see school-branded previews when sharing the actual subdomain URL (e.g., `greenwood.ourschooltech.com`), a server-side proxy (e.g., Cloudflare Worker) would need to detect crawler user agents and serve the edge function response instead of the SPA. The client-side injection and OG proxy edge function are the best achievable within the current architecture and cover most use cases.

