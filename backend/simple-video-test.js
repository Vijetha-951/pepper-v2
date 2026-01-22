/**
 * Simple Video Creation Test
 * Tests the endpoint directly using dev bypass
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5000';

async function testVideoCreation() {
  console.log('\n🔍 Testing Video Creation Endpoint');
  console.log('='.repeat(60));

  try {
    const testVideo = {
      title: 'Test Video - ' + new Date().toLocaleTimeString(),
      description: 'This is a test video created by diagnostic script',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      category: 'tutorial',
      duration: '3:33',
      tags: ['test', 'diagnostic'],
      isActive: true
    };

    console.log('\n📤 Test video data:');
    console.log(JSON.stringify(testVideo, null, 2));

    console.log('\n🔧 Sending POST request to /api/videos/admin/create');
    console.log('   Using dev-admin-bypass token for testing...\n');

    const response = await fetch(`${BACKEND_URL}/api/videos/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-admin-bypass',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testVideo)
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('\n📥 Response Body:');
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Raw response:', responseText);
      console.log('⚠️  Response is not valid JSON');
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS! Video created successfully!');
      if (responseData?.video) {
        console.log('   Video ID:', responseData.video._id);
        console.log('   Title:', responseData.video.title);
      }
      return true;
    } else {
      console.log('\n❌ FAILED! Video creation failed');
      if (responseData) {
        console.log('   Error:', responseData.message || responseData.error);
      }
      return false;
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function testGetVideos() {
  console.log('\n🔍 Testing Get All Videos Endpoint');
  console.log('='.repeat(60));

  try {
    console.log('🔧 Sending GET request to /api/videos/admin/all\n');

    const response = await fetch(`${BACKEND_URL}/api/videos/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer dev-admin-bypass',
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    
    const responseData = await response.json();
    console.log('\n📥 Response:');
    console.log('   Success:', responseData.success);
    console.log('   Video count:', responseData.videos?.length || 0);
    
    if (responseData.videos?.length > 0) {
      console.log('\n📹 Recent videos:');
      responseData.videos.slice(0, 3).forEach((video, i) => {
        console.log(`   ${i + 1}. ${video.title}`);
        console.log(`      ID: ${video._id}`);
        console.log(`      Active: ${video.isActive ? '✅' : '❌'}`);
      });
    }

    return response.ok;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

async function checkBackend() {
  console.log('\n🏥 Checking Backend Server');
  console.log('='.repeat(60));

  try {
    console.log('📡 Connecting to:', BACKEND_URL);
    const response = await fetch(`${BACKEND_URL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is online');
      console.log('   Status:', data.status);
      console.log('   Database:', data.database || 'Connected');
      return true;
    } else {
      console.log('⚠️  Backend responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not reachable');
    console.log('   Error:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   cd backend && npm start');
    return false;
  }
}

// Main execution
(async () => {
  console.log('\n🚀 VIDEO API DIAGNOSTIC TOOL');
  console.log('='.repeat(60));
  console.log('Time:', new Date().toLocaleString());
  console.log('Backend:', BACKEND_URL);

  // Check if backend is running
  const backendOk = await checkBackend();
  if (!backendOk) {
    process.exit(1);
  }

  // Test getting videos
  await testGetVideos();

  // Test creating video
  const createOk = await testVideoCreation();
  
  console.log('\n' + '='.repeat(60));
  if (createOk) {
    console.log('✅ DIAGNOSTIC COMPLETE: Video creation is working!');
  } else {
    console.log('❌ DIAGNOSTIC COMPLETE: Issues detected');
    console.log('\n💡 Common fixes:');
    console.log('   1. Restart backend server: cd backend && npm start');
    console.log('   2. Check MongoDB is running');
    console.log('   3. Verify .env configuration');
    console.log('   4. Check backend console for errors');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(createOk ? 0 : 1);
})();
