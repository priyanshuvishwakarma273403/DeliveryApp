import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, CloudRain, CloudSun, AlertTriangle, CheckCircle2, 
  Users, ShoppingBag, TrendingUp, Sparkles, Plus, Clock, Info, ShieldAlert,
  Flame, Utensils, RefreshCw, BarChart2, DollarSign, Calendar, Check, X, Edit2,
  Sliders, Activity, ShieldCheck, Heart, AlertOctagon
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
import { useWebSocket } from '../providers/WebSocketProvider';

const AdminDigitalTwin = () => {
  const { id } = useParams();
  const { client, isConnected } = useWebSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  // Real backend metrics states
  const [twinState, setTwinState] = useState(null);
  const [forecastData, setForecastData] = useState({ multiHorizon: [], dishForecasts: [], heatmap: { data: [] } });
  const [kitchenCapacity, setKitchenCapacity] = useState({ stations: [], bottleneckCascade: [] });
  const [inventoryForecasts, setInventoryForecasts] = useState([]);
  const [menuIntelligence, setMenuIntelligence] = useState({ items: [], cannibalization: [], demandGaps: [] });
  const [prepPlans, setPrepPlans] = useState([]);
  const [monitoringMetrics, setMonitoringMetrics] = useState(null);

  // Editing Prep Plan state
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // Simulation Parameters
  const [weather, setWeather] = useState('sunny');
  const [simulationEvent, setSimulationEvent] = useState('none');
  const [demandFactor, setDemandFactor] = useState('standard');
  const [staffingLevel, setStaffingLevel] = useState('optimal');
  const [simulatingActive, setSimulatingActive] = useState(false);
  const [simResults, setSimResults] = useState(null);

  const fetchIntelligenceData = async () => {
    try {
      // 1. Get twin state
      const stateRes = await restaurantService.getDigitalTwinState(id);
      if (stateRes) setTwinState(stateRes);

      // 2. Get forecasts
      const forecastRes = await restaurantService.getMultiHorizonForecast(id);
      if (forecastRes) setForecastData(forecastRes);

      // 3. Get kitchen capacity
      const kitchenRes = await restaurantService.getKitchenCapacityIntelligence(id);
      if (kitchenRes) setKitchenCapacity(kitchenRes);

      // 4. Get inventory forecasts
      const inventoryRes = await restaurantService.getInventoryForecastIntelligence(id);
      if (inventoryRes) setInventoryForecasts(inventoryRes);

      // 5. Get menu intelligence
      const menuRes = await restaurantService.getMenuIntelligenceDetails(id);
      if (menuRes) setMenuIntelligence(menuRes);

      // 6. Get prep planner
      const prepRes = await restaurantService.getPrepPlanDetails(id);
      if (prepRes) setPrepPlans(prepRes);

      // 7. Get model tracking metrics
      const monitorRes = await restaurantService.getForecastMonitoring(id);
      if (monitorRes) setMonitoringMetrics(monitorRes);

    } catch (e) {
      console.warn("Failed to load backend intelligence services. Using fallback mock state.", e);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      // Fetch restaurant basic metadata
      try {
        const res = await restaurantService.getRestaurantById(id);
        if (res && res.success) {
          setRestaurant(res.data);
        } else {
          setRestaurant(ALL_RESTAURANTS.find(r => String(r.id) === String(id)));
        }
      } catch (err) {
        setRestaurant(ALL_RESTAURANTS.find(r => String(r.id) === String(id)));
      }
      
      await fetchIntelligenceData();
      setLoading(false);
    };

    initPage();
  }, [id]);

  // WebSocket Subscription for Real-time Updates
  useEffect(() => {
    if (!client || !isConnected) return;

    const topic = `/topic/digital-twin/${id}`;
    console.log("Subscribing to WebSocket digital twin updates:", topic);
    
    const subscription = client.subscribe(topic, (message) => {
      if (message.body) {
        try {
          const payload = JSON.parse(message.body);
          if (payload.state) {
            setTwinState(payload.state);
            toast.success("AI operations synchronized in real-time! 🔄", { id: "ws-twin" });
            // Re-fetch forecasts/capacities in background to keep data fresh
            fetchIntelligenceData();
          }
        } catch (err) {
          console.error("Error parsing WebSocket update:", err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isConnected, id]);

  const handleRetrain = () => {
    setIsTraining(true);
    toast.loading("AI models recalculating multi-horizon weights...", { id: "retrain" });
    setTimeout(async () => {
      setIsTraining(false);
      await fetchIntelligenceData();
      toast.success("AI models successfully updated!", { id: "retrain" });
    }, 2000);
  };

  // Prep Planner Actions
  const handleApprovePlan = async (planId) => {
    try {
      await restaurantService.approvePrepPlan(id, planId);
      toast.success("Prep target approved!");
      // Reload plans
      const prepRes = await restaurantService.getPrepPlanDetails(id);
      if (prepRes) setPrepPlans(prepRes);
    } catch (err) {
      toast.error("Failed to approve prep plan");
    }
  };

  const handleRejectPlan = async (planId) => {
    try {
      await restaurantService.rejectPrepPlan(id, planId);
      toast.error("Prep target rejected");
      // Reload plans
      const prepRes = await restaurantService.getPrepPlanDetails(id);
      if (prepRes) setPrepPlans(prepRes);
    } catch (err) {
      toast.error("Failed to reject prep plan");
    }
  };

  const handleSaveEditPlan = async (planId) => {
    try {
      const val = parseInt(editingValue);
      if (isNaN(val) || val < 0) {
        toast.error("Please enter a valid quantity");
        return;
      }
      await restaurantService.editPrepPlan(id, planId, val);
      toast.success("Prep target edited successfully");
      setEditingPlanId(null);
      // Reload plans
      const prepRes = await restaurantService.getPrepPlanDetails(id);
      if (prepRes) setPrepPlans(prepRes);
    } catch (err) {
      toast.error("Failed to edit prep plan");
    }
  };

  // Run What-If Simulation
  const handleRunSimulation = async () => {
    setSimulatingActive(true);
    try {
      let orderIncrease = 0.0;
      if (demandFactor === 'low') orderIncrease = -0.20;
      if (demandFactor === 'high_surge') orderIncrease = 0.40;
      if (simulationEvent === 'diwali') orderIncrease += 0.80;
      if (simulationEvent === 'weekend') orderIncrease += 0.30;
      if (simulationEvent === 'cricket') orderIncrease += 0.50;

      let staffChange = 0;
      if (staffingLevel === 'understaffed') staffChange = -2;
      if (staffingLevel === 'overstaffed') staffChange = 2;

      const res = await restaurantService.runSimulationWhatIf(id, {
        orderIncrease,
        staffChange,
        discountApplied: weather === 'stormy' ? 0.15 : 0.0
      });

      if (res) {
        setSimResults(res);
        toast.success("Simulation scenario executed!");
      }
    } catch (err) {
      toast.error("Failed to run scenario simulation");
    } finally {
      setSimulatingActive(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-widest animate-pulse">BOOTING DEMAND INTELLIGENCE ENGINE...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black mb-4">Operations Dashboard Offline</h1>
        <p className="text-gray-400 mb-8 max-w-md">No metadata found for restaurant ID {id}.</p>
        <Link to="/admin/restaurants">
          <Button className="bg-cyan-500 text-black font-bold rounded-xl px-8">Return</Button>
        </Link>
      </div>
    );
  }

  // Determine current operating Mode
  let opMode = "NORMAL";
  let opColor = "bg-green-500/10 text-green-400 border-green-500/30";
  const ordersLast15 = twinState?.ordersLast15Minutes || 0;
  if (ordersLast15 > 25) {
    opMode = "CRITICAL SURGE";
    opColor = "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse";
  } else if (ordersLast15 > 15) {
    opMode = "HIGH DEMAND";
    opColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }

  // Map forecast data to Recharts
  const multiHorizonChartData = forecastData.multiHorizon.map(f => {
    let lbl = f.horizon;
    if (lbl === 'NEXT_15_MINUTES') lbl = '15m';
    if (lbl === 'NEXT_30_MINUTES') lbl = '30m';
    if (lbl === 'NEXT_60_MINUTES') lbl = '60m';
    if (lbl === 'NEXT_2_HOURS') lbl = '2h';
    if (lbl === 'NEXT_6_HOURS') lbl = '6h';
    if (lbl === 'NEXT_DAY') lbl = '24h';
    if (lbl === 'NEXT_7_DAYS') lbl = '7d';

    return {
      horizon: lbl,
      predicted: f.predictedOrders,
      confidence: Math.round(f.confidence * 100)
    };
  });

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16">
      
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[400px] h-[150px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/restaurants" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-cyan-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${opColor}`}>
                  {opMode} MODE ACTIVE
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">Real-time Operations Twin</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {restaurant.name} <span className="text-cyan-500 font-light">Demand Operations Cockpit</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Proactive kitchen orchestrator, inventory stockout predictors, prep planners, and what-if simulation suite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRetrain}
              disabled={isTraining}
              className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <RefreshCw size={14} className={isTraining ? 'animate-spin text-cyan-400' : ''} />
              Re-Calculate Models
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        
        {/* ── CORE OPERATIONS SNAPSHOT HUD ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-cyan-500/20"><ShoppingBag size={48} /></div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Active Orders</span>
            <p className="text-2xl font-black text-white mt-1">{twinState?.activeOrders || 0}</p>
            <span className="text-[10px] text-cyan-400 font-semibold block mt-1">{twinState?.ordersLast15Minutes || 0} orders in last 15m</span>
          </div>

          <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-violet-500/20"><Activity size={48} /></div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Kitchen Utilization</span>
            <p className="text-2xl font-black text-violet-400 mt-1">{Math.round((twinState?.kitchenUtilization || 0) * 100)}%</p>
            <span className="text-[10px] text-gray-400 block mt-1">Staff Utilization: {Math.round((twinState?.staffUtilization || 0) * 100)}%</span>
          </div>

          <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-emerald-500/20"><ShieldCheck size={48} /></div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Twin Health Score</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{twinState?.healthScore || 100}/100</p>
            <span className="text-[10px] text-gray-400 block mt-1">SLA Breach Risk: {Math.round((twinState?.slaRisk || 0) * 100)}%</span>
          </div>

          <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-red-500/20"><AlertTriangle size={48} /></div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Inventory Depletion Risk</span>
            <p className="text-2xl font-black text-rose-500 mt-1">{twinState?.inventoryRisk || "LOW"}</p>
            <span className="text-[10px] text-gray-400 block mt-1">Reorder threshold alerts are live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ════ LEFT SECTION: CONTROLS & WHAT-IF SIMULATORS (4 COLS) ════ */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Simulation Controls */}
            <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-5">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sliders size={18} className="text-cyan-400" /> What-If Stress Simulator
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Test spikes and staff rosters virtual scenarios. This computes outputs immediately without impacting live operations.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Demand Stress Spike</label>
                  <select 
                    value={demandFactor} 
                    onChange={(e) => setDemandFactor(e.target.value)}
                    className="w-full bg-black/45 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="standard">Standard Volume</option>
                    <option value="high_surge">+40% Demand Surge</option>
                    <option value="low">-20% Demand Dip</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Festival & Events</label>
                  <select 
                    value={simulationEvent} 
                    onChange={(e) => setSimulationEvent(e.target.value)}
                    className="w-full bg-black/45 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="none">No Event</option>
                    <option value="diwali">🪔 Diwali Surge (+80%)</option>
                    <option value="weekend">🍹 Weekend Rush (+30%)</option>
                    <option value="cricket">🏏 Match Day Snack Attack (+50%)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Staffing Levels</label>
                  <select 
                    value={staffingLevel} 
                    onChange={(e) => setStaffingLevel(e.target.value)}
                    className="w-full bg-black/45 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="optimal">Optimal Roster</option>
                    <option value="understaffed">Understaffed (-2 chefs)</option>
                    <option value="overstaffed">Overstaffed (+2 chefs)</option>
                  </select>
                </div>

                <button 
                  onClick={handleRunSimulation}
                  disabled={simulatingActive}
                  className="w-full bg-cyan-500 text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-400"
                >
                  <Cpu size={14} /> Run Stress Scenario
                </button>
              </div>

              {simResults && (
                <div className="p-4 bg-white/5 border border-cyan-500/25 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Simulated Orders</span>
                    <span className="font-bold text-white">{simResults.predictedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Simulated Revenue</span>
                    <span className="font-bold text-emerald-400">₹{simResults.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Simulated Load</span>
                    <span className="font-bold text-violet-400">{Math.round(simResults.capacityUtilization * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stockout Risk</span>
                    <span className={`font-bold ${simResults.stockoutRisk === 'HIGH' ? 'text-red-500' : 'text-green-500'}`}>{simResults.stockoutRisk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Primary Bottleneck</span>
                    <span className="font-bold text-rose-400">{simResults.primaryBottleneck}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Model Monitoring Accuracy */}
            {monitoringMetrics && (
              <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-400" /> Forecast Accuracy KPI
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Model MAPE Error</span>
                    <span className="font-bold text-white">{monitoringMetrics.mape}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Model Version</span>
                    <span className="font-bold text-cyan-400">{monitoringMetrics.modelVersion}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">Model Drift Status</span>
                    <span className="font-bold text-white">{monitoringMetrics.modelDrift}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">Data pipeline status</span>
                    <span className="font-bold text-emerald-400">{monitoringMetrics.featurePipelineStatus}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════ MIDDLE & RIGHT SECTION: CORE INTELLIGENCE CARDS (8 COLS) ════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* Demand Spike Alerts */}
            {twinState?.inventoryRisk === 'CRITICAL' && (
              <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2.5xl flex items-start gap-4">
                <AlertOctagon className="text-rose-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-black text-rose-500 text-sm">CRITICAL INVENTORY ALERT DETECTED</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Some ingredients will run out within 60 minutes due to higher demand velocity. Active reorder recommendations are loaded in the stock forecast.
                  </p>
                </div>
              </div>
            )}

            {/* Multi-Horizon Demand Graph */}
            {multiHorizonChartData.length > 0 && (
              <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={16} /> Multi-Horizon Demand Projection (15m to 7 days)
                </h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={multiHorizonChartData}>
                      <defs>
                        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                      <XAxis dataKey="horizon" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                      <Area type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={3} fill="url(#projGrad)" name="Predicted Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Kitchen Capacity Predictor & Downstream Bottlenecks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Station utilization */}
              <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="text-amber-500" size={16} /> Kitchen Station Loads
                </h3>
                
                <div className="space-y-3 text-xs">
                  {kitchenCapacity.stations && kitchenCapacity.stations.map((st, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-300">{st.station}</span>
                        <span className="text-[10px] text-gray-400">Util: {Math.round(st.currentUtilization * 100)}% {"→"} Pred: {Math.round(st.predictedUtilization * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${st.risk === 'CRITICAL' ? 'bg-red-500' : st.risk === 'HIGH' ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                          style={{ width: `${Math.round(st.predictedUtilization * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {kitchenCapacity.predictedBottleneck && kitchenCapacity.predictedBottleneck !== 'NONE' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>{kitchenCapacity.predictedBottleneck}</strong> is predicted to bottleneck in {kitchenCapacity.timeToOverload || "14 minutes"}.</span>
                  </div>
                )}
              </div>

              {/* Downstream Bottleneck Cascade Waterfall */}
              <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="text-violet-500" size={16} /> Downstream Delay Cascade
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Waterfall breakdown showing how kitchen overload ripples downstream into delivery SLA delays.
                </p>

                <div className="space-y-3 text-xs">
                  {kitchenCapacity.bottleneckCascade && kitchenCapacity.bottleneckCascade.map((cas, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="h-5 w-5 bg-white/5 border border-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">{i + 1}</span>
                      <div>
                        <h4 className="font-bold text-white text-xs">{cas.step}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{cas.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Prep Planner Panel */}
            <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="text-emerald-400" size={16} /> Proactive Prep Planner
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Configure preparation quantities based on estimated upcoming order volumes to prevent shelf-life waste.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5">Dish</th>
                      <th className="py-2.5">Estimated Orders</th>
                      <th className="py-2.5">Current Prep</th>
                      <th className="py-2.5 text-center">AI Target</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prepPlans.map((plan, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5">
                        <td className="py-3 font-bold text-white">
                          {plan.menuItemName}
                          <span className="text-[9px] block text-gray-400 font-normal">{plan.reason}</span>
                        </td>
                        <td className="py-3 text-gray-300">{plan.predictedDemand} units</td>
                        <td className="py-3 text-gray-300">{plan.currentPrep} units</td>
                        <td className="py-3 text-center font-bold text-cyan-400">
                          {editingPlanId === plan.id ? (
                            <input 
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-16 bg-black/60 border border-cyan-500 rounded p-1 text-center outline-none text-white text-xs font-bold"
                            />
                          ) : (
                            `${plan.recommendedPrep} units`
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {plan.status === 'PENDING' ? (
                            <div className="flex gap-2 justify-end">
                              {editingPlanId === plan.id ? (
                                <>
                                  <button onClick={() => handleSaveEditPlan(plan.id)} className="h-7 w-7 bg-emerald-500 text-black rounded flex items-center justify-center hover:bg-emerald-400"><Check size={14} /></button>
                                  <button onClick={() => setEditingPlanId(null)} className="h-7 w-7 bg-gray-800 text-gray-400 rounded flex items-center justify-center hover:bg-gray-700"><X size={14} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleApprovePlan(plan.id)} className="h-7 w-7 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center justify-center hover:bg-emerald-500 hover:text-black"><Check size={14} /></button>
                                  <button onClick={() => { setEditingPlanId(plan.id); setEditingValue(String(plan.recommendedPrep)); }} className="h-7 w-7 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded flex items-center justify-center hover:bg-cyan-500 hover:text-black"><Edit2 size={14} /></button>
                                  <button onClick={() => handleRejectPlan(plan.id)} className="h-7 w-7 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded flex items-center justify-center hover:bg-rose-500 hover:text-white"><X size={14} /></button>
                                </>
                              )}
                            </div>
                          ) : (
                            <Badge variant={plan.status === 'APPROVED' ? 'success' : plan.status === 'EDITED' ? 'warning' : 'error'}>{plan.status}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ingredient Replenishment & Reorder Forecasts */}
            <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Utensils className="text-cyan-400" size={16} /> Ingredient stock depletion tracker
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventoryForecasts.map((inv, i) => (
                  <div key={i} className="p-4 bg-black/25 border border-gray-800 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-white">{inv.ingredient}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Stock: {inv.currentStock} {inv.unit} · Need: {inv.predictedUsage} {inv.unit}</p>
                      <p className="text-[10px] text-gray-500">Depletion ETA: {inv.expectedDepletionMinutes} mins</p>
                    </div>

                    <div className="text-right space-y-1.5">
                      <Badge variant={inv.risk === 'CRITICAL' ? 'error' : inv.risk === 'HIGH' ? 'warning' : 'success'}>
                        {inv.risk}
                      </Badge>
                      {inv.recommendedReorder > 0 && (
                        <p className="text-[9px] font-bold text-cyan-400">Reorder +{inv.recommendedReorder} units</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Performance Matrix & Cannibalization */}
            <div className="bg-[#111827] border border-gray-850 rounded-3xl p-6 space-y-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="text-violet-400 animate-pulse" size={16} /> Menu Intelligence Matrix & Gaps
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuIntelligence.items && menuIntelligence.items.map((item, i) => (
                  <div key={i} className="p-4 bg-black/25 border border-gray-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white">{item.dish}</h4>
                      <span className="text-[10px] text-violet-400 font-bold">Score: {item.operationalScore}/100</span>
                    </div>
                    <p className="text-[10px] text-cyan-400 font-semibold">{item.matrixClassification}</p>
                    <p className="text-[10px] text-gray-400">{item.recommendation}</p>
                    <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest pt-1 border-t border-gray-800/40">
                      <span>Margin: {item.margin}</span>
                      <span>Prep: {item.prepTime}</span>
                      <span className="text-rose-400">Cancellations: {item.cancellations}</span>
                    </div>
                  </div>
                ))}
              </div>

              {menuIntelligence.cannibalization && menuIntelligence.cannibalization.map((can, i) => (
                <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 flex items-center gap-2">
                  <Info size={14} className="shrink-0" />
                  <span>{can}</span>
                </div>
              ))}

              {menuIntelligence.demandGaps && menuIntelligence.demandGaps.map((gap, i) => (
                <div key={i} className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[11px] text-violet-400 flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDigitalTwin;
