

# Fix: Forgot Password Flow — Better Mobile UX

## Problems
1. Clicking outside the dialog instantly closes it — losing all progress
2. OTP + new password + confirm password all shown at once is overwhelming on mobile
3. No separation between verification and password creation

## Fix

### 1. Prevent accidental close on backdrop click
Remove `onClick={handleClose}` from the backdrop overlay. Users must use the X button to close intentionally.

### 2. Split into 4 steps instead of 3
Current: `email → otp+password → success`
New: `email → otp → newPassword → success`

- **Step 1 (email)**: Enter email, send OTP — no change
- **Step 2 (otp)**: Enter 6-digit OTP only, with "Verify" button. On success, call a new edge function endpoint (or verify OTP separately) — but since the current backend ver