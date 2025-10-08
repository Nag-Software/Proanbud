# Dark Mode Testing Guide

## Quick Test Steps

### 1. Start the Development Server
```bash
pnpm dev
```

### 2. Navigate to Dashboard
- Open your browser and go to `http://localhost:3000/dashboard`
- Log in if needed

### 3. Test Theme Toggle

#### Desktop View:
1. Look at the sidebar (left side)
2. Find the theme toggle button next to the Proanbud logo
3. Click the toggle button (moon icon for light mode, sun icon for dark mode)
4. Verify the entire dashboard switches to dark mode
5. Check that all components update properly:
   - KPI cards
   - Charts (Main chart, Pie chart)
   - Activity feed
   - Data tables
   - Sidebar
   - Text colors

#### Mobile View:
1. Resize browser to mobile width (< 1024px) or open dev tools responsive mode
2. Look at the top header
3. Find the theme toggle button next to the menu button
4. Click the toggle to switch themes
5. Open the mobile menu (hamburger icon)
6. Verify the mobile menu also displays in the correct theme

### 4. Test Persistence
1. Switch to dark mode
2. Refresh the page (F5 or Cmd+R)
3. Verify the page loads in dark mode
4. Switch back to light mode
5. Refresh again
6. Verify the page loads in light mode

### 5. Test Components

#### KPI Cards:
- Should have dark background (`#1a1f2e`)
- White/light text
- Icon backgrounds should be dark gray
- Change indicators (green/red) should be visible

#### Main Chart:
- Chart axes should be visible
- Tooltip should have dark background
- Lines and data points should be clear

#### Activity Feed:
- Dark card background
- Hover states should work (darker on hover)
- Text should be readable

#### Pie Chart:
- Chart colors should be vibrant
- Tooltip should have dark background
- Legend text should be visible

### 6. Visual Checks

Look for:
- ✅ No bright white flashes
- ✅ All text is readable
- ✅ Proper contrast ratios
- ✅ Smooth transitions
- ✅ Icons visible
- ✅ Borders subtle but visible
- ✅ Hover states work correctly

### 7. Browser Console
- Open browser console (F12)
- Check for any React hydration warnings
- Should see no errors related to theme

## Expected Behavior

### Light Mode Colors:
- Background: White/Light Gray (#F8F9FA)
- Cards: White (#FFFFFF)
- Text: Dark Gray (#1C1C1E)
- Primary: Dark Green (#1A4314)

### Dark Mode Colors:
- Background: Dark Charcoal (#0f1419)
- Cards: Dark Blue-Gray (#1a1f2e)
- Text: Light Gray (#e3e8ef)
- Primary: Muted Green (#2d5a3d)

## Common Issues & Fixes

### Issue: Theme doesn't persist
**Solution**: Check browser's localStorage is enabled and not being cleared

### Issue: Flash of wrong theme on load
**Solution**: The inline script in `layout.tsx` should prevent this. Clear cache and reload.

### Issue: Some components don't update
**Solution**: Ensure the component uses the `dark:` Tailwind classes or CSS variables

### Issue: Chart colors not visible in dark mode
**Solution**: Check that chart tooltips use CSS variables like `var(--card)` and `var(--foreground)`

## Browser Compatibility
Tested and works on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance
- Theme toggle should be instant (< 100ms)
- No layout shift when switching themes
- Smooth transitions on all color changes

## Accessibility
- Theme toggle has proper ARIA labels
- Sufficient contrast ratios in both themes
- Keyboard accessible (Tab to reach toggle, Enter to activate)
