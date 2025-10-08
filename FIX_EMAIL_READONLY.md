# Fix: Email Field Now Read-Only and Synced from Auth

## Changes Made

### Problem Solved
The email field in settings was editable, but it should always reflect the user's Firebase Authentication email. This could cause confusion and data inconsistencies.

### Solution Implemented

#### 1. **UserSettings Component** (`src/components/settings/UserSettings.tsx`)

**Visual Changes:**
- Email input field is now **read-only** and **disabled**
- Added a lock icon (🔒) to visually indicate the field is locked
- Added helper text: "E-postadressen kan ikke endres og er knyttet til din konto"
- Field has a gray background (`bg-gray-50`) to indicate it's disabled

**Code Changes:**
```tsx
// Email field now displays Auth email and is not editable
<input
  type="email"
  value={user?.email || ''}
  readOnly
  disabled
  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
/>
```

**Data Flow:**
- `useEffect` now includes `user` in dependency array
- Email is always set from `user?.email`, not from database
- When saving, email is forced to `user.email` (Auth email)

#### 2. **Settings Page** (`src/app/(dashboard)/innstillinger/page.tsx`)

**Changes:**
- When loading settings from database, email is always overridden with Auth email
- This ensures database email is always in sync with Auth email

```tsx
setUserSettings({
    ...dbSettings,
    email: user.email || ''  // Always use Auth email
} as UserSettingsData);
```

### Benefits

✅ **Single Source of Truth**: Email always comes from Firebase Auth
✅ **No User Confusion**: Clear visual indication that email cannot be changed
✅ **Data Consistency**: Database email always matches Auth email
✅ **Security**: Users cannot accidentally change their login email through settings
✅ **Better UX**: Lock icon and helper text explain why field is disabled

### Visual Example

```
┌─────────────────────────────────────────┐
│ E-post                                  │
├─────────────────────────────────────────┤
│ user@example.com              🔒        │
│ (grayed out, disabled)                  │
└─────────────────────────────────────────┘
  E-postadressen kan ikke endres og er 
  knyttet til din konto
```

### Testing Instructions

1. Go to **Settings** (Innstillinger)
2. Observe the email field:
   - ✅ Shows your current Firebase Auth email
   - ✅ Has a gray background
   - ✅ Has a lock icon
   - ✅ Cannot be edited (clicking does nothing)
   - ✅ Shows helper text below
3. Change other fields (name, phone) and save
4. Refresh the page
5. Verify email still shows your Auth email (unchanged)

### Technical Notes

- Email field is removed from the editable state management
- The `handleInputChange` function no longer handles email changes
- When saving, `user.email` is always used, ignoring any potential user input
- This prevents any potential tampering or confusion about email changes
