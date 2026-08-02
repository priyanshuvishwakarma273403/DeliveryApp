import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, Package, Plus, MoreVertical, 
  Search, LayoutDashboard, Home as HomeIcon, Bell, Cpu, Activity, Leaf, 
  Sliders, Eye, Globe, FlaskConical, Network, Image as ImageIcon, Compass, 
  CloudRain, Building, ShieldCheck, Server, AlertTriangle, ShieldAlert, 
  Terminal, Wifi, Database, Radio, RefreshCw, Layers, CheckCircle2, XCircle,
  Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import apiClient from '../api/axios';

const MOCK_INFRA_HEALTH = [
  { service: "API Gateway", status: "HEALTHY", latency: "14ms", load: "28%" },
  { service: "Primary DB Cluster", status: "HEALTHY", latency: "3ms", load: "42%" },
  { service: "Redis Cache Grid", status: "HEALTHY", latency: "1ms", load: "18%" },
  { service: "Kafka Event Stream", status: "HEALTHY", latency: "8ms", load: "55%" },
  { service: "WebSocket Dispatcher", status: "HEALTHY", latency: "2ms", load: "12%" }
];

const MOCK_SYSTEM_ALERTS = [
  { id: "AL-102", service: "Payment Gateway", msg: "Stripe API latency spike detected (1200ms)", severity: "WARNING", time: "15:08" },
  { id: "AL-103", service: "Auth Service", msg: "Brute-force attempts detected on IP 192.168.1.100", severity: "CRITICAL", time: "15:05" },
  { id: "AL-104", service: "Kitchen Vision", msg: "KDS Screen disconnected at Branch Lucknow-Hazratganj", severity: "INFO", time: "14:58" }
];

const MOCK_LIVE_ORDERS = [
  { id: "OD-4402", customer: "Aditya Roy", restaurant: "Pizza Hut - Connaught Place", rider: "Rider Shiva", value: "₹450.00", status: "OUT_FOR_DELIVERY", eta: "8 mins", priority: "VIP" },
  { id: "OD-4403", customer: "Divya Negi", restaurant: "Bikanervala - Sector 62", rider: "Rider Amit", value: "₹280.00", status: "PREPARING", eta: "15 mins", priority: "EXPRESS" },
  { id: "OD-4404", customer: "Kabir Mehra", restaurant: "Tuscany Grill - Saket", rider: "Unassigned", value: "₹1,200.00", status: "PLACED", eta: "25 mins", priority: "NORMAL" }
];

const CHART_DATA = [
  { day: 'Mon', revenue: 4000, orders: 24, load: 30 },
  { day: 'Tue', revenue: 3000, orders: 13, load: 45 },
  { day: 'Wed', revenue: 2000, orders: 98, load: 60 },
  { day: 'Thu', revenue: 2780, orders: 39, load: 50 },
  { day: 'Fri', revenue: 1890, orders: 48, load: 40 },
  { day: 'Sat', revenue: 6390, orders: 85, load: 75 },
  { day: 'Sun', revenue: 8490, orders: 110, load: 90 },
];

const PIE_DATA = [
  { name: 'Delivered', value: 480, color: '#10B981' },
  { name: 'Preparing', value: 310, color: '#3B82F6' },
  { name: 'Out for Delivery', value: 180, color: '#F59E0B' },
  { name: 'Cancelled', value: 45, color: '#EF4444' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: '8,412',
    totalRevenue: '₹24.5L',
    totalCustomers: '45,820',
    activeRestaurants: '312'
  });
  
  const [activePreset, setActivePreset] = useState('operational'); // operational, infrastructure, security
  const [infraStatus, setInfraStatus] = useState(MOCK_INFRA_HEALTH);
  const [alerts, setAlerts] = useState(MOCK_SYSTEM_ALERTS);
  const [liveOrders, setLiveOrders] = useState(MOCK_LIVE_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Widget customizer preset toggles
  const [widgetsVisibility, setWidgetsVisibility] = useState({
    stats: true,
    trends: true,
    infra: true,
    orders: true,
    alerts: true
  });

  const toggleWidget = (widgetName) => {
    setWidgetsVisibility(prev => ({ ...prev, [widgetName]: !prev[widgetName] }));
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const statsRes = await apiClient.get('/admin/analytics/stats');
        if (statsRes.data?.success) {
          const data = statsRes.data.data;
          setStats({
            totalOrders: data.totalOrders.toLocaleString(),
            totalRevenue: `₹${(data.totalRevenue / 100000).toFixed(1)}L`,
            totalCustomers: data.totalCustomers.toLocaleString(),
            activeRestaurants: data.activeRestaurants.toLocaleString()
          });
        }
      } catch (error) {
        console.error('Failed to sync real-time stats:', error);
      }
    };
    fetchRealData();
  }, []);

  return (
    <div className="min-h-screen bg-[#070A13] text-[#E2E8F0] font-sans flex flex-col lg:flex-row">
      
      {/* ── SIDEBAR CONTROL NAV ── */}
      <aside className="w-full lg:w-80 bg-[#0F1524] border-r border-gray-850 p-6 lg:sticky lg:top-0 h-auto lg:h-screen overflow-y-auto space-y-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl text-white shadow-lg shadow-primary/30">
            <span className="font-black text-xl tracking-tighter">F</span>
          </div>
          <div>
            <h2 className="text-base font-black text-white">FoodIQ Command</h2>
            <span className="text-[9px] text-[#FC8019] font-black uppercase tracking-widest bg-[#FC8019]/10 px-2 py-0.5 rounded-lg border border-[#FC8019]/20">Mission Control</span>
          </div>
        </div>

        <nav className="space-y-1">
          <Link to="/admin" className="flex items-center gap-3.5 text-primary font-black bg-primary/5 p-3.5 rounded-2xl border border-primary/10">
            <LayoutDashboard size={18} /> Command Center
          </Link>
          <Link to="/admin/restaurants" className="flex items-center gap-3.5 text-gray-400 font-bold hover:text-white hover:bg-white/5 p-3.5 rounded-2xl transition-all">
            <Package size={18} /> Restaurants
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3.5 text-gray-400 font-bold hover:text-white hover:bg-white/5 p-3.5 rounded-2xl transition-all">
            <ShoppingBag size={18} /> Manage Orders
          </Link>
          <Link to="/admin/iam" className="flex items-center gap-3.5 text-rose-500 font-black hover:text-rose-450 bg-rose-500/5 p-3.5 rounded-2xl border border-rose-500/10 transition-all">
            <ShieldCheck size={18} /> IAM & Security
          </Link>
          <Link to="/admin/copilot" className="flex items-center gap-3.5 text-cyan-500 font-black hover:text-cyan-400 bg-cyan-500/5 p-3.5 rounded-2xl border border-cyan-500/10 transition-all">
            <Cpu size={18} /> AI Copilot
          </Link>
          <Link to="/admin/ops" className="flex items-center gap-3.5 text-violet-500 font-black hover:text-violet-400 bg-violet-500/5 p-3.5 rounded-2xl border border-violet-500/10 transition-all">
            <Activity size={18} /> AI Ops Control
          </Link>
          <Link to="/admin/supply-waste" className="flex items-center gap-3.5 text-emerald-500 font-black hover:text-emerald-400 bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/10 transition-all">
            <Leaf size={18} /> Supply & Waste
          </Link>
          <Link to="/admin/simulations" className="flex items-center gap-3.5 text-amber-500 font-black hover:text-amber-400 bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/10 transition-all">
            <Sliders size={18} /> AI Simulations
          </Link>
          <Link to="/admin/restaurant-cockpit" className="flex items-center gap-3.5 text-teal-500 font-black hover:text-teal-400 bg-teal-500/5 p-3.5 rounded-2xl border border-teal-500/10 transition-all">
            <Building size={18} /> Restaurant Cockpit
          </Link>

          <div className="pt-6 mt-6 border-t border-gray-800">
            <Link to="/" className="flex items-center gap-3.5 text-gray-400 font-bold hover:text-white p-3.5 rounded-2xl transition-all">
              <HomeIcon size={18} /> Exit Command Center
            </Link>
          </div>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-hidden space-y-8">
        
        {/* Top Header telemetry */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-gray-850">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">System Command Center</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Real-time status updates across database, transactions, orders, and telemetry streams.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Presets selectors */}
            <div className="flex bg-[#0F1524] p-1 rounded-xl border border-gray-800">
              {['operational', 'infrastructure', 'security'].map(p => (
                <button
                  key={p}
                  onClick={() => setActivePreset(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    activePreset === p ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Customizer dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="p-3 bg-[#0F1524] hover:bg-gray-800 border border-gray-800 rounded-xl relative"
              >
                <Bell size={16} />
                <span className="absolute -top-1 -right-1 bg-[#FC8019] text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center">3</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── GLOBAL TELEMETRY STATS WIDGETS ── */}
        {widgetsVisibility.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Revenue Today", val: stats.totalRevenue, change: "+8.2%", icon: DollarSign, color: "text-green-500 bg-green-500/10 border-green-500/20" },
              { title: "Live Orders", val: stats.totalOrders, change: "+12.5%", icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
              { title: "Platform Users", val: stats.totalCustomers, change: "+15.3%", icon: Users, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
              { title: "Avg Delivery Time", val: "24.8m", change: "-4.1%", icon: Clock, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" }
            ].map((card, idx) => (
              <div key={idx} className="bg-[#0F1524] p-6 rounded-[2rem] border border-gray-850 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 h-20 w-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px]`} />
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${card.color} mb-4 shadow-sm`}>
                  <card.icon size={20} />
                </div>
                <h3 className="text-2xl font-black text-white mb-1">{card.val}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  {card.title} <span className="text-green-400 font-black">{card.change}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── DUAL COLUMN DASHBOARD ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Charts and Order Logs */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Real-time Order and Load Trends */}
            {widgetsVisibility.trends && (
              <div className="bg-[#0F1524] p-6 md:p-8 rounded-[2.5rem] border border-gray-850 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Activity className="text-primary" size={16} /> Live Orders & Node Workload Stream
                  </h3>
                  <div className="flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-black uppercase">Socket Connected</span>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FC8019" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#FC8019" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="day" stroke="#4B5563" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis stroke="#4B5563" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F1524', borderColor: '#1F2937' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#FC8019" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Live Order Roster */}
            {widgetsVisibility.orders && (
              <div className="bg-[#0F1524] p-6 md:p-8 rounded-[2.5rem] border border-gray-850 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Live Platform Order Board</h3>
                  <span className="text-[10px] text-gray-500 font-bold">Showing 3 active transfers</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400">
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Order ID</th>
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Customer</th>
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Restaurant</th>
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Rider</th>
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Amount</th>
                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {liveOrders.map(order => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-white font-black">{order.id}</td>
                          <td className="py-4 text-gray-300">{order.customer}</td>
                          <td className="py-4 text-gray-400">{order.restaurant}</td>
                          <td className="py-4 text-gray-300">{order.rider}</td>
                          <td className="py-4 text-primary">{order.value}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              order.status === 'OUT_FOR_DELIVERY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              order.status === 'PREPARING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Column 3: Tech Infrastructure Health & Real-time Alerts */}
          <div className="space-y-6">
            
            {/* Tech Infra Health */}
            {widgetsVisibility.infra && (
              <div className="bg-[#0F1524] p-6 rounded-[2.5rem] border border-gray-850 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Server className="text-cyan-500" size={16} /> Tech Infrastructure Node Health
                </h3>
                
                <div className="space-y-4">
                  {infraStatus.map((service, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-300">{service.service}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold">{service.latency}</span>
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        </div>
                      </div>
                      
                      {/* Load progress bar */}
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: service.load }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert Center */}
            {widgetsVisibility.alerts && (
              <div className="bg-[#0F1524] p-6 rounded-[2.5rem] border border-gray-850 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <ShieldAlert className="text-rose-500 animate-pulse" size={16} /> Threat & Fault Alerts
                </h3>

                <div className="space-y-3 font-bold text-[11px]">
                  {alerts.map(al => (
                    <div key={al.id} className={`p-3 border rounded-xl flex gap-2.5 ${
                      al.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                      al.severity === 'WARNING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                      'bg-blue-500/5 border-blue-500/20 text-blue-500'
                    }`}>
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <div className="flex justify-between items-center w-full">
                          <span className="font-black text-xs">{al.service}</span>
                          <span className="text-[9px] text-gray-500">{al.time}</span>
                        </div>
                        <p className="mt-1 leading-tight text-gray-300 text-[10px]">{al.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
