import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, CloudRain, CloudSun, AlertTriangle, CheckCircle2, 
  Users, ShoppingBag, TrendingUp, Sparkles, Plus, Clock, Info, ShieldAlert,
  Flame, Utensils, RefreshCw, BarChart2, DollarSign, Calendar
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';
import restaurantService from '../services/restaurantService';
import { ALL_RESTAURANTS } from '../data/restaurants';

const AdminDigitalTwin = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [appliedOptimizations, setAppliedOptimizations] = useState({});

  // Simulation Parameters
  const [weather, setWeather] = useState('sunny'); // sunny, rainy, stormy, heatwave
  const [simulationEvent, setSimulationEvent] = useState('none'); // none, diwali, weekend, cricket
  const [demandFactor, setDemandFactor] = useState('standard'); // low, standard, high_surge
  const [staffingLevel, setStaffingLevel] = useState('optimal'); // understaffed, optimal, overstaffed
  const [kitchenCapacity, setKitchenCapacity] = useState('100'); // 50, 100, 150

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        // Try fetching from server first
        let resData = null;
        try {
          const res = await restaurantService.getRestaurantById(id);
          if (res && res.success) {
            resData = res.data;
          }
        } catch (e) {
          console.warn("Backend restaurant fetch failed, falling back to mock catalog", e);
        }

        // Fallback to static catalog if server fails or returns empty
        if (!resData) {
          resData = ALL_RESTAURANTS.find(r => String(r.id) === String(id));
        }

        if (resData) {
          setRestaurant(resData);
          // Get menu items
          let menuList = [];
          if (resData.menu && resData.menu.length > 0) {
            menuList = resData.menu.flatMap(m => m.items || []);
          } else {
            // Generate mock menu items based on cuisine if empty
            menuList = [
              { id: 101, name: 'Signature Dish A', price: 299 },
              { id: 102, name: 'Popular Appetizer B', price: 189 },
              { id: 103, name: 'Chef Special C', price: 349 },
              { id: 104, name: 'Beverage D', price: 89 },
            ];
          }
          setMenuItems(menuList);
        } else {
          toast.error("Restaurant not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load restaurant digital twin data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id]);

  const handleRetrain = () => {
    setIsTraining(true);
    toast.loading("AI Twin reprocessing historical logs...", { id: "retrain" });
    setTimeout(() => {
      setIsTraining(false);
      toast.success("AI Twin model retrained with latest parameters!", { id: "retrain" });
    }, 2000);
  };

  const toggleOptimization = (optId, successMessage) => {
    setAppliedOptimizations(prev => {
      const isApplied = !prev[optId];
      if (isApplied) {
        toast.success(successMessage || "Optimization applied!");
      } else {
        toast.error("Optimization reverted");
      }
      return { ...prev, [optId]: isApplied };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-widest animate-pulse">BOOTING AI DIGITAL TWIN...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black mb-4">Digital Twin Not Available</h1>
        <p className="text-gray-400 mb-8 max-w-md">The selected restaurant could not be loaded. Please ensure it exists in the database.</p>
        <Link to="/admin/restaurants">
          <Button className="bg-cyan-500 text-black font-bold rounded-xl px-8">Back to Restaurants</Button>
        </Link>
      </div>
    );
  }

  // --- DYNAMIC AI CALCULATOR ---
  // Calculates predictions in real-time based on selected simulation parameters and applied optimizations.

  // Base constants
  const baseOrderVolume = 85;
  const baseAvgPrice = 240;
  
  // 1. Weather Multipliers
  let weatherMult = 1.0;
  let weatherLabel = "Clear Sky";
  if (weather === 'rainy') { weatherMult = 1.35; weatherLabel = "Heavy Rain (+35% Delivery Demand)"; }
  if (weather === 'stormy') { weatherMult = 1.55; weatherLabel = "Severe Storm (+55% Delivery Demand)"; }
  if (weather === 'heatwave') { weatherMult = 0.85; weatherLabel = "Extreme Heatwave (-15% Dine-in)"; }

  // 2. Events Multipliers
  let eventMult = 1.0;
  let eventLabel = "Regular Day";
  if (simulationEvent === 'diwali') { eventMult = 1.80; eventLabel = "Diwali Festival (+80% Volume)"; }
  if (simulationEvent === 'weekend') { eventMult = 1.30; eventLabel = "Weekend Rush (+30% Volume)"; }
  if (simulationEvent === 'cricket') { eventMult = 1.45; eventLabel = "India Match Live (+45% Snack Orders)"; }

  // 3. Demand Factor Multipliers
  let demandMult = 1.0;
  if (demandFactor === 'low') demandMult = 0.7;
  if (demandFactor === 'high_surge') demandMult = 1.5;

  // Calculate predicted orders
  let predictedOrders = Math.round(baseOrderVolume * weatherMult * eventMult * demandMult);
  
  // Optimization impact
  if (appliedOptimizations['throttle']) {
    predictedOrders = Math.round(predictedOrders * 0.85); // Throttling caps maximum load
  }

  // Revenue calculation
  let predictedRevenue = Math.round(predictedOrders * baseAvgPrice);
  if (simulationEvent === 'diwali') predictedRevenue = Math.round(predictedRevenue * 1.15); // Higher average cart value during festivals

  // Confidence Score logic
  let confidenceScore = 95;
  if (weather === 'stormy') confidenceScore -= 8;
  if (simulationEvent === 'diwali') confidenceScore -= 5;
  if (demandFactor === 'high_surge') confidenceScore -= 6;
  if (isTraining) confidenceScore = 99;

  // Kitchen load calculation
  let kitchenLoadBase = Math.round((predictedOrders / 120) * 100);
  if (kitchenCapacity === '50') kitchenLoadBase *= 2.0;
  if (kitchenCapacity === '150') kitchenLoadBase *= 0.65;
  let kitchenLoad = Math.min(Math.max(Math.round(kitchenLoadBase), 15), 180);

  // Apply staff scheduling optimization
  if (appliedOptimizations['staff_up'] && staffingLevel === 'understaffed') {
    // Rebalances load
    kitchenLoad = Math.round(kitchenLoad * 0.82);
  }

  // Food Waste calculations
  let foodWasteKg = Math.round(predictedOrders * 0.35);
  if (appliedOptimizations['waste_reclaim']) {
    foodWasteKg = Math.round(foodWasteKg * 0.4); // Reduces waste by 60%
  }

  // Predicted Staffing
  let optimalRiders = Math.max(Math.round(predictedOrders * 0.12), 3);
  let optimalChefs = Math.max(Math.round(predictedOrders * 0.08), 2);
  
  let currentRiders = staffingLevel === 'understaffed' ? Math.round(optimalRiders * 0.6) : staffingLevel === 'overstaffed' ? Math.round(optimalRiders * 1.4) : optimalRiders;
  let currentChefs = staffingLevel === 'understaffed' ? Math.round(optimalChefs * 0.7) : staffingLevel === 'overstaffed' ? Math.round(optimalChefs * 1.3) : optimalChefs;

  // Ingredient Shortages
  const mockIngredients = [
    { name: 'Fresh Produce / Veggies', key: 'veggies', baseStock: 45, consumptionPerOrder: 0.4 },
    { name: 'Cooking Oil', key: 'oil', baseStock: 30, consumptionPerOrder: 0.25 },
    { name: 'Dairy & Cheese', key: 'dairy', baseStock: 25, consumptionPerOrder: 0.3 },
    { name: 'Flour & Rice', key: 'grains', baseStock: 80, consumptionPerOrder: 0.65 },
    { name: 'Poultry / Meat', key: 'meat', baseStock: 35, consumptionPerOrder: 0.5 },
  ];

  const predictedIngredients = mockIngredients.map(ing => {
    let required = Math.round(predictedOrders * ing.consumptionPerOrder);
    let currentStock = ing.baseStock;
    
    // Auto-replenish optimization
    if (appliedOptimizations['auto_stock']) {
      currentStock += Math.round(required * 1.2);
    }

    const shortage = required > currentStock ? Math.round(required - currentStock) : 0;
    const risk = shortage > 0 ? (shortage / currentStock > 0.4 ? 'HIGH' : 'MEDIUM') : 'SAFE';
    
    return {
      name: ing.name,
      stock: currentStock,
      required: required,
      shortage: shortage,
      risk: risk
    };
  });

  // Check if any ingredient is in high/medium risk
  const hasShortageAlert = predictedIngredients.some(i => i.shortage > 0);

  // Top Dishes Demand Forecast
  const mainDishes = menuItems.slice(0, 4);
  const dishForecasts = mainDishes.map((dish, i) => {
    // Distribute demand across dishes
    const share = i === 0 ? 0.35 : i === 1 ? 0.25 : i === 2 ? 0.20 : 0.20;
    let expectedOrders = Math.round(predictedOrders * share);
    
    // Weather effects dish choices
    if (weather === 'rainy' && (dish.name.toLowerCase().includes('pizza') || dish.name.toLowerCase().includes('chicken') || dish.name.toLowerCase().includes('biryani'))) {
      expectedOrders = Math.round(expectedOrders * 1.25);
    }

    return {
      name: dish.name,
      price: dish.price,
      orders: expectedOrders,
      waste: Math.round(expectedOrders * 0.15 * (appliedOptimizations['waste_reclaim'] ? 0.4 : 1))
    };
  });

  // Recharts Chart Data Generation
  const hourlyLoadData = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 11; // 11 AM to 10 PM
    const isPeak = (hour >= 13 && hour <= 14) || (hour >= 19 && hour <= 21);
    const multiplier = isPeak ? 1.5 : 0.6;
    const ordersPerHour = Math.round((predictedOrders / 12) * multiplier);
    const capacityLimit = Math.round(15 * (parseInt(kitchenCapacity) / 100));
    
    return {
      time: hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
      Orders: ordersPerHour,
      Capacity: capacityLimit,
      Load: Math.round((ordersPerHour / capacityLimit) * 100)
    };
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans pb-16">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#111827] via-[#0F172A] to-transparent border-b border-gray-800/60 py-6 md:py-8 px-4 md:px-12">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[150px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-10 w-[200px] h-[200px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/restaurants" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-cyan-400 transition-all duration-300 shadow-lg"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  Twin Synced & Active
                </span>
                <span className="text-gray-500 text-xs font-bold">Model v4.1-RealTime</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {restaurant.name} <span className="text-cyan-500 font-light text-2xl">Digital Twin</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                AI Agent learning from 365-day ordering patterns, real-time weather logs, and market intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleRetrain}
              disabled={isTraining}
              className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTraining ? 'animate-spin text-cyan-400' : ''} />
              Retrain Twin
            </button>
            <div className="bg-cyan-500 text-black font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20">
              <Cpu size={16} /> Live Simulation
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ════ LEFT COLUMN: SIMULATOR CONTROLS ════ */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2rem] border border-gray-800/80 p-8 shadow-xl">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Flame className="text-cyan-400" size={20} />
                Simulator Parameters
              </h2>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                Tweak external stress factors below. The AI Twin will instantly simulate the operation changes and update the predictions.
              </p>

              {/* Weather Input */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Weather Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sunny', label: '☀️ Sunny', color: 'hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-500' },
                    { id: 'rainy', label: '🌧️ Heavy Rain', color: 'hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400' },
                    { id: 'stormy', label: '⛈️ Stormy', color: 'hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400' },
                    { id: 'heatwave', label: '🔥 Heatwave', color: 'hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-500' },
                  ].map(w => (
                    <button
                      key={w.id}
                      onClick={() => setWeather(w.id)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all ${
                        weather === w.id 
                          ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md shadow-cyan-500/5' 
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Event */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Special Events & Festivals</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: '📅 Regular Day' },
                    { id: 'diwali', label: '🪔 Diwali Festival' },
                    { id: 'weekend', label: '🍹 Weekend Rush' },
                    { id: 'cricket', label: '🏏 India Match Live' },
                  ].map(e => (
                    <button
                      key={e.id}
                      onClick={() => setSimulationEvent(e.id)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold text-left transition-all ${
                        simulationEvent === e.id 
                          ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md shadow-cyan-500/5' 
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Local Demand Surge */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Local Demand Factor</label>
                <div className="flex gap-2">
                  {[
                    { id: 'low', label: 'Low' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'high_surge', label: '⚡ Surge High' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDemandFactor(d.id)}
                      className={`flex-1 py-3 text-center rounded-xl border text-xs font-bold transition-all ${
                        demandFactor === d.id 
                          ? 'border-cyan-500 bg-cyan-500/10 text-white' 
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staffing Levels */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Simulated Staffing Level</label>
                <div className="flex gap-2">
                  {[
                    { id: 'understaffed', label: 'Understaffed' },
                    { id: 'optimal', label: 'Optimal' },
                    { id: 'overstaffed', label: 'Overstaffed' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStaffingLevel(s.id)}
                      className={`flex-1 py-2.5 text-center rounded-xl border text-xs font-bold transition-all ${
                        staffingLevel === s.id 
                          ? 'border-cyan-500 bg-cyan-500/10 text-white' 
                          : 'border-gray-800 bg-[#0F172A] text-gray-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kitchen Capacity Capacity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kitchen Active Capacity</label>
                  <span className="text-xs font-black text-cyan-400">{kitchenCapacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  step="50" 
                  value={kitchenCapacity}
                  onChange={(e) => setKitchenCapacity(e.target.value)}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  <span>50% (Maintenance)</span>
                  <span>100% (Optimal)</span>
                  <span>150% (Overdrive)</span>
                </div>
              </div>

            </div>

            {/* Simulated Live Environment Insights */}
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2rem] border border-gray-800/80 p-8 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <Info size={16} className="text-cyan-400" />
                Live Twin Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">Simulation Status</span>
                  <Badge variant="success">RUNNING</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">Simulation Target</span>
                  <span className="text-xs font-bold text-white">{weatherLabel}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">Target Event</span>
                  <span className="text-xs font-bold text-cyan-400">{eventLabel}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-400">Last Synced Data</span>
                  <span className="text-xs text-gray-400 font-mono">10 min ago</span>
                </div>
              </div>
            </div>

          </div>

          {/* ════ RIGHT COLUMN: CORE DASHBOARD PREDICTIONS ════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── SECTION 1: KEY PERFORMANCE TWIN PREDICTIONS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Predicted Orders */}
              <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-24 w-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full">{confidenceScore}% Confidence</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Predicted Orders Today</p>
                <h3 className="text-3xl font-black text-white flex items-baseline gap-2">
                  {predictedOrders}
                  <span className="text-xs text-green-500 font-bold">
                    {predictedOrders > baseOrderVolume ? `+${Math.round((predictedOrders - baseOrderVolume)/baseOrderVolume*100)}% vs avg` : `${Math.round((predictedOrders - baseOrderVolume)/baseOrderVolume*100)}% vs avg`}
                  </span>
                </h3>
              </div>

              {/* Predicted Revenue */}
              <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <DollarSign size={20} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">92% Margin Acc</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Predicted Gross Revenue</p>
                <h3 className="text-3xl font-black text-white flex items-baseline gap-2">
                  ₹{predictedRevenue.toLocaleString()}
                  <span className="text-xs text-green-500 font-bold">
                    {predictedRevenue > (baseOrderVolume * baseAvgPrice) ? 'Surge Revenue' : 'Stable'}
                  </span>
                </h3>
              </div>

              {/* Kitchen Load Stress */}
              <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-24 w-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
                    <Flame size={20} />
                  </div>
                  <div className="text-right">
                    <Badge variant={kitchenLoad > 100 ? 'error' : kitchenLoad > 80 ? 'warning' : 'success'}>
                      {kitchenLoad > 100 ? 'OVERLOAD' : kitchenLoad > 80 ? 'HIGH STRESS' : 'OPTIMAL'}
                    </Badge>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Simulated Kitchen Load</p>
                <h3 className="text-3xl font-black text-white">
                  {kitchenLoad}%
                </h3>
              </div>

            </div>

            {/* ── SECTION 2: CHARTS & HOURLY SIMULATION ── */}
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border border-gray-800/80 p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <BarChart2 className="text-cyan-400" size={20} />
                    Hourly Load & Order Projection
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Real-time simulation of incoming orders compared to kitchen capacity limits.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Hourly Target
                </div>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyLoadData}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '16px', color: '#fff' }} />
                    <Area type="monotone" dataKey="Orders" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#orderGrad)" />
                    <Line type="monotone" dataKey="Capacity" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Kitchen Capacity Cap" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── SECTION 3: ACTIONABLE RECOMMENDATIONS & DIALS ── */}
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border border-gray-800/80 p-8 shadow-xl">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Sparkles className="text-cyan-400 animate-pulse" size={20} />
                Actionable AI Recommendations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Recommendation 1: Replenishment */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  appliedOptimizations['auto_stock']
                    ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400'
                    : hasShortageAlert 
                      ? 'bg-amber-500/5 border-amber-500/30 text-amber-400' 
                      : 'bg-white/5 border-gray-800'
                }`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center">
                      <ShieldAlert size={18} />
                    </div>
                    <button 
                      onClick={() => toggleOptimization('auto_stock', "Replenishment order sent to suppliers!")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        appliedOptimizations['auto_stock']
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {appliedOptimizations['auto_stock'] ? 'Applied' : 'Apply Fix'}
                    </button>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">Stock Replenishment Required</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {hasShortageAlert 
                      ? "High risk of ingredient shortage due to surge in simulated demand. Pre-ordering is highly recommended."
                      : "Stock levels currently optimal for this simulation. Apply replenishment to lock in pre-order prices."}
                  </p>
                </div>

                {/* Recommendation 2: Staff Scheduling */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  appliedOptimizations['staff_up']
                    ? 'bg-emerald-500/5 border-emerald-500/40'
                    : staffingLevel === 'understaffed'
                      ? 'bg-rose-500/5 border-rose-500/30' 
                      : 'bg-white/5 border-gray-800'
                }`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center text-cyan-400">
                      <Users size={18} />
                    </div>
                    <button 
                      onClick={() => toggleOptimization('staff_up', "Additional shifts automated and sent to staff!")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        appliedOptimizations['staff_up']
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {appliedOptimizations['staff_up'] ? 'Optimized' : 'Adjust Shifts'}
                    </button>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">Staffing Adjustment Alert</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {staffingLevel === 'understaffed' 
                      ? "Understaffed simulation will lead to a 12-minute delay in order deliveries. Call in 2 extra chefs."
                      : "Staff scheduling matches current volume. Adjust shifts to simulate dynamic roster optimization."}
                  </p>
                </div>

                {/* Recommendation 3: Waste Management */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  appliedOptimizations['waste_reclaim']
                    ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/5 border-gray-800'
                }`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center text-yellow-500">
                      <AlertTriangle size={18} />
                    </div>
                    <button 
                      onClick={() => toggleOptimization('waste_reclaim', "Smart kitchen waste reduction activated!")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        appliedOptimizations['waste_reclaim']
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {appliedOptimizations['waste_reclaim'] ? 'Reclaimed' : 'Reclaim Waste'}
                    </button>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">Food Waste Mitigation</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Expected prep surplus will generate {foodWasteKg}kg of food waste. Enable Smart Pre-portioning to reduce waste by 60%.
                  </p>
                </div>

                {/* Recommendation 4: Order Throttling */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  appliedOptimizations['throttle']
                    ? 'bg-emerald-500/5 border-emerald-500/40'
                    : kitchenLoad > 100
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-white/5 border-gray-800'
                }`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center text-purple-400">
                      <Clock size={18} />
                    </div>
                    <button 
                      onClick={() => toggleOptimization('throttle', "Order throttling active! Incoming orders capped.")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        appliedOptimizations['throttle']
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {appliedOptimizations['throttle'] ? 'Throttled' : 'Throttle Orders'}
                    </button>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">Kitchen Load Throttling</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {kitchenLoad > 100 
                      ? "Kitchen is severely overloaded! Restrict incoming delivery orders by 15% to maintain ratings."
                      : "Kitchen queue times are normal. Simulate high kitchen load to test auto-throttling limits."}
                  </p>
                </div>

              </div>
            </div>

            {/* ── SECTION 4: INVENTORY SHORTAGE RISK CHART & LIST ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Ingredient predictions */}
              <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border border-gray-800/80 p-8 shadow-xl">
                <h3 className="text-base font-black text-white mb-6 flex items-center gap-2">
                  <Utensils className="text-cyan-400" size={18} />
                  Ingredient Stock Forecast
                </h3>

                <div className="space-y-4">
                  {predictedIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/5 border border-gray-800 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-white">{ing.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Stock: {ing.stock} units · Need: {ing.required} units</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {ing.shortage > 0 && (
                          <span className="text-[10px] font-bold text-rose-500">Short: {ing.shortage} units</span>
                        )}
                        <Badge variant={ing.risk === 'HIGH' ? 'error' : ing.risk === 'MEDIUM' ? 'warning' : 'success'} className="text-[9px] font-black tracking-widest uppercase">
                          {ing.risk}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dish sales forecast */}
              <div className="bg-[#111827]/80 backdrop-blur-md rounded-[2.5rem] border border-gray-800/80 p-8 shadow-xl">
                <h3 className="text-base font-black text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={18} />
                  Top Dish Demand Projections
                </h3>

                <div className="space-y-4">
                  {dishForecasts.map((dish, i) => (
                    <div key={i} className="p-3.5 bg-white/5 border border-gray-800 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-white">{dish.name}</h4>
                        <span className="text-xs font-black text-cyan-400">{dish.orders} Orders</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>Price: ₹{dish.price}</span>
                        <span className="text-rose-400">Waste: {dish.waste} units expected</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDigitalTwin;
