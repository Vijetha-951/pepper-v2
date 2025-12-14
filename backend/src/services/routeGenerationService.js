import Hub from '../models/Hub.js';

const KOTTAYAM_DISTRICT = 'Kottayam';

export async function generateRoute(destinationDistrict) {
  try {
    const sourceHub = await Hub.findOne({ district: KOTTAYAM_DISTRICT });
    if (!sourceHub) {
      throw new Error('Kottayam hub not found');
    }

    const destinationHub = await Hub.findOne({
      district: { $regex: new RegExp(`^${destinationDistrict}$`, 'i') }
    });
    if (!destinationHub) {
      console.warn(`Destination hub for ${destinationDistrict} not found (Case Insensitive Search)`);
      throw new Error(`Destination hub for ${destinationDistrict} not found`);
    }

    const allHubs = await Hub.find({ isActive: true }).sort({ order: 1 });

    let route = [];

    if (destinationHub.order > sourceHub.order) {
      route = allHubs.filter(
        hub => hub.order >= sourceHub.order && hub.order <= destinationHub.order
      );
    } else if (destinationHub.order < sourceHub.order) {
      route = allHubs
        .filter(hub => hub.order >= destinationHub.order && hub.order <= sourceHub.order)
        .reverse();
    } else {
      route = [sourceHub];
    }

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
