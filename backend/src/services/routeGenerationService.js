import Hub from '../models/Hub.js';

const KOTTAYAM_DISTRICT = 'Kottayam';

// Topology Definition (Zone -> Parenting Mega Hub)
const HUB_TOPOLOGY = {
  // South/Central Zone -> Ernakulam Mega Hub
  'Thiruvananthapuram': 'Ernakulam',
  'Kollam': 'Ernakulam',
  'Alappuzha': 'Ernakulam',
  'Pathanamthitta': 'Ernakulam',
  'Kottayam': 'Ernakulam',
  'Idukki': 'Ernakulam',
  'Ernakulam': 'Ernakulam', // Self
  'Thrissur': 'Ernakulam',
  'Palakkad': 'Ernakulam',

  // North Zone -> Kozhikode Mega Hub
  'Malappuram': 'Kozhikode',
  'Kozhikode': 'Kozhikode', // Self
  'Wayanad': 'Kozhikode',
  'Kannur': 'Kozhikode',
  'Kasaragod': 'Kozhikode'
};

export async function generateRoute(destinationDistrict) {
  try {
    // 1. Fetch Key Hubs
    const sourceHub = await Hub.findOne({ district: KOTTAYAM_DISTRICT });
    if (!sourceHub) throw new Error('Kottayam source hub not found');

    const destinationHub = await Hub.findOne({
      district: { $regex: new RegExp(`^${destinationDistrict}$`, 'i') }
    });
    if (!destinationHub) {
      console.warn(`Destination hub for ${destinationDistrict} not found`);
      throw new Error(`Destination hub for ${destinationDistrict} not found`);
    }

    // 2. Identify Mega Hubs for Start and End
    // Normalize casing for lookup
    const destDistrictProper = destinationHub.district;
    const sourceDistrictProper = sourceHub.district;

    const sourceMegaName = HUB_TOPOLOGY[sourceDistrictProper] || 'Ernakulam'; // Default to Ernakulam
    const destMegaName = HUB_TOPOLOGY[destDistrictProper] || 'Ernakulam';

    // 3. Construct Path Strategy (List of District Names)
    let pathDistricts = [];

    // SPECIAL CASE: Same district delivery (Source = Destination)
    // For local deliveries within the source district, no need to send to mega hub
    if (sourceDistrictProper === destDistrictProper) {
      pathDistricts.push(sourceDistrictProper);
      
      // Early return with just the source hub for local delivery
      const hubsInRoute = await Hub.find({
        district: sourceDistrictProper,
        isActive: true
      });
      
      return hubsInRoute.length > 0 ? [hubsInRoute[0]] : [];
    }

    // Start at Source
    pathDistricts.push(sourceDistrictProper);

    // If Source != SourceMega, go to SourceMega
    if (sourceDistrictProper !== sourceMegaName) {
      pathDistricts.push(sourceMegaName);
    }

    // If SourceMega != DestMega, jump to DestMega
    if (sourceMegaName !== destMegaName) {
      // Direct jump (Flight/Express Haul)
      pathDistricts.push(destMegaName);
    }

    // If DestMega != Destination, go to Destination
    // (And check we didn't already add DestMega in previous step or if Dest is DestMega)
    if (destMegaName !== destDistrictProper) {
      // Avoid duplicates if we are already at DestMega
      if (pathDistricts[pathDistricts.length - 1] !== destDistrictProper) {
        pathDistricts.push(destDistrictProper);
      }
    }

    // Remove immediate duplicates (Sequence filtering)
    const uniquePath = [...new Set(pathDistricts)];

    // 4. Fetch Hub Objects for the Path
    // We need to preserve the ORDER of `uniquePath`. 
    // `Hub.find` returns arbitrary order.

    // Fetch all needed hubs in one query
    const hubsInRoute = await Hub.find({
      district: { $in: uniquePath },
      isActive: true
    });

    // Map back to the ordered list
    const route = uniquePath.map(districtName => {
      const h = hubsInRoute.find(h => h.district === districtName);
      if (!h) console.warn(`Hub in route not found: ${districtName}`);
      return h;
    }).filter(h => h); // Remove undefined if any missing

    return route;

  } catch (error) {
    console.error('Route generation error:', error);
    throw error;
  }
}

export async function getRouteInfo(route) {
  return route.map(hub => ({
    _id: hub._id,
    name: hub.name,
    district: hub.district,
    order: hub.order,
    type: hub.type
  }));
}
