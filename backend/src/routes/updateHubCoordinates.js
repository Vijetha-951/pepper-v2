import express from 'express';
import Hub from '../models/Hub.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Hub coordinates data
const hubCoordinates = {
  'Thiruvananthapuram': [
    { lat: 8.5241, lng: 76.9366, type: 'MEGA_HUB' },
    { lat: 8.4874, lng: 76.9497, type: 'LOCAL_HUB' },
    { lat: 8.5480, lng: 76.9158, type: 'REGIONAL_HUB' }
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
    { lat: 9.5916, lng: 76.5222, type: 'WAREHOUSE' },
    { lat: 9.6020, lng: 76.5380, type: 'MEGA_HUB' },
    { lat: 9.5800, lng: 76.5100, type: 'LOCAL_HUB' }
  ],
  'Idukki': [
    { lat: 9.9189, lng: 77.1025, type: 'LOCAL_HUB' }
  ],
  'Ernakulam': [
    { lat: 9.9312, lng: 76.2673, type: 'MEGA_HUB' },
    { lat: 10.0266, lng: 76.3172, type: 'REGIONAL_HUB' },
    { lat: 9.9674, lng: 76.2412, type: 'LOCAL_HUB' }
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
    { lat: 11.2588, lng: 75.7804, type: 'MEGA_HUB' },
    { lat: 11.2480, lng: 75.7686, type: 'REGIONAL_HUB' },
    { lat: 11.2432, lng: 75.7937, type: 'LOCAL_HUB' }
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

// Update all hubs with GPS coordinates
router.post('/update-hub-coordinates', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const hubs = await Hub.find();
    let updated = 0;
    let notFound = 0;
    const results = [];
    
    for (const hub of hubs) {
      const districtCoords = hubCoordinates[hub.district];
      
      if (districtCoords) {
        let coords = districtCoords.find(c => c.type === hub.type);
        
        if (!coords) {
          coords = districtCoords[0];
          const offset = 0.005;
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
        results.push({
          hub: hub.name,
          type: hub.type,
          district: hub.district,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
        });
        updated++;
      } else {
        notFound++;
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updated} hubs with GPS coordinates`,
      updated,
      notFound,
      results
    });
    
  } catch (error) {
    console.error('Error updating hub coordinates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hub coordinates',
      error: error.message
    });
  }
}));

export default router;
