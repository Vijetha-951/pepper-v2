import '../src/config/db.js';
import Hub from '../src/models/Hub.js';
import mongoose from 'mongoose';

// Kerala hub coordinates - specific locations for hub facilities
const hubCoordinates = {
  // Major city centers with slight variations for different hub types
  'Thiruvananthapuram': [
    { lat: 8.5241, lng: 76.9366, type: 'MEGA_HUB' },      // City center
    { lat: 8.4874, lng: 76.9497, type: 'LOCAL_HUB' },    // Near airport
    { lat: 8.5480, lng: 76.9158, type: 'REGIONAL_HUB' }  // North area
  ],
  'Kollam': [
    { lat: 8.8932, lng: 76.6141, type: 'MEGA_HUB' },
    { lat: 8.8813, lng: 76.5847, type: 'LOCAL_HUB' }
  ],
  'Pathanamthitta': [
    { lat: 9.2648, lng: 76.7870, type: 'LOCAL_HUB' }
  ],
  'Alappuzha': [
    { lat: 9.4981, lng: 76.3388, type: 'REGIONAL_HUB' },
    { lat: 9.4980, lng: 76.3270, type: 'LOCAL_HUB' }
  ],
  'Kottayam': [
    { lat: 9.5916, lng: 76.5222, type: 'WAREHOUSE' },     // Main warehouse
    { lat: 9.6020, lng: 76.5380, type: 'MEGA_HUB' },      // Mega hub
    { lat: 9.5800, lng: 76.5100, type: 'LOCAL_HUB' }      // Local hub
  ],
  'Idukki': [
    { lat: 9.9189, lng: 77.1025, type: 'LOCAL_HUB' }
  ],
  'Ernakulam': [
    { lat: 9.9312, lng: 76.2673, type: 'MEGA_HUB' },      // Kochi city
    { lat: 10.0266, lng: 76.3172, type: 'REGIONAL_HUB' }, // Aluva area
    { lat: 9.9674, lng: 76.2412, type: 'LOCAL_HUB' }      // Kakkanad
  ],
  'Thrissur': [
    { lat: 10.5276, lng: 76.2144, type: 'MEGA_HUB' },
    { lat: 10.5703, lng: 76.2141, type: 'LOCAL_HUB' }
  ],
  'Palakkad': [
    { lat: 10.7867, lng: 76.6548, type: 'REGIONAL_HUB' },
    { lat: 10.7715, lng: 76.6538, type: 'LOCAL_HUB' }
  ],
  'Malappuram': [
    { lat: 11.0510, lng: 76.0711, type: 'REGIONAL_HUB' },
    { lat: 11.0642, lng: 76.0826, type: 'LOCAL_HUB' }
  ],
  'Kozhikode': [
    { lat: 11.2588, lng: 75.7804, type: 'MEGA_HUB' },     // City center
    { lat: 11.2480, lng: 75.7686, type: 'REGIONAL_HUB' }, // Beach road area
    { lat: 11.2432, lng: 75.7937, type: 'LOCAL_HUB' }     // Mavoor road
  ],
  'Wayanad': [
    { lat: 11.6854, lng: 76.1320, type: 'LOCAL_HUB' }
  ],
  'Kannur': [
    { lat: 11.8745, lng: 75.3704, type: 'REGIONAL_HUB' },
    { lat: 11.8683, lng: 75.3567, type: 'LOCAL_HUB' }
  ],
  'Kasaragod': [
    { lat: 12.4996, lng: 75.0077, type: 'LOCAL_HUB' }
  ]
};

async function addHubCoordinates() {
  try {
    // Wait for database connection
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        const timeout = setTimeout(() => reject(new Error('DB connection timeout')), 10000);
        mongoose.connection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });
    
    console.log('🗺️  Adding GPS coordinates to hubs...\n');
    
    const hubs = await Hub.find();
    let updated = 0;
    let notFound = 0;
    
    for (const hub of hubs) {
      const districtCoords = hubCoordinates[hub.district];
      
      if (districtCoords) {
        // Find matching coordinates by hub type
        let coords = districtCoords.find(c => c.type === hub.type);
        
        // If no exact type match, use the first available or add slight offset
        if (!coords) {
          coords = districtCoords[0];
          const offset = (districtCoords.length > 1 ? 0.01 : 0.005);
          coords = {
            lat: coords.lat + (Math.random() * offset * 2 - offset),
            lng: coords.lng + (Math.random() * offset * 2 - offset)
          };
        }
        
        hub.location = hub.location || {};
        hub.location.coordinates = {
          lat: coords.lat,
          lng: coords.lng
        };
        
        if (!hub.location.state) hub.location.state = 'Kerala';
        if (!hub.location.city) hub.location.city = hub.district;
        
        await hub.save();
        console.log(`✅ ${hub.name} (${hub.type}): ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        updated++;
      } else {
        console.log(`⚠️  No coordinates found for ${hub.district}`);
        notFound++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Updated: ${updated} hubs`);
    console.log(`   ⚠️  Not found: ${notFound} hubs`);
    console.log('\n🗺️  Hub coordinates have been added!');
    console.log('💡 Refresh your order tracking page to see accurate hub locations on the map.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

addHubCoordinates();
