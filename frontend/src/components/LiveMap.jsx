import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;

const createCustomIcon = (IconComponent, color) => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{ color }}>
      <IconComponent size={32} />
    </div>
  );
  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const navIcon = createCustomIcon(Navigation, '#ef4444'); // red-500

// Helper component to auto-center the map when GPS moves
const AutoCenterView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const LiveMap = () => {
  // Default fallback coordinates before GPS loads
  const [userPosition, setUserPosition] = useState([12.9716, 77.5946]);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setHasLocation(true);
      },
      (error) => {
        console.error("Error getting GPS location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-gray-700/50 z-0">
      <MapContainer 
        center={userPosition} 
        zoom={15} 
        style={{ height: '100%', width: '100%', background: '#1f2937' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map
        />
        
        {hasLocation && <AutoCenterView center={userPosition} />}

        <Marker position={userPosition} icon={navIcon}>
          <Popup className="custom-popup">
            <div className="font-bold text-gray-900">You are here</div>
            <div className="text-sm text-gray-600">Real-time GPS Location</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LiveMap;
