import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, Users, CheckSquare, AlertCircle, Play, CheckCircle2, Search, 
  Filter, BookOpen, UserPlus, HelpCircle, Activity, Award, Calendar, RefreshCw, 
  Maximize2, Volume2, ShieldAlert, Award as Medal, ShoppingBag, ShieldCheck, ChevronRight
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
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [packingOrder, setPackingOrder] = useState(null);
  const [packingChecklist, setPackingChecklist] = useState({
    itemsVerify: false, cutleryVerify: false, tissuesVerify: false, sealVerify: false
  });

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

  // Stats calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const cooking = orders.filter(o => o.status === 'COOKING').length;
    const ready = orders.filter(o => o.status === 'READY').length;
    const delayed = orders.filter(o => o.timeElapsed > o.expectedTime).length;
    
    // Kitchen load percentage
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

  // Action handers
  const handleTogglePrepItem = (orderId, index) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = [...o.items];
        updatedItems[index] = { ...updatedItems[index], prepDone: !updatedItems[index].prepDone };
        return { ...o, items: updatedItems };
      }
      return o;
    }));
  };

  const handleAdvanceStatus = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStatus = 'NEW';
        if (o.status === 'ACCEPTED') nextStatus = 'PREPARING';
        else if (o.status === 'PREPARING') nextStatus = 'COOKING';
        else if (o.status === 'COOKING') {
          // Trigger packing flow
          handleOpenPacking(o);
          return o;
        }
        return { ...o, status: nextStatus };
      }
      return o;
    }));
    toast.success(`Ticket status updated!`);
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

  const handleAcceptOrder = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ACCEPTED' } : o));
    toast.success(`Order ${id} accepted!`);
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-[#E2E8F0] p-4 md:p-6 lg:p-8 font-sans">
      
      {/* ── HEADER STATUS COCKPIT ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-gray-800/80 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Live Kitchen Display System (KDS)</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Flame className="text-rose-500 fill-rose-500/20" size={28} />
            FoodIQ Cooking Pipeline
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-medium">Real-time dish tracking, station routing, and packaging checklist validation.</p>
        </div>

        {/* Top metrics summary cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#0F1524] border border-gray-850 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Clock className="text-amber-500" size={20} />
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase leading-none mb-1">Delayed Orders</p>
              <p className="text-base font-black text-amber-500 leading-none">{stats.delayed}</p>
            </div>
          </div>
          <div className="bg-[#0F1524] border border-gray-850 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Activity className="text-cyan-500" size={20} />
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase leading-none mb-1">Kitchen Load</p>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-cyan-400 leading-none">{stats.activeLoad}%</span>
                <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${stats.activeLoad}%` }} />
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                toast.success('Fullscreen mode active.');
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-3 bg-[#0F1524] border border-gray-850 hover:bg-gray-800 rounded-xl transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* ── STATION FILTER TABS & SEARCH ── */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2.5 bg-[#0F1524] p-1.5 rounded-2xl border border-gray-850 w-full lg:w-auto">
          {['All', 'Pizza', 'Grill', 'Indian', 'Desserts', 'Packing'].map(station => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedStation === station 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="Search active tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1524] border border-gray-850 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* ── KITCHEN TICKETS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                className={`bg-[#0F1524] rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden transition-all ${
                  isOverdue ? 'border-rose-500/40 bg-rose-950/5' : 'border-gray-850'
                }`}
              >
                {/* Card Top Header */}
                <div className={`p-4 ${isOverdue ? 'bg-rose-500/10' : 'bg-gray-900/60'} border-b border-gray-800`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg mr-2">
                        {order.priority}
                      </span>
                      <span className="text-xs font-black text-white">{order.id}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{order.type}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm font-black text-white truncate max-w-[150px]">{order.customer}</p>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-gray-400'} />
                      <span className={`text-xs font-black ${isOverdue ? 'text-rose-500 font-bold animate-pulse' : 'text-white'}`}>
                        {order.timeElapsed} / {order.expectedTime}m
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full ${isOverdue ? 'bg-rose-500' : 'bg-green-500'}`} style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Card Body - Items checklist */}
                <div className="p-4 flex-1 space-y-4">
                  
                  {/* Allergy Warnings */}
                  {order.allergyNotes !== 'None' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-start gap-2 text-xs font-bold">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black leading-none mb-1">ALLERGY WARNING</p>
                        <p className="text-[10px] leading-tight text-amber-400">{order.allergyNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Items Roster */}
                  <div className="space-y-2">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Dishes to Cook</p>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 text-xs font-bold">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={item.prepDone}
                            onChange={() => handleTogglePrepItem(order.id, index)}
                            className="mt-1 rounded bg-gray-900 border-gray-700 text-rose-500 focus:ring-rose-500/20"
                          />
                          <span className={item.prepDone ? 'line-through text-gray-550' : 'text-gray-200'}>
                            {item.qty}x {item.name}
                          </span>
                        </label>
                        {MOCK_RECIPES[item.code] && (
                          <button 
                            onClick={() => setSelectedRecipe(MOCK_RECIPES[item.code])}
                            className="text-cyan-400 hover:text-cyan-300 text-[10px] shrink-0 font-black uppercase tracking-widest flex items-center gap-0.5"
                          >
                            <BookOpen size={10} /> Recipe
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Special Notes */}
                  {order.specialInstructions && (
                    <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 text-[10px] font-bold text-gray-400">
                      <span className="font-black text-gray-500">Chef Instruction: </span> {order.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Card Actions / Assignments */}
                <div className="p-4 border-t border-gray-800/80 bg-gray-900/20 space-y-3">
                  {/* Chef Assign Selector */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-black uppercase">Assign Chef</span>
                    <select 
                      value={order.assignedChef}
                      onChange={(e) => handleAssignChef(order.id, e.target.value)}
                      className="p-1.5 bg-[#070A13] border border-gray-800 rounded-lg text-[10px] font-black text-gray-300 outline-none"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {MOCK_CHEFS.map(chef => (
                        <option key={chef.name} value={chef.name}>{chef.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status update triggers */}
                  {order.status === 'ACCEPTED' ? (
                    <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-550 text-xs font-black uppercase tracking-wider">
                      Start Prep / Cooking
                    </Button>
                  ) : order.status === 'PREPARING' ? (
                    <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-550 text-xs font-black uppercase tracking-wider">
                      Mark as Cooking
                    </Button>
                  ) : order.status === 'COOKING' ? (
                    <Button onClick={() => handleAdvanceStatus(order.id)} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-550 text-xs font-black uppercase tracking-wider">
                      Verify & Send to Packing
                    </Button>
                  ) : (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} /> Ready for Dispatch
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── CHEF PERFORMANCE & ROSTER DRAWER ── */}
      <div className="bg-[#0F1524] rounded-[2.5rem] border border-gray-850 p-6 mt-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Kitchen Staff Shift Roster & Efficiency</h3>
          <span className="text-xs text-gray-500 font-bold">Shift: 08:00 AM - 04:00 PM</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_CHEFS.map(chef => (
            <div key={chef.name} className="p-4 bg-[#070A13] border border-gray-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">{chef.name}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Station: {chef.station} • Load: {chef.currentLoad} orders</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-lg border border-green-500/20 font-black uppercase">
                  {chef.status}
                </span>
                <p className="text-[10px] text-cyan-400 font-bold mt-1.5">Yield Score: {chef.efficiency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECIPE DETAILS DRAWER MODAL ── */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0F1524] border border-gray-800 rounded-[2.5rem] p-6 max-w-xl w-full relative z-10 space-y-5"
            >
              <h3 className="text-lg font-black text-white">{selectedRecipe.name}</h3>
              
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-black uppercase">Ingredients list</p>
                <p className="text-xs text-gray-200 font-bold leading-relaxed">{selectedRecipe.ingredients}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 font-black uppercase">Kitchen Prep Instructions</p>
                <div className="space-y-1.5 text-xs text-gray-300 font-bold">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <p key={idx} className="flex gap-2">
                      <span className="text-rose-500 font-black">{idx + 1}.</span>
                      <span>{step}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4 text-xs font-bold">
                <div>
                  <span className="text-[9px] text-gray-500 font-black uppercase">Allergen Safety</span>
                  <p className="text-amber-500 mt-1">{selectedRecipe.allergens}</p>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-black uppercase">Plating / Presentation Notes</span>
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
              className="bg-[#0F1524] border border-gray-800 rounded-[2.5rem] p-6 max-w-md w-full relative z-10 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center font-black">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Packing Verification</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Order ID: {packingOrder.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-300 font-bold">Please verify the following packing checklist parameters before marking ready:</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'itemsVerify', label: 'Verify correct item names & quantity' },
                    { key: 'cutleryVerify', label: 'Include disposable cutlery and napkins' },
                    { key: 'tissuesVerify', label: 'Tissues, condiments (sauce sachets) included' },
                    { key: 'sealVerify', label: 'Apply FoodIQ double-sealer security tape' }
                  ].map(check => (
                    <label key={check.key} className="flex items-center gap-3 p-3 bg-[#070A13] border border-gray-850 rounded-2xl cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={packingChecklist[check.key]}
                        onChange={() => setPackingChecklist({ ...packingChecklist, [check.key]: !packingChecklist[check.key] })}
                        className="rounded bg-gray-900 border-gray-700 text-rose-500 focus:ring-rose-500/20 h-4.5 w-4.5"
                      />
                      <span className="text-xs font-bold text-gray-300">{check.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-800 pt-4">
                <Button onClick={() => setIsPackingModalOpen(false)} variant="outline" className="flex-1 py-2.5 rounded-xl text-xs font-black">Cancel</Button>
                <Button onClick={handleCompletePacking} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-550 text-xs font-black uppercase tracking-wider">
                  Confirm Seal & Release
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
