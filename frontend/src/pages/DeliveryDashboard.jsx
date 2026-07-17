import { useState, useEffect } from 'react';
import { 
  Bike, MapPin, Navigation, CheckCircle2, Power, ChevronRight, 
  User, Package, LayoutDashboard, Phone, Clock, DollarSign, 
  Wallet, Award, Trophy, TrendingUp, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import deliveryService from '../services/deliveryService';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../providers/WebSocketProvider';

const mockLeaderboard = [
  { rank: 1, name: 'Shiva', rating: 4.95, speed: '21 min avg', orders: 124 },
  { rank: 2, name: 'Nikhil Sharma', rating: 4.90, speed: '23 min avg', orders: 110 },
  { rank: 3, name: 'Ashu Verma', rating: 4.89, speed: '22 min avg', orders: 98 },
  { rank: 4, name: 'You', rating: 4.85, speed: '24 min avg', orders: 85, isCurrentUser: true },
  { rank: 5, name: 'Rishabh Pal', rating: 4.80, speed: '26 min avg', orders: 74 }
];

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, earnings, incentives, leaderboard
  const { user } = useAuthStore();
  const { client } = useWebSocket();

  // Wallet and withdrawal mock logic
  const [walletBalance, setWalletBalance] = useState(1850);
  const [incentiveProgress, setIncentiveProgress] = useState(7); // orders completed out of 10 today

  const fetchActiveDelivery = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getMyDeliveries();
      if (res.success && res.data.length > 0) {
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
            toast.success('Order Delivered! Earned ₹80 delivery fee + ₹20 peak bonus.', { icon: '👏' });
            setWalletBalance(prev => prev + 100);
            setIncentiveProgress(prev => prev + 1);
            setActiveDelivery(null);
        }
      }
    } catch (error) {
       toast.error('Failed to update status');
    }
  };

  const handleWithdrawal = () => {
    if (walletBalance < 500) {
      toast.error('Minimum withdrawal amount is ₹500');
      return;
    }
    toast.success(`Withdrawal of ₹${walletBalance} processed successfully to linked account!`);
    setWalletBalance(0);
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50/50">Loading delivery panel telemetry...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-12">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-50 shadow-sm">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-2.5 rounded-xl text-white shadow-lg shadow-primary/20">
                 <Bike size={22} />
              </div>
              <div>
                 <h1 className="text-lg font-black text-text-primary">Delivery Partner</h1>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mt-1">{user?.name || 'Partner'}</p>
              </div>
            </div>

            <button 
               onClick={toggleOnline}
               className={`flex items-center gap-2.5 px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
                 isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400'
               }`}
            >
               <Power size={14} /> {isOnline ? 'Online' : 'Offline'}
            </button>
         </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
         
         {/* Navigation sub-tabs */}
         <div className="grid grid-cols-4 gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-gray-100">
           {[
             { id: 'active', label: 'Task', icon: Bike },
             { id: 'earnings', label: 'Wallet', icon: Wallet },
             { id: 'incentives', label: 'Streak', icon: Award },
             { id: 'leaderboard', label: 'Ranks', icon: Trophy }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                 activeTab === tab.id 
                   ? 'bg-primary text-white font-black shadow-lg shadow-primary/10' 
                   : 'text-gray-400 hover:text-text-primary'
               }`}
             >
               <tab.icon size={16} />
               <span className="text-[9px] uppercase font-black tracking-widest">{tab.label}</span>
             </button>
           ))}
         </div>

         {/* ── Active Task View ── */}
         {activeTab === 'active' && (
           <div className="space-y-6">
             {!isOnline ? (
                <div className="text-center py-16">
                   <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                      <Power size={48} className="text-gray-200" />
                   </div>
                   <h2 className="text-xl font-black text-text-primary mb-1">Switch Online to Receive Orders</h2>
                   <p className="text-text-secondary text-xs">Your coordinates are currently hidden from dispatcher queue.</p>
                </div>
             ) : activeDelivery ? (
                <div className="space-y-6">
                   <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                         <Badge variant="warning" className="text-[9px] font-black uppercase tracking-wider px-3 py-1">Active Shipment</Badge>
                         <span className="text-xs font-black text-primary">#{activeDelivery.orderId}</span>
                      </div>

                      <div className="space-y-8">
                         <div className="flex gap-4">
                            <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                               <User size={20} />
                            </div>
                            <div className="flex-1">
                               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Customer Delivery</p>
                               <h4 className="text-sm font-black text-text-primary mb-1">Order #{activeDelivery.orderId}</h4>
                               <div className="flex gap-2 mt-4">
                                  <button className="h-9 px-4 bg-gray-50 hover:bg-gray-100 text-text-primary rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all border border-gray-100">
                                     <Phone size={12} className="text-primary" /> Call Customer
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-100">
                         <div className="space-y-3">
                            {activeDelivery.status === 'ASSIGNED' || activeDelivery.status === 'ACCEPTED' ? (
                               <Button onClick={() => handleStatusUpdate('PICKED_UP')} className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider">
                                  Order Picked Up <ChevronRight className="ml-1" size={14} />
                               </Button>
                            ) : activeDelivery.status === 'PICKED_UP' ? (
                               <Button onClick={() => handleStatusUpdate('DELIVERED')} className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-xs font-black uppercase tracking-wider">
                                  Mark as Delivered <CheckCircle2 className="ml-1" size={14} />
                               </Button>
                            ) : null}
                            <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 text-xs font-bold">Report Dispute / Out of Stock</Button>
                         </div>
                      </div>
                   </motion.div>
                   
                   <div className="bg-blue-500 text-white p-5 rounded-[2rem] shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Navigation size={20} strokeWidth={2.5} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-1 opacity-80">Rider Telemetry</p>
                            <p className="text-xs font-bold">Location shared via secure WebSockets</p>
                         </div>
                      </div>
                      <div className="h-2.5 w-2.5 bg-white rounded-full animate-ping" />
                   </div>
                </div>
             ) : (
                <div className="text-center py-16 px-6">
                   <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 text-primary">
                      <Bike size={48} />
                   </div>
                   <h2 className="text-xl font-black text-text-primary mb-1">Scanning dispatcher queue...</h2>
                   <p className="text-xs text-gray-400 font-bold mb-6">You will receive audio/push warnings when a load matches.</p>
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-black text-xs uppercase tracking-wider">
                      <Clock size={14} /> High Surge: Sector 62 (₹40 extra/delivery)
                   </div>
                   <br />
                   <Button onClick={fetchActiveDelivery} variant="outline" className="mt-8 rounded-xl font-black text-xs uppercase">
                      Sync Queue
                   </Button>
                </div>
             )}
           </div>
         )}

         {/* ── Earnings & Wallet View ── */}
         {activeTab === 'earnings' && (
           <div className="space-y-6">
             <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
               <DollarSign size={80} className="absolute -right-6 -bottom-6 text-white/5" />
               
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-2">Available Balance</p>
               <h3 className="text-3xl font-black text-white mb-6">₹{walletBalance}</h3>

               <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mb-6">
                 <div>
                   <p className="text-[10px] text-gray-400 font-black uppercase">Weekly Earnings</p>
                   <p className="text-lg font-black mt-1">₹4,200</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-black uppercase">Weekly Tips</p>
                   <p className="text-lg font-black mt-1">₹350</p>
                 </div>
               </div>

               <Button 
                 onClick={handleWithdrawal}
                 className="w-full bg-primary hover:bg-red-600 text-white font-black text-xs uppercase py-3 rounded-xl"
               >
                 Withdraw Earnings to UPI
               </Button>
             </div>

             <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
               <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Earnings History</h3>
               <div className="space-y-3">
                 <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                   <div>
                     <p className="text-xs font-black">#ORD-8812 Delivery Fee</p>
                     <p className="text-[10px] text-gray-400 font-bold">17 Jul 2026 • Cashless</p>
                   </div>
                   <span className="text-xs font-black text-green-600">+₹80.00</span>
                 </div>
                 <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                   <div>
                     <p className="text-xs font-black">Customer Tip (#ORD-8799)</p>
                     <p className="text-[10px] text-gray-400 font-bold">16 Jul 2026 • App Credit</p>
                   </div>
                   <span className="text-xs font-black text-green-600">+₹40.00</span>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* ── Incentives & Streak View ── */}
         {activeTab === 'incentives' && (
           <div className="space-y-6">
             <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-6">
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="text-sm font-black uppercase tracking-wider">Daily Milestone Bonus</h3>
                   <span className="text-xs font-black text-primary">{incentiveProgress}/10 Orders</span>
                 </div>
                 <div className="h-2.5 bg-gray-150 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(incentiveProgress/10)*100}%` }} />
                 </div>
                 <p className="text-[10px] text-gray-450 font-medium">Complete 3 more deliveries today to trigger a ₹150 incentive cash reward!</p>
               </div>

               <div className="border-t border-gray-50 pt-6">
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Milestone Incentives</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                     <Award className="text-orange-500 shrink-0" size={24} />
                     <div>
                       <p className="text-xs font-black">Weekly Star</p>
                       <p className="text-[9px] text-gray-500 font-bold mt-0.5">Complete 40 trips this week</p>
                       <p className="text-xs font-black text-orange-600 mt-2">Payout: ₹500 bonus</p>
                     </div>
                   </div>
                   <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex gap-3">
                     <TrendingUp className="text-cyan-500 shrink-0" size={24} />
                     <div>
                       <p className="text-xs font-black">Weekend Rush</p>
                       <p className="text-[9px] text-gray-500 font-bold mt-0.5">Deliver 15 orders on Sunday</p>
                       <p className="text-xs font-black text-cyan-600 mt-2">Payout: ₹300 bonus</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* ── Leaderboard View ── */}
         {activeTab === 'leaderboard' && (
           <div className="space-y-6">
             <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Trophy size={18} className="text-yellow-500" />
                 Local Rider Leaderboard (Noida Zone)
               </h3>
               
               <div className="space-y-3 mt-4">
                 {mockLeaderboard.map((rider) => (
                   <div 
                     key={rider.rank} 
                     className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                       rider.isCurrentUser 
                         ? 'border-primary/20 bg-primary/5 text-primary' 
                         : 'border-gray-50 bg-gray-50/50 text-[#1C1C1C]'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-black w-6">#{rider.rank}</span>
                       <div>
                         <p className="text-xs font-black">{rider.name}</p>
                         <p className="text-[9px] text-gray-400 font-bold mt-0.5">{rider.speed} • {rider.orders} trips</p>
                       </div>
                     </div>
                     <span className="text-xs font-black text-amber-500">★ {rider.rating}</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

      </main>
    </div>
  );
};

export default DeliveryDashboard;
