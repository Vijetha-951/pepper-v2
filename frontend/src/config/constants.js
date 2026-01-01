// Application Constants

/**
 * Hub System Launch Date
 * Orders placed on or after this date will use hub-based tracking.
 * Orders before this date will use the legacy tracking system.
 * 
 * Format: 'YYYY-MM-DD'
 */
export const HUB_LAUNCH_DATE = new Date('2025-12-15');

/**
 * Check if an order should use hub-based tracking
 * @param {Date|string} orderDate - The order creation date
 * @returns {boolean}
 */
export const shouldUseHubTracking = (orderDate) => {
  const date = new Date(orderDate);
  return date >= HUB_LAUNCH_DATE;
};
