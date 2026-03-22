

# Fix: White Blank Space After Closing Mobile Keyboard

## Problem

When a user types in an input field inside a Drawer on mobile, the virtual keyboard pushes the viewport up. When the keyboard closes, a white blank space remains at the bottom because:

1. **`shouldScaleBackground = true`** in the Drawer component scales the background content down when the drawer opens. Combined with keyboard resize, the background doesn't restore correctly.
2. **Missing `interactive-widget=resizes-content`** in the viewport meta tag — without this, Chrome on Android uses `resizes-visual` by default, which resizes only the visual viewport (not the layout viewport), causing mismatches when the keyboard dismisses.
3. **No `window.scrollTo(0,0)` on blur** — after the keyboard closes, the page scroll position can be left offset, showing white space below.

## Fix

### 1. Update viewport meta tag in `index.html`

Add `interactive-widget=resizes-content` to tell the browser to resize the layout viewport (not just the visual viewport) when the keyboard appears/disappears. This prevents the white gap.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content" />
```

### 2. Disable `shouldScaleBackground` in Drawer component

Change the default from `true` to `false` in `src/components/ui/drawer.tsx`. The scale transform conflicts with keyboard viewport changes on mobile, causing the background to not restore properly.

### 3. Add global blur handler to reset scroll position

In `src/App.tsx` (or `main.tsx`), add a one-time effect that listens for `focusout` on inputs/textareas and calls `window.scrollTo(0, 0)` with a small delay. This catches the edge case where the page remains scrolled after keyboard dismissal.

## Files to Modify

1. **`index.html`** — Add `interactive-widget=resizes-content` to viewport meta
2. **`src/components/ui/drawer.tsx`** — Change `shouldScaleBackground` default to `false`
3. **`src/App.tsx`** — Add global focusout scroll-reset effect

