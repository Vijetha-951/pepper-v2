import Hub from '../models/Hub.js';
import { generateRoute } from './routeGenerationService.js';

export const planRoute = async (pincode, district) => {
  try {
    if (!district) {
      console.warn('District not provided for route planning');
      return [];
    }

    const route = await generateRoute(district);
    return route.map(hub => hub._id);
  } catch (error) {
    console.error('Error planning route:', error);
    return [];
  }
};
