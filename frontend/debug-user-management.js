// Debug script to test user management API endpoints
// Run this in browser console on the admin user management page

console.log('🔍 User Management NetworkError Debugging');
console.log('===========================================');

// Test basic connectivity
async function testBasicConnectivity() {
  console.log('\n1. Testing basic backend connectivity...');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Backend health check:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

// Test user listing endpoint
async function testUserListing() {
  console.log('\n2. Testing user listing endpoint...');
  
  try {
    // Get auth token (this will vary based on your auth implementation)
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') ||
                  'test-token';
    
    const response = await fetch('http://localhost:5000/api/admin/users?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ User listing successful:', data);
    return data;
  } catch (error) {
    console.log('❌ User listing failed:', error.message);
    return null;
  }
}

// Test delivery areas endpoint specifically
async function testDeliveryAreasEndpoint() {
  console.log('\n3. Testing delivery areas endpoint...');
  
  try {
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') ||
                  'test-token';
    
    // First get a user to test with
    const usersResponse = await fetch('http://localhost:5000/api/admin/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users for testing');
    }
    
    const usersData = await usersResponse.json();
    if (!usersData.users || usersData.users.length === 0) {
      console.log('⚠️  No users available for testing delivery areas endpoint');
      return;
    }
    
    const testUser = usersData.users[0];
    const userId = testUser._id || testUser.firebaseUid || testUser.id;
    
    console.log('Testing with user ID:', userId);
    
    // Test the delivery areas endpoint
    const areasResponse = await fetch(`http://localhost:5000/api/admin/delivery-boys/${userId}/areas`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pincodes: ['680001'],
        districts: ['Palakkad']
      })
    });
    
    if (!areasResponse.ok) {
      const errorText = await areasResponse.text();
      throw new Error(`HTTP ${areasResponse.status}: ${errorText}`);
    }
    
    const data = await areasResponse.json();
    console.log('✅ Delivery areas endpoint successful:', data);
    return data;
    
  } catch (error) {
    console.log('❌ Delivery areas endpoint failed:', error.message);
    return null;
  }
}

// Check current page state
function checkCurrentPageState() {
  console.log('\n4. Checking current page state...');
  
  // Check if we're on the right page
  const isUserManagementPage = window.location.pathname.includes('admin-users') ||
                               document.title.includes('User Management') ||
                               document.querySelector('[data-testid="admin-user-management"]');
  
  console.log('On user management page:', isUserManagementPage);
  
  // Check for error messages in DOM
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
  if (errorElements.length > 0) {
    console.log('Found error elements:', Array.from(errorElements).map(el => el.textContent));
  }
  
  // Check network tab for failed requests
  console.log('💡 To check network errors:');
  console.log('1. Open DevTools (F12)');
  console.log('2. Go to Network tab');
  console.log('3. Refresh the page');
  console.log('4. Look for red/failed requests to admin/users or delivery-boys endpoints');
}

// Check authentication state
function checkAuthState() {
  console.log('\n5. Checking authentication state...');
  
  // Common auth storage locations
  const authChecks = {
    'localStorage.authToken': localStorage.getItem('authToken'),
    'sessionStorage.authToken': sessionStorage.getItem('authToken'),
    'localStorage.user': localStorage.getItem('user'),
    'sessionStorage.user': sessionStorage.getItem('user'),
  };
  
  for (const [key, value] of Object.entries(authChecks)) {
    if (value) {
      console.log(`✅ ${key}:`, value.substring(0, 50) + '...');
    } else {
      console.log(`❌ ${key}: not found`);
    }
  }
}

// Run all diagnostics
async function runAllDiagnostics() {
  checkCurrentPageState();
  checkAuthState();
  
  const isConnected = await testBasicConnectivity();
  if (isConnected) {
    await testUserListing();
    await testDeliveryAreasEndpoint();
  }
  
  console.log('\n📊 Common NetworkError Solutions:');
  console.log('================================');
  console.log('1. Backend not running → Start: npm run dev in backend folder');
  console.log('2. Wrong API URL → Check frontend .env file');
  console.log('3. CORS issues → Check backend CORS configuration');  
  console.log('4. Auth token missing → Check localStorage/sessionStorage for tokens');
  console.log('5. Firebase auth expired → Re-login to get fresh token');
  console.log('6. Database connection → Check MongoDB Atlas connection');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. If health check fails → Backend is not running');
  console.log('2. If user listing fails → Check authentication');
  console.log('3. If delivery areas fails → Check specific endpoint implementation');
  console.log('4. Check browser console for JavaScript errors');
  console.log('5. Check Network tab in DevTools for failed requests');
}

// Run diagnostics
runAllDiagnostics();