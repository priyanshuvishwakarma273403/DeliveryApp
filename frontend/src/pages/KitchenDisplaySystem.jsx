import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, Users, CheckSquare, AlertCircle, Play, CheckCircle2, Search, 
  Filter, BookOpen, Activity, Award, Calendar, RefreshCw, 
  Maximize2, Volume2, ShieldAlert, ShoppingBag, ShieldCheck, 
  ChevronRight, VolumeX, AlertOctagon, HelpCircle as HelpIcon, BellRing, Sparkles, LogOut
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../providers/WebSocketProvider';
import kitchenService from '../services/kitchenService';
import orderService from '../services/orderService';
import { playSuccessChime, playNotificationTick, playAlertBleep, playEmergencySiren } from '../utils/audioSynth';

const RECIPES_DB = {
  "paneer-tikka": {
    name: "Classic Paneer Tikka",
    ingredients: "Fresh Paneer (150g), Bell peppers (50g), Onions, Tandoori spices, Yogurt marinade.",
    instructions: [
      "Cut paneer and veggies into cubes.",
      "Marinate in tandoori yogurt spice mix for 30 minutes.",
      "Skew and grill in tandoor at 350°C for 8-10 minutes.",
      "Garnish with chat masala and serve hot with mint chutney."
    ],
    allergens: "Dairy",
    presentation: "Serve on a hot iron sizzler plate with lime wedges."
  },
  "truffle-burger": {
    name: "Gourmet Truffle Burger",
    ingredients: "Black Angus beef patty (180g), Truffle Aioli (15g), Aged Swiss cheese, Brioche bun, Caramelized onions.",
    instructions: [
      "Grill beef patty to medium well (4 mins per side).",
      "Melt Swiss cheese over the patty during the final minute.",
      "Toast brioche bun on the flat top grill.",
      "Assemble and serve with hot fries."
    ],
    allergens: "Gluten, Dairy, Egg",
    presentation: "Wrap base in greaseproof paper, serve with fresh rosemary fries."
  }
};

const KitchenDisplaySystem = () => {
  const { user } = useAuthStore();
  const { client, isConnected } = useWebSocket();
  const restaurantId = user?.restaurantId || 'rest-1';

  const [loading, setLoading] = useState(true);
  const [twinState, setTwinState] = useState(null);
  const [stations, setStations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [selectedStation, setSelectedStation] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [packingOrder, setPackingOrder] = useState(null);
  const [packingChecklist, setPackingChecklist] = useState({
    itemsVerify: false, cutleryVerify: false, tissuesVerify: false, sealVerify: false
  });

  // Load all data
  const loadKdsData = async () => {
    try {
      const [stateData, stationsData, ordersData, tasksData] = await Promise.all([
        kitchenService.getKitchenState(restaurantId),
        kitchenService.getStations(restaurantId),
        orderService.getRestaurantOrders(restaurantId),
        kitchenService.getTasks(restaurantId)
      ]);
      setTwinState(stateData);
      setStations(stationsData || []);
      setOrders(ordersData || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error("Failed to load KDS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKdsData();
    const interval = setInterval(loadKdsData, 15000); // Poll every 15s for fresh backend updates
    return () => clearInterval(interval);
  }, [restaurantId]);

  // WebSocket Subscription for Realtime updates
  useEffect(() => {
    if (!client || !isConnected) return;
    
    const twinSub = client.subscribe(`/topic/kitchen/${restaurantId}/state`, (message) => {
      if (message.body) {
        const updatedTwin = JSON.parse(message.body);
        setTwinState(updatedTwin);
        if (soundEnabled) playNotificationTick();
      }
    });

    const ordersSub = client.subscribe(`/topic/admin/orders`, () => {
      // Reload on any general admin order placement/status updates
      loadKdsData();
    });

    return () => {
      twinSub.unsubscribe();
      ordersSub.unsubscribe();
    };
  }, [client, isConnected, restaurantId, soundEnabled]);

  // Active cooking timers tick simulator
  const [simSeconds, setSimSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setSimSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter only active orders (e.g. not DELIVERED or CANCELLED)
  const activeOrdersList = useMemo(() => {
    return orders.filter(o => 
      ['PLACED', 'ACCEPTED', 'PREPARING', 'COOKING', 'FOOD_READY'].includes(o.status)
    );
  }, [orders]);

  // Identify Overloaded Stations
  // (Station workload = count of preparing tasks mapped to that station name)
  const overloadedStations = useMemo(() => {
    return stations.filter(station => {
      const activeTaskCount = tasks.filter(t => 
        t.stationId === station.name && t.status === 'PREPARING'
      ).length;
      return activeTaskCount > (station.capacity || 2);
    });
  }, [stations, tasks]);

  // Filter KDS tickets based on station selections and search queries
  const filteredOrders = useMemo(() => {
    return activeOrdersList.filter(o => {
      // Filter by station: Check if any item in the order maps to this station
      const matchesStation = selectedStation === 'All' || o.orderItems?.some(item => {
        const dishProfile = tasks.find(t => t.dishId === item.menuItemId);
        return dishProfile?.stationId === selectedStation;
      });

      const customerName = o.customerName || o.user?.name || '';
      const matchesSearch = o.id.toString().includes(searchQuery) || 
                            customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStation && matchesSearch;
    });
  }, [activeOrdersList, selectedStation, searchQuery, tasks]);

  const playChime = (type) => {
    if (!soundEnabled) return;
    if (type === 'Checklist Update') {
      playNotificationTick();
    } else if (type === 'Order Completed') {
      playSuccessChime();
    } else if (type === 'Emergency') {
      playEmergencySiren();
    }
  };

  // Toggle single item preparation state
  const handleToggleTask = async (taskId) => {
    try {
      await kitchenService.completeTask(restaurantId, taskId);
      toast.success("Task completed!");
      playChime('Checklist Update');
      loadKdsData();
    } catch (err) {
      toast.error("Could not complete task.");
    }
  };

  // Advance Order status to READY
  const handleOpenPacking = (order) => {
    setPackingOrder(order);
    setPackingChecklist({ itemsVerify: false, cutleryVerify: false, tissuesVerify: false, sealVerify: false });
    setIsPackingModalOpen(true);
  };

  const handleCompletePacking = async () => {
    if (!packingChecklist.itemsVerify || !packingChecklist.sealVerify) {
      toast.error('Please verify items and apply the safety packing seal.');
      return;
    }
    
    try {
      await kitchenService.markOrderReady(restaurantId, packingOrder.id);
      setIsPackingModalOpen(false);
      playChime('Order Completed');
      toast.success(`Order #${packingOrder.id} marked as Food Ready! Rider notified.`);
      loadKdsData();
    } catch (err) {
      toast.error("Failed to mark order ready.");
    }
  };

  // Toggle station state between ACTIVE and OFFLINE
  const handleToggleStation = async (stationId) => {
    try {
      const result = await kitchenService.toggleStationState(restaurantId, stationId);
      toast.success(result.message || "Station toggled.");
      loadKdsData();
    } catch (err) {
      toast.error("Failed to toggle station status.");
    }
  };

  // Adjust capacity
  const handleAdjustCapacity = async (stationId, newCapacity) => {
    try {
      await kitchenService.adjustCapacity(restaurantId, stationId, newCapacity);
      toast.success(`Capacity set to ${newCapacity}`);
      loadKdsData();
    } catch (err) {
      toast.error("Failed to adjust station capacity.");
    }
  };

  const handleBuzzer = () => {
    playChime('Emergency');
    toast.error('Assistance requested! Shift manager and Cashier notified.', { icon: '🚨' });
  };

  return (
    <div className="min-h-screen bg-[#070913] text-[#E2E8F0] flex flex-col font-sans">
      {/* Dynamic Overloaded Stations Alert Banner */}
      {overloadedStations.length > 0 && (
        <div className="bg-red-600 text-white font-black px-6 py-3 text-xs tracking-wider flex items-center justify-between shadow-lg z-20 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>
              KITCHEN BOTTLENECK ALERT: {overloadedStations.map(s => s.name).join(', ')} Station Overloaded! Capacity threshold exceeded.
            </span>
          </div>
          <button 
            onClick={() => overloadedStations.forEach(s => handleAdjustCapacity(s.stationId, (s.capacity || 2) + 1))}
            className="bg-white text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase"
          >
            Auto-Scale capacity (+1)
          </button>
        </div>
      )}

      {/* Cockpit Top HUD */}
      <header className="bg-[#0F1322] border-b border-[#1B233D] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-rose-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-rose-600/30 text-white animate-pulse">
            <Flame size={22} className="fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              FoodIQ KDS Cockpit
            </h1>
            <p className="text-[9px] text-[#A0AEC0] font-bold uppercase tracking-wider">
              Restaurant Twin: {restaurantId} | Delay Risk:{' '}
              <span className={`font-black ${twinState?.delayRisk === 'HIGH' ? 'text-red-500' : 'text-green-500'}`}>
                {twinState?.delayRisk || 'LOW'}
              </span>
            </p>
          </div>
        </div>

        {/* Live Metrics HUD */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-[#080B16] border border-[#1C243F] px-4 py-2 rounded-xl">
            <Activity className="text-cyan-500" size={16} />
            <div className="text-left">
              <p className="text-[8px] text-gray-500 font-bold uppercase">Workload load</p>
              <p className="text-xs font-black text-cyan-400">
                {twinState?.overallLoad ? `${Math.round(twinState.overallLoad * 100)}%` : '0%'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#080B16] border border-[#1C243F] px-4 py-2 rounded-xl">
            <Clock className="text-amber-500" size={16} />
            <div className="text-left">
              <p className="text-[8px] text-gray-500 font-bold uppercase">Backlog clear</p>
              <p className="text-xs font-black text-amber-500">{twinState?.estimatedBacklogClearTime || '0 mins'}</p>
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
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
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

      {/* Main Board */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Active Queue */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 border-b border-gray-800/50">
            <button
              onClick={() => setSelectedStation('All')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedStation === 'All' 
                  ? 'bg-rose-600 text-white shadow-lg' 
                  : 'bg-[#0F1322] text-[#A0AEC0] border border-[#1B233D]'
              }`}
            >
              All Stations
            </button>
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.name)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedStation === station.name
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'bg-[#0F1322] text-[#A0AEC0] border border-[#1B233D]'
                }`}
              >
                {station.name} ({station.status})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1322] border border-[#1B233D] rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map(order => {
                // Find KDS tasks matching this order
                const orderTasks = tasks.filter(t => t.orderId === order.id);
                const allDone = orderTasks.length > 0 && orderTasks.allMatch?.(t => t.status === 'COMPLETED');
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0F1322] rounded-3xl border border-[#1B233D] shadow-xl flex flex-col justify-between overflow-hidden"
                  >
                    {/* Ticket Header */}
                    <div className="p-4 bg-gray-900/60 border-b border-[#1B233D]">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black px-2 py-0.5 rounded uppercase">
                            {order.status}
                          </span>
                          <span className="text-xs font-black text-white ml-2">#{order.id}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">
                          {order.paymentMethod || 'ONLINE'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs font-black text-white truncate max-w-[150px]">
                          {order.customerName || order.user?.name || 'Customer'}
                        </p>
                        <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                          <Clock size={12} />
                          {dayjs(order.createdAt).format('HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Task checklist */}
                    <div className="p-4 flex-1 space-y-4">
                      {order.allergensAlert && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start gap-2 text-[10px] font-bold">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black leading-none mb-1 uppercase">ALLERGY ALERT</p>
                            <p className="leading-tight text-red-400">Contains exclusions matching profile.</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Kitchen prep tasks</p>
                        {orderTasks.length > 0 ? (
                          orderTasks.map((task) => {
                            const elapsed = Math.round((simSeconds % 120) / 10);
                            const estimated = task.estimatedDuration || 5.0;
                            // Progress bar: remaining prep time ratio
                            const progress = Math.max(0, Math.min(1, (estimated - elapsed) / estimated));
                            
                            return (
                              <div key={task.taskId} className="space-y-1.5 p-2 bg-[#070913] rounded-xl border border-gray-850">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={task.status === 'COMPLETED'}
                                      onChange={() => handleToggleTask(task.taskId)}
                                      className="rounded bg-gray-950 border-gray-800 text-rose-500"
                                    />
                                    <span className={task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-200'}>
                                      {task.dishId.replace(/-/g, ' ')}
                                    </span>
                                  </label>
                                  <span className="text-[9px] bg-gray-850 px-1.5 py-0.5 rounded text-gray-400">
                                    {task.stationId}
                                  </span>
                                </div>

                                {task.status === 'PREPARING' && (
                                  <div className="space-y-1">
                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-cyan-500 transition-all duration-1000" 
                                        style={{ width: `${progress * 100}%` }} 
                                      />
                                    </div>
                                    <p className="text-[8px] text-gray-500 text-right">Remaining: {Math.max(0, Math.round(estimated - elapsed))} min</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-400 italic font-semibold">No preparation tasks generated.</p>
                        )}
                      </div>
                    </div>

                    {/* Footer dispatch actions */}
                    <div className="p-4 border-t border-[#1B233D] bg-gray-900/10">
                      {order.status === 'FOOD_READY' ? (
                        <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={12} /> Ready for Rider Pick
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleOpenPacking(order)}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-550 text-[10px] font-black uppercase tracking-widest"
                        >
                          Mark Ready & Dispatch
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Station Panel */}
        <div className="w-full lg:w-80 bg-[#0F1322] border-l border-[#1B233D] p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Users size={14} className="text-rose-500" /> Active Station Controls
            </h3>

            <div className="space-y-3">
              {stations.map(station => (
                <div key={station.id} className="p-4 bg-[#070913] border border-gray-800 rounded-2xl space-y-3 text-xs font-bold">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-black">{station.name}</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-0.5">ID: {station.stationId}</p>
                    </div>
                    
                    <button
                      onClick={() => handleToggleStation(station.stationId)}
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                        station.status === 'ACTIVE' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {station.status}
                    </button>
                  </div>

                  {/* Station capacity controls */}
                  <div className="space-y-1 pt-1 border-t border-gray-850">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">Load / Capacity</span>
                      <span className="text-cyan-400">{Math.round((station.currentLoad || 0) * 100)}% ({station.capacity} Max)</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={station.capacity}
                      onChange={(e) => handleAdjustCapacity(station.stationId, Number(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Packing Checklist Verification Modal */}
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
