

## Fix: Instant School Logo Loading on Login

### Problem
The school logo loads late because it requires **two sequential network calls**:
1. `lookup_user_by_email` -- returns school info but only a boolean `has_logo` (not the actual URL)
2. `get_school_logo_by_id` -- a second call to fetch the logo URL

For 100+ schools and 200K+ users, this extra round-trip adds noticeable delay.

### Solution
Include the logo URL directly in the first `lookup_user_by_email` response, eliminating the second network call entirely. The logo image will start loading immediately when the password step renders.

### Changes

**1. Update the `lookup_user_by_email` database function**
- Add `logo_url` field (the actual URL) to the JSON response alongside the existing `has_logo` boolean
- This is a zero-cost change since the query already joins the `schools` table

**2. Update `LoginPage.tsx` -- PasswordStep component**
- Use `schoolInfo.logo_url` directly instead of making a second RPC call
- Remove the `useEffect` that calls `get_school_logo_by_id`
- Preload the logo image during the email lookup phase (while user types password) using an `Image()` prefetch
- The logo will already be in the browser cache by the time the password step renders

### Technical Details

Database migration (SQL):
```sql
-- Add logo_url directly to lookup response
-- Change: 'has_logo', (s.logo IS NOT NULL AND s.logo <> '')
-- To also include: 'logo_url', s.logo
```

Frontend changes in `src/pages/LoginPage.tsx`:
- Remove the lazy-load `useEffect` with `get_school_logo_by_id` RPC call
- Set `logoUrl` directly from `schoolInfo.logo_url`
- Add image prefetch in `handleEmailSubmit` so the browser downloads the logo while the user is transitioning to the password step

### Result
- One network call instead of two
- Logo appears instantly when password step opens
- No visible loading/fade-in delay for the school logo

