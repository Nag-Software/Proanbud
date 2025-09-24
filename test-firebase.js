// Simple Firebase connection test
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, query, limitToLast } = require('firebase/database');

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

async function testConnection() {
  try {
    console.log('🔄 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    console.log('🔄 Testing connection to Realtime Database...');
    
    // Test a simple read operation on the root
    const testRef = ref(db, 'connectionTest');
    await get(testRef);
    
    console.log('📊 Connection status: connected');
    console.log('✅ Firebase Realtime Database connection successful!');
    
    // Test reading from the customers collection
    console.log('🔄 Testing customers collection...');
    const customersRef = ref(db, 'kunder');
    const customersSnapshot = await get(customersRef);
    
    console.log('📊 Customers collection test:', !customersSnapshot.exists() ? 'Empty (normal for new setup)' : `${Object.keys(customersSnapshot.val()).length} records found`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
    if (error.code) {
      console.error('🔍 Error code:', error.code);
    }
    return false;
  }
}

testConnection()
  .then(result => {
    console.log('\n📋 Final result:', result ? 'SUCCESS' : 'FAILED');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });