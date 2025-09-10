import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testing Delivery Areas Endpoint');
console.log('==================================');

// Test the specific endpoint that might be causing issues
async function testEndpoints() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('\n1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  console.log('\n2. Testing admin users endpoint (without auth)...');
  try {
    const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
    console.log('Users endpoint status:', usersResponse.status, usersResponse.statusText);
    
    if (usersResponse.status === 401 || usersResponse.status === 403) {
      console.log('⚠️  Authentication required (expected)');
    } else if (usersResponse.status === 500) {
      const errorText = await usersResponse.text();
      console.log('❌ Server error:', errorText);
    }
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
  }
  
  console.log('\n3. Testing delivery-boys endpoint structure...');
  try {
    const deliveryResponse = await fetch(`${baseUrl}/api/admin/delivery-boys/test/areas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincodes: ['680001'], districts: ['Palakkad'] })
    });
    
    console.log('Delivery areas endpoint status:', deliveryResponse.status, deliveryResponse.statusText);
    
    if (deliveryResponse.status === 404) {
      console.log('❌ Endpoint not found - this might be the issue!');
    } else if (deliveryResponse.status === 401 || deliveryResponse.status === 403) {
      console.log('⚠️  Authentication required (expected)');
    } else if (deliveryResponse.status === 500) {
      const errorText = await deliveryResponse.text();
      console.log('❌ Server error:', errorText);
    }
  } catch (error) {
    console.log('❌ Delivery areas endpoint failed:', error.message);
  }
  
  console.log('\n📊 Diagnosis:');
  console.log('=============');
  
  console.log('The issue is likely one of these:');
  console.log('1. Frontend trying to call delivery-boys endpoint without proper authentication');
  console.log('2. CORS preflight request being blocked');
  console.log('3. Authentication middleware rejecting requests');
  console.log('4. Database connection issue preventing authentication');
  
  console.log('\n🔧 Solutions to try:');
  console.log('1. Check browser DevTools Network tab for the exact error');
  console.log('2. Ensure user is logged in and has admin role');
  console.log('3. Check if Firebase authentication token is valid');
  console.log('4. Try refreshing the page to get a new auth token');
  console.log('5. Check backend logs for authentication errors');
}

testEndpoints();