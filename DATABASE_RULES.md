# Firebase Realtime Database Rules - Proanbud

This document explains the security rules for the Firebase Realtime Database used in the Proanbud application.

## Table of Contents
- [Overview](#overview)
- [Database Structure](#database-structure)
- [Security Rules Explanation](#security-rules-explanation)
- [Data Validation](#data-validation)
- [Deployment](#deployment)

## Overview

The database rules ensure that:
1. **Authentication Required**: All data access requires authentication
2. **User Data Isolation**: Users can only access their own data
3. **Data Validation**: All writes are validated for correct structure and data types
4. **Shared Catalog**: The product catalog (`katalog`) is readable by all authenticated users

## Database Structure

```
/
├── users/
│   └── $userId/
│       ├── profile/
│       ├── userSettings/
│       ├── businessSettings/
│       ├── tilbud/          # Quotes
│       ├── kunder/          # Customers
│       ├── inbox/           # Messages
│       └── analytics/       # Analytics data
└── katalog/                 # Shared product catalog
    └── $categoryId/
        └── $itemId/         # Subcategories or Products
```

## Security Rules Explanation

### User Data Rules

#### Authentication & Authorization
```json
"$userId": {
  ".read": "auth != null && auth.uid == $userId",
  ".write": "auth != null && auth.uid == $userId"
}
```
- Users must be authenticated to access any data
- Users can only read/write their own data (path matches their user ID)

### Collection-Specific Rules

#### 1. Profile
```json
"profile": {
  ".validate": "newData.hasChildren(['navn', 'epost'])"
}
```
**Required fields**: `navn` (name), `epost` (email)

#### 2. User Settings
```json
"userSettings": {
  ".validate": "newData.hasChildren()"
}
```
**Validation**: Must contain at least one setting

#### 3. Business Settings
```json
"businessSettings": {
  ".validate": "newData.hasChildren(['companyName', 'email', 'phone'])"
}
```
**Required fields**: `companyName`, `email`, `phone`

#### 4. Tilbud (Quotes)
```json
"tilbud": {
  "$tilbudId": {
    ".validate": "newData.hasChildren(['kundenavn', 'prosjekt', 'jobbtype', 'belop', 'status', 'dato', 'svarfrist'])"
  }
}
```
**Required fields**:
- `kundenavn` (customer name) - string
- `prosjekt` (project) - string
- `jobbtype` (job type) - string
- `belop` (amount) - number
- `status` - must be one of: `venter`, `vunnet`, `tapt`
- `dato` (date) - string
- `svarfrist` (response deadline) - string

**Price Components** (`prisgrunnlag`):
```json
"prisgrunnlag": {
  "$componentId": {
    ".validate": "newData.hasChildren(['category', 'name', 'amount'])"
  }
}
```
- `category` - must be one of: `materialer`, `arbeid`, `transport`, `utstyr`, `margin`, `annet`
- `name` - string
- `amount` - number

#### 5. Kunder (Customers)
```json
"kunder": {
  "$kundeId": {
    ".validate": "newData.hasChildren(['navn', 'epost', 'telefon', 'antallTilbud', 'antallVunnet', 'sistAktivitet'])"
  }
}
```
**Required fields**:
- `navn` (name) - string
- `epost` (email) - must match email regex pattern
- `telefon` (phone) - string
- `antallTilbud` (number of quotes) - number
- `antallVunnet` (number won) - number
- `sistAktivitet` (last activity) - string

**Email validation**: Enforces proper email format using regex

#### 6. Inbox (Messages)
```json
"inbox": {
  "$messageId": {
    ".validate": "newData.hasChildren(['from', 'subject', 'message', 'timestamp', 'isRead', 'type'])"
  }
}
```
**Required fields**:
- `from` - string
- `subject` - string
- `message` - string
- `timestamp` - number (Unix timestamp)
- `isRead` - boolean
- `type` - must be one of: `quote_sent`, `quote_opened`, `quote_question`, `quote_approved`, `quote_rejected`, `general_inquiry`

#### 7. Analytics
```json
"analytics": {
  ".validate": "newData.hasChildren()",
  "kpiData": { ... },
  "chartData": { ... },
  "activities": { ... },
  "jobbtypeAnalyse": { ... },
  "inntektFordeling": { ... }
}
```

**Activities**:
- `type` - must be one of: `tilbud_sendt`, `tilbud_vunnet`, `tilbud_tapt`, `ny_kunde`
- `title`, `description`, `timestamp` - required

**Job Type Analysis**:
- `jobbtype`, `treffprosent`, `antallTilbud`, `antallVunnet` - all required
- Numeric fields must be numbers

**Revenue Distribution**:
- `jobbtype`, `inntekt`, `prosent` - all required
- Numeric fields must be numbers

### Katalog (Product Catalog) Rules

```json
"katalog": {
  ".read": "auth != null",
  ".write": "auth != null"
}
```

The catalog is **shared across all authenticated users**. It contains:

1. **Categories** (at root level):
   - Required: `navn`, `opprettet`, `oppdatert`
   - No `kategoriId` or `produktnavn` fields

2. **Subcategories** (nested under categories):
   - Required: `navn`, `kategoriId`, `opprettet`, `oppdatert`
   - No `produktnavn` field

3. **Products** (nested under categories):
   - Required: `produktnavn`, `produsent`, `enhet`, `enhetspris`, `påslag`, `kategoriId`, `underkategoriId`, `opprettet`, `oppdatert`
   - `enhetspris` and `påslag` must be numbers

**Structure validation** ensures items are correctly identified by their fields:
- Categories: Have `navn` but no `kategoriId` or `produktnavn`
- Subcategories: Have `navn` and `kategoriId` but no `produktnavn`
- Products: Have `produktnavn` and all product-specific fields

## Data Validation

### Type Validation
- **Strings**: Fields like names, emails, descriptions
- **Numbers**: Prices, counts, percentages, timestamps
- **Booleans**: Flags like `isRead`
- **Enums**: Status values, types, categories (validated via regex)

### Pattern Validation
- **Email addresses**: Must match standard email regex pattern
- **Status values**: Must match predefined status strings
- **Categories**: Must match predefined category types

### Structural Validation
- **Required fields**: All writes must include mandatory fields
- **Data integrity**: References between collections (e.g., quote IDs in customer records)

## Deployment

### Deploy Rules to Firebase

1. **Using Firebase CLI**:
```bash
firebase deploy --only database
```

2. **From Firebase Console**:
   - Go to Firebase Console → Realtime Database → Rules
   - Copy the contents of `database.rules.json`
   - Paste and publish

### Testing Rules

Before deploying to production:

1. **Firebase Console Simulator**:
   - Go to Rules tab in Realtime Database
   - Use the Rules Playground to test read/write operations

2. **Test with actual authentication**:
   - Ensure you have a test user created
   - Try accessing data with and without authentication
   - Verify cross-user access is blocked

### Important Notes

⚠️ **Security Considerations**:
1. Never set `.read` or `.write` to `true` without authentication checks
2. Always validate user input on write operations
3. Keep the catalog shared but consider adding admin-only write rules if needed
4. Monitor Firebase usage and set up billing alerts

🔧 **Maintenance**:
1. Review and update rules when adding new features
2. Test rules thoroughly before deploying to production
3. Keep this documentation updated with any rule changes

## Common Operations

### Reading User Data
```javascript
// ✅ Allowed: User reading their own data
const userId = auth.currentUser.uid;
const userDataRef = ref(db, `users/${userId}/tilbud`);

// ❌ Denied: User reading another user's data
const otherUserRef = ref(db, `users/otherUserId/tilbud`);
```

### Reading Catalog
```javascript
// ✅ Allowed: Any authenticated user can read catalog
const catalogRef = ref(db, 'katalog');
const snapshot = await get(catalogRef);
```

### Writing Validated Data
```javascript
// ✅ Allowed: Valid quote structure
const tilbudData = {
  kundenavn: "Acme Corp",
  prosjekt: "Renovation",
  jobbtype: "Bathroom",
  belop: 50000,
  status: "venter",
  dato: "2025-10-02",
  svarfrist: "2025-10-15"
};

// ❌ Denied: Missing required fields
const invalidData = {
  kundenavn: "Acme Corp",
  belop: 50000
};
```

## Support

For questions or issues with database rules:
1. Check Firebase Console for rule validation errors
2. Review Firebase logs for permission denied errors
3. Verify authentication state before data operations
4. Ensure data structure matches validation rules
