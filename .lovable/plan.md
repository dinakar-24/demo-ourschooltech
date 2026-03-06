

## Centralized API Wrapper Refactor

### Current State

There are **~15 call sites** across 11 files using `supabase.functions.invoke()` directly, with 3 distinct error-handling patterns:
1. **Already uses `extractEdgeFunctionError`** (4 files): `useManageUser`, `useCreateSchoolUser`, `useStudents`, `SuperAdminOTPLogin`, `ForgotPasswordDialog`
2. **Manual `error`/`data.success` checks** (3 files): `useTeachers`, `useSchools`, `StudentsPage`
3. **Minimal/no error handling** (1 file): `send-notification.ts`

Plus `useRazorpay` which has a unique flow (Razorpay checkout callback) that shouldn't be abstracted.

### Plan

#### 1. Create `src/lib/api.ts` — Edge Function wrapper

```typescript
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { timeoutMs?: number }
): Promise<T>
```

- Calls `supabase.functions.invoke()` internally
- Wraps in `Promise.race` with configurable timeout (default 12s)
- Runs response through `extractEdgeFunctionError()` — throws if error found
- Checks `data.success === false` pattern — throws friendly error
- Returns typed `data` on success
- All thrown errors are already user-friendly (via `friendlyErrorMessage`)

#### 2. Refactor call sites (8 files)

| File | Current pattern | Change |
|------|----------------|--------|
| `useManageUser.ts` | `invoke` + `extractEdgeFunctionError` | Replace with `invokeEdgeFunction('manage-user', data)` — remove manual error check |
| `useCreateSchoolUser.ts` | Same | Same simplification |
| `useStudents.ts` (delete) | Same | Same |
| `useTeachers.ts` (delete) | Manual `error`/`data.success` check | Replace with `invokeEdgeFunction` |
| `useSchools.ts` (delete + toggle) | Manual check | Replace both calls |
| `SuperAdminOTPLogin.tsx` | 3 calls with `extractEdgeFunctionError` | Replace all 3 |
| `ForgotPasswordDialog.tsx` | 2 calls with `extractEdgeFunctionError` | Replace both |
| `StudentsPage.tsx` | 2 calls with manual checks | Replace both — `create-student-with-accounts` returns `data.student` so wrapper returns full data |

**Not refactored** (intentional):
- `useRazorpay.ts` — Razorpay's callback handler has unique flow with `verifyData.verified` check
- `send-notification.ts` — Fire-and-forget, errors are logged not thrown

#### 3. Simplify try/catch blocks

After the wrapper handles error extraction + timeout, many call sites can drop their try/catch entirely (mutations already have `onError` handlers). For hooks using `useMutation`, the `mutationFn` just calls `invokeEdgeFunction` and lets errors propagate to `onError`. For component-level calls (SuperAdminOTPLogin, StudentsPage), a minimal catch sets the error state.

### Implementation details

- Timeout uses the same `Promise.race` pattern already proven in `LoginPage.tsx`
- The wrapper is async, so all callers already use `await` — no signature changes needed
- `send-notification.ts` stays unchanged (it intentionally swallows errors)
- `useRazorpay.ts` stays unchanged (unique payment verification flow)

