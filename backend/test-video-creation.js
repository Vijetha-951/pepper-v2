/**
 * Test script to diagnose video creation issues
 * Usage: node test-video-creation.js
 */

import admin from 'firebase-admin';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 
  path.join(__dirname, '..', 'pepper-5ed90-firebase-adminsdk-lq82r-1e8ce4f0f6.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const ADMIN_EMAIL = 'vj.vijetha01@gmail.com';
const BACKEND_URL = 'http://localhost:5000';

async function testVideoCreation() {
  console.log('\n🔍 Testing Video Creation Endpoint\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get custom token for admin
    console.log('\n1️⃣ Getting custom token for admin...');
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log('✅ Custom token created for:', ADMIN_EMAIL);
    console.log('   UID:', userRecord.uid);

    // Step 2: Exchange custom token for ID token
    console.log('\n2️⃣ Exchanging custom token for ID token...');
    const API_KEY = serviceAccount.project_id === 'pepper-5ed90' 
      ? 'AIzaSyDZy9KqjLhqVwNqXqXqXqXqXqXqXqXqXqX' // Replace with actual API key
      : process.env.FIREBASE_API_KEY;
    
    // For testing, we'll use the custom token directly with Firebase
    // In production, you'd exchange it via Firebase Auth REST API
    console.log('⚠️  Using custom token method...');

    // Step 3: Test video creation endpoint
    console.log('\n3️⃣ Testing video creation endpoint...');
    
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

    console.log('\n📤 Sending test video data:');
    console.log(JSON.stringify(testVideo, null, 2));

    // Try with dev bypass token first
    console.log('\n🔧 Attempting with dev-admin-bypass token...');
    const devResponse = await fetch(`${BACKEND_URL}/api/videos/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-admin-bypass',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testVideo)
    });

    console.log('📥 Response status:', devResponse.status);
    console.log('📥 Response headers:', Object.fromEntries(devResponse.headers));

    const responseText = await devResponse.text();
    console.log('\n📥 Response body:');
    
    try {
      const responseData = JSON.parse(responseText);
      console.log(JSON.stringify(responseData, null, 2));
      
      if (devResponse.ok) {
        console.log('\n✅ SUCCESS! Video created successfully!');
        console.log('   Video ID:', responseData.video?._id);
        console.log('   Title:', responseData.video?.title);
        return true;
      } else {
        console.log('\n❌ FAILED! Error creating video');
        console.log('   Error:', responseData.message || responseData.error);
        return false;
      }
    } catch (e) {
      console.log('Raw text response:', responseText);
      console.log('\n❌ FAILED! Invalid JSON response');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function checkBackendHealth() {
  console.log('\n🏥 Checking Backend Health\n');
  console.log('='.repeat(60));

  try {
    console.log('📡 Pinging backend at:', BACKEND_URL);
    const response = await fetch(`${BACKEND_URL}/health`);
    
    if (response.ok) {
      console.log('✅ Backend is responding');
      const data = await response.json();
      console.log('   Status:', data.status);
      console.log('   Database:', data.database);
    } else {
      console.log('⚠️  Backend responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend is not reachable');
    console.log('   Error:', error.message);
    return false;
  }

  return true;
}

async function checkVideoModel() {
  console.log('\n📦 Checking Video Model\n');
  console.log('='.repeat(60));

  try {
    const mongoose = await import('mongoose');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pepper';
    console.log('🔌 Connecting to MongoDB:', mongoUri);
    
    await mongoose.default.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import Video model
    const { default: Video } = await import('./src/models/Video.js');
    console.log('✅ Video model loaded');

    // Count existing videos
    const count = await Video.countDocuments();
    console.log('📊 Existing videos:', count);

    // Get recent videos
    const recentVideos = await Video.find().sort({ createdAt: -1 }).limit(3).select('title createdAt isActive');
    console.log('\n📹 Recent videos:');
    recentVideos.forEach((video, i) => {
      console.log(`   ${i + 1}. ${video.title}`);
      console.log(`      Created: ${video.createdAt?.toLocaleString() || 'Unknown'}`);
      console.log(`      Active: ${video.isActive ? '✅' : '❌'}`);
    });

    await mongoose.default.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error checking video model:', error.message);
    return false;
  }
}

// Main execution
(async () => {
  console.log('\n🚀 VIDEO CREATION DIAGNOSTIC TOOL');
  console.log('='.repeat(60));
  console.log('Time:', new Date().toLocaleString());
  console.log('Backend URL:', BACKEND_URL);
  console.log('Admin Email:', ADMIN_EMAIL);

  const healthOk = await checkBackendHealth();
  if (!healthOk) {
    console.log('\n⚠️  Backend health check failed. Please start the backend server.');
    process.exit(1);
  }

  const modelOk = await checkVideoModel();
  if (!modelOk) {
    console.log('\n⚠️  Video model check failed.');
  }

  const testOk = await testVideoCreation();
  
  console.log('\n' + '='.repeat(60));
  if (testOk) {
    console.log('✅ DIAGNOSTIC COMPLETE: Video creation is working!');
  } else {
    console.log('❌ DIAGNOSTIC COMPLETE: Video creation has issues');
    console.log('\n💡 Common issues:');
    console.log('   1. Backend server not running');
    console.log('   2. MongoDB connection issues');
    console.log('   3. Authentication/authorization problems');
    console.log('   4. Missing required fields in request');
    console.log('   5. CORS or proxy configuration issues');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(testOk ? 0 : 1);
})();
