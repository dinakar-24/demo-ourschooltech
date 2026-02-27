

## Performance Fix: Sub-Second Email Lookup for 2L+ Users

### Problem Identified
The email lookup (`lookup_user_by_email` RPC) returns the school logo as a **1MB+ base64-encoded string** embedded directly in the response. This massive payload causes slow response times regardless of how fast the database query runs (which is already ~7ms).

### Solution

**1. Create an optimized lookup RPC that excludes the heavy logo**

Update the `lookup_user_by_email` function to return a lightweight `logo_url` (a storage bucket URL) instead of the raw base64 blob. Since some schools store logos as base64, we'll add a flag (`has_logo`) and truncate/omit the base64 data from the lookup response entirely.

- Modify the RPC to return `has_logo: true/false` and a small `school_logo_thumb` (or skip logo entirely in lookup)
- The full logo will be loaded separately via a normal `<img>` tag only on the password step

**2. Two-phase logo loading on the frontend**

- **Phase 1 (Email lookup):** Return all metadata instantly WITHOUT the logo (~1KB response instead of ~1MB). Show a placeholder/initial while transitioning.
- **Phase 2 (Password step):** Load the school logo lazily via a separate lightweight query or directly from the school record, so the transition to the password screen is instant.

### Technical Steps

**Database Migration:**
- Create a new version of `lookup_user_by_email` that excludes `s.logo` from the response and instead returns `has_logo: (s.logo IS NOT NULL)` boolean flag
- Add a new tiny RPC `get_school_logo_by_id(school_id)` that returns just the logo for lazy loading

**Frontend (`LoginPage.tsx`):**
- Remove dependency on `school_logo` from the lookup response for the transition
- Show a letter-avatar placeholder immediately on the password step
- Fetch the logo in the background after the password step renders, then fade it in
- This makes the step transition feel instant

### Expected Impact
- Lookup response drops from ~1MB to ~1KB (1000x smaller)
- Response time drops from potentially seconds to under 100ms
- Password step appears instantly with school name/role badge
- Logo fades in smoothly 200-500ms later

### Files to Modify
- **Database migration**: Update `lookup_user_by_email` RPC, add `get_school_logo_by_id` RPC
- **`src/pages/LoginPage.tsx`**: Lazy-load school logo on password step instead of relying on lookup response

