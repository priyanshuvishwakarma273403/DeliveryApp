import { useState, useEffect } from 'react';
import { 
  Bike, MapPin, Navigation, CheckCircle2, 
  Power, ChevronRight, User, Package, LayoutDashboard, Phone, Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import deliveryService from '../services/deliveryService';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../providers/WebSocketProvider';

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { client } = useWebSocket();

  const fetchActiveDelivery = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getMyDeliveries();
      if (res.success && res.data.length > 0) {
        // Find the first delivery that is not delivered or cancelled
        const active = res.data.find(d => !['DELIVERED', 'REJECTED'].includes(d.status));
        setActiveDelivery(active || null);
      } else {
        setActiveDelivery(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDelivery();
  }, []);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? 'You are now Offline' : 'You are now Online');
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!activeDelivery) return;
    try {
      if (newStatus === 'PICKED_UP') {
        const res = await deliveryService.markPickedUp(activeDelivery.orderId);
        if (res.success) {
            toast.success('Order Picked Up!');
            fetchActiveDelivery();
        }
      } else if (newStatus === 'DELIVERED') {
        const res = await deliveryService.markDelivered(activeDelivery.orderId);
        if (res.success) {
            toast.success('Order Delivered! Looking for next order...', { icon: '👏' });
            setActiveDelivery(null);
        }
      }
    } catch (error) {
       toast.error('Failed to update status');
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center">Loading your dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-50">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                 <Bike size={24} />
              </div>
              <div>
                 <h1 className="text-xl font-black text-text-primary">Delivery Partner</h1>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{user?.name || 'Partner'}</p>
              </div>
            </div>

            <button 
               onClick={toggleOnline}
               className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-black text-sm transition-all ${
                 isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400'
               }`}
            >
               <Power size={18} /> {isOnline ? 'Online' : 'Offline'}
            </button>
         </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
         {!isOnline ? (
            <div className="text-center py-20">
               <div className="h-40 w-40 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-premium border border-gray-100">
                  <Power size={64} className="text-gray-200" />
               </div>
               <h2 className="text-2xl font-black text-text-primary mb-2">You are Offline</h2>
               <p className="text-text-secondary">Switch to online to start receiving delivery requests</p>
            </div>
         ) : activeDelivery ? (
            <div className="space-y-8">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[3rem] p-8 md:p-10 shadow-premium border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-orange-50 rounded-bl-full" />
                  
                  <div className="flex items-center justify-between mb-10 relative z-10">
                     <Badge variant="warning">Active Delivery</Badge>
                     <span className="text-sm font-black text-primary">#{activeDelivery.orderId}</span>
                  </div>

                  <div className="space-y-10">
                     {/* Customer */}
                     <div className="flex gap-6">
                        <div className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg shadow-red-100">
                           <User size={24} />
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-2">Deliver to</p>
                           <h4 className="text-lg font-bold text-text-primary mb-1">Customer</h4>
                           <div className="flex gap-4 mt-6">
                              <button className="h-10 px-4 bg-gray-50 hover:bg-white text-text-primary rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border border-gray-100 shadow-sm">
                                 <Phone size={14} className="text-primary" /> Call Customer
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-gray-100">
                     <div className="space-y-4">
                        {activeDelivery.status === 'ASSIGNED' || activeDelivery.status === 'ACCEPTED' ? (
                           <Button onClick={() => handleStatusUpdate('PICKED_UP')} className="w-full py-5 rounded-[2rem] text-lg shadow-xl shadow-primary/20">
                              Order Picked Up <ChevronRight className="ml-2" />
                           </Button>
                        ) : activeDelivery.status === 'PICKED_UP' ? (
                           <Button onClick={() => handleStatusUpdate('DELIVERED')} className="w-full py-5 rounded-[2rem] bg-green-500 hover:bg-green-600 text-lg shadow-xl shadow-green-200">
                              Mark as Delivered <CheckCircle2 className="ml-2" />
                           </Button>
                        ) : null}
                        <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 py-4">Report an Issue</Button>
                     </div>
                  </div>
               </motion.div>
               
               <div className="bg-blue-500 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Navigation size={24} />
                     </div>
                     <div>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest leading-none mb-1">Live Tracking</p>
                        <p className="text-sm font-black">Your location is being shared via WebSockets</p>
                     </div>
                  </div>
                  <div className="h-3 w-3 bg-white rounded-full animate-ping" />
               </div>
            </div>
         ) : (
            <div className="text-center py-20 px-8">
               <div className="h-40 w-40 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-premium border border-gray-100 text-primary">
                  <Bike size={64} />
               </div>
               <h2 className="text-2xl font-black text-text-primary mb-2">Looking for Orders...</h2>
               <p className="text-text-secondary mb-10">Stay in a high-demand area to receive orders faster</p>
               <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-50 text-orange-600 rounded-2xl font-bold text-sm">
                  <Clock size={18} /> High Demand in Sector 62
               </div>
               <br />
               <Button onClick={fetchActiveDelivery} variant="outline" className="mt-8 rounded-full">
                  Refresh Orders
               </Button>
            </div>
         )}
      </main>
    </div>
  );
};

export default DeliveryDashboard;
