# Deploying Firebase Database Rules

This guide walks you through deploying the database rules to your Firebase project.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase**
   ```bash
   firebase login
   ```

## Quick Deploy

### Deploy Database Rules Only
```bash
firebase deploy --only database
```

### Deploy Everything (Database + Hosting)
```bash
firebase deploy
```

## Step-by-Step Deployment

### 1. Verify Your Configuration

Check that your Firebase project is configured:
```bash
firebase projects:list
```

You should see `proanbudas` in the list.

### 2. Test Rules Locally (Optional)

Before deploying, you can validate the rules syntax:
```bash
firebase database:rules:get
```

### 3. Deploy the Rules

Deploy only the database rules:
```bash
firebase deploy --only database
```

Expected output:
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/proanbudas/overview
```

### 4. Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **proanbudas**
3. Navigate to: **Realtime Database** → **Rules**
4. Verify the rules match `database.rules.json`

## Testing the Rules

### Option 1: Firebase Console Simulator

1. Go to **Realtime Database** → **Rules** tab
2. Click on **Rules Playground**
3. Test various scenarios:

**Test Read Access (Should Succeed)**:
```
Location: /users/USER_ID/tilbud
Simulated User: Authenticated as USER_ID
Operation: Read
```

**Test Write Access with Invalid Data (Should Fail)**:
```
Location: /users/USER_ID/tilbud/new-quote
Simulated User: Authenticated as USER_ID
Operation: Write
Data: { "kundenavn": "Test" }  // Missing required fields
```

**Test Cross-User Access (Should Fail)**:
```
Location: /users/OTHER_USER_ID/tilbud
Simulated User: Authenticated as USER_ID
Operation: Read
```

### Option 2: Application Testing

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Test authenticated access**:
   - Login with a valid user
   - Try to create/read/update data
   - Should work normally

3. **Test unauthenticated access**:
   - Logout
   - Try to access data
   - Should receive permission denied errors

4. **Test data validation**:
   - Try to create a quote with missing fields
   - Should fail validation
   - Check browser console for error messages

## Common Issues

### Issue: "Permission Denied" Error

**Cause**: User not authenticated or trying to access another user's data

**Solution**:
```javascript
// Ensure user is authenticated
if (!auth.currentUser) {
  // Redirect to login
}

// Always use the authenticated user's ID
const userId = auth.currentUser.uid;
const userDataRef = ref(db, `users/${userId}/tilbud`);
```

### Issue: "Validation Failed" Error

**Cause**: Missing required fields or incorrect data types

**Solution**: Check the data structure matches the rules
```javascript
// ✅ Correct structure
const tilbudData = {
  kundenavn: "Customer Name",
  prosjekt: "Project Name",
  jobbtype: "Job Type",
  belop: 50000,  // Number
  status: "venter",  // Must be: venter, vunnet, or tapt
  dato: "2025-10-02",
  svarfrist: "2025-10-15"
};
```

### Issue: Rules Not Updating

**Solution**:
1. Clear browser cache
2. Wait 1-2 minutes for rules to propagate
3. Check Firebase Console to verify rules are deployed
4. Refresh your application

## Rollback (Emergency)

If you need to rollback to previous rules:

1. **From Firebase Console**:
   - Go to **Realtime Database** → **Rules**
   - Click on **History** tab
   - Select a previous version
   - Click **Rollback**

2. **From Git**:
   ```bash
   git checkout HEAD~1 database.rules.json
   firebase deploy --only database
   ```

## Security Best Practices

✅ **DO**:
- Always require authentication for data access
- Validate all user inputs
- Use user-scoped paths (`users/$userId/...`)
- Test rules thoroughly before production deployment
- Monitor Firebase usage and set up alerts

❌ **DON'T**:
- Set `.read` or `.write` to `true` globally
- Store sensitive data without encryption
- Allow cross-user data access
- Skip data validation
- Ignore Firebase security warnings

## Monitoring

### Check Rule Usage

Firebase Console → Realtime Database → Usage:
- Monitor read/write operations
- Check for denied requests (indicates rule violations)
- Set up alerts for unusual activity

### Enable Debug Mode

Temporarily enable detailed logging:
```javascript
import { enableLogging } from 'firebase/database';

// In development only
if (process.env.NODE_ENV === 'development') {
  enableLogging(true);
}
```

## Production Checklist

Before deploying to production:

- [ ] Rules deployed to Firebase
- [ ] Rules tested with authenticated users
- [ ] Rules tested with unauthenticated access (should fail)
- [ ] Cross-user access tested (should fail)
- [ ] Data validation tested
- [ ] Catalog access tested (should work for all authenticated users)
- [ ] Firebase usage monitoring enabled
- [ ] Billing alerts configured
- [ ] Documentation updated

## Support

**Firebase Console**: https://console.firebase.google.com/project/proanbudas/overview

**Database Rules**: https://console.firebase.google.com/project/proanbudas/database/rules

**Documentation**: See `DATABASE_RULES.md` for detailed rules explanation

**Firebase CLI Help**:
```bash
firebase help
firebase database:help
```
