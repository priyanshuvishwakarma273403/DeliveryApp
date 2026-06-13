import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { Phone, Navigation, Star, ShieldCheck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet marker icons issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Restaurant, Rider, Customer
const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7542/7542190.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42]
});

const homeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Component to dynamically focus and fit bounds
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const validCoords = positions.filter(pos => pos && pos.lat && pos.lng);
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
      }
    }
  }, [positions, map]);
  return null;
}

// Component to pan/re-center to the rider position smoothly
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.panTo([position.lat, position.lng]);
    }
  }, [position, map]);
  return null;
}

// Haversine formula to compute distance in km
const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LiveMap = ({ riderPos, restaurantPos, userPos, order }) => {
  const [lineOffset, setLineOffset] = useState(0);

  // Animate the flowing polyline route dots
  useEffect(() => {
    const interval = setInterval(() => {
      setLineOffset(prev => (prev + 1) % 20);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const distance = useMemo(() => {
    if (!riderPos || !userPos) return 0;
    return getHaversineDistance(riderPos.lat, riderPos.lng, userPos.lat, userPos.lng);
  }, [riderPos, userPos]);

  const eta = useMemo(() => {
    // Assuming average bike delivery speed is ~20km/h + 2 mins restaurant pick/parking buffer
    return Math.max(2, Math.round(distance * 3.5 + 2));
  }, [distance]);

  // Combine positions to fit bounds on start
  const allPositions = useMemo(() => {
    return [riderPos, restaurantPos, userPos];
  }, [riderPos, restaurantPos, userPos]);

  const riderName = order?.delivery?.deliveryPartnerName || 'Rahul Sharma';
  const riderPhone = order?.delivery?.deliveryPartnerPhone || '';
  const orderStatus = order?.status || 'OUT_FOR_DELIVERY';

  return (
    <div className="h-full w-full relative overflow-hidden bg-gray-100">
      <MapContainer 
        center={[riderPos.lat, riderPos.lng]} 
        zoom={14} 
        zoomControl={false}
        className="z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds positions={allPositions} />
        <RecenterMap position={riderPos} />

        {/* Restaurant Pin */}
        <Marker position={[restaurantPos.lat, restaurantPos.lng]} icon={restaurantIcon}>
          <Popup>
            <div className="text-xs">
              <strong className="text-primary font-black block">{order?.restaurantName || 'Restaurant'}</strong>
              <span className="text-gray-500 font-semibold">{order?.restaurantAddress || 'Picking up food here'}</span>
            </div>
          </Popup>
        </Marker>

        {/* Customer Home Pin */}
        <Marker position={[userPos.lat, userPos.lng]} icon={homeIcon}>
          <Popup>
            <div className="text-xs">
              <strong className="text-secondary font-black block">Your Location</strong>
              <span className="text-gray-500 font-semibold">{order?.deliveryAddress}</span>
            </div>
          </Popup>
        </Marker>

        {/* Rider Pin */}
        <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
          <Popup>
            <div className="text-xs">
              <strong className="text-green-600 font-black block">{riderName}</strong>
              <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Tomato Delivery Executive</span>
            </div>
          </Popup>
        </Marker>

        {/* Route Polylines */}
        {/* Restaurant to Customer dotted path */}
        <Polyline 
          positions={[[restaurantPos.lat, restaurantPos.lng], [userPos.lat, userPos.lng]]} 
          color="#94A3B8" 
          weight={2} 
          dashArray="6, 8" 
        />
        
        {/* Rider current location to Customer path (Out for delivery indicator) */}
        <Polyline 
          positions={[[riderPos.lat, riderPos.lng], [userPos.lat, userPos.lng]]} 
          color="#FC8019" 
          weight={4} 
          dashArray="4, 10" 
        />
      </MapContainer>

      {/* Floating Status Badge */}
      <div className="absolute top-6 left-6 z-[400]">
         <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F172A]">Live Tracking Active</span>
         </div>
      </div>

      {/* Floating Action Buttons */}
      {riderPhone && (
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-[400]">
          <a 
            href={`tel:${riderPhone}`}
            className="h-12 w-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-primary border border-gray-150 hover:bg-gray-50 transition-colors"
          >
            <Phone size={20} />
          </a>
        </div>
      )}

      {/* Premium Glassmorphic Bottom Panel */}
      <AnimatePresence>
        <div className="absolute bottom-6 left-6 right-6 z-[400] max-w-lg mx-auto">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-[#FC8019]/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Navigation size={22} className="stroke-[2.5] animate-bounce" />
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-0.5">Your Valet</p>
                 <div className="flex items-center gap-2">
                   <h4 className="font-black text-base text-[#0F172A] dark:text-white truncate max-w-[140px]">{riderName}</h4>
                   <span className="bg-orange-50 text-primary dark:bg-primary/10 dark:text-primary text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                     <Star size={9} fill="currentColor" /> 4.9
                   </span>
                 </div>
                 <p className="text-[9px] text-[#64748B] dark:text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                   <ShieldCheck size={11} className="text-green-500" /> COVID Vaccinated & Safe
                 </p>
               </div>
            </div>
            
            <div className="w-[1px] h-10 bg-gray-100 dark:bg-gray-800 self-center shrink-0" />
            
            <div className="text-right shrink-0">
               <p className="text-[9px] font-black uppercase tracking-[0.15em] text-primary mb-0.5">Estimated Arrival</p>
               <h5 className="font-black text-lg text-[#0F172A] dark:text-white">~ {eta} Mins</h5>
               <p className="text-[9px] font-bold text-[#64748B] dark:text-gray-400 mt-0.5">{distance.toFixed(1)} km away</p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
};

export default LiveMap;
