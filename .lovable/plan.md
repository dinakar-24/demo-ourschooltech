

## Redesign SubdomainLanding Login Page

The uploaded screenshot shows the current subdomain login page. The design needs to be polished for mobile-first responsiveness across all devices.

### Changes to `src/pages/login/SubdomainLanding.tsx`

**Layout:**
- Use `min-h-[100dvh]` instead of `min-h-screen` for proper mobile viewport handling (avoids address bar overlap)
- Split into a top gradient area and bottom card section on mobile (card anchored to bottom), centered card on desktop
- Add `safe-area-inset` padding for notched devices

**Card Design:**
- Rounded top corners only on mobile (`rounded-t-3xl`), full rounded on desktop (`sm:rounded-2xl`)
- More breathing room: increase padding on mobile (`px-6 py-8`), larger on desktop (`sm:p-10`)
- Subtle shadow and border for depth

**Branding Section:**
- Logo: `w-16 h-16` on mobile, `w-20 h-20` on desktop with smooth rounded corners and shadow
- School name: `text-xl` mobile, `text-2xl` desktop, bold
- Subtitle "Sign in to your account" in muted gray

**Form Fields:**
- Taller inputs (`h-12`) with larger touch targets for mobile
- Rounded-xl inputs with subtle background
- Password eye toggle with proper sizing

**Button:**
- Full width, `h-12`, rounded-xl, school's primary color
- Proper disabled/loading states

**Footer:**
- School portal text at bottom, subtle gray

**Background:**
- Top portion uses a soft gradient from the tenant's primary color
- Bottom half clean white/light on mobile

### Files to Edit
1. `src/pages/login/SubdomainLanding.tsx` — full redesign with mobile-first responsive layout

