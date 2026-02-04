

## Plan: Fix Schools Page Mobile Scroll and Logo Display

### Problem Analysis

Based on my investigation, there are two issues:

1. **Logo not displaying**: The database confirms schools have logos stored (base64 format), but the table always shows the Building2 icon. The code at line 382-384 never checks if `school.logo` exists.

2. **Poor mobile scroll experience**: The table uses `overflow-x-auto` creating a horizontal scrollbar which is not touch-friendly for mobile devices.

---

### Solution

#### 1. Fix Logo Display in Table

**File:** `src/pages/super-admin/SchoolsPage.tsx`

Update the table cell to conditionally show the uploaded logo or fallback to the Building2 icon:

```text
BEFORE (line 381-384):
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
  <Building2 className="w-5 h-5 text-primary" />
</div>

AFTER:
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
  {school.logo ? (
    <img 
      src={school.logo} 
      alt={`${school.name} logo`}
      className="w-full h-full object-cover"
    />
  ) : (
    <Building2 className="w-5 h-5 text-primary" />
  )}
</div>
```

#### 2. Replace Horizontal Scroll Table with Mobile-Friendly Card Layout

**Approach:** Use responsive design - show cards on mobile, table on desktop.

**Changes:**
- Add a mobile card view that stacks information vertically
- Keep the table for desktop/tablet screens
- Use CSS responsive breakpoints to switch between views

**Mobile Card Design:**
- Each school displayed as a card with logo, name, code, city
- Actions (edit/delete) easily accessible with large touch targets
- Native vertical scroll instead of horizontal table scroll

---

### Technical Details

**File to modify:** `src/pages/super-admin/SchoolsPage.tsx`

**Key changes:**
1. Lines 381-384: Add conditional logo rendering
2. Lines 366-435: Add responsive layout with:
   - `hidden md:block` for the table (desktop only)
   - `md:hidden` for the card list (mobile only)

**Mobile card structure:**
```text
[Logo/Icon] School Name          [Edit] [Delete]
            Code: DPS001  |  City
```

---

### Expected Result

- Logos will display correctly in both the table and cards
- Mobile users get a vertical scrolling card list (no horizontal scroll)
- Desktop users keep the existing table view
- Touch-friendly action buttons on mobile

