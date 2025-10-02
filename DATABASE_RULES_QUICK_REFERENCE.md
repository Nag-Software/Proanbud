# Database Rules Quick Reference

## 🔐 Security Rules Summary

### User Data Access
```javascript
// ✅ ALLOWED
const userId = auth.currentUser.uid;
const myDataRef = ref(db, `users/${userId}/tilbud`);

// ❌ DENIED
const otherUserRef = ref(db, `users/otherUserId}/tilbud`);
```

### Catalog Access
```javascript
// ✅ ALLOWED (any authenticated user)
const catalogRef = ref(db, 'katalog');
```

## 📋 Required Fields by Collection

### Tilbud (Quotes)
```typescript
{
  kundenavn: string,      // Customer name
  prosjekt: string,       // Project name
  jobbtype: string,       // Job type
  belop: number,          // Amount
  status: 'venter' | 'vunnet' | 'tapt',
  dato: string,           // Date
  svarfrist: string       // Deadline
}
```

### Kunder (Customers)
```typescript
{
  navn: string,           // Name
  epost: string,          // Email (must be valid format)
  telefon: string,        // Phone
  antallTilbud: number,   // Number of quotes
  antallVunnet: number,   // Number won
  sistAktivitet: string   // Last activity
}
```

### Inbox Messages
```typescript
{
  from: string,
  subject: string,
  message: string,
  timestamp: number,      // Unix timestamp
  isRead: boolean,
  type: 'quote_sent' | 'quote_opened' | 'quote_question' | 
        'quote_approved' | 'quote_rejected' | 'general_inquiry'
}
```

### Price Components (prisgrunnlag)
```typescript
{
  category: 'materialer' | 'arbeid' | 'transport' | 
            'utstyr' | 'margin' | 'annet',
  name: string,
  amount: number
}
```

### Business Settings
```typescript
{
  companyName: string,
  email: string,
  phone: string,
  // ... other fields optional
}
```

## 🚫 Common Validation Errors

### Missing Required Fields
```javascript
// ❌ WILL FAIL
const tilbud = {
  kundenavn: "Test",
  belop: 5000
  // Missing: prosjekt, jobbtype, status, dato, svarfrist
};
```

### Invalid Status Value
```javascript
// ❌ WILL FAIL
const tilbud = {
  // ... required fields
  status: "pending"  // Must be: venter, vunnet, or tapt
};
```

### Invalid Email Format
```javascript
// ❌ WILL FAIL
const kunde = {
  // ... required fields
  epost: "invalid-email"  // Must be valid email format
};
```

### Non-Numeric Amount
```javascript
// ❌ WILL FAIL
const tilbud = {
  // ... required fields
  belop: "5000"  // Must be a number, not string
};
```

## 📊 Catalog Structure

### Category (Root Level)
```typescript
{
  navn: string,
  beskrivelse?: string,
  opprettet: number,
  oppdatert: number
  // No kategoriId or produktnavn
}
```

### Subcategory (Under Category)
```typescript
{
  navn: string,
  kategoriId: string,      // Parent category ID
  beskrivelse?: string,
  opprettet: number,
  oppdatert: number
  // No produktnavn
}
```

### Product (Under Category)
```typescript
{
  produktnavn: string,
  produsent: string,
  enhet: string,
  enhetspris: number,
  påslag: number,
  kategoriId: string,
  underkategoriId: string,
  beskrivelse?: string,
  opprettet: number,
  oppdatert: number
}
```

## 🔍 Testing Rules

### Firebase Console
1. Go to: Database → Rules → Playground
2. Set location: `/users/USER_ID/tilbud`
3. Set auth: Authenticated as `USER_ID`
4. Test read/write operations

### Application Testing
```javascript
// Test authentication requirement
try {
  await get(ref(db, 'users/someUserId/tilbud'));
} catch (error) {
  // Should fail if not authenticated
  console.log('Auth required:', error.code);
}

// Test data validation
try {
  await set(ref(db, 'users/myUserId/tilbud/test'), {
    kundenavn: "Test"  // Missing required fields
  });
} catch (error) {
  // Should fail validation
  console.log('Validation failed:', error.message);
}
```

## 🚀 Quick Deploy

```bash
# Deploy rules only
firebase deploy --only database

# View current rules
firebase database:rules:get

# Check Firebase project
firebase projects:list
```

## 📖 Full Documentation

See these files for complete details:
- `DATABASE_RULES.md` - Complete rules documentation
- `DEPLOY_DATABASE_RULES.md` - Deployment guide
- `database.rules.json` - Actual rules file

## ⚡ Emergency Rollback

```bash
# Rollback from Firebase Console
Database → Rules → History → Select Previous → Rollback

# Or from CLI
git checkout HEAD~1 database.rules.json
firebase deploy --only database
```

## 💡 Tips

1. **Always authenticate first** before accessing data
2. **Use user's own ID** for user-scoped paths
3. **Validate data** before writing to database
4. **Test thoroughly** before production deployment
5. **Monitor usage** in Firebase Console
6. **Check logs** for permission denied errors

## 🔗 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/proanbudas
- **Database Rules**: https://console.firebase.google.com/project/proanbudas/database/rules
- **Authentication**: https://console.firebase.google.com/project/proanbudas/authentication

---

**Last Updated**: October 2025  
**Project**: Proanbud (proanbudas)  
**Organization**: Nag Software
