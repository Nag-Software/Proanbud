// Debug Firestore user lookup
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app"
});

const firestore = admin.firestore();

async function debugUserLookup() {
  try {
    console.log('🔍 Debugging user lookup in Firestore...\n');

    // Get all users to see what's available
    console.log('1️⃣ Getting all users from Firestore...');
    const usersSnapshot = await firestore.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} users:`);

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - User ID: ${doc.id}`);
      console.log(`     Has stripeCustomerId: ${!!data.stripeCustomerId}`);
      if (data.stripeCustomerId) {
        console.log(`     stripeCustomerId: ${data.stripeCustomerId}`);
      }
      console.log(`     Email: ${data.email || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error debugging user lookup:', error);
  }
}

debugUserLookup();