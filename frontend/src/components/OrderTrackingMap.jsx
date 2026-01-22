import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 20px;
          font-weight: bold;
        ">${icon}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const currentHubIcon = createIcon('#10b981', '📍');
const destinationIcon = createIcon('#ef4444', '🏠');
const hubIcon = createIcon('#3b82f6', '🏢');
const deliveredIcon = createIcon('#22c55e', '✓');

// Component to auto-fit bounds
function FitBounds({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [bounds, map]);
  
  return null;
}

const OrderTrackingMap = ({ order, routeData }) => {
  const mapRef = useRef(null);
  
  // Default center (Kerala, India)
  const defaultCenter = [10.8505, 76.2711];
  
  // Get coordinates for markers
  const getMarkers = () => {
    const markers = [];
    const routeCoordinates = [];
    
    // Debug logging
    console.log('🗺️ OrderTrackingMap - Order data:', {
      currentHub: order.currentHub?.name,
      district: order.currentHub?.district,
      collectionHub: order.collectionHub?.name,
      deliveryType: order.deliveryType,
      shippingDistrict: order.shippingAddress?.district
    });
    console.log('🗺️ Current Hub District:', order.currentHub?.district);
    console.log('🗺️ Collection Hub District:', order.collectionHub?.district);
    console.log('🗺️ Shipping Address District:', order.shippingAddress?.district);
    console.log('🗺️ Full order object:', order);
    
    // Get district - prioritize shipping address since hubs might not be populated
    const district = order.shippingAddress?.district || 
                    order.currentHub?.district || 
                    order.collectionHub?.district;
    
    console.log('🗺️ Using district for map:', district);
    
    // Kerala district coordinates for fallback
    const districtCoords = {
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Kollam': { lat: 8.8932, lng: 76.6141 },
      'Alappuzha': { lat: 9.4981, lng: 76.3388 },
      'Kottayam': { lat: 9.5916, lng: 76.5222 },
      'Ernakulam': { lat: 9.9312, lng: 76.2673 },
      'Thrissur': { lat: 10.5276, lng: 76.2144 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Malappuram': { lat: 11.0510, lng: 76.0711 },
      'Kozhikode': { lat: 11.2588, lng: 75.7804 },
      'Kannur': { lat: 11.8745, lng: 75.3704 },
      'Kasaragod': { lat: 12.4996, lng: 75.0077 }
    };
    
    // Add hubs from route
    if (routeData && routeData.route && routeData.route.length > 0) {
      routeData.route.forEach((hub, index) => {
        let position;
        
        if (hub.location?.coordinates?.lat && hub.location?.coordinates?.lng) {
          // Use actual coordinates if available
          position = [hub.location.coordinates.lat, hub.location.coordinates.lng];
        } else if (districtCoords[hub.district]) {
          // Use district coordinates as fallback
          const coords = districtCoords[hub.district];
          const offset = (index * 0.02);
          position = [coords.lat + offset, coords.lng + offset];
        } else {
          // Last resort: Kerala center with offset
          position = [10.8505 + (index * 0.5), 76.2711 + (index * 0.5)];
        }
        
        routeCoordinates.push(position);
        
        const isCurrent = order.currentHub && order.currentHub._id === hub._id;
        const isPassed = routeData.currentHubIndex !== undefined && index < routeData.currentHubIndex;
        
        // Build detailed hub info
        let hubInfo = hub.district || 'Hub';
        if (hub.type) {
          hubInfo = `${hub.district} - ${hub.type.replace('_', ' ')}`;
        }
        if (hub.location?.address) {
          hubInfo = hub.location.address;
          if (hub.location.city) {
            hubInfo += `, ${hub.location.city}`;
          }
          if (hub.location.pincode) {
            hubInfo += ` - ${hub.location.pincode}`;
          }
        }
        
        markers.push({
          position,
          type: isCurrent ? 'current' : isPassed ? 'passed' : 'upcoming',
          label: hub.name,
          info: hubInfo,
          fullAddress: hub.location
        });
      });
    } else if (order.currentHub) {
      // Fallback: show current hub with district coordinates
      let position;
      // Use shipping address district if hub is not populated
      const hubDistrict = order.currentHub.district || district;
      
      if (order.currentHub.location?.coordinates?.lat) {
        position = [
          order.currentHub.location.coordinates.lat,
          order.currentHub.location.coordinates.lng
        ];
      } else if (districtCoords[hubDistrict]) {
        const coords = districtCoords[hubDistrict];
        position = [coords.lat, coords.lng];
      } else {
        position = [10.8505, 76.2711]; // Kerala center
      }
      
      // Build detailed hub info
      let hubInfo = hubDistrict || 'Current Location';
      if (order.currentHub.location?.address) {
        hubInfo = order.currentHub.location.address;
        if (order.currentHub.location.city) {
          hubInfo += `, ${order.currentHub.location.city}`;
        }
        if (order.currentHub.location.pincode) {
          hubInfo += ` - ${order.currentHub.location.pincode}`;
        }
      }
      
      markers.push({
        position,
        type: 'current',
        label: order.currentHub.name || `${hubDistrict} Hub`,
        info: hubInfo,
        fullAddress: order.currentHub.location
      });
      routeCoordinates.push(position);
    }
    
    // Add destination marker (if home delivery)
    if (order.deliveryType === 'HOME_DELIVERY' && order.shippingAddress) {
      const destDistrict = order.shippingAddress.district;
      let destPosition;
      
      if (districtCoords[destDistrict]) {
        const coords = districtCoords[destDistrict];
        destPosition = [coords.lat - 0.05, coords.lng + 0.05];
      } else {
        destPosition = [10.5, 76.0];
      }
      
      markers.push({
        position: destPosition,
        type: 'destination',
        label: 'Delivery Address',
        info: `${order.shippingAddress.line1}, ${destDistrict}`
      });
      routeCoordinates.push(destPosition);
    } else if (order.deliveryType === 'HUB_COLLECTION' && order.collectionHub) {
      // Show collection hub
      // Use shipping address district if hub is not populated
      const hubDistrict = order.collectionHub.district || district;
      let position;
      
      if (order.collectionHub.location?.coordinates?.lat) {
        position = [
          order.collectionHub.location.coordinates.lat,
          order.collectionHub.location.coordinates.lng
        ];
      } else if (districtCoords[hubDistrict]) {
        const coords = districtCoords[hubDistrict];
        position = [coords.lat, coords.lng];
      } else {
        position = [10.8505, 76.2711];
      }
      
      if (!markers.find(m => m.label === order.collectionHub.name)) {
        // Build detailed hub info
        let hubInfo = `Collection Hub - ${hubDistrict}`;
        if (order.collectionHub.location?.address) {
          hubInfo = order.collectionHub.location.address;
          if (order.collectionHub.location.city) {
            hubInfo += `, ${order.collectionHub.location.city}`;
          }
          if (order.collectionHub.location.pincode) {
            hubInfo += ` - ${order.collectionHub.location.pincode}`;
          }
        }
        
        markers.push({
          position,
          type: order.status === 'DELIVERED' ? 'delivered' : 'destination',
          label: order.collectionHub.name || `${hubDistrict} Collection Hub`,
          info: hubInfo,
          fullAddress: order.collectionHub.location
        });
        routeCoordinates.push(position);
      }
    }
    
    return { markers, routeCoordinates };
  };
  
  const { markers, routeCoordinates } = getMarkers();
  
  // Calculate bounds for auto-fitting
  const bounds = markers.length > 0 
    ? markers.map(m => m.position)
    : null;
  
  const getMarkerIcon = (type) => {
    switch(type) {
      case 'current': return currentHubIcon;
      case 'destination': return destinationIcon;
      case 'delivered': return deliveredIcon;
      case 'passed': return hubIcon;
      default: return hubIcon;
    }
  };
  
  const getStatusColor = (type) => {
    switch(type) {
      case 'current': return '#10b981';
      case 'destination': return '#ef4444';
      case 'delivered': return '#22c55e';
      case 'passed': return '#3b82f6';
      default: return '#94a3b8';
    }
  };
  
  if (markers.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280', margin: 0 }}>
          📍 Location tracking not available for this order
        </p>
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={markers[0]?.position || defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route line */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#10b981"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
        
        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup>
              <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: getStatusColor(marker.type),
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {marker.label}
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                  {marker.info}
                </p>
                {marker.fullAddress?.landmark && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    🗺️ {marker.fullAddress.landmark}
                  </p>
                )}
                {marker.type === 'current' && (
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '0.75rem', 
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    📦 Current Location
                  </p>
                )}
                {(marker.type === 'destination' || marker.type === 'delivered') && marker.fullAddress?.address && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.info)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: '#10b981',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    📍 View on Google Maps
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Auto-fit bounds */}
        {bounds && <FitBounds bounds={bounds} />}
      </MapContainer>
    </div>
  );
};

export default OrderTrackingMap;
