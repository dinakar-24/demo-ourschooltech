

# Performance Optimization Plan — Round 2

## What's Already Done
- Optimistic UI on attendance + announcement deletion
- Sidebar hover prefetch
- Post-login chunk preloading
- Skeleton UI on admin dashboard
- Global React Query config (5min stale, no window refocus)
- Server-side RPCs for dashboard stats, fee stats, attendance summary

---

## Remaining Bottlenecks (Ordered by Impact)

### 1. Replace `select('*')` with explicit columns — 20 hooks affected

**Problem**: 20 hooks use `select('*')`, fetching every column including unused ones like `created_at`, `updated_at`, `address`, `blood_group`. This wastes bandwidth especially on mobile.

**Fix**: Replace with explicit column lists in each hook:

| Hook | Current | Optimized Select |
|------|---------|-----------------|
| `useStudents` | `select('*')` | `select('id,full_name,class_name,section,roll_number,admission_number,status,avatar_url,parent_name,parent_phone,gender,date_of_birth', {count:'exact'})` |
| `useTeachers` | `select('*')` | `select('id,full_name,email,phone,employee_id,subjects,classes,user_id', {count:'exact'})` |
| `useStudentProfile` | `select('*')` | `select('id,full_name,class_name,section,roll_number,admission_number,school_id,avatar_url,parent_name,parent_phone,parent_email,date_of_birth,gender,blood_group,address,alternate_phone')` (needs all — keep as-is) |
| `useGallery` albums | `select('*')` | `select('id,name,description,event_date,cover_image_url,school_id,created_at')` |
| `useGallery` items | `select('*')` | `select('id,album_id,file_url,file_type,caption,display_order')` |
| `useTransport` | `select('*')` | `select('id,route_name,vehicle_number,driver_name,driver_phone,stops,school_id')` |
| `useFeedback` | `select('*')` | `select('id,user_id,school_id,category,message,status,created_at')` |
| `useClasses` | `select('*')` | `select('id,name,display_order,school_id')` |
| `useSubscription` | `select('*')` | `select('id,school_id,plan,status,start_date,end_date,max_students')` |
| `useOnlineClasses` | Already has join — keep `*` with teacher join |
| `useStudentAnnouncements` | `select('*')` | `select('id,title,content,target_classes,created_at,image_url')` |
| `useParentData` announcements | `select('*')` | Same as above |
| `useParentData` fees | `select('*')` | `select('id,fee_type,amount,due_date,status,paid_date,receipt_number')` |
| `useSupportQueries` | `select('*')` | `select('id,user_id,school_id,subject,message,status,priority,created_at')` |
| `useStudentStats` | `select('*', head:true)` | Already head-only, fine |

**Files**: ~15 hook files

---

### 2. Fix `useStudentHomework` — 3 sequential DB calls → 1

**Problem**: Makes 3 serial queries: profile → class lookup → homework fetch. Each round-trip adds ~100-200ms.

**Fix**: Combine into a single query by storing `school_id` from auth context (already available) and looking up class by name in one step, or better — use a single RPC.

Simpler approach: The student profile is already fetched by `useStudentProfile`. Pass `school_id` from that instead of re-fetching profile. Then use Promise.all for class+homework:

```typescript
// Before: 3 serial queries
const { data: profile } = await supabase.from('profiles').select('school_id')...
const { data: classData } = await supabase.from('classes').select('id')...
const { data } = await supabase.from('homework').select(...)...

// After: Accept schoolId as param, 2 queries in parallel where possible
// Or single query joining homework → classes by name match
```

**File**: `src/hooks/useStudentData.ts`

---

### 3. Optimistic UI on more mutations

**Problem**: Create/update/delete for students, teachers, homework, fees, online classes all wait for API response before updating UI.

**Fix**: Add `onMutate` optimistic updates to the highest-frequency mutations:
- `useCreateHomework` / `useDeleteHomework`
- `useCreateOnlineClass` / `useDeleteOnlineClass`  
- `useCreateAnnouncement`
- `markAllRead` in notifications (instant badge clear)

**Files**: `useHomework.ts`, `useOnlineClasses.ts`, `useAnnouncements.ts`, `useNotifications.ts`

---

### 4. Teachers hook — eliminate N+1 avatar query

**Problem**: `useTeachers` fetches all teachers, then makes a SECOND query to `profiles` table to get avatar URLs. This is an N+1 pattern.

**Fix**: Store `avatar_url` directly on the `teachers` table (add column via migration), or join `profiles` in the original query:

```sql
-- Option A: Add avatar_url to teachers table
ALTER TABLE teachers ADD COLUMN avatar_url text;

-- Option B: Use a view or RPC that joins
```

Simpler immediate fix: Join profiles in the query itself:
```typescript
.select('id,full_name,email,phone,employee_id,subjects,classes,user_id, profile:profiles!teachers_user_id_fkey(avatar_url)')
```

**File**: `src/hooks/useTeachers.ts`

---

### 5. `markAllRead` notifications — missing user_id filter

**Problem** (line 55-58 of `useNotifications.ts`):
```typescript
.update({ is_read: true })
.eq('is_read', false)  // No user_id filter!
```
This updates ALL users' unread notifications — a data leak bug AND a slow full-table scan.

**Fix**: Add `.eq('user_id', user.id)` filter.

**File**: `src/hooks/useNotifications.ts`

---

### 6. Mobile prefetch — add `onTouchStart` to MobileNav

**Problem**: `prefetchForPath` only works on desktop (mouseEnter on Sidebar). Mobile users get no prefetching.

**Fix**: Add `onTouchStart` handler to MobileNav links to trigger the same prefetch logic.

**File**: `src/components/layout/MobileNav.tsx`

---

### 7. Notification realtime — add optimistic insert to cache

**Problem**: Realtime subscription calls `invalidateQueries` on every INSERT, causing a full re-fetch. For a notification badge, this is wasteful.

**Fix**: Instead of invalidating, append the new notification directly to the cache:
```typescript
.on('postgres_changes', ..., (payload) => {
  queryClient.setQueryData(['notifications', user.id], (old) => 
    [payload.new, ...(old || [])].slice(0, 50)
  );
})
```

**File**: `src/hooks/useNotifications.ts`

---

### 8. Add skeleton loading to more pages

**Problem**: Students, Teachers, Fees pages show no visual feedback while loading.

**Fix**: Add skeleton cards/rows to `StudentsPage`, `TeachersPage`, `FeesPage` list views.

**Files**: `src/pages/admin/StudentsPage.tsx`, `TeachersPage.tsx`, `FeesPage.tsx`

---

## Implementation Order

1. **Fix `markAllRead` missing user_id** (security bug — highest priority)
2. **Replace `select('*')` in 15 hooks** (biggest bandwidth reduction)
3. **Fix `useStudentHomework` 3→1 queries** (latency reduction)
4. **Eliminate teacher avatar N+1** (remove extra DB call)
5. **Optimistic UI on notifications markAllRead** (instant badge clear)
6. **Notification realtime cache append** (eliminate re-fetch)
7. **Mobile prefetch via onTouchStart** (mobile performance)
8. **Skeleton loading on list pages** (perceived performance)

## Files Modified
- `src/hooks/useNotifications.ts` (items 1, 5, 6)
- `src/hooks/useStudentData.ts` (item 3)
- `src/hooks/useStudents.ts` (item 2)
- `src/hooks/useTeachers.ts` (items 2, 4)
- `src/hooks/useFees.ts` (item 2)
- `src/hooks/useGallery.ts` (item 2)
- `src/hooks/useTransport.ts` (item 2)
- `src/hooks/useFeedback.ts` (item 2)
- `src/hooks/useClasses.ts` (item 2)
- `src/hooks/useSubscription.ts` (item 2)
- `src/hooks/useParentData.ts` (item 2)
- `src/hooks/useSupportQueries.ts` (item 2)
- `src/hooks/useHomework.ts` (item 2)
- `src/components/layout/MobileNav.tsx` (item 7)
- `src/pages/admin/StudentsPage.tsx` (item 8)
- `src/pages/admin/TeachersPage.tsx` (item 8)
- `src/pages/admin/FeesPage.tsx` (item 8)

