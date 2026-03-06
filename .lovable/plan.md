

## Centralized Error Handling Refactor

### Problem

Error handling is scattered across 50+ files with inconsistent patterns:
- Edge function errors can surface as `[object ReadableStream]` because `fnError.message` sometimes contains a Response body, not a string
- `error.message` from Supabase Auth returns raw messages like `"Invalid login credentials"` — fine, but inconsistent with other flows
- Each component duplicates error extraction logic for `supabase.functions.invoke()` (see SuperAdminOTPLogin doing it 3 times)
- No centralized mapping from backend error codes to user-friendly messages
- Client-side validation is inconsistent (SuperAdminOTPLogin validates email format, LoginPage does not)

### Plan

#### 1. Create `src/lib/error-utils.ts` — Centralized error handling utility

A single module with:

- **`extractEdgeFunctionError(response)`** — Safely extracts error messages from `supabase.functions.invoke()` responses, handling ReadableStream bodies, JSON parsing failures, and context objects. Returns a clean string, never `[object Object]`.

- **`friendlyErrorMessage(rawError: string)`** — Maps known backend error strings to user-friendly messages:
  | Raw error | Friendly message |
  |-----------|-----------------|
  | `Invalid login credentials` | `Incorrect email or password. Please try again.` |
  | `Invalid or expired OTP` | `The OTP you entered is incorrect or has expired. Please request a new one.` |
  | `Rate limit exceeded` / `Too many attempts` | `Too many attempts. Please wait a few minutes and try again.` |
  | `Email not confirmed` | `Please verify your email address before signing in.` |
  | `User not found` / `No account found` | `No account found with this email address.` |
  | `TIMEOUT` | `Taking too long. Please check your connection and try again.` |
  | Network/fetch errors | `Unable to connect. Please check your internet connection.` |
  | Unknown/empty | `Something went wrong. Please try again or contact support.` |

- **`validateEmail(email: string)`** — Returns error string or null
- **`validatePassword(password: string)`** — Returns error string or null  
- **`validateOTP(otp: string)`** — Returns error string or null

#### 2. Refactor auth-related components to use centralized utils

Files to update:
- **`src/contexts/AuthContext.tsx`** (line 222) — Wrap `error.message` through `friendlyErrorMessage()`
- **`src/pages/LoginPage.tsx`** — Add email validation before RPC, use `friendlyErrorMessage()` in catch blocks
- **`src/components/auth/SuperAdminOTPLogin.tsx`** — Replace the 3 duplicated error extraction blocks with `extractEdgeFunctionError()`, add email/password validation
- **`src/components/auth/ForgotPasswordDialog.tsx`** — Replace manual error parsing in `sendOTP()` and `handleVerifyAndReset()` with `extractEdgeFunctionError()`
- **`src/pages/login/SubdomainLanding.tsx`** — Use `friendlyErrorMessage()` in catch block
- **`src/pages/login/RoleLoginPage.tsx`** — Use `friendlyErrorMessage()` in catch block

#### 3. Refactor hook-level error handling

Files to update:
- **`src/hooks/useManageUser.ts`** — Use `extractEdgeFunctionError()` for the edge function call
- **`src/hooks/useCreateSchoolUser.ts`** — Same pattern
- **`src/hooks/useStudents.ts`** — Same for delete mutation edge function call

#### 4. Key implementation details

The `extractEdgeFunctionError` function will handle the ReadableStream issue:
```typescript
export async function extractEdgeFunctionError(
  response: { data: any; error: any }
): Promise<string | null> {
  const { data, error } = response;
  if (!error && data?.success !== false) return null;
  
  // Handle FunctionsHttpError with context body
  if (error?.context) {
    try {
      const body = typeof error.context.json === 'function' 
        ? await error.context.json() 
        : null;
      if (body?.error) return friendlyErrorMessage(body.error);
    } catch { /* fall through */ }
  }
  
  // Handle string message
  if (error?.message && typeof error.message === 'string' 
      && !error.message.includes('[object')) {
    return friendlyErrorMessage(error.message);
  }
  
  // Handle data-level errors
  if (data?.error) return friendlyErrorMessage(data.error);
  
  return 'Something went wrong. Please try again.';
}
```

This ensures no raw objects, ReadableStreams, or cryptic backend messages ever reach the UI.

