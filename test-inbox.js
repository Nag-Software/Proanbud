// Test script for inbox functionality
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAhSC5u_d12f2Y5GipOAD6TDEOWPlwDBVs",
  authDomain: "proanbudas.firebaseapp.com",
  databaseURL: "https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "proanbudas",
  storageBucket: "proanbudas.firebasestorage.app",
  messagingSenderId: "956288932829",
  appId: "1:956288932829:web:5ac25a69767f31ed507434",
  measurementId: "G-B35G6SB47M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testInboxFunctionality() {
  try {
    console.log('🔄 Testing inbox functionality...\n');

    const rootRef = ref(db, '/');
    const snapshot = await get(rootRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const userIds = Object.keys(data);

      console.log(`📊 Found ${userIds.length} users in database`);

      userIds.forEach(userId => {
        const userData = data[userId];
        const quoteCount = userData.tilbud ? Object.keys(userData.tilbud).length : 0;
        const inboxCount = userData.inbox ? Object.keys(userData.inbox).length : 0;

        console.log(`� User ${userId}: ${quoteCount} quotes, ${inboxCount} inbox messages`);

        if (inboxCount > 0) {
          console.log('   � Inbox messages:');
          Object.values(userData.inbox).forEach(msg => {
            console.log(`      - ${msg.type}: ${msg.subject}`);
          });
        }
      });
    } else {
      console.log('📊 Database is empty');
    }

    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInboxFunctionality();