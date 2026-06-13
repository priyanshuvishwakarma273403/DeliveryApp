import { useState, useEffect, useRef } from 'react';
import { 
  Bike, MapPin, Navigation, CheckCircle2, 
  Power, ChevronRight, User, Package, Phone, 
  Clock, Coins, Star, RefreshCw, AlertCircle, 
  Map, Check, X, Shield, Award, DollarSign,
  TrendingUp, BarChart3, ShieldCheck, HelpCircle, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import deliveryService from '../services/deliveryService';
import orderService from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../providers/WebSocketProvider';

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
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/69/69524.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Map Panning Controller
const MapPanController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

// Web Audio API Ding Sound generator
const playIncomingChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.15); // D5
    playTone(783.99, now + 0.12, 0.35); // G5
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const DeliveryDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'earnings' | 'profile'
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuthStore();
  const prevOrdersCountRef = useRef(0);

  // Live simulation coordinates starting near Noida Sector 62
  const [simulating, setSimulating] = useState(false);
  const [riderCoords, setRiderCoords] = useState([28.6273, 77.3725]); // Lat, Lng array
  const restaurantCoords = [28.6295, 77.3790];
  const customerCoords = [28.6210, 77.3620];

  // Fetch active runs & available assignments
  const fetchDashboardData = async (showToast = false) => {
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showToast) setRefreshing(true);

      const res = await deliveryService.getMyDeliveries();
      if (res.success && res.data.length > 0) {
        const active = res.data.find(d => !['DELIVERED', 'REJECTED'].includes(d.status));
        if (active) {
          setActiveDelivery(active);
          
          // Set live coordinate center base on active coordinates
          if (active.currentLatitude && active.currentLongitude) {
            setRiderCoords([active.currentLatitude, active.currentLongitude]);
          }

          const orderRes = await orderService.getOrderById(active.orderId);
          if (orderRes.success) {
            setActiveOrderDetails(orderRes.data);
          }
          setAvailableOrders([]);
        } else {
          setActiveDelivery(null);
          setActiveOrderDetails(null);
          // Fetch available orders
          const availableRes = await deliveryService.getAvailableOrders();
          if (availableRes.success) {
            setAvailableOrders(availableRes.data);
            // Play sound chime if new orders appear
            if (availableRes.data.length > prevOrdersCountRef.current) {
              playIncomingChime();
            }
            prevOrdersCountRef.current = availableRes.data.length;
          }
        }
      } else {
        setActiveDelivery(null);
        setActiveOrderDetails(null);
        // Fetch available orders
        const availableRes = await deliveryService.getAvailableOrders();
        if (availableRes.success) {
          setAvailableOrders(availableRes.data);
          if (availableRes.data.length > prevOrdersCountRef.current) {
            playIncomingChime();
          }
          prevOrdersCountRef.current = availableRes.data.length;
        }
      }

      if (showToast) toast.success('Dashboard synced!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isOnline]);

  // Periodic polling for available orders
  useEffect(() => {
    if (!isOnline || activeDelivery) return;
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 6000); // Poll every 6s for quick updates
    return () => clearInterval(interval);
  }, [isOnline, activeDelivery]);

  // Coordinate movement simulator
  useEffect(() => {
    if (!activeDelivery || activeDelivery.status !== 'PICKED_UP' || !simulating) return;

    // Start rider coords from restaurant and move closer to customer
    setRiderCoords(restaurantCoords);

    let step = 0;
    const totalSteps = 20;

    const interval = setInterval(() => {
      step++;
      const ratio = step / totalSteps;
      
      const newLat = restaurantCoords[0] + (customerCoords[0] - restaurantCoords[0]) * ratio;
      const newLng = restaurantCoords[1] + (customerCoords[1] - restaurantCoords[1]) * ratio;
      
      const newCoords = [newLat, newLng];
      setRiderCoords(newCoords);

      // Post coordinate updates to backend REST fallback (which broadcasts WebSockets)
      deliveryService.updateLocation(activeDelivery.orderId, newLat, newLng)
        .catch(err => console.error("Simulated location sync error:", err));

      if (step >= totalSteps) {
        setSimulating(false);
        clearInterval(interval);
        toast.success("Destination reached! You can now mark order delivered.");
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeDelivery?.orderId, activeDelivery?.status, simulating]);

  const toggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      setAvailableOrders([]);
      setActiveDelivery(null);
      setActiveOrderDetails(null);
      setSimulating(false);
    }
    toast.success(nextState ? 'Status: Online 🟢' : 'Status: Offline 🔴');
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      const res = await deliveryService.acceptOrder(orderId);
      if (res.success) {
        toast.success('Accepted! Head to the restaurant.');
        setRiderCoords(restaurantCoords); // Anchor to restaurant
        await fetchDashboardData();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to accept order');
      fetchDashboardData();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeDelivery) return;
    try {
      if (newStatus === 'PICKED_UP') {
        const res = await deliveryService.markPickedUp(activeDelivery.orderId);
        if (res.success) {
          toast.success('Food Picked Up! Delivery route activated.');
          setSimulating(true); // Auto-start map simulator
          fetchDashboardData();
        }
      } else if (newStatus === 'DELIVERED') {
        const res = await deliveryService.markDelivered(activeDelivery.orderId);
        if (res.success) {
          toast.success('Delivered successfully! Payout added to wallet.', { icon: '💰' });
          setSimulating(false);
          setActiveDelivery(null);
          setActiveOrderDetails(null);
          fetchDashboardData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleRejectOrder = async () => {
    if (!activeDelivery) return;
    if (!window.confirm("Reject this delivery assignment?")) return;
    try {
      setLoading(true);
      const res = await deliveryService.handleAction(activeDelivery.orderId, 'REJECT');
      if (res.success) {
        toast.success('Assignment rejected.');
        setSimulating(false);
        setActiveDelivery(null);
        setActiveOrderDetails(null);
        await fetchDashboardData();
      }
    } catch (e) {
      toast.error('Failed to reject assignment');
    } finally {
      setLoading(false);
    }
  };

  // Dummy Chart & Analytics data for next-level presentation
  const weeklyEarningsData = [
    { name: 'Mon', payout: 420, tips: 60 },
    { name: 'Tue', payout: 510, tips: 110 },
    { name: 'Wed', payout: 390, tips: 40 },
    { name: 'Thu', payout: 640, tips: 90 },
    { name: 'Fri', payout: 750, tips: 120 },
    { name: 'Sat', payout: 980, tips: 220 },
    { name: 'Sun', payout: 1120, tips: 250 },
  ];

  const payoutHistoryList = [
    { id: 'TXN-9011', date: 'Today, 2:40 PM', base: 60, tip: 20, status: 'Completed' },
    { id: 'TXN-8902', date: 'Yesterday, 8:15 PM', base: 54, tip: 15, status: 'Completed' },
    { id: 'TXN-8843', date: 'Yesterday, 1:10 PM', base: 72, tip: 30, status: 'Completed' },
    { id: 'TXN-8692', date: '11 Jun, 9:30 PM', base: 48, tip: 10, status: 'Completed' },
    { id: 'TXN-8511', date: '10 Jun, 7:00 PM', base: 65, tip: 25, status: 'Completed' }
  ];

  if (loading) {
     return (
       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
         <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
         <p className="text-gray-500 font-black animate-pulse">Initializing Fleet Console...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24 md:pb-16 text-[#0F172A] font-sans antialiased">
      {/* Premium Navigation Header */}
      <header className="bg-[#0F172A] text-white px-6 py-4 sticky top-0 z-50 shadow-md">
         <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/20">
                 <Bike size={24} className="stroke-[2.5]" />
              </div>
              <div>
                 <h1 className="text-base font-black tracking-tight flex items-center gap-1.5">
                   Tomato Fleet <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">PRO</span>
                 </h1>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user?.name || 'Rider Partner'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                 onClick={toggleOnline}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                   isOnline 
                     ? 'bg-green-500 text-white shadow-lg shadow-green-400 hover:bg-green-600' 
                     : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                 }`}
              >
                 <Power size={14} className="stroke-[3]" />
                 {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
         <AnimatePresence mode="wait">
           {!isOnline ? (
              /* Offline Panel */
              <motion.div 
                key="offline"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-center py-20 bg-white rounded-3xl border border-gray-200/50 shadow-lg p-10 max-w-lg mx-auto"
              >
                 <div className="h-28 w-28 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 shadow-inner">
                    <Power size={48} className="text-gray-300 stroke-[1.5]" />
                 </div>
                 <h2 className="text-2xl font-black text-[#0F172A] mb-2">You are currently Offline</h2>
                 <p className="text-[#64748B] font-medium mb-8">Go online to receive high-paying delivery assignments, track orders, and view demand hotspots.</p>
                 <Button onClick={toggleOnline} className="px-8 py-4 rounded-2xl font-black text-sm w-full">
                   Go Online
                 </Button>
              </motion.div>
           ) : (
              /* Online Views (Dashboard, Earnings, Profile tabs) */
              <motion.div 
                key="online-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* 3 Tabs Header (Dashboard / Earnings / Profile) */}
                <div className="grid grid-cols-3 bg-white p-1 rounded-2xl border border-gray-200/80 shadow-sm">
                   {[
                     { id: 'dashboard', label: 'Console', icon: Map },
                     { id: 'earnings', label: 'Earnings', icon: BarChart3 },
                     { id: 'profile', label: 'Profile', icon: Award }
                   ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black transition-all ${
                         activeTab === tab.id 
                           ? 'bg-[#0F172A] text-white shadow-md' 
                           : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50'
                       }`}
                     >
                       <tab.icon size={16} />
                       {tab.label}
                     </button>
                   ))}
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Active Runs */}
                    {activeDelivery ? (
                       <div className="space-y-6">
                         {/* Details Card */}
                         <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-200/50 relative overflow-hidden">
                           <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full" />
                           
                           <div className="flex items-center justify-between mb-8">
                             <Badge variant="warning" className="px-3 py-1 font-black text-[10px] tracking-wider uppercase">
                               {activeDelivery.status === 'ASSIGNED' ? 'Assigned' : activeDelivery.status === 'ACCEPTED' ? 'Heading to Restaurant' : 'Out for Delivery'}
                             </Badge>
                             <span className="text-xs font-black text-gray-400">Order #{activeDelivery.orderId}</span>
                           </div>

                           <div className="space-y-8">
                             {/* Restaurant Info */}
                             {(activeDelivery.status === 'ASSIGNED' || activeDelivery.status === 'ACCEPTED') && (
                               <div className="flex gap-4">
                                 <div className="h-11 w-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                   <Package size={20} className="stroke-[2.5]" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick up food at</p>
                                   <h4 className="text-base font-black text-[#0F172A] truncate">{activeOrderDetails?.restaurantName || 'Loading Restaurant...'}</h4>
                                   <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">{activeOrderDetails?.restaurantAddress || 'Sector 62, Noida'}</p>

                                   {/* Items */}
                                   {activeOrderDetails?.orderItems && (
                                     <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 max-w-md">
                                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Item checklist</p>
                                       {activeOrderDetails.orderItems.map((item, idx) => (
                                         <div key={idx} className="flex justify-between text-xs font-bold text-[#0F172A]">
                                           <span>{item.quantity}x {item.menuItemName}</span>
                                         </div>
                                       ))}
                                     </div>
                                   )}

                                   {activeOrderDetails?.restaurantPhone && (
                                     <div className="flex gap-3 mt-4">
                                       <a 
                                         href={`tel:${activeOrderDetails.restaurantPhone}`}
                                         className="px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-xs font-black text-[#0F172A] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                       >
                                         <Phone size={13} className="text-primary" /> Call Restaurant
                                       </a>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}

                             {/* Customer Info */}
                             {activeDelivery.status === 'PICKED_UP' && (
                               <div className="flex gap-4">
                                 <div className="h-11 w-11 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                                   <User size={20} className="stroke-[2.5]" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver food to</p>
                                   <h4 className="text-base font-black text-[#0F172A] truncate">{activeOrderDetails?.customerName || 'Customer'}</h4>
                                   <p className="text-xs text-[#64748B] mt-1 font-bold leading-relaxed">{activeOrderDetails?.deliveryAddress || 'Sector 62, Noida'}</p>

                                   {activeOrderDetails?.specialInstructions && (
                                     <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-bold leading-relaxed">
                                       <strong>Instructions: </strong> {activeOrderDetails.specialInstructions}
                                     </div>
                                   )}

                                   {activeOrderDetails?.customerPhone && (
                                     <div className="flex gap-3 mt-4">
                                       <a 
                                         href={`tel:${activeOrderDetails.customerPhone}`}
                                         className="px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-xs font-black text-[#0F172A] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                       >
                                         <Phone size={13} className="text-green-500" /> Call Customer
                                       </a>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>

                           <div className="mt-10 pt-6 border-t border-gray-50">
                             {activeDelivery.status === 'ASSIGNED' ? (
                               <div className="grid grid-cols-2 gap-4">
                                 <Button onClick={() => handleAcceptOrder(activeDelivery.orderId)} className="w-full py-4 rounded-xl text-sm font-black shadow-lg shadow-primary/20">
                                   <Check size={16} /> Accept Order
                                 </Button>
                                 <Button onClick={handleRejectOrder} variant="outline" className="w-full py-4 rounded-xl text-sm font-black border-red-200 text-red-500 hover:bg-red-50">
                                   <X size={16} /> Reject
                                 </Button>
                               </div>
                             ) : activeDelivery.status === 'ACCEPTED' ? (
                               <div className="space-y-3">
                                 <Button onClick={() => handleStatusChange('PICKED_UP')} className="w-full py-4.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20">
                                   Mark as Picked Up <ChevronRight size={16} />
                                 </Button>
                                 <Button onClick={handleRejectOrder} variant="ghost" className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">
                                   Cancel Assignment
                                 </Button>
                               </div>
                             ) : activeDelivery.status === 'PICKED_UP' ? (
                               <Button onClick={() => handleStatusChange('DELIVERED')} className="w-full py-4.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-black shadow-lg shadow-green-300">
                                 Mark as Delivered <CheckCircle2 size={16} />
                               </Button>
                             ) : null}
                           </div>
                         </div>

                         {/* Live Leaflet Map */}
                         <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200/50">
                            <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                              <Map size={18} className="text-primary" /> Live Route Map
                            </h4>
                            <div className="h-[280px] rounded-2xl overflow-hidden border border-gray-100 z-10 relative">
                              <MapContainer center={riderCoords} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapPanController center={riderCoords} />
                                
                                {/* Restaurant Marker */}
                                <Marker position={restaurantCoords} icon={restaurantIcon}>
                                  <Popup><b>Restaurant</b><br/>Pick up food here</Popup>
                                </Marker>

                                {/* Customer Marker */}
                                <Marker position={customerCoords} icon={customerIcon}>
                                  <Popup><b>Customer</b><br/>Deliver food here</Popup>
                                </Marker>

                                {/* Rider Marker */}
                                <Marker position={riderCoords} icon={riderIcon}>
                                  <Popup><b>Your Location</b><br/>Heading to target</Popup>
                                </Marker>
                              </MapContainer>
                            </div>

                            {activeDelivery.status === 'PICKED_UP' && (
                              <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                <div>
                                  <h5 className="text-xs font-black text-blue-900 flex items-center gap-1">
                                    <Navigation size={12} className="animate-pulse" /> Live Tracking Active
                                  </h5>
                                  <p className="text-[10px] text-blue-700 mt-0.5 font-bold">Simulating rider driving coordinates...</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={simulating} 
                                    onChange={(e) => setSimulating(e.target.checked)} 
                                    className="sr-only peer" 
                                  />
                                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                              </div>
                            )}
                         </div>
                       </div>
                    ) : (
                       /* Idle View */
                       <div className="space-y-6 animate-in fade-in duration-300">
                         {/* Pulse Radar scanning Map with Leaflet */}
                         <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200/50">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-sm font-black">Scanning Hotspots</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Demand zones in Noida</p>
                              </div>
                              <button 
                                 onClick={() => fetchDashboardData(true)}
                                 disabled={refreshing}
                                 className="p-2 border border-gray-200 hover:border-gray-300 rounded-xl bg-white transition-all shadow-sm shrink-0"
                              >
                                 <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary' : 'text-primary'} />
                              </button>
                            </div>

                            {/* Leaflet Map with Demand Hotspot Circles */}
                            <div className="h-[220px] rounded-2xl overflow-hidden border border-gray-100 relative z-10">
                              <MapContainer center={[28.6273, 77.3725]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {/* Hotspot Noida Sec 62 */}
                                <Circle center={[28.6295, 77.3790]} radius={600} pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.15 }} />
                                {/* Hotspot Indirapuram */}
                                <Circle center={[28.6360, 77.3610]} radius={500} pathOptions={{ fillColor: 'orange', color: 'orange', fillOpacity: 0.15 }} />
                                {/* Rider marker */}
                                <Marker position={[28.6273, 77.3725]} icon={riderIcon} />
                              </MapContainer>
                            </div>
                         </div>

                         {/* Available Orders List */}
                         <div className="space-y-4">
                           <h3 className="text-xs font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 pl-2">
                             <Package size={14} className="text-secondary" /> Available Runs ({availableOrders.length})
                           </h3>

                           <AnimatePresence mode="popLayout">
                             {availableOrders.length > 0 ? (
                               availableOrders.map((order) => (
                                 <motion.div
                                   key={order.id}
                                   layout
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                                 >
                                   <div className="flex-1 space-y-2">
                                     <div className="flex items-center gap-2">
                                       <span className="text-xs font-black text-primary">#{order.id}</span>
                                       <Badge variant="success" className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                         {order.status}
                                       </Badge>
                                     </div>
                                     <h4 className="font-bold text-[#0F172A] text-sm">{order.restaurantName}</h4>
                                     <p className="text-xs text-[#64748B] font-medium flex items-center gap-1">
                                       <MapPin size={12} className="text-primary shrink-0" /> {order.deliveryAddress}
                                     </p>
                                     
                                     <div className="flex gap-4 pt-1">
                                       <span className="text-[10px] font-black uppercase text-gray-400">Total pay: ₹{60 + Math.round(order.totalAmount * 0.05)}</span>
                                       <span className="text-[10px] font-black uppercase text-gray-400">Items: {order.orderItems?.length || 0}</span>
                                     </div>
                                   </div>

                                   <div className="shrink-0">
                                     <Button 
                                       onClick={() => handleAcceptOrder(order.id)}
                                       className="px-5 py-3 rounded-xl text-xs font-black shadow-md shadow-primary/10 w-full md:w-auto"
                                     >
                                       Accept Request <ChevronRight size={14} />
                                     </Button>
                                   </div>
                                 </motion.div>
                               ))
                             ) : (
                               <div className="text-center py-12 bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6">
                                 <AlertCircle size={22} className="text-gray-300 mx-auto mb-2" />
                                 <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider">No pending delivery runs nearby.</p>
                               </div>
                             )}
                           </AnimatePresence>
                         </div>
                       </div>
                    )}
                  </div>
                )}

                {/* Earnings Analytics Tab */}
                {activeTab === 'earnings' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 animate-in fade-in duration-300"
                  >
                    {/* Stats Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Weekly Payout</span>
                          <h4 className="text-xl font-black mt-1 text-[#0F172A]">₹4,480</h4>
                       </div>
                       <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tips Earned</span>
                          <h4 className="text-xl font-black mt-1 text-green-500">₹870</h4>
                       </div>
                       <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Completed Runs</span>
                          <h4 className="text-xl font-black mt-1 text-[#0F172A]">72</h4>
                       </div>
                       <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rating Bonus</span>
                          <h4 className="text-xl font-black mt-1 text-primary">₹350</h4>
                       </div>
                    </div>

                    {/* Recharts Bar Chart */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
                       <h4 className="text-sm font-black mb-6 flex items-center gap-2">
                         <BarChart3 size={18} className="text-primary" /> Daily Earnings Breakdown
                       </h4>
                       <div className="h-[240px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={weeklyEarningsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                                <Bar dataKey="payout" name="Base Pay" fill="#FC8019" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="tips" name="Tips" fill="#22C55E" radius={[4, 4, 0, 0]} />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Cash out widget */}
                    <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
                       <div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Available Balance</span>
                         <h4 className="text-2xl font-black mt-1">₹1,120</h4>
                       </div>
                       <Button 
                         onClick={() => {
                           toast.loading('Transferring to Bank Account...', { duration: 1500 });
                           setTimeout(() => toast.success('Transfer successful! ₹1,120 sent to Bank Account.'), 1600);
                         }}
                         className="px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-primary/20"
                       >
                         Instant Cash Out
                       </Button>
                    </div>

                    {/* Payout History Log */}
                    <div className="space-y-3">
                       <h4 className="text-xs font-black text-[#64748B] uppercase tracking-wider pl-2">Payout History Log</h4>
                       <div className="space-y-2">
                         {payoutHistoryList.map((payout, i) => (
                           <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex justify-between items-center">
                             <div>
                               <h5 className="text-sm font-black text-[#0F172A]">Payout {payout.id}</h5>
                               <span className="text-[10px] font-bold text-gray-400">{payout.date}</span>
                             </div>
                             <div className="text-right">
                               <h5 className="text-sm font-black text-[#0F172A]">₹{payout.base + payout.tip}</h5>
                               <span className="text-[9px] font-bold text-green-500 flex items-center gap-0.5 justify-end">
                                 <Check size={10} strokeWidth={3} /> {payout.status}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </motion.div>
                )}

                {/* Profile Performance Tab */}
                {activeTab === 'profile' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 animate-in fade-in duration-300"
                  >
                    {/* Performance Tier Banner */}
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden text-center">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
                          <Award size={280} />
                       </div>
                       <div className="relative z-10">
                         <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-md">
                           <Award size={36} className="stroke-[2.5]" />
                         </div>
                         <h3 className="text-xl font-black">Diamond Tier Partner</h3>
                         <p className="text-xs font-bold text-yellow-100 mt-1 uppercase tracking-wider">5% Extra Incentive on all runs active</p>
                       </div>
                    </div>

                    {/* Stats Grids */}
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'Acceptance Rate', val: '98.4%', desc: 'Target: 95%', color: 'text-green-500' },
                         { label: 'On-Time Delivery', val: '99.2%', desc: 'Target: 98%', color: 'text-green-500' },
                         { label: 'Rating', val: '4.95 ⭐', desc: 'Top 2% in Noida', color: 'text-[#FC8019]' },
                         { label: 'Weekly Active Hours', val: '38h 15m', desc: 'Target: 30h', color: 'text-[#0F172A]' }
                       ].map((stat, i) => (
                         <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</span>
                            <div className="mt-3">
                              <h4 className={`text-2xl font-black ${stat.color}`}>{stat.val}</h4>
                              <p className="text-[10px] font-bold text-[#64748B] mt-0.5">{stat.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* Badges Grid */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm space-y-4">
                       <h4 className="text-sm font-black mb-4 flex items-center gap-2">
                         <Award size={18} className="text-primary" /> Active Badges
                       </h4>
                       <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: 'Speed Demon', icon: Bike, desc: '99% on-time deliveries' },
                            { name: 'Customer Choice', icon: Star, desc: '50+ 5-star ratings' },
                            { name: 'Safe Rider', icon: ShieldCheck, desc: 'Zero incidents reported' }
                          ].map((badge, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center flex flex-col items-center">
                               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 shadow-inner">
                                 <badge.icon size={18} />
                               </div>
                               <h5 className="text-[11px] font-black text-[#0F172A]">{badge.name}</h5>
                               <p className="text-[8px] text-[#64748B] font-bold mt-1 leading-normal uppercase">{badge.desc}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm space-y-4">
                       <h4 className="text-xs font-black text-[#64748B] uppercase tracking-wider">Registered Vehicle</h4>
                       <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                           <Bike size={24} />
                         </div>
                         <div>
                           <h5 className="text-sm font-black text-[#0F172A]">Electric Scooter</h5>
                           <p className="text-xs text-[#64748B] font-semibold mt-0.5">Registration Number: <span className="font-mono font-black text-[#0F172A]">UP-16-AB-8892</span></p>
                         </div>
                         <Badge variant="success" className="ml-auto uppercase text-[9px] font-black">Verified</Badge>
                       </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
           )}
         </AnimatePresence>
      </main>

      {/* Stats Summary Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 py-3 px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] z-40">
        <div className="container mx-auto max-w-2xl flex justify-between items-center text-center">
          <button onClick={() => { setActiveTab('dashboard'); }} className="flex-1 focus:outline-none">
            <span className="block text-xs font-black text-[#0F172A]">{activeDelivery ? 'Active Run' : 'Idle'}</span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Console Status</span>
          </button>
          <div className="w-[1px] h-6 bg-gray-200" />
          <button onClick={() => { setActiveTab('earnings'); }} className="flex-1 focus:outline-none">
            <span className="block text-xs font-black text-primary">₹4,480</span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Weekly Payout</span>
          </button>
          <div className="w-[1px] h-6 bg-gray-200" />
          <button onClick={() => { setActiveTab('profile'); }} className="flex-1 focus:outline-none">
            <span className="block text-xs font-black text-yellow-500 flex items-center justify-center gap-0.5">
              Diamond <Star size={10} fill="currentColor" />
            </span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Rider Tier</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryDashboard;
