// Test script to verify dashboard layout in user initialization
// Run with: node test-dashboard-layout.js

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

async function testDashboardLayoutStructure() {
  console.log('🔄 Testing dashboard layout structure...');
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    // Get a sample user to check the dashboard layout structure
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userIds = Object.keys(users);
      
      if (userIds.length > 0) {
        const sampleUserId = userIds[0];
        const sampleUser = users[sampleUserId];
        
        console.log('📊 Sample user dashboard layout:');
        
        if (sampleUser.userSettings) {
          const dashboardLayout = sampleUser.userSettings.dashboardLayout;
          const dashboardLayoutMobile = sampleUser.userSettings.dashboardLayoutMobile;
          
          console.log('  - Has dashboardLayout:', !!dashboardLayout);
          console.log('  - dashboardLayout is array:', Array.isArray(dashboardLayout));
          console.log('  - dashboardLayout length:', dashboardLayout ? dashboardLayout.length : 0);
          console.log('  - Has dashboardLayoutMobile:', !!dashboardLayoutMobile);
          console.log('  - dashboardLayoutMobile is array:', Array.isArray(dashboardLayoutMobile));
          console.log('  - dashboardLayoutMobile length:', dashboardLayoutMobile ? dashboardLayoutMobile.length : 0);
          
          if (dashboardLayout && dashboardLayout.length > 0) {
            console.log('  - Sample layout item:', dashboardLayout[0]);
            
            // Check if it has the expected structure
            const hasCorrectStructure = dashboardLayout.every(item => 
              item.i && typeof item.x === 'number' && typeof item.y === 'number' && 
              typeof item.w === 'number' && typeof item.h === 'number'
            );
            
            console.log('  - Layout has correct structure:', hasCorrectStructure);
          } else {
            console.log('  ⚠️  No dashboard layout found or empty array');
          }
        } else {
          console.log('  ⚠️  No userSettings found');
        }
        
        console.log('✅ Dashboard layout structure test completed');
      } else {
        console.log('ℹ️  No users found in database');
      }
    } else {
      console.log('ℹ️  No users collection found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardLayoutStructure();