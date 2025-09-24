// Debug Realtime Database setup and connection
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, push, connectDatabaseEmulator } = require('firebase/database');

// Firebase configuration
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

async function debugDatabase() {
  console.log('🔧 Debugging Realtime Database Setup...\n');
  
  try {
    console.log('1️⃣ Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    console.log('\n2️⃣ Getting Realtime Database instance...');
    const db = getDatabase(app);
    console.log('✅ Database instance created');
    
    console.log('\n3️⃣ Testing basic reference access...');
    const testRef = ref(db, 'test');
    console.log('✅ Database reference created');
    
    console.log('\n4️⃣ Attempting to read from Database...');
    const snapshot = await get(testRef);
    console.log('✅ Read operation successful');
    console.log(`📊 Test node is ${!snapshot.exists() ? 'empty' : 'not empty'}`);
    
    console.log('\n5️⃣ Testing write operation (this will fail if rules block it)...');
    try {
      const newTestRef = push(testRef);
      await set(newTestRef, {
        message: 'Hello Realtime Database!',
        timestamp: Date.now(),
        test: true
      });
      console.log('✅ Write operation successful');
      console.log(`📝 Data written with key: ${newTestRef.key}`);
    } catch (writeError) {
      console.log('❌ Write operation failed (this is expected if security rules block writes)');
      console.log(`   Error: ${writeError.code} - ${writeError.message}`);
    }
    
    console.log('\n6️⃣ Testing customers collection...');
    const customersRef = ref(db, 'kunder');
    const customersSnapshot = await get(customersRef);
    console.log('✅ Customers collection accessible');
    console.log(`📊 Customers collection: ${!customersSnapshot.exists() ? 'empty' : `${Object.keys(customersSnapshot.val()).length} records`}`);
    
    console.log('\n🎉 Realtime Database debugging complete!');
    console.log('\n📋 Summary:');
    console.log('- Firebase app: ✅ Working');
    console.log('- Database instance: ✅ Working');
    console.log('- Read operations: ✅ Working');
    console.log('- References accessible: ✅ Working');
    
  } catch (error) {
    console.error('\n❌ Database debugging failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔍 Possible solutions:');
    if (error.code === 'PERMISSION_DENIED') {
      console.log('- Update Realtime Database security rules to allow read/write');
      console.log('- Make sure you\'re authenticated if rules require auth');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('- Check internet connection');
      console.log('- Check if corporate firewall blocks Firebase');
    } else if (error.message?.includes('databaseURL')) {
      console.log('- Make sure databaseURL is correct in Firebase config');
      console.log('- Verify Realtime Database is enabled in Firebase Console');
    }
  }
}

debugDatabase()
  .then(() => {
    console.log('\n✨ Debug complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Unexpected error:', err);
    process.exit(1);
  });