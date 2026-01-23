import express from 'express';
import Hub from '../models/Hub.js';
import { requireAuth } from '../middleware/auth.js';
import { getCoordinatesForPincode, isPincodeSupported } from '../data/pincodeCoordinates.js';

const router = express.Router();

// Helper function to calculate distance between two coordinates (Haversine formula)
// Returns distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Find nearest hub by pincode using distance calculation
router.post('/find-nearest-hub', requireAuth, async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode is required'
      });
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits.'
      });
    }

    // Get coordinates for the entered pincode
    const pincodeCoords = getCoordinatesForPincode(pincode);
    
    if (!pincodeCoords) {
      return res.status(404).json({
        success: false,
        message: `Pincode ${pincode} is not currently serviced. Please enter a valid Kerala pincode.`,
        supportedArea: 'Currently supporting all Kerala districts'
      });
    }

    // Get all active hubs with coordinates
    const hubs = await Hub.find({
      isActive: true,
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    if (hubs.length === 0) {
      // Fallback: Try to get any active hub if no hubs have coordinates
      console.warn('⚠️ No hubs with coordinates found. Checking for any active hubs...');
      const fallbackHubs = await Hub.find({ isActive: true });
      
      if (fallbackHubs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active hubs available for delivery. Please try again later.'
        });
      }

      // Return first available hub without distance calculation
      return res.json({
        success: true,
        hub: fallbackHubs[0],
        distance: null,
        distanceFormatted: 'Distance not available',
        matchType: 'fallback',
        pincodeInfo: {
          pincode: pincode,
          district: pincodeCoords.district,
          state: pincodeCoords.state
        },
        message: 'Hub assigned (coordinates not available for distance calculation)'
      });
    }

    // Calculate distance to each hub with district awareness
    const hubsWithDistance = hubs.map(hub => {
      const distance = calculateDistance(
        pincodeCoords.lat,
        pincodeCoords.lng,
        hub.location.coordinates.lat,
        hub.location.coordinates.lng
      );
      
      const sameDistrict = hub.district?.toLowerCase() === pincodeCoords.district?.toLowerCase();
      
      return {
        hub: hub,
        distance: distance,
        distanceFormatted: `${distance.toFixed(2)} km`,
        sameDistrict: sameDistrict
      };
    });

    // PRIORITY: Prefer hubs in same district, then use distance
    const sameDistrictHubs = hubsWithDistance.filter(h => h.sameDistrict);
    const hubsToConsider = sameDistrictHubs.length > 0 ? sameDistrictHubs : hubsWithDistance;
    hubsToConsider.sort((a, b) => a.distance - b.distance);

    // Get the nearest hub (district-aware)
    const nearest = hubsToConsider[0];

    // Check if pincode is explicitly in hub's coverage
    let matchType = 'distance';
    if (nearest.hub.coverage?.pincodes?.includes(pincode)) {
      matchType = 'exact';
    } else if (nearest.hub.location?.pincode === pincode) {
      matchType = 'location';
    }

    return res.json({
      success: true,
      hub: nearest.hub,
      distance: nearest.distance,
      distanceFormatted: nearest.distanceFormatted,
      matchType: matchType,
      sameDistrict: nearest.sameDistrict,
      pincodeInfo: {
        pincode: pincode,
        district: pincodeCoords.district,
        state: pincodeCoords.state
      },
      message: matchType === 'distance' 
        ? `Assigned ${nearest.sameDistrict ? 'nearest hub in same district' : 'nearest available hub'} (${nearest.distanceFormatted} away)`
        : null
    });

  } catch (error) {
    console.error('Error finding nearest hub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearest hub',
      error: error.message
    });
  }
});

// Get hub by pincode with distance calculation (Alternative GET endpoint)
router.get('/by-pincode/:pincode', requireAuth, async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format'
      });
    }

    // Get coordinates for the pincode
    const pincodeCoords = getCoordinatesForPincode(pincode);
    
    if (!pincodeCoords) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not supported'
      });
    }

    // Get all active hubs with coordinates
    const hubs = await Hub.find({
      isActive: true,
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    if (hubs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hubs available'
      });
    }

    // Calculate distances with district awareness
    const hubsWithDistance = hubs.map(hub => {
      const distance = calculateDistance(
        pincodeCoords.lat,
        pincodeCoords.lng,
        hub.location.coordinates.lat,
        hub.location.coordinates.lng
      );
      const sameDistrict = hub.district?.toLowerCase() === pincodeCoords.district?.toLowerCase();
      
      return {
        hub: hub,
        distance: distance,
        sameDistrict: sameDistrict
      };
    });

    // Prioritize same-district hubs
    const sameDistrictHubs = hubsWithDistance.filter(h => h.sameDistrict);
    const hubsToConsider = sameDistrictHubs.length > 0 ? sameDistrictHubs : hubsWithDistance;
    hubsToConsider.sort((a, b) => a.distance - b.distance);

    const nearest = hubsToConsider[0];

    let matchType = 'distance';
    if (nearest.hub.coverage?.pincodes?.includes(pincode)) {
      matchType = 'exact';
    } else if (nearest.hub.location?.pincode === pincode) {
      matchType = 'location';
    }

    return res.json({
      success: true,
      hub: nearest.hub,
      distance: nearest.distance,
      matchType: matchType
    });

  } catch (error) {
    console.error('Error fetching hub by pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hub',
      error: error.message
    });
  }
});

// Get all hubs with distances from a pincode
router.post('/all-with-distances', requireAuth, async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit pincode is required'
      });
    }

    const pincodeCoords = getCoordinatesForPincode(pincode);
    
    if (!pincodeCoords) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not supported'
      });
    }

    const hubs = await Hub.find({
      isActive: true,
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    const hubsWithDistance = hubs.map(hub => {
      const distance = calculateDistance(
        pincodeCoords.lat,
        pincodeCoords.lng,
        hub.location.coordinates.lat,
        hub.location.coordinates.lng
      );
      const sameDistrict = hub.district?.toLowerCase() === pincodeCoords.district?.toLowerCase();
      
      return {
        ...hub.toObject(),
        distance: distance,
        distanceFormatted: `${distance.toFixed(2)} km`,
        sameDistrict: sameDistrict
      };
    });

    // Sort: same-district hubs first, then by distance
    hubsWithDistance.sort((a, b) => {
      if (a.sameDistrict && !b.sameDistrict) return -1;
      if (!a.sameDistrict && b.sameDistrict) return 1;
      return a.distance - b.distance;
    });

    return res.json({
      success: true,
      hubs: hubsWithDistance,
      pincodeInfo: pincodeCoords
    });

  } catch (error) {
    console.error('Error fetching hubs with distances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hubs',
      error: error.message
    });
  }
});

export default router;
