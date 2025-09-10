import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import mongoose from 'mongoose';
import admin from '../src/config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 NetworkError Diagnostic Tool');
console.log('===============================\n');

async function checkBackendHealth() {
  console.log('🖥️  Backend Health Checks:');
  console.log('---------------------------');
  
  // Check if server file exists
  const serverPath = join(__dirname, '../src/server.js');
  console.log(`✅ Server file exists: ${existsSync(serverPath)}`);
  
  // Check environment configuration
  const envPath = join(__dirname, '../.env');
  console.log(`✅ Environment file exists: ${existsSync(envPath)}`);
  
  return true;
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Database Connection Check:');
  console.log('------------------------------');
  
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pepper';
    console.log(`🔗 Attempting to connect to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function checkFirebaseConnection() {
  console.log('\n🔥 Firebase Configuration Check:');
  console.log('--------------------------------');
  
  try {
    // Try to initialize Firebase admin
    const app = admin;
    console.log('✅ Firebase admin SDK initialized');
    
    // Test authentication service
    const auth = admin.auth();
    console.log('✅ Firebase Auth service accessible');
    
    return true;
  } catch (error) {
    console.log('❌ Firebase connection failed:', error.message);
    return false;
  }
}

async function checkNetworkConnectivity() {
  console.log('\n🌐 Network Connectivity Check:');
  console.log('------------------------------');
  
  try {
    // Test external connectivity
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000
    });
    console.log('✅ External network connectivity: OK');
    
    // Test Firebase connectivity
    try {
      const firebaseResponse = await fetch('https://firebase.googleapis.com', {
        method: 'HEAD',
        timeout: 5000
      });
      console.log('✅ Firebase services reachable: OK');
    } catch (err) {
      console.log('⚠️  Firebase services connectivity: Issues detected');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Network connectivity issues:', error.message);
    return false;
  }
}

function checkCommonNetworkErrorCauses() {
  console.log('\n🚨 Common NetworkError Causes:');
  console.log('------------------------------');
  
  const causes = [
    {
      issue: 'CORS Configuration',
      description: 'Backend not allowing frontend domain',
      solution: 'Check CORS settings in server.js'
    },
    {
      issue: 'Backend Not Running',
      description: 'Express server is not started',
      solution: 'Run: npm run dev or npm start'
    },
    {
      issue: 'Wrong Backend URL',
      description: 'Frontend pointing to incorrect backend URL',
      solution: 'Check API_BASE_URL in frontend .env'
    },
    {
      issue: 'Firebase Auth Issues',
      description: 'Authentication middleware blocking requests',
      solution: 'Check Firebase token validation'
    },
    {
      issue: 'Database Connection',
      description: 'MongoDB connection preventing server startup',
      solution: 'Verify MongoDB is running and accessible'
    },
    {
      issue: 'Port Conflicts',
      description: 'Backend port already in use',
      solution: 'Change port or kill existing process'
    }
  ];
  
  causes.forEach((cause, index) => {
    console.log(`${index + 1}. ${cause.issue}`);
    console.log(`   Problem: ${cause.description}`);
    console.log(`   Solution: ${cause.solution}\n`);
  });
}

function generateCurlTestCommands() {
  console.log('🧪 Manual API Testing Commands:');
  console.log('-------------------------------');
  
  const baseUrl = 'http://localhost:5000'; // Adjust based on your config
  
  const testCommands = [
    {
      name: 'Health Check',
      command: `curl -X GET ${baseUrl}/api/health`
    },
    {
      name: 'Admin Users List (requires auth)',
      command: `curl -X GET ${baseUrl}/api/admin/users -H "Authorization: Bearer YOUR_TOKEN"`
    },
    {
      name: 'Products List',
      command: `curl -X GET ${baseUrl}/api/admin/products -H "Authorization: Bearer YOUR_TOKEN"`
    }
  ];
  
  testCommands.forEach(test => {
    console.log(`📋 ${test.name}:`);
    console.log(`   ${test.command}\n`);
  });
}

async function runDiagnostics() {
  try {
    await checkBackendHealth();
    await checkDatabaseConnection();
    await checkFirebaseConnection();
    await checkNetworkConnectivity();
    checkCommonNetworkErrorCauses();
    generateCurlTestCommands();
    
    console.log('🎯 Quick Resolution Steps:');
    console.log('-------------------------');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Check browser console for detailed error');
    console.log('3. Verify frontend API URL configuration');
    console.log('4. Test API endpoints manually with curl');
    console.log('5. Check network connectivity and firewall');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run diagnostics
runDiagnostics();