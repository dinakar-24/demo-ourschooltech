

## Problem

The current refresh/loading experience shows either a white blank screen or a floating card with eyes + text. The user wants it to match the "eskoolynow" style: **just two large bare circles with tiny black pupils centered on the page** — no card, no text, no container, no shadows.

## Plan

### 1. Update `index.html` pre-React loader
Remove the card container, backdrop blur, shadow, text, and padding. Replace with just two SVG circles centered on the page with animated pupils. The eyes should be larger (~80px each), with a purple/indigo stroke, white fill, and small black pupils that animate left-right.

### 2. Update `EyesRefreshAnimation` component
Simplify the React version to match — remove the card wrapper, text, and styling. Just render two large SVG eyes centered on a full-screen white background overlay with the same look as the HTML version.

### 3. Update `RouteLoadingFallback` in `App.tsx`
Instead of an empty div, render the same centered eyes animation so there's never a blank white screen during Suspense loading or tenant resolution.

### 4. Update `ProtectedRoute.tsx`
Same — show the eyes during auth loading instead of empty div.

### Visual spec (from reference images)
- Two circles, ~70-80px diameter each
- Purple/indigo stroke (~#6366f1), ~2.5px width
- White fill
- Small black dot pupil (~6-8px) that animates left-right
- Centered horizontally and vertically on white background
- No card, no text, no shadow, no blur

