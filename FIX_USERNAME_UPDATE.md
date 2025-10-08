# Fix: Username Not Updating in Sidebar

## Problem
When users changed their username in the settings page, the updated name was not reflected in the sidebar (both desktop and mobile). This was because the sidebar components were reading the username from the Firebase Auth `user.displayName` property, which wasn't being updated when users saved their settings.

## Root Cause
The settings page saves user data to the Firebase Realtime Database at `users/${uid}/userSettings`, but the sidebar components were only reading from the Firebase Auth user object (`user.displayName`), which is separate from the database.

## Solution
Updated both sidebar components to listen to real-time changes from the Firebase Realtime Database:

### Files Modified

1. **`src/components/layout/Sidebar.tsx`**
   - Added imports: `ref`, `onValue`, `off` from `firebase/database` and `db` from firebase config
   - Added state: `const [displayName, setDisplayName] = useState<string>('')`
   - Added `useEffect` hook to listen to `users/${uid}/userSettings` in real-time
   - Updated `getDisplayName()` to use the state value first, then fallback to auth values

2. **`src/components/layout/MobileBreadcrumb.tsx`**
   - Same changes as Sidebar.tsx
   - Now both desktop and mobile views show the updated username immediately

## How It Works
1. When the component mounts, it sets up a real-time listener on `users/${user.uid}/userSettings`
2. Whenever the data changes in the database, the listener callback fires
3. The callback updates the local `displayName` state with the new name from the database
4. If no database name exists, it falls back to Firebase Auth displayName or email
5. The listener is cleaned up when the component unmounts

## Benefits
- ✅ Username updates are reflected immediately in both sidebars
- ✅ Works in real-time without page refresh
- ✅ Maintains proper fallback chain (Database → Auth displayName → Email → 'User')
- ✅ Properly cleans up listeners to prevent memory leaks
- ✅ No breaking changes to existing functionality

## Testing
1. Go to Settings (Innstillinger)
2. Change your name in the "Navn" field
3. Click "Lagre endringer" (Save changes)
4. Observe that the name in the sidebar updates immediately without refreshing
5. Test on both desktop (left sidebar) and mobile (hamburger menu)
