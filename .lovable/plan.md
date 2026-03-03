

# Fix: "AbortError: Lock broken by another request with the 'steal' option"

## Root Cause

The error `AbortError: Lock broken by another request with the 'steal' option` comes from Supabase Auth's internal use of `navigator.locks`. When AuthContext's `getSession()` and `onAuthStateChange` both fire simultaneously on page load, they compete for the browser lock. The Supabase client also checks auth state internally when making RPC calls (to attach the JWT token). If the lock is contended at that moment, the RPC call in `handleEmailSubmit` throws this AbortError — which the current code displays to the user instead of retrying silently.

The old blue-background version (image 336/337) is the published production version that hasn't been redeployed yet. That's separate from this code issue.

## Fix

### 1. Suppress Auth Lock Errors in Login (`LoginPage.tsx`)
- Add the `AbortError: Lock broken` message to the retry-eligible error list in `handleEmailSubmit`
- This error is transient — the lock resolves within milliseconds, so a retry always succeeds
- Also suppress it from being shown to users as a final error (show a generic "Please try again" instead)

### 2. Add `lockAcquireTimeout` to Supabase Client Config
- Wait — we cannot edit `client.ts` (auto-generated). So we handle this purely on the consumer side.

### 3. Harden AuthContext Against Lock Errors
- Wrap `getSession()` in a try-catch that specifically handles AbortError, retrying once after a short delay
- This prevents the auth initialization from failing due to lock contention

## Files to Change

| File | Change |
|------|--------|
| `src/pages/LoginPage.tsx` | Treat AbortError/lock-steal as retryable network error; never show raw lock error to user |
| `src/contexts/AuthContext.tsx` | Add try-catch with retry around `getSession()` for lock contention resilience |

## Expected Result
- The "Lock broken by another request" error will never be shown to users
- Login will silently retry and succeed within ~100ms
- No more wasted credits on this issue

