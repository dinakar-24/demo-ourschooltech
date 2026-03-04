

## Performance-First Eyes Animation

Given this app serves 100+ schools with 200K+ users, the animation system needs to be ultra-lightweight. The current implementation has two performance concerns:

1. **framer-motion import** — The `EyesRefreshAnimation` component imports `motion` and `AnimatePresence` from framer-motion just for a simple fade. This pulls ~30KB into every route's critical path since it's used in `RouteLoadingFallback`, `ProtectedRoute`, and `AuthRedirect`.

2. **React component for what should be pure CSS** — The animation is simple enough to be done entirely with CSS animations, eliminating the `requestAnimationFrame` loop and React overhead.

### Changes

#### 1. Replace `EyesRefreshAnimation` with pure CSS/HTML (no framer-motion)
- Remove framer-motion dependency entirely from this component
- Use CSS `@keyframes` for the circular orbit instead of `requestAnimationFrame`
- Use a simple conditional render with CSS opacity transition instead of `AnimatePresence`
- Result: zero JS animation cost, GPU-accelerated CSS transforms

#### 2. Replace `RouteLoadingFallback` with static inline JSX
- Instead of importing the full `EyesRefreshAnimation` component (which pulls framer-motion into the initial bundle), use a simple inline div with the same static eyes markup
- No animation needed for route loading — just show static centered eyes
- This keeps the Suspense fallback zero-cost

#### 3. Keep `ProtectedRoute` loading state lightweight
- Same approach — inline static eyes markup, no component import needed for the loading state

#### 4. Update `index.html` pre-loader to use CSS keyframes
- Replace the SVG `<animate>` elements with a single `<style>` block using `@keyframes orbit`
- More reliable cross-browser, same visual result

### Result
- **Zero JS animation overhead** — all motion handled by CSS on the compositor thread
- **~30KB smaller critical path** — framer-motion no longer imported for loading states
- **No React re-renders** — pure CSS doesn't trigger reconciliation
- **Same visual output** — two 64px eyes, #5a5ce6 stroke, 12px black pupils orbiting at 18px radius, 1.4s duration, 0.2s offset

