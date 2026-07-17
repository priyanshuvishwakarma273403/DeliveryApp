import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, Shield, MapPin, Users, Flame, Navigation, 
  TrendingUp, RefreshCw, AlertTriangle, Zap, CheckCircle2, 
  Layers, Settings, Play, Pause, ChevronRight, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

const AdminOpsCenter = () => {
  // Autopilot status
  const [autoPilot, setAutoPilot] = useState(true);
  const [simulationHour, setSimulationHour] = useState(1); // 1hr, 2hr, 4hr forecasts
  const [activeTab, setActiveTab] = useState('orders'); // orders, map, kitchen

  // Telemetry log feeds
  const [opsLogs, setOpsLogs] = useState([
    { id: 1, time: '14:24:10', type: 'INFO', text: 'Autonomous pilot initialized.' },
    { id: 2, time: '14:24:15', type: 'SUCCESS', text: 'Optimal chef assignment locked: Chef A assigned to Order #3290 (Italian specialist).' },
    { id: 3, time: '14:24:22', type: 'LOGISTICS', text: 'Rider Kabir assigned to Order #3290. Distance: 1.2km. ETA: 8m.' },
    { id: 4, time: '14:24:35', type: 'WARNING', text: 'Bypass Road traffic congestion detected (+8 min transit latency). Auto-routing Order #3285 via Sector 62.' }
  ]);

  // Autopilot loop simulation
  useEffect(() => {
    if (!autoPilot) return;

    const interval = setInterval(() => {
      const timestamp = new Date().toTimeString().split(' ')[0];
      const logTemplates = [
        { type: 'SUCCESS', text: 'Cooking priority updated: Order #3295 bumped up in queue due to delivery courier location lock.' },
        { type: 'LOGISTICS', text: 'Best-suited driver selected: Rider Anita assigned to Order #3298. GPS proximity verified.' },
        { type: 'WARNING', text: 'Kitchen load imbalance: Chef A at 92% capacity. Dynamic reassignment of Order #3301 to Chef B.' },
        { type: 'INFO', text: 'Heat Map model recalculated: Rain surge in Sector 62 driving 35% higher delivery demands.' },
        { type: 'SUCCESS', text: 'Route optimization resolved: Saved 4.2 mins for Order #3292 via Sector 18 bypass.' }
      ];

      const selectedTemplate = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setOpsLogs(prev => [
        { id: Date.now(), time: timestamp, ...selectedTemplate },
        ...prev.slice(0, 7)
      ]);

      if (selectedTemplate.type === 'WARNING') {
        toast('AI Optimizer balanced kitchen tasks', { icon: '🤖' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPilot]);

  // Simulated orders queue for Autonomous Assignment
  const [activeQueue, setActiveQueue] = useState([
    { 
      id: '3290', 
      customer: 'Priyanshu V.', 
      items: '1x Veg Burger, 1x Fries', 
      chef: 'Chef A (Burger Specialist)', 
      rider: 'Rider Kabir', 
      route: 'Sector 62 (Saved 8m)', 
      delayRisk: 'LOW', 
      priority: 'CRITICAL',
      status: 'PREPARING'
    },
    { 
      id: '3292', 
      customer: 'Neha Sharma', 
      items: '1x Paneer Tikka Pizza', 
      chef: 'Chef B (Pizza Specialist)', 
      rider: 'Rider Anita', 
      route: 'Sector 18 Bypass (Saved 4m)', 
      delayRisk: 'LOW', 
      priority: 'HIGH',
      status: 'CONFIRMED'
    },
    { 
      id: '3295', 
      customer: 'Aman Verma', 
      items: '2x Butter Chicken, 3x Naan', 
      chef: 'Chef C (Trainee)', 
      rider: 'Re-assigning (Searching)', 
      route: 'Link Road (Standard)', 
      delayRisk: 'MEDIUM', 
      priority: 'STANDARD',
      status: 'PLACED'
    }
  ]);

  // Simulated Kitchen workloads
  const chefWorkloadData = [
    { name: 'Chef A', Load: 92, status: 'Overloaded', color: '#ef4444' },
    { name: 'Chef B', Load: 65, status: 'Optimal', color: '#10b981' },
    { name: 'Chef C', Load: 25, status: 'Under-utilized', color: '#06b6d4' }
  ];

  // AI Demand Heat Map zones (Noida / Delhi simulation)
  const heatMapZones = [
    { name: 'Sector 62', demand: 'CRITICAL SURGE', expectedOrders: 145, ridersAlloc: 18, rating: 4.8, statusColor: 'border-rose-500 bg-rose-500/10 text-rose-400' },
    { name: 'Sector 18', demand: 'HIGH DEMAND', expectedOrders: 92, ridersAlloc: 12, rating: 4.5, statusColor: 'border-amber-500 bg-amber-500/10 text-amber-400' },
    { name: 'Indirapuram', demand: 'STANDARD', expectedOrders: 48, ridersAlloc: 6, rating: 4.2, statusColor: 'border-cyan-500 bg-cyan-500/10 text-cyan-400' },
    { name: 'Vasundhara', demand: 'LOW DEMAND', expectedOrders: 15, ridersAlloc: 2, rating: 4.6, statusColor: 'border-gray-800 bg-gray-900/40 text-gray-500' },
    { name: 'Sector 15', demand: 'HIGH DEMAND', expectedOrders: 84, ridersAlloc: 10, rating: 4.7, statusColor: 'border-amber-500 bg-amber-500/10 text-amber-400' },
    { name: 'Noida Expressway', demand: 'STANDARD', expectedOrders: 56, ridersAlloc: 8, rating: 4.1, statusColor: 'border-cyan-500 bg-cyan-500/10 text-cyan-400' },
  ];

  const handleForceBalancing = () => {
    toast.success("AI redistribution protocol executed. Workloads stabilized.");
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-cyan-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  Auto-Pilot Systems Active
                </span>
                <span className="text-gray-500 text-xs font-bold">Vite Server Push Synced</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                AI Operations <span className="text-cyan-500 font-light">Command Center</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Autonomous order dispatch, live demand heat maps, and kitchen workload balancing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111827] border border-gray-800 p-2 rounded-2xl">
            <button
              onClick={() => setAutoPilot(true)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                autoPilot ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Play size={12} /> Auto-Pilot
            </button>
            <button
              onClick={() => setAutoPilot(false)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                !autoPilot ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Pause size={12} /> Suspended
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTIONS NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="flex border-b border-gray-800 gap-6 mb-8">
          {[
            { id: 'orders', label: 'Autonomous Order Management', desc: 'Auto-dispatch dispatch queue' },
            { id: 'map', label: 'AI Demand Heat Map', desc: 'City-wide forecast zones' },
            { id: 'kitchen', label: 'AI Kitchen Optimizer', desc: 'Workload & prep queue monitoring' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-left border-b-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'border-cyan-500 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <h3 className="text-sm font-black tracking-wide uppercase">{tab.label}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{tab.desc}</p>
            </button>
          ))}
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Module Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ════ MODULE 1: AUTONOMOUS ORDER DISPATCH ════ */}
            {activeTab === 'orders' && (
              <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Zap className="text-cyan-400" size={20} />
                      Autonomous Dispatch Queue
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">Real-time task dispatching without manager intervention</p>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-cyan-500/20">
                    Live Syncing
                  </span>
                </div>

                <div className="space-y-4">
                  {activeQueue.map(order => (
                    <div key={order.id} className="p-5 bg-white/5 border border-gray-800 hover:border-cyan-500/30 rounded-2xl transition-all relative group">
                      <div className="absolute top-0 right-0 h-full w-1.5 bg-cyan-500 rounded-r-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-white">Order #{order.id}</span>
                          <span className="text-xs text-gray-400">· {order.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.priority === 'CRITICAL' ? 'error' : order.priority === 'HIGH' ? 'warning' : 'info'} className="text-[9px] font-black tracking-widest">
                            {order.priority}
                          </Badge>
                          <Badge variant="success" className="text-[9px] font-black tracking-widest">
                            AUTO-ASSIGNED
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Menu items</span>
                          <p className="text-white font-bold mt-0.5 truncate">{order.items}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Chef Assigned</span>
                          <p className="text-cyan-400 font-bold mt-0.5 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            {order.chef}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Delivery Partner</span>
                          <p className="text-white font-bold mt-0.5 flex items-center gap-1">
                            <Navigation size={10} className="text-cyan-400" />
                            {order.rider}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Optimized Route</span>
                          <p className="text-green-400 font-bold mt-0.5 truncate">{order.route}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ MODULE 2: AI DEMAND HEAT MAP ════ */}
            {activeTab === 'map' && (
              <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Layers className="text-cyan-400" size={20} />
                      Live City Demand Zones
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">Simulating demand surges and allocating courier partners proactively</p>
                  </div>

                  {/* Hour Simulation Slider */}
                  <div className="flex items-center gap-4 bg-white/5 border border-gray-800 px-4 py-2.5 rounded-2xl">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Forecast:</span>
                    <div className="flex gap-2">
                      {[1, 2, 4].map(h => (
                        <button
                          key={h}
                          onClick={() => setSimulationHour(h)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                            simulationHour === h 
                              ? 'bg-cyan-500 text-black' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          +{h}hr
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heat Map Grid simulation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {heatMapZones.map((zone, i) => (
                    <div key={i} className={`p-5 rounded-2xl border transition-all ${zone.statusColor}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-black text-sm text-white">{zone.name}</h4>
                        <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-black/20 rounded-full border border-current">
                          {zone.demand}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-black/25 rounded-xl p-2.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Orders</span>
                          <p className="text-white font-black mt-0.5">{Math.round(zone.expectedOrders * (simulationHour === 2 ? 1.3 : simulationHour === 4 ? 1.6 : 1))}</p>
                        </div>
                        <div className="bg-black/25 rounded-xl p-2.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Need Rider</span>
                          <p className="text-white font-black mt-0.5">{Math.round(zone.ridersAlloc * (simulationHour === 2 ? 1.25 : simulationHour === 4 ? 1.5 : 1))}</p>
                        </div>
                        <div className="bg-black/25 rounded-xl p-2.5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">AOD Rating</span>
                          <p className="text-white font-black mt-0.5">{zone.rating}★</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dispatch Suggestion Info banner */}
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="text-cyan-400" size={20} />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong>AI Recommendation:</strong> Relocate <strong>6 delivery riders</strong> from <em>Vasundhara</em> zone to <em>Sector 62</em> zone to handle the rain-induced surge forecast in the next 60 minutes.
                  </p>
                </div>
              </div>
            )}

            {/* ════ MODULE 3: AI KITCHEN OPTIMIZER ════ */}
            {activeTab === 'kitchen' && (
              <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Flame className="text-cyan-400" size={20} />
                    AI Kitchen Dispatch & Capacity Optimizer
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">Workload status, bottleneck projection, and queue order re-sorting recommendations</p>
                </div>

                {/* Chef Workload Bar chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="bg-black/20 p-6 rounded-2.5xl border border-gray-800">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Chef Active Workloads</h4>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chefWorkloadData}>
                          <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                          <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                          <Bar dataKey="Load" radius={[8, 8, 0, 0]}>
                            {chefWorkloadData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Active Bottlenecks & Prep Queue Sorting */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Kitchen Bottleneck Forecast</h4>
                    
                    <div className="p-4 bg-rose-500/5 border border-rose-500/30 text-rose-400 rounded-2xl flex items-start gap-3">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-white">Stove station 3 overheat anomaly</h5>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          Causing a 12% capacity lag. Reroute pan-fried items to Assembly Station 2 to avoid order backlog.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-start gap-3">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-white">Optimal Cook-Order Re-sequence</h5>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          Auto-prioritize Order #3292 paneer pizza prep before #3295 dessert plating to clear double oven slots.
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleForceBalancing} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl">
                      Rebalance Workloads Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Real-time Simulation Telemetry Log (4 Cols) */}
          <div className="lg:col-span-4 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[520px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Cpu className="text-cyan-400" size={16} />
              AI Automation Telemetry Logs
            </h3>
            
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar">
              <AnimatePresence initial={false}>
                {opsLogs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-black/45 border border-gray-850 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[9px] font-bold">{log.time}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        log.type === 'SUCCESS' ? 'text-green-400' :
                        log.type === 'WARNING' ? 'text-rose-400' :
                        log.type === 'LOGISTICS' ? 'text-cyan-400' : 'text-gray-400'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{log.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="border-t border-gray-850 pt-4 mt-4 flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Auto-Pilot Status</span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping" />
                ACTIVE & LEARNING
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOpsCenter;
