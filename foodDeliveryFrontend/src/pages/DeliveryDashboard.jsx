import { useState, useEffect } from 'react';
import { 
  Bike, MapPin, Navigation, CheckCircle2, 
  Power, ChevronRight, User, Package, Phone, 
  Clock, Coins, Star, RefreshCw, AlertCircle, 
  Map, Check, X, Shield, Award, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import deliveryService from '../services/deliveryService';
import orderService from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../providers/WebSocketProvider';

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const { client } = useWebSocket();

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulatedCoords, setSimulatedCoords] = useState({ lat: 28.6139, lng: 77.2090 });

  // Fetch active deliveries & available orders
  const fetchData = async (showRefreshToast = false) => {
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showRefreshToast) setRefreshing(true);
      
      // 1. Fetch active deliveries
      const res = await deliveryService.getMyDeliveries();
      if (res.success && res.data.length > 0) {
        const active = res.data.find(d => !['DELIVERED', 'REJECTED'].includes(d.status));
        if (active) {
          setActiveDelivery(active);
          // Fetch corresponding order details
          const orderRes = await orderService.getOrderById(active.orderId);
          if (orderRes.success) {
            setActiveOrderDetails(orderRes.data);
          }
          setAvailableOrders([]);
        } else {
          setActiveDelivery(null);
          setActiveOrderDetails(null);
          // 2. Fetch available orders since no active delivery
          const availableRes = await deliveryService.getAvailableOrders();
          if (availableRes.success) {
            setAvailableOrders(availableRes.data);
          }
        }
      } else {
        setActiveDelivery(null);
        setActiveOrderDetails(null);
        // 2. Fetch available orders since no active delivery
        const availableRes = await deliveryService.getAvailableOrders();
        if (availableRes.success) {
          setAvailableOrders(availableRes.data);
        }
      }

      if (showRefreshToast) {
        toast.success('Dashboard updated!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOnline]);

  // Periodic polling for available orders when online and idle
  useEffect(() => {
    if (!isOnline || activeDelivery) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [isOnline, activeDelivery]);

  // Handle location update simulation
  useEffect(() => {
    if (!activeDelivery || activeDelivery.status !== 'PICKED_UP' || !simulating) return;

    // Simulate path starting from a base restaurant position towards customer
    const interval = setInterval(() => {
      setSimulatedCoords(prev => {
        const nextCoords = {
          lat: prev.lat + (Math.random() - 0.45) * 0.0008,
          lng: prev.lng + (Math.random() - 0.45) * 0.0008
        };
        // Update live coordinates on the server
        deliveryService.updateLocation(activeDelivery.orderId, nextCoords.lat, nextCoords.lng)
          .catch(err => console.error("Live coordinate update failed:", err));
        return nextCoords;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeDelivery?.orderId, activeDelivery?.status, simulating]);

  const toggleOnline = () => {
    const nextOnlineState = !isOnline;
    setIsOnline(nextOnlineState);
    if (!nextOnlineState) {
      setAvailableOrders([]);
      setActiveDelivery(null);
      setActiveOrderDetails(null);
      setSimulating(false);
    }
    toast.success(nextOnlineState ? 'You are now Online 🟢' : 'You are now Offline 🔴');
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      const res = await deliveryService.acceptOrder(orderId);
      if (res.success) {
        toast.success('Delivery Request Accepted! Drive safely.');
        // Seed initial simulation coordinates near a standard spot
        setSimulatedCoords({ lat: 28.6139 + (Math.random() - 0.5) * 0.01, lng: 77.2090 + (Math.random() - 0.5) * 0.01 });
        await fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!activeDelivery) return;
    try {
      if (newStatus === 'PICKED_UP') {
        const res = await deliveryService.markPickedUp(activeDelivery.orderId);
        if (res.success) {
          toast.success('Order Picked Up! Live tracking enabled.');
          setSimulating(true); // Auto-start simulation for convenience
          fetchData();
        }
      } else if (newStatus === 'DELIVERED') {
        const res = await deliveryService.markDelivered(activeDelivery.orderId);
        if (res.success) {
          toast.success('Order Delivered successfully! 🎉', { icon: '👏' });
          setSimulating(false);
          setActiveDelivery(null);
          setActiveOrderDetails(null);
          fetchData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRejectOrder = async () => {
    if (!activeDelivery) return;
    if (!window.confirm("Are you sure you want to reject/cancel this delivery assignment?")) return;
    try {
      setLoading(true);
      const res = await deliveryService.handleAction(activeDelivery.orderId, 'REJECT');
      if (res.success) {
        toast.success('Delivery assignment rejected.');
        setSimulating(false);
        setActiveDelivery(null);
        setActiveOrderDetails(null);
        await fetchData();
      }
    } catch (error) {
      toast.error('Failed to reject assignment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
         <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
         <p className="text-text-secondary font-black animate-pulse">Loading Rider Dashboard...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-12 text-[#1C1C1C]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-40 shadow-sm">
         <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/20">
                 <Bike size={24} className="stroke-[2.5]" />
              </div>
              <div>
                 <h1 className="text-lg font-black tracking-tight text-[#1C1C1C]">Tomato Fleet</h1>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Rider Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                 onClick={toggleOnline}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                   isOnline 
                     ? 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600' 
                     : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                 }`}
              >
                 <Power size={14} className="stroke-[3]" />
                 {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
         </div>
      </header>

      {/* Main Body */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
          <AnimatePresence mode="wait">
            {!isOnline ? (
              /* Offline View */
              <motion.div 
                key="offline"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8"
              >
                 <div className="h-32 w-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 shadow-inner">
                    <Power size={48} className="text-gray-300 stroke-[1.5]" />
                 </div>
                 <h2 className="text-2xl font-black text-[#1C1C1C] mb-2">You are Offline</h2>
                 <p className="text-[#686B78] font-medium max-w-xs mx-auto mb-8">Toggle online to start receiving and accepting delivery orders near you.</p>
                 <Button onClick={toggleOnline} className="px-8 py-3.5 rounded-2xl font-black text-sm">
                   Go Online Now
                 </Button>
              </motion.div>
            ) : activeDelivery ? (
              /* Active Order Handling View */
              <motion.div 
                key="active-delivery"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 animate-in fade-in duration-300"
              >
                {/* Active Info Banner */}
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full" />
                   
                   <div className="flex items-center justify-between mb-8">
                      <Badge variant="warning" className="px-3 py-1 font-black text-[10px] tracking-wider uppercase">
                        {activeDelivery.status === 'ASSIGNED' ? 'Assigned' : activeDelivery.status === 'ACCEPTED' ? 'Accepted' : 'Picked Up'}
                      </Badge>
                      <span className="text-xs font-black text-gray-400">Order #{activeDelivery.orderId}</span>
                   </div>

                   {/* Step Info */}
                   <div className="space-y-8">
                     {/* RESTAURANT DETALS (Accept / Pick Up Stage) */}
                     {(activeDelivery.status === 'ASSIGNED' || activeDelivery.status === 'ACCEPTED') && (
                       <div className="flex gap-4">
                         <div className="h-11 w-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                           <Package size={20} className="stroke-[2.5]" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pick up from</p>
                           <h4 className="text-base font-black text-[#1C1C1C] truncate">{activeOrderDetails?.restaurantName || 'Loading Restaurant...'}</h4>
                           {activeOrderDetails?.restaurantAddress && (
                             <p className="text-xs text-[#686B78] mt-1 font-medium">{activeOrderDetails.restaurantAddress}</p>
                           )}
                           
                           {/* Item List Summary */}
                           {activeOrderDetails?.orderItems && (
                             <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100 max-w-md">
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Items to Pick Up</p>
                               <div className="space-y-1">
                                 {activeOrderDetails.orderItems.map((item, idx) => (
                                   <div key={idx} className="flex justify-between text-xs font-bold text-[#1C1C1C]">
                                     <span className="text-[#686B78]">{item.quantity}x {item.menuItemName}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {activeOrderDetails?.restaurantPhone && (
                             <div className="flex gap-3 mt-4">
                               <a 
                                 href={`tel:${activeOrderDetails.restaurantPhone}`}
                                 className="px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-xs font-bold text-text-primary rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                               >
                                 <Phone size={14} className="text-primary" /> Call Restaurant
                               </a>
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                     {/* CUSTOMER DETAILS (Delivery Stage) */}
                     {activeDelivery.status === 'PICKED_UP' && (
                       <div className="flex gap-4">
                         <div className="h-11 w-11 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                           <User size={20} className="stroke-[2.5]" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Deliver to</p>
                           <h4 className="text-base font-black text-[#1C1C1C] truncate">{activeOrderDetails?.customerName || 'Customer'}</h4>
                           <p className="text-xs text-[#686B78] mt-1 font-bold">{activeOrderDetails?.deliveryAddress || 'No Address Listed'}</p>
                           
                           {activeOrderDetails?.specialInstructions && (
                             <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-medium leading-relaxed">
                               <strong>Instructions: </strong>{activeOrderDetails.specialInstructions}
                             </div>
                           )}

                           {activeOrderDetails?.customerPhone && (
                             <div className="flex gap-3 mt-4">
                               <a 
                                 href={`tel:${activeOrderDetails.customerPhone}`}
                                 className="px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white text-xs font-bold text-text-primary rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                               >
                                 <Phone size={14} className="text-green-500" /> Call Customer
                               </a>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>

                   {/* CTA Buttons based on delivery state */}
                   <div className="mt-10 pt-6 border-t border-gray-50 space-y-3">
                      {activeDelivery.status === 'ASSIGNED' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => handleAcceptOrder(activeDelivery.orderId)} className="w-full py-4 rounded-xl text-sm font-black shadow-lg shadow-primary/20">
                            <Check size={16} /> Accept Assignment
                          </Button>
                          <Button onClick={handleRejectOrder} variant="outline" className="w-full py-4 rounded-xl text-sm font-black border-red-200 text-red-500 hover:bg-red-50">
                            <X size={16} /> Reject
                          </Button>
                        </div>
                      ) : activeDelivery.status === 'ACCEPTED' ? (
                        <div className="space-y-3">
                          <Button onClick={() => handleStatusUpdate('PICKED_UP')} className="w-full py-4.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20">
                            Mark as Picked Up <ChevronRight size={16} />
                          </Button>
                          <Button onClick={handleRejectOrder} variant="ghost" className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">
                            Cancel/Reject Delivery
                          </Button>
                        </div>
                      ) : activeDelivery.status === 'PICKED_UP' ? (
                        <Button onClick={() => handleStatusUpdate('DELIVERED')} className="w-full py-4.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-black shadow-lg shadow-green-200">
                          Mark as Delivered <CheckCircle2 size={16} />
                        </Button>
                      ) : null}
                   </div>
                </div>

                {/* Live Tracking & Location Simulator Widget */}
                {activeDelivery.status === 'PICKED_UP' && (
                  <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                           <Navigation size={18} className="animate-pulse" />
                         </div>
                         <div>
                           <h4 className="text-sm font-black">Live Tracking Simulator</h4>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Updates coordinates periodically</p>
                         </div>
                       </div>

                       {/* Toggle Simulation */}
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={simulating} 
                           onChange={(e) => setSimulating(e.target.checked)} 
                           className="sr-only peer" 
                         />
                         <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                       </label>
                     </div>

                     {/* Coordinates Log */}
                     <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                       <span className="font-bold text-[#686B78] flex items-center gap-1">
                         <Map size={14} className="text-blue-500" /> Coords:
                       </span>
                       <span className="font-mono font-black text-gray-800">
                         {simulatedCoords.lat.toFixed(6)}, {simulatedCoords.lng.toFixed(6)}
                       </span>
                       {simulating && (
                         <span className="flex h-2 w-2 relative">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                         </span>
                       )}
                     </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Idle & Available Orders View */
              <motion.div 
                key="idle-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Radar Scanning */}
                <div className="bg-white rounded-[2.5rem] p-8 text-center border border-gray-100 shadow-sm relative overflow-hidden">
                   {/* Scanning animation rings */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                     <div className="h-36 w-36 border border-primary/10 rounded-full animate-[ping_3s_infinite]" />
                     <div className="h-56 w-56 border border-primary/5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_4s_infinite]" />
                   </div>

                   <div className="h-28 w-28 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-red-50">
                      <Bike size={44} className="stroke-[2]" />
                   </div>
                   <h2 className="text-xl font-black mb-1">Scanning for orders...</h2>
                   <p className="text-xs text-[#686B78] font-bold uppercase tracking-wider">Stay active to receive matching delivery requests</p>

                   <div className="flex justify-center mt-6">
                      <button 
                         onClick={() => fetchData(true)}
                         disabled={refreshing}
                         className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-xl bg-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                         <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary' : 'text-primary'} /> 
                         Refresh Available Orders
                      </button>
                   </div>
                </div>

                {/* Available Orders List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-[#1C1C1C] uppercase tracking-wider flex items-center gap-2">
                    <Package size={16} className="text-secondary" /> Available Orders ({availableOrders.length})
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
                          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-primary">#{order.id}</span>
                              <Badge variant="success" className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                {order.status}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-[#1C1C1C] text-sm">{order.restaurantName}</h4>
                            <p className="text-xs text-[#686B78] font-medium flex items-center gap-1">
                              <MapPin size={12} className="text-primary shrink-0" /> {order.deliveryAddress}
                            </p>
                            
                            <div className="flex gap-4 pt-1">
                              <span className="text-[10px] font-black uppercase text-gray-400">Value: ₹{order.totalAmount}</span>
                              <span className="text-[10px] font-black uppercase text-gray-400">Items: {order.orderItems?.length || 0}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            <Button 
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-5 py-3 rounded-xl text-xs font-black shadow-md shadow-primary/10 w-full md:w-auto"
                            >
                              Accept Order <ChevronRight size={14} />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-[#686B78] font-bold uppercase tracking-wider">No pending orders in Noida at the moment.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </main>

      {/* Stats Summary Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6 shadow-lg z-30">
        <div className="container mx-auto max-w-2xl flex justify-between items-center text-center">
          <div className="flex-1">
            <span className="block text-xs font-black text-[#1C1C1C]">{activeDelivery ? '1' : '0'}</span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Active Run</span>
          </div>
          <div className="w-[1px] h-6 bg-gray-100" />
          <div className="flex-1">
            <span className="block text-xs font-black text-primary">₹{partnerProfileEarnings()}</span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Rider Payout</span>
          </div>
          <div className="w-[1px] h-6 bg-gray-100" />
          <div className="flex-1">
            <span className="block text-xs font-black text-yellow-500 flex items-center justify-center gap-0.5">
              4.9 <Star size={10} fill="currentColor" />
            </span>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Rating</span>
          </div>
        </div>
      </footer>
    </div>
  );

  function partnerProfileEarnings() {
    // Return a dummy value based on active delivery or standard rider stats
    return 150 + (availableOrders.length * 30);
  }
};

export default DeliveryDashboard;
