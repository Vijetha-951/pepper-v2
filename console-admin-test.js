// Copy and paste this into browser console (F12) to test admin roles

console.log('🧪 ADMIN ROLE TEST SCRIPT');
console.log('========================');

// Clear all local data
function clearAllData() {
    console.log('🧹 Clearing all browser data...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local data cleared');
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ Cookies cleared');
    
    console.log('👉 Now refresh the page and login');
}

// Check current user
function checkUser() {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        console.log('👤 Current User:', userData.email);
        console.log('📋 Role:', userData.role);
        
        if (userData.email === 'vj.vijetha01@gmail.com' && userData.role === 'admin') {
            console.log('✅ CORRECT: Admin user with admin role');
        } else if (userData.email === 'vijethajinu01@gmail.com' && userData.role === 'user') {
            console.log('✅ CORRECT: User account with user role');
        } else {
            console.log('❌ INCORRECT: Role assignment is wrong');
        }
    } else {
        console.log('ℹ️ No user logged in');
    }
}

// Set emergency admin (if needed)
function emergencyAdmin() {
    const adminData = {
        uid: 'oSyBm1OTFyg17WJE80JBA8UWvo62',
        email: 'vj.vijetha01@gmail.com', 
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
    };
    localStorage.setItem('user', JSON.stringify(adminData));
    console.log('🚨 Emergency admin set. Refresh page.');
}

console.log('Available functions:');
console.log('- clearAllData() - Clear cache and data'); 
console.log('- checkUser() - Check current user');
console.log('- emergencyAdmin() - Set emergency admin');
console.log('');
console.log('Quick test: Run clearAllData(), then go to login page');

// Auto-check current user
checkUser();