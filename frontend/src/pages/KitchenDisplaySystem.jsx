import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, Users, CheckSquare, AlertCircle, Play, CheckCircle2, Search, 
  Filter, BookOpen, UserPlus, HelpCircle, Activity, Award, Calendar, RefreshCw, 
  Maximize2, Volume2, ShieldAlert, Award as Medal, ShoppingBag, ShieldCheck, 
  ChevronRight, VolumeX, AlertOctagon, HelpCircle as HelpIcon, BellRing, Sparkles, LogOut
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

const MOCK_RECIPES = {
  "R-1": {
    name: "Classic Neapolitan Margherita Pizza",
    ingredients: "Fresh Mozzarella (120g), San Marzano Tomato Sauce (80ml), Fresh Basil (4 leaves), Olive oil (10ml), Sourdough crust.",
    instructions: [
      "Stretch sourdough dough to 12 inches.",
      "Spread San Marzano sauce evenly, leaving 1-inch border.",
      "Scatter torn mozzarella and fresh basil leaves.",
      "Drizzle olive oil and bake in 450°C wood fire oven for 90 seconds."
    ],
    allergens: "Gluten, Dairy",
    presentation: "Serve on a round rustic wooden plate with a splash of fresh olive oil."
  },
  "R-2": {
    name: "Gourmet Truffle Burger",
    ingredients: "Black Angus beef patty (180g), Truffle Aioli (15g), Aged Swiss cheese, Brioche bun, Caramelized onions.",
    instructions: [
      "Grill beef patty to medium well (4 mins per side).",
      "Melt Swiss cheese over the patty during the final minute.",
      "Toast brioche bun on the flat top grill.",
      "Spread truffle aioli on both buns, assemble with caramelized onions."
    ],
    allergens: "Gluten, Dairy, Egg",
    presentation: "Wrap base in greaseproof black branding paper, serve with fresh rosemary fries."
  },
  "R-3": {
    name: "Paneer Butter Masala",
    ingredients: "Charred paneer cubes (200g), Creamy tomato gravy (150ml), Butter (20g), Kasuri methi.",
    instructions: [
      "Heat butter in a copper kadhai.",
      "Add charred paneer and simmer with cream tomato gravy base for 5 mins.",
      "Finish with kasuri methi crush and fresh coriander garnish."
    ],
    allergens: "Dairy, Nuts",
    presentation: "Serve in a warm traditional brass bowl, finished with a fresh cream swirl."
  }
};

const MOCK_KITCHEN_ORDERS = [
  {
    id: "KD-501",
    customer: "Rohan Malhotra",
    type: "DELIVERY",
    priority: "VIP",
    timeReceived: "15:05",
    expectedTime: 15, // mins
    timeElapsed: 7, // mins elapsed
    assignedChef: "Chef Giovanni",
    station: "Pizza",
    status: "COOKING",
    paymentStatus: "PAID",
    allergyNotes: "Tree nuts allergy",
    specialInstructions: "Extra thin crust if possible, make it crispy.",
    items: [
      { code: "R-1", name: "Neapolitan Margherita Pizza", qty: 2, prepDone: false },
      { code: "D-1", name: "Truffle Garlic Breadsticks", qty: 1, prepDone: true }
    ]
  },
  {
    id: "KD-502",
    customer: "Priya Sharma",
    type: "DINE-IN",
    priority: "EXPRESS",
    timeReceived: "15:08",
    expectedTime: 12,
    timeElapsed: 4,
    assignedChef: "Unassigned",
    station: "Grill",
    status: "ACCEPTED",
    paymentStatus: "PAID",
    allergyNotes: "None",
    specialInstructions: "Medium rare patty temperature please.",
    items: [
      { code: "R-2", name: "Gourmet Truffle Burger", qty: 1, prepDone: false }
    ]
  },
  {
    id: "KD-503",
    customer: "Amit Verma",
    type: "PICKUP",
    priority: "NORMAL",
    timeReceived: "14:52",
    expectedTime: 20,
    timeElapsed: 22, // Overdue
    assignedChef: "Chef Vikram",
    station: "Indian",
    status: "PREPARING",
    paymentStatus: "UNPAID",
    allergyNotes: "No Gluten",
    specialInstructions: "Make it extra spicy.",
    items: [
      { code: "R-3", name: "Paneer Butter Masala", qty: 1, prepDone: false }
    ]
  }
];

const MOCK_CHEFS = [
  { name: "Chef Giovanni", station: "Pizza", currentLoad: 2, status: "ONLINE", efficiency: "98%" },
  { name: "Chef Vikram", station: "Indian", currentLoad: 1, status: "ONLINE", efficiency: "94%" },
  { name: "Assistant Chef Sarah", station: "Grill", currentLoad: 0, status: "ONLINE", efficiency: "90%" }
];

const KitchenDisplaySystem = () => {
  const [orders, setOrders] = useState(MOCK_KITCHEN_ORDERS);
  const [selectedStation, setSelectedStation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [packingOrder, setPackingOrder] = useState(null);
  const [packingChecklist, setPackingChecklist] = useState({
    itemsVerify: false, cutleryVerify: false, tissuesVerify: false, sealVerify: false
  });

  // Active cooking timers widget state
  const [timers, setTimers] = useState([
    { id: 'T-1', label: 'Pizza Oven 01', timeLeft: 90, active: true },
    { id: 'T-2', label: 'Grill Patty 02', timeLeft: 240, active: false }
  ]);

  // Live timer ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status !== 'READY' && order.status !== 'COMPLETED') {
            return { ...order, timeElapsed: order.timeElapsed + 1 };
          }
          return order;
        })
      );
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Timer countdown simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (t.active && t.timeLeft > 0) {
          return { ...t, timeLeft: t.timeLeft - 1 };
        }
        return t;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const cooking = orders.filter(o => o.status === 'COOKING').length;
    const ready = orders.filter(o => o.status === 'READY').length;
    const delayed = orders.filter(o => o.timeElapsed > o.expectedTime).length;
    const activeLoad = Math.min(100, Math.round((orders.filter(o => o.status !== 'COMPLETED').length / 10) * 100));

    return { total, cooking, ready, delayed, activeLoad };
  }, [orders]);

  // Filters logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStation = selectedStation === 'All' || o.station === selectedStation;
      const matchSearch = o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStation && matchSearch;
    });
  }, [orders, selectedStation, searchQuery]);

  const playChime = (type) => {
    if (!soundEnabled) return;
    toast.success(`${type} Audio alert triggered!`, { id: 'chime' });
  };

  // Action handlers
  const handleTogglePrepItem = (orderId, index) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = [...o.items];
        updatedItems[index] = { ...updatedItems[index], prepDone: !updatedItems[index].prepDone };
        return { ...o, items: updatedItems };
      }
      return o;
    }));
    playChime('Checklist Update');
  };

  const handleAdvanceStatus = (orderId) => {
    let showModal = false;
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStatus = 'NEW';
        if (o.status === 'ACCEPTED') nextStatus = 'PREPARING';
        else if (o.status === 'PREPARING') nextStatus = 'COOKING';
        else if (o.status === 'COOKING') {
          showModal = true;
          handleOpenPacking(o);
          return o;
        }
        return { ...o, status: nextStatus };
      }
      return o;
    }));
    if (!showModal) {
      playChime('Status Advance');
      toast.success(`Ticket status updated!`);
    }
  };

  const handleOpenPacking = (order) => {
    setPackingOrder(order);
    setPackingChecklist({ itemsVerify: false, cutleryVerify: false, tissuesVerify: false, sealVerify: false });
    setIsPackingModalOpen(true);
  };

  const handleCompletePacking = () => {
    if (!packingChecklist.itemsVerify || !packingChecklist.sealVerify) {
      toast.error('Please verify items and apply the security packaging seal.');
      return;
    }
    
    setOrders(prev => prev.map(o => {
      if (o.id === packingOrder.id) {
        return { ...o, status: 'READY', timeElapsed: o.timeElapsed };
      }
      return o;
    }));
    setIsPackingModalOpen(false);
    playChime('Order Completed');
    toast.success(`Order ${packingOrder.id} ready at dispatch lane!`);
  };

  const handleAssignChef = (orderId, chefName) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, assignedChef: chefName };
      }
      return o;
    }));
    toast.success(`Assigned ${chefName} to order.`);
  };

  const handleBuzzer = () => {
    playChime('Emergency Buzzer');
    toast.error('Assistance requested! Manager and Cashier counter notified.', { icon: '🚨' });
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#070913] text-[#E2E8F0] flex flex-col font-sans">
      
      {/* ── HIGH-TECH KITCHEN TOP HEADER ── */}
      <header className="bg-[#0F1322] border-b border-[#1B233D] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-rose-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-rose-600/30 text-white animate-pulse">
            <Flame size={22} className="fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              FoodIQ KDS Cockpit
            </h1>
            <p className="text-[9px] text-[#A0AEC0] font-bold uppercase tracking-wider">Kitchen Display Node 04 (Hot Prep)</p>
          </div>
        </div>

        {/* Live Metrics HUD */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-[#080B16] border border-[#1C243F] px-4 py-2 rounded-xl">
            <Activity className="text-cyan-500" size={16} />
            <div className="text-left">
              <p className="text-[8px] text-gray-500 font-bold uppercase">Pipeline Load</p>
              <p className="text-xs font-black text-cyan-400">{stats.activeLoad}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#080B16] border border-[#1C243F] px-4 py-2 rounded-xl">
            <Clock className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} size={16} />
            <div className="text-left">
              <p className="text-[8px] text-gray-500 font-bold uppercase">Delayed Alerts</p>
              <p className="text-xs font-black text-amber-500">{stats.delayed} orders</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/25' 
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
              }`}
              title="Toggle Audio Notifications"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button 
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                  toast.success('Fullscreen mode active.');
                } else {
                  document.exitFullscreen();
                }
              }}
              className="p-2.5 bg-slate-900 border border-[#1C243F] hover:bg-slate-800 rounded-xl transition-all"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={16} />
            </button>

            <button 
              onClick={handleBuzzer}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black uppercase text-white tracking-widest shadow-lg shadow-rose-600/10 flex items-center gap-1.5"
            >
              <BellRing size={14} className="animate-bounce" /> Call Manager
            </button>
          </div>
        </div>
      </header>

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Active Orders Queue */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Station Filters */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 border-b border-gray-800/50">
            {['All', 'Pizza', 'Grill', 'Indian', 'Desserts'].map(station => (
              <button
                key={station}
                onClick={() => setSelectedStation(station)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedStation === station 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                    : 'bg-[#0F1322] text-[#A0AEC0] border border-[#1B233D] hover:text-white'
                }`}
              >
                {station} Station
              </button>
            ))}
          </div>

          {/* Search tickets input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Filter cooking pipeline by Order ID, Item, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1322] border border-[#1B233D] rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Cooking Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map(order => {
                const isOverdue = order.timeElapsed > order.expectedTime;
                const progressPct = Math.min(100, Math.round((order.timeElapsed / order.expectedTime) * 100));

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-[#0F1322] rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden transition-all ${
                      isOverdue ? 'border-rose-500/40 bg-rose-950/5' : 'border-[#1B233D]'
                    }`}
                  >
                    {/* Header */}
                    <div className={`p-4 ${isOverdue ? 'bg-rose-500/10' : 'bg-gray-900/60'} border-b border-[#1B233D]`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            order.priority === 'VIP' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {order.priority}
                          </span>
                          <span className="text-xs font-black text-white ml-2">{order.id}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{order.type}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs font-black text-white truncate max-w-[130px]">{order.customer}</p>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className={isOverdue ? 'text-rose-500 animate-pulse' : 'text-gray-400'} />
                          <span className={`text-xs font-black ${isOverdue ? 'text-rose-500 font-bold animate-pulse' : 'text-white'}`}>
                            {order.timeElapsed} / {order.expectedTime}m
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${isOverdue ? 'bg-rose-500' : 'bg-green-500'}`} style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    {/* Body checklist */}
                    <div className="p-4 flex-1 space-y-4">
                      {order.allergyNotes !== 'None' && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-start gap-2 text-[10px] font-bold">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black leading-none mb-1 uppercase text-[9px]">ALLERGY WARNING</p>
                            <p className="leading-tight text-amber-400">{order.allergyNotes}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Required Dishes</p>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-start justify-between gap-3 text-xs font-bold">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={item.prepDone}
                                onChange={() => handleTogglePrepItem(order.id, index)}
                                className="mt-1 rounded bg-[#070913] border-[#1B233D] text-rose-500 focus:ring-rose-500/20"
                              />
                              <span className={item.prepDone ? 'line-through text-gray-500' : 'text-gray-200'}>
                                {item.qty}x {item.name}
                              </span>
                            </label>
                            {MOCK_RECIPES[item.code] && (
                              <button 
                                onClick={() => setSelectedRecipe(MOCK_RECIPES[item.code])}
                                className="text-cyan-400 hover:text-cyan-300 text-[9px] shrink-0 font-black uppercase tracking-widest flex items-center gap-0.5"
                              >
                                <BookOpen size={10} /> Recipe
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="bg-[#070913] p-2.5 rounded-xl border border-gray-800/80 text-[10px] font-semibold text-gray-400">
                          <span className="font-bold text-rose-500">Chef Special Instruction: </span> {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-[#1B233D] bg-gray-900/10 space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-500 font-black uppercase">Assign Cook Station</span>
                        <select 
                          value={order.assignedChef}
                          onChange={(e) => handleAssignChef(order.id, e.target.value)}
                          className="p-1 bg-[#070913] border border-[#1B233D] rounded-lg text-[9px] font-black text-gray-300 outline-none"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {MOCK_CHEFS.map(chef => (
                            <option key={chef.name} value={chef.name}>{chef.name}</option>
                          ))}
                        </select>
                      </div>

                      {order.status === 'ACCEPTED' ? (
                        <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2 bg-orange-600 hover:bg-orange-550 text-[10px] font-black uppercase tracking-widest">
                          Start Prep / Cooking
                        </Button>
                      ) : order.status === 'PREPARING' ? (
                        <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2 bg-amber-600 hover:bg-amber-550 text-[10px] font-black uppercase tracking-widest">
                          Mark as Cooking
                        </Button>
                      ) : order.status === 'COOKING' ? (
                        <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2 bg-rose-600 hover:bg-rose-550 text-[10px] font-black uppercase tracking-widest">
                          Verify & Send to Packing
                        </Button>
                      ) : (
                        <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={12} /> Ready for Dispatch
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Active Oven Timers & Chef Load Roster */}
        <div className="w-full lg:w-80 bg-[#0F1322] border-l border-[#1B233D] p-6 space-y-6 overflow-y-auto">
          {/* Active Oven Timers */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Clock size={14} className="text-rose-500" /> Active Cooking Timers
            </h3>
            <div className="space-y-3">
              {timers.map(timer => (
                <div key={timer.id} className="p-3 bg-[#070913] border border-gray-800 rounded-2xl flex items-center justify-between text-xs font-bold">
                  <div>
                    <p className="text-white font-black">{timer.label}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">{timer.active ? 'Baking...' : 'Idle'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${timer.active && timer.timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                      {formatTimer(timer.timeLeft)}
                    </span>
                    <button 
                      onClick={() => setTimers(timers.map(t => t.id === timer.id ? { ...t, active: !t.active } : t))}
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                        timer.active ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {timer.active ? 'Pause' : 'Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roster & Chef Load */}
          <div className="space-y-4 border-t border-[#1B233D] pt-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Users size={14} className="text-cyan-500" /> Station Load Metrics
            </h3>
            <div className="space-y-3">
              {MOCK_CHEFS.map(chef => (
                <div key={chef.name} className="p-3 bg-[#070913] border border-gray-850 rounded-2xl space-y-2 text-xs font-bold">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-black">{chef.name}</p>
                    <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-black">
                      {chef.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">Station: {chef.station} • Yield: {chef.efficiency}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── RECIPE DETAILS DRAWER MODAL ── */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0F1322] border border-[#1B233D] rounded-[2.5rem] p-6 max-w-xl w-full relative z-10 space-y-5 shadow-2xl"
            >
              <h3 className="text-base font-black text-white">{selectedRecipe.name}</h3>
              
              <div className="space-y-1">
                <p className="text-[9px] text-gray-500 font-black uppercase">Ingredients list</p>
                <p className="text-xs text-gray-200 font-semibold leading-relaxed">{selectedRecipe.ingredients}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] text-gray-500 font-black uppercase">Kitchen Prep Instructions</p>
                <div className="space-y-1.5 text-xs text-gray-300 font-semibold">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <p key={idx} className="flex gap-2">
                      <span className="text-rose-500 font-black">{idx + 1}.</span>
                      <span>{step}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1B233D] pt-4 text-xs font-bold">
                <div>
                  <span className="text-[9px] text-gray-500 font-black uppercase">Allergen Safety</span>
                  <p className="text-amber-500 mt-1">{selectedRecipe.allergens}</p>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-black uppercase">Plating Presentation</span>
                  <p className="text-gray-300 mt-1">{selectedRecipe.presentation}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedRecipe(null)} className="px-6 py-2 rounded-xl text-xs font-black">Close Recipe</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PACKING VERIFICATION MODAL ── */}
      <AnimatePresence>
        {isPackingModalOpen && packingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsPackingModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0F1322] border border-[#1B233D] rounded-[2.5rem] p-6 max-w-md w-full relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center font-black">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Packing Verification Checklist</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Order ID: {packingOrder.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-300 font-semibold">Please verify the following packing parameters before releasing to delivery rider:</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'itemsVerify', label: 'Verify correct dish names & quantity count' },
                    { key: 'cutleryVerify', label: 'Include disposable spoons, forks and napkins' },
                    { key: 'tissuesVerify', label: 'Add tissue packets, seasonings and ketchup sachets' },
                    { key: 'sealVerify', label: 'Apply FoodIQ double-sealer security safety tape' }
                  ].map(check => (
                    <label key={check.key} className="flex items-center gap-3 p-3 bg-[#070913] border border-gray-800 rounded-2xl cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={packingChecklist[check.key]}
                        onChange={() => setPackingChecklist({ ...packingChecklist, [check.key]: !packingChecklist[check.key] })}
                        className="rounded bg-gray-950 border-gray-800 text-rose-500 focus:ring-rose-500/20 h-4.5 w-4.5"
                      />
                      <span className="text-xs font-semibold text-gray-300">{check.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#1B233D] pt-4">
                <Button onClick={() => setIsPackingModalOpen(false)} variant="outline" className="flex-1 py-2.5 rounded-xl text-xs font-black">Cancel</Button>
                <Button onClick={handleCompletePacking} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-550 text-xs font-black uppercase tracking-wider">
                  Seal & Dispatch
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default KitchenDisplaySystem;
