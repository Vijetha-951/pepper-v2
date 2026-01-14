import '../src/config/db.js';
import Hub from '../src/models/Hub.js';

// Kerala hub coordinates (approximate locations)
const hubCoordinates = {
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Kollam': { lat: 8.8932, lng: 76.6141 },
  'Pathanamthitta': { lat: 9.2648, lng: 76.7870 },
  'Alappuzha': { lat: 9.4981, lng: 76.3388 },
  'Kottayam': { lat: 9.5916, lng: 76.5222 },
  'Idukki': { lat: 9.9189, lng: 77.1025 },
  'Ernakulam': { lat: 9.9312, lng: 76.2673 },
  'Thrissur': { lat: 10.5276, lng: 76.2144 },
  'Palakkad': { lat: 10.7867, lng: 76.6548 },
  'Malappuram': { lat: 11.0510, lng: 76.0711 },
  'Kozhikode': { lat: 11.2588, lng: 75.7804 },
  'Wayanad': { lat: 11.6854, lng: 76.1320 },
  'Kannur': { lat: 11.8745, lng: 75.3704 },
  'Kasaragod': { lat: 12.4996, lng: 75.0077 }
};

async function addHubCoordinates() {
  try {
    console.log('🗺️  Adding GPS coordinates to hubs...\n');
    
    const hubs = await Hub.find();
    let updated = 0;
    
    for (const hub of hubs) {
      const coords = hubCoordinates[hub.district];
      
      if (coords) {
        // Add small random offset for multiple hubs in same district
        const offset = Math.random() * 0.05 - 0.025;
        
        hub.location = hub.location || {};
        hub.location.coordinates = {
          lat: coords.lat + offset,
          lng: coords.lng + offset
        };
        
        await hub.save();
        console.log(`✅ ${hub.name} (${hub.district}): ${coords.lat}, ${coords.lng}`);
        updated++;
      } else {
        console.log(`⚠️  No coordinates found for ${hub.district}`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} hubs with GPS coordinates!`);
    console.log('\n🗺️  Now refresh your order tracking page to see the map!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

addHubCoordinates();
