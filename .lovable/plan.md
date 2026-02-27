

# Delete Unused Login Components

## Summary
Remove the two login component files that are not imported or used anywhere in the codebase.

## Files to Delete

### 1. `src/components/login/LoginRoleSelector.tsx`
- Old role selector (Admin/Teacher/Parent/Student buttons)
- Not imported by any file -- completely dead code

### 2. `src/components/login/LoginForm.tsx`
- Old standalone login form component
- Not imported by any file -- completely dead code

## Files That Stay (Still in Use)
- `LoginSplash.tsx` -- actively used by `LoginPage.tsx`
- `LoginShapes.tsx` -- actively used by `LoginSplash.tsx`
- `SubdomainLanding.tsx` -- actively used by `App.tsx`

## Impact
Zero functionality change. Just removing dead code that is no longer referenced anywhere.

