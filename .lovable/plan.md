

# Performance Optimization: Login Splash and Background

## Problem
The login splash screen is extremely heavy with **30+ simultaneous framer-motion animations** running infinite loops, complex SVG illustrations, and a mandatory **4-second delay** before users can even start logging in. For 200K+ users across 100+ schools, this is unacceptable.

## Changes

### 1. Reduce Splash Timer (4s to 2s)
- Cut the auto-advance timer from 4000ms to 2000ms
- Add a tap-to-skip: clicking anywhere advances immediately

### 2. Drastically Simplify LoginShapes Background
Replace the current 30+ animated elements with just 3 static CSS gradient orbs (no framer-motion). Remove:
- 12 floating particle dots
- 3 sparkle/star SVGs
- 2 animated rings
- Concentric circles
- 3 floating pills
- 2 botanical SVGs
- 2 dot grid patterns
- Animated wavy line
- Keep only the 3 gradient orbs but make them **static CSS** (no motion)

### 3. Simplify LoginSplash Illustration
Replace the heavy SVG character illustrations (male graduate, female graduate, couch -- ~200 SVG elements with nested motion animations) with a simpler, lighter layout:
- Keep the logo, brand name "Our School Tech" (bigger), tagline, and feature tags
- Remove the couch + graduate character SVGs entirely
- Remove the 3 floating badge SVGs
- Keep the WELCOME badge but remove its infinite scale animation
- Make the logo larger (w-28 h-28) and the title text bigger (text-4xl)

### 4. Make Header Logo Bigger on LoginPage
- Increase to `w-12 h-12` on all screens (no responsive shrinking needed since splash is simplified)

## Files Modified
- `src/components/login/LoginShapes.tsx` -- Replace with 3 static CSS gradient orbs (no framer-motion import needed)
- `src/components/login/LoginSplash.tsx` -- Remove SVG illustrations, simplify to logo + brand + tags, reduce timer to 2s, add tap-to-skip
- `src/pages/LoginPage.tsx` -- Increase header logo size

## Performance Impact
- **Before**: ~35 concurrent framer-motion animation loops, ~200 SVG elements, 4s mandatory wait
- **After**: ~6 simple CSS transitions, ~0 complex SVGs, 2s wait (skippable)
- Estimated paint time reduction: 80%+

