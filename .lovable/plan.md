

## Fix: Instant School Branding on Subdomain Page Load

### Problem
When refreshing a subdomain page (e.g., `sse.ourschooltech.com`), the browser tab shows generic "School Portal" until React hydrates and TenantContext resolves the school data. The user sees the generic title and favicon for 1-3 seconds.

### Solution
Add an inline `<script>` block in `index.html` that runs **before React loads**. It:

1. Detects the subdomain from `window.location.hostname`
2. Checks `sessionStorage` for cached tenant data (instant on refresh)
3. If no cache, makes a direct `fetch()` to the PostgREST RPC endpoint (`get_school_by_code`) — no SDK needed
4. Immediately sets `document.title`, favicon, and theme-color meta tag
5. Caches the result in `sessionStorage` for subsequent refreshes
6. Also updates the pre-React loader background color to match the school's branding

Then, when TenantContext resolves (which already does full branding), it takes over seamlessly. The user never sees "School Portal" in the tab.

### Files to modify

| File | Change |
|------|--------|
| `index.html` | Add inline script after the cache-bust script that resolves subdomain branding before React loads. Change default `<title>` to empty/minimal so there's no flash of "School Portal". |
| `src/contexts/TenantContext.tsx` | Write resolved tenant to `sessionStorage` so the inline script can use it on next refresh. |

### Implementation details

**index.html inline script** (runs synchronously before React):
```javascript
(function() {
  var host = location.hostname;
  var base = 'ourschooltech.com';
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;
  if (!host.endsWith('.' + base)) return;
  var sub = host.replace('.' + base, '');
  if (!sub || ['www','app','admin'].indexOf(sub) >= 0) return;

  // Try sessionStorage cache first (instant)
  var cached = sessionStorage.getItem('tenant_' + sub);
  if (cached) {
    try {
      var t = JSON.parse(cached);
      if (t.title) document.title = t.title;
      if (t.logo) { /* update favicon */ }
      if (t.color) { /* update theme-color + loader bg */ }
    } catch(e) {}
    return;
  }

  // Async fetch — updates as soon as response arrives
  var url = 'SUPABASE_URL/rest/v1/rpc/get_school_by_code';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': 'ANON_KEY' },
    body: JSON.stringify({ _code: sub })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (!d) return;
    var title = d.app_display_name || d.name;
    if (title) document.title = title;
    // Cache for next refresh
    sessionStorage.setItem('tenant_' + sub, JSON.stringify({
      title: title, logo: d.logo, color: d.primary_color
    }));
  })
  .catch(function(){});
})();
```

**TenantContext.tsx** — after `setTenant(tenantData)`, write to sessionStorage:
```typescript
sessionStorage.setItem(`tenant_${subdomain}`, JSON.stringify({
  title: tenantData.appDisplayName || tenantData.name,
  logo: tenantData.logo,
  color: tenantData.primaryColor
}));
```

This ensures the first load fetches data (slight delay), but every subsequent refresh is **instant** from cache.

