import { useState, useEffect, useMemo } from 'react';
import { 
  Bike, MapPin, Navigation, CheckCircle2, Power, ChevronRight, 
  User, Package, Phone, Clock, DollarSign, Wallet, Award, Trophy, 
  TrendingUp, AlertTriangle, ShieldCheck, Camera, FileText, Send, 
  Map, Battery, RefreshCw, Star, Compass, CloudRain, ShieldAlert, Zap,
  Check, Play, Key, ClipboardCheck, PhoneCall, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const MOCK_HOTSPOTS = [
  { zone: "Sector 18 Market, Noida", distance: "1.2 km", surge: "+₹50 / delivery", demand: "HIGH" },
  { zone: "Indiranagar Food Hub", distance: "3.5 km", surge: "+₹35 / delivery", demand: "MEDIUM" },
  { zone: "Hazratganj Ganj Market", distance: "0.8 km", surge: "+₹60 / delivery", demand: "VERY HIGH" }
];

const MOCK_CHARGERS = [
  { name: "Ather Grid EV Fast Station", type: "EV Charger", distance: "0.4 km", status: "2 slots free" },
  { name: "HP Fuel Station & Air", type: "Petrol", distance: "1.1 km", status: "Open" }
];

const MOCK_EARNING_TRENDS = [
  { day: "Mon", income: 450 },
  { day: "Tue", income: 620 },
  { day: "Wed", income: 580 },
  { day: "Thu", income: 710 },
  { day: "Fri", income: 950 },
  { day: "Sat", income: 1200 },
  { day: "Sun", income: 1050 }
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Rider Shiva', rating: 4.95, speed: '21 min avg', orders: 124 },
  { rank: 2, name: 'Nikhil Sharma', rating: 4.90, speed: '23 min avg', orders: 110 },
  { rank: 3, name: 'Ashu Verma', rating: 4.89, speed: '22 min avg', orders: 98 },
  { rank: 4, name: 'You', rating: 4.85, speed: '24 min avg', orders: 85, isCurrentUser: true }
];

const DeliveryDashboard = () => {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('hub'); // hub, active, earnings, documents, leaderboard
  const [shiftActive, setShiftActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isGpsOnline, setIsGpsOnline] = useState(true);

  // Active delivery task sequence
  const [incomingOrder, setIncomingOrder] = useState({
    orderId: "OD-9921",
    restaurant: "Tuscany Grill - South Ext",
    pickupAddr: "E-4, South Extension Part II, New Delhi",
    customerName: "Sneha Kapoor",
    customerAddr: "Block B-12, Green Park Apartments, New Delhi",
    distance: "4.2 km",
    fee: 95,
    itemsCount: 3,
    specialInstructions: "Leave with security guard if call not answered.",
    priority: "Express"
  });

  const [activeTask, setActiveTask] = useState(null); // ACCEPTED, REACHED_RESTAURANT, PICKED_UP, REACHED_CUSTOMER, DELIVERED
  const [otpValue, setOtpValue] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);

  // Stats and Wallet
  const [walletBalance, setWalletBalance] = useState(1420);
  const [deliveriesCount, setDeliveriesCount] = useState(8);
  const [earningGoal, setEarningGoal] = useState({ current: 840, target: 1200 });

  // Onboarding documents state
  const [documents, setDocuments] = useState({
    license: { name: "DL-98218902", status: "VERIFIED", expiry: "2032-12" },
    aadhaar: { name: "9821-2290-4412", status: "VERIFIED" },
    insurance: { name: "INS-90821-22", status: "VERIFIED", expiry: "2027-05" }
  });

  // Simulated location updates
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTask && activeTask !== 'DELIVERED') {
        toast.info("Updating real-time GPS location telemetry...");
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [activeTask]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? 'You are now Offline' : 'You are now Online');
  };

  const handleAcceptOrder = () => {
    setActiveTask('ACCEPTED');
    setIncomingOrder(null);
    toast.success('Order Accepted! Route map dispatched.');
  };

  const handleAdvanceTask = () => {
    if (activeTask === 'ACCEPTED') {
      setActiveTask('REACHED_RESTAURANT');
      toast.success('Arrived at Restaurant. Loading order...');
    } else if (activeTask === 'REACHED_RESTAURANT') {
      setActiveTask('PICKED_UP');
      toast.success('Items Picked Up! Navigate to Customer location.');
    } else if (activeTask === 'PICKED_UP') {
      setActiveTask('REACHED_CUSTOMER');
      toast.success('Arrived at Customer location.');
    } else if (activeTask === 'REACHED_CUSTOMER') {
      setShowOtpModal(true);
    }
  };

  const handleConfirmOtp = () => {
    if (otpValue === "1234") {
      setActiveTask(null);
      setShowOtpModal(false);
      setOtpValue("");
      setWalletBalance(prev => prev + 95);
      setDeliveriesCount(prev => prev + 1);
      setEarningGoal(prev => ({ ...prev, current: prev.current + 95 }));
      toast.success('Shipment completed! Earned ₹95.00', { icon: '💰' });
    } else {
      toast.error('Invalid OTP. Please verify with customer.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 text-slate-800">
      
      {/* ── TOP HEADER RIDER telemetry ── */}
      <header className="bg-white border-b border-gray-150 p-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">
              <Bike size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">FoodIQ Delivery</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{user?.name || 'Rider Partner'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Battery Warning */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border">
              <Battery size={12} className={batteryLevel < 20 ? 'text-red-500' : 'text-green-500'} />
              <span>{batteryLevel}%</span>
            </div>
            <button 
              onClick={toggleOnline}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation tabs */}
        <div className="grid grid-cols-5 gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { id: 'hub', label: 'Hub', icon: Compass },
            { id: 'active', label: 'Task', icon: Bike },
            { id: 'earnings', label: 'Wallet', icon: Wallet },
            { id: 'documents', label: 'Docs', icon: FileText },
            { id: 'leaderboard', label: 'Ranks', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/10' 
                  : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              <tab.icon size={16} />
              <span className="text-[9px] uppercase font-bold tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          
          {/* ── TAB 1: UNIQUE SMART RIDER HUB ── */}
          {activeTab === 'hub' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Earning Goal Dashboard */}
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-5 rounded-[2rem] text-white shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Today's Earning Goal</p>
                  <span className="text-xs font-black text-[#FC8019]">₹{earningGoal.current} / ₹{earningGoal.target}</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (earningGoal.current / earningGoal.target) * 100)}%` }} />
                </div>
                
                <p className="text-[10px] text-gray-400 font-bold leading-tight">
                  Remaining target: <strong className="text-white">₹{earningGoal.target - earningGoal.current}</strong> to hit your daily target bonus!
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs font-bold">
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase">Trips Completed</span>
                    <p className="text-lg mt-0.5 text-white">{deliveriesCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase">Break Reminders</span>
                    <p className="text-lg mt-0.5 text-green-400">Time for a break</p>
                  </div>
                </div>
              </div>

              {/* Weather & Rain Surge Alerts */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2.5xl flex gap-3 text-xs font-bold text-blue-700">
                <CloudRain className="text-blue-500 shrink-0" size={24} />
                <div>
                  <p className="font-black uppercase tracking-wider mb-0.5">Light Rain Warning</p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    Peak surge multiplier active. Earn an extra <span className="text-primary font-black">+₹30.00</span> per delivery. Drive safe!
                  </p>
                </div>
              </div>

              {/* Suggested Hotspots */}
              <div className="bg-white rounded-[2rem] p-5 border border-gray-150 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Compass size={16} className="text-primary" /> Suggested Demand Hotspots
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {MOCK_HOTSPOTS.map((hot, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border flex items-center justify-between text-xs font-bold">
                      <div>
                        <p className="text-slate-900">{hot.zone}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{hot.distance} away • Demand: {hot.demand}</p>
                      </div>
                      <span className="text-primary text-xs font-black shrink-0">{hot.surge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EV Charging & Petrol Stations */}
              <div className="bg-white rounded-[2rem] p-5 border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Zap size={16} className="text-green-500" /> EV Stations & Fuel Points Near Me
                </h3>
                
                <div className="space-y-3">
                  {MOCK_CHARGERS.map((char, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border flex items-center justify-between text-xs font-bold">
                      <div>
                        <p className="text-slate-900">{char.name}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{char.type} • {char.distance}</p>
                      </div>
                      <span className="text-green-600 text-[10px] font-black shrink-0 uppercase">{char.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOS Emergency button */}
              <button 
                onClick={() => toast.error('Emergency alert initiated. Sharing GPS location logs with emergency services.', { duration: 6000 })}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <ShieldAlert size={16} /> Trigger SOS Help Button
              </button>

            </motion.div>
          )}

          {/* ── TAB 2: ACTIVE TASK ENGINE ── */}
          {activeTab === 'active' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {incomingOrder && isOnline && (
                <div className="bg-orange-50 border border-orange-200 rounded-[2rem] p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-widest">Auto Expire: 45s</div>
                  <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest">New Delivery Opportunity!</h3>
                  
                  <div className="space-y-1 text-xs text-slate-700 font-bold">
                    <p className="text-base font-black text-[#1C1C1C]">{incomingOrder.restaurant}</p>
                    <p className="text-gray-500">Distance: {incomingOrder.distance}</p>
                    <p className="text-primary font-black text-base mt-2">Delivery Fee: ₹{incomingOrder.fee}.00</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIncomingOrder(null)} className="flex-1 py-2.5 rounded-xl text-xs font-black">Decline</Button>
                    <Button onClick={handleAcceptOrder} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black">Accept Delivery</Button>
                  </div>
                </div>
              )}

              {activeTask ? (
                <div className="bg-white rounded-[2rem] p-6 border border-gray-150 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <Badge variant="warning" className="text-[9px] font-black uppercase px-2.5 py-1">Active Shipment</Badge>
                    <span className="text-xs font-black text-gray-400">Order #KD-901</span>
                  </div>

                  {/* Route Steps */}
                  <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-gray-200 text-xs font-bold">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 h-4 w-4 bg-primary rounded-full border-4 border-white shadow-sm" />
                      <p className="text-[10px] text-gray-400 font-black uppercase">Pickup location</p>
                      <p className="text-slate-900 mt-0.5">Tuscany Grill - South Ext</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 h-4 w-4 bg-green-500 rounded-full border-4 border-white shadow-sm" />
                      <p className="text-[10px] text-gray-400 font-black uppercase">Drop address</p>
                      <p className="text-slate-900 mt-0.5">Block B-12, Green Park Apartments</p>
                    </div>
                  </div>

                  {/* Simulated GPS Nav widget */}
                  <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Navigation className="text-primary rotate-45" size={24} />
                      <div>
                        <p className="text-xs font-black">Navigate to Restaurant</p>
                        <p className="text-[10px] text-gray-400">Follow Ring Road: ETA 8 mins</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-green-400">1.8 km</span>
                  </div>

                  <div className="pt-2">
                    <Button onClick={handleAdvanceTask} className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider">
                      {activeTask === 'ACCEPTED' && 'Reached Restaurant'}
                      {activeTask === 'REACHED_RESTAURANT' && 'Confirm Pickup / Items Loaded'}
                      {activeTask === 'PICKED_UP' && 'Reached Customer location'}
                      {activeTask === 'REACHED_CUSTOMER' && 'Enter Drop OTP / Complete Shipment'}
                    </Button>
                  </div>
                </div>
              ) : (
                !incomingOrder && (
                  <div className="text-center py-12 text-xs font-bold text-gray-400">
                    <Bike className="mx-auto mb-3 text-gray-300" size={36} />
                    <p>No active delivery shipments assigned.</p>
                  </div>
                )
              )}

            </motion.div>
          )}

          {/* ── TAB 3: WALLET & EARNINGS ── */}
          {activeTab === 'earnings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 rounded-[2rem] text-white shadow-xl space-y-4">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Withdrawable Wallet Balance</span>
                <p className="text-3xl font-black text-white">₹{walletBalance}.00</p>
                
                <Button 
                  onClick={() => {
                    if (walletBalance < 100) {
                      toast.error('Minimum withdrawal target is ₹100.');
                      return;
                    }
                    toast.success(`Transferred ₹${walletBalance} to your linked bank account via UPI!`);
                    setWalletBalance(0);
                  }}
                  className="w-full bg-primary hover:bg-[#E07015] text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider"
                >
                  Withdraw earnings via UPI
                </Button>
              </div>

              {/* Earnings breakdown chart */}
              <div className="bg-white rounded-[2rem] p-5 border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Income Trends (This Week)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_EARNING_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="income" stroke="#FC8019" strokeWidth={3} fill="#FFF3E0" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </motion.div>
          )}

          {/* ── TAB 4: DOCUMENTS ONBOARDING ── */}
          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="bg-white rounded-[2rem] p-6 border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Verification Documents Status</h3>
                
                <div className="space-y-3 font-bold text-xs">
                  <div className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-slate-900">Driving License</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{documents.license.name}</p>
                    </div>
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded text-[9px] font-black uppercase">{documents.license.status}</span>
                  </div>

                  <div className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-slate-900">Aadhaar Identity</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{documents.aadhaar.name}</p>
                    </div>
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded text-[9px] font-black uppercase">{documents.aadhaar.status}</span>
                  </div>

                  <div className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-slate-900">Vehicle Insurance policy</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{documents.insurance.name}</p>
                    </div>
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded text-[9px] font-black uppercase">{documents.insurance.status}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full text-xs font-black py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Camera size={14} /> Upload Renewed Document
                  </Button>
                </div>
              </div>

            </motion.div>
          )}

          {/* ── TAB 5: LEADERBOARD & RANKS ── */}
          {activeTab === 'leaderboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="bg-white rounded-[2rem] p-5 border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Trophy size={16} className="text-yellow-500" /> Local Rider Leaderboard (Noida Zone)
                </h3>

                <div className="space-y-3 font-bold text-xs">
                  {MOCK_LEADERBOARD.map((rider) => (
                    <div 
                      key={rider.rank} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${
                        rider.isCurrentUser 
                          ? 'border-primary/20 bg-primary/5 text-primary' 
                          : 'border-gray-50 bg-gray-50/50 text-[#1C1C1C]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 font-black">#{rider.rank}</span>
                        <div>
                          <p className="text-slate-900">{rider.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{rider.speed} • {rider.orders} trips</p>
                        </div>
                      </div>
                      <span className="text-yellow-600">★ {rider.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── DROP OTP CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowOtpModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full relative z-10 space-y-6"
            >
              <div className="text-center space-y-2">
                <Key className="text-primary mx-auto" size={32} />
                <h3 className="text-lg font-black text-[#1C1C1C]">Enter Customer OTP</h3>
                <p className="text-xs text-gray-400 font-bold">Ask customer for the 4-digit verification code. (Simulated Code: <code className="bg-gray-100 px-1.5 py-0.5 rounded">1234</code>)</p>
              </div>

              <input 
                type="text" 
                maxLength={4}
                placeholder="0 0 0 0"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-lg font-black tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
              />

              <div className="flex gap-3">
                <Button onClick={() => setShowOtpModal(false)} variant="outline" className="flex-1 py-2.5 rounded-xl text-xs font-black">Cancel</Button>
                <Button onClick={handleConfirmOtp} className="flex-1 py-2.5 rounded-xl text-xs font-black">Confirm OTP</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DeliveryDashboard;
