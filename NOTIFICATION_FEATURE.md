# Notification Feature Implementation

## Overview
Added a real-time notification system that displays unread inbox messages next to the dark mode toggle button in both desktop and mobile layouts.

## Changes Made

### 1. New Component: `NotificationButton.tsx`
**Location:** `src/components/shared/NotificationButton.tsx`

**Features:**
- Real-time Firebase listener for unread inbox messages
- Bell icon with red badge showing unread count
- Dropdown notification panel with latest 5 unread messages
- Click to mark as read and navigate to inbox
- Responsive design for mobile and desktop
- Auto-closes when clicking outside

**Mobile Optimizations:**
- Full-screen overlay backdrop on mobile devices
- Fixed positioning with proper margins (left-2, right-2)
- Dropdown stays within viewport boundaries
- Top-16 positioning to avoid header overlap

**Desktop Optimizations:**
- Absolute positioning relative to button
- 320px width (w-80)
- Right-aligned dropdown
- No overlay backdrop

### 2. Updated: `Sidebar.tsx`
**Location:** `src/components/layout/Sidebar.tsx`

**Changes:**
- Imported `NotificationButton` component
- Wrapped ThemeToggle and NotificationButton in flex container
- Added proper spacing with gap-2

```tsx
<div className="flex items-center gap-2">
  <NotificationButton />
  <ThemeToggle />
</div>
```

### 3. Updated: `MobileBreadcrumb.tsx`
**Location:** `src/components/layout/MobileBreadcrumb.tsx`

**Changes:**
- Imported `NotificationButton` component
- Added NotificationButton before ThemeToggle in mobile header
- Maintains proper spacing with gap-2

```tsx
<div className="flex items-center gap-2">
  <NotificationButton />
  <ThemeToggle />
  <button>...</button>
</div>
```

## Technical Details

### Responsive Breakpoints
- **Mobile (< 1024px):** 
  - Fixed positioning with overlay
  - Full-width with margins (left-2, right-2)
  - Top-16 to clear mobile header
  
- **Desktop (≥ 1024px):**
  - Absolute positioning
  - 320px fixed width
  - Right-aligned to button

### CSS Classes Used
```css
/* Mobile */
fixed left-2 right-2 top-16 w-auto max-w-md

/* Desktop */
lg:absolute lg:right-0 lg:top-auto lg:mt-2 lg:w-80 lg:max-w-none
```

### Firebase Integration
- Listens to: `users/{userId}/inbox`
- Filters: `!isRead && folder === 'innboks'`
- Real-time updates with `onValue`
- Auto-cleanup on unmount

## User Experience

### Notification Badge
- Shows count when unread messages exist
- Displays "9+" if more than 9 unread messages
- Red background for high visibility

### Notification Panel
- Shows latest 5 unread messages
- Displays message type, subject, sender, and time ago
- Empty state with bell icon when no notifications
- "Se alle meldinger" button to view full inbox

### Interactions
1. Click bell icon → Opens dropdown
2. Click notification → Marks as read, navigates to inbox
3. Click "Se alle meldinger" → Navigates to inbox
4. Click outside → Closes dropdown
5. Click backdrop (mobile) → Closes dropdown

## Browser Compatibility
- Modern browsers with CSS Grid/Flexbox support
- Tailwind responsive utilities (sm:, lg:)
- Backdrop-blur effects may vary by browser

## Future Enhancements
- Sound notifications
- Browser push notifications
- Mark all as read button
- Notification preferences/filters
- Group notifications by type
