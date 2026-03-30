

# Performance Optimization — Round 3 (All Areas)

## 1. Database & Query Optimization

### 1a. Add missing indexes for gallery and online_payments
Gallery tables (`gallery_albums`, `gallery_items`) and the new `online_payments` table lack indexes on frequently queried columns.

**Migration SQL:**
```sql
CREATE INDEX IF NOT EXISTS idx_gallery_albums_school ON gallery_albums(school_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_album ON gallery_items(album_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_school ON online_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_invoice ON online_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_status ON online_payments(status);
CREATE INDEX IF NOT EXISTS idx_online_payments_cf_order ON online_payments(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_school_payment_config_school ON school_payment_config(school_id);
```

### 1b. Consolidate parent dashboard queries
`useParentData` makes multiple serial queries. Create an RPC `get_parent_dashboard` that returns child profile + recent announcements + fees summary in one call.

**File**: New RPC via migration + update `src/hooks/useParentData.ts`

---

## 2. Bundle Size & Code Splitting

### 2a. Add Vite `manualChunks` to split vendor libraries
Currently all vendor code lands in one chunk. Split heavy libraries into separate cacheable chunks.

**File**: `vite.config.ts` — add `build.rollupOptions.output.manualChunks`:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu'],
        'vendor-charts': ['recharts'],
        'vendor-pdf': ['jspdf', 'html2canvas'],
        'vendor-excel': ['exceljs'],
        'vendor-motion': ['framer-motion'],
      }
    }
  }
}
```

This ensures heavy libraries like `recharts` (250KB+), `jspdf`, `exceljs`, and `framer-motion` are only loaded when needed and cached independently.

### 2b. Remove duplicate `xlsx` dependency
`package.json` has both `exceljs` and `xlsx`. The codebase migrated to `exceljs` — remove `xlsx` to cut ~300KB.

**File**: `package.json` — remove `"xlsx": "^0.18.5"`

---

## 3. Image & Asset Optimization

### 3a. Add `loading="lazy"` to all images
Only 2 files use `loading="lazy"`. Add it to all `<img>` tags across 37 files — specifically the high-impact ones:
- Gallery items (multiple images per page)
- Student/teacher avatars in lists
- School logos in layouts

**Key files** (highest image density):
- `src/components/gallery/AlbumDetailView.tsx`
- `src/pages/parent/ParentGallery.tsx`
- `src/pages/admin/EmployeeAttendancePage.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/MobileLayout.tsx`
- `src/components/student-dashboard/WelcomeCard.tsx`

### 3b. Add image dimension hints
Add `width` and `height` attributes to known-size images (avatars: 36x36, logos: 48x48) to prevent layout shifts (CLS improvement).

---

## 4. Caching & Offline Support

### 4a. Persist React Query cache to IndexedDB
Add `@tanstack/query-persist-client-core` and `idb-keyval` for offline-first capability. On app load, restore cached data from IndexedDB so returning users see instant content before network responses arrive.

**Files**:
- `package.json` — add `@tanstack/react-query-persist-client`, `idb-keyval`
- `src/App.tsx` — wrap `QueryClientProvider` with `PersistQueryClientProvider`

### 4b. Enhance service worker runtime caching
Current Workbox config only caches Supabase API with `NetworkFirst`. Add:
- **StaleWhileRevalidate** for Google Fonts
- **CacheFirst** for gallery images (they don't change)
- **NetworkFirst** with longer TTL for static school data

**File**: `vite.config.ts` — expand `runtimeCaching` array

### 4c. Remove aggressive no-cache meta tags
`index.html` has `Cache-Control: no-store, no-cache` meta tags that fight against the service worker. Remove them — the service worker and Vite's content-hashed filenames handle cache busting correctly.

**File**: `index.html` — remove lines 17-19

---

## Summary of Files

| File | Changes |
|------|---------|
| `vite.config.ts` | Add manualChunks, expand runtimeCaching |
| `package.json` | Remove xlsx, add persist-client + idb-keyval |
| `index.html` | Remove no-cache meta tags |
| `src/App.tsx` | Wrap with PersistQueryClientProvider |
| `src/hooks/useParentData.ts` | Use consolidated RPC |
| Migration SQL | Add 7 indexes + parent dashboard RPC |
| 10+ component files | Add loading="lazy" + dimensions to images |

## Implementation Order
1. Database indexes + parent dashboard RPC (migration)
2. Bundle splitting (vite.config.ts manualChunks)
3. Remove xlsx from package.json
4. Image lazy loading across components
5. Remove no-cache meta, add persistent query cache
6. Enhance service worker caching rules

