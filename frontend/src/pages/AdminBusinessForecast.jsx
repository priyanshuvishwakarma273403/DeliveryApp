import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Calendar, CloudRain, Sparkles, 
  HelpCircle, ChevronRight, Users, ShieldAlert, DollarSign,
  Briefcase, Percent, BarChart, Server, Activity, Database,
  ArrowDownRight, ArrowUpRight, ShieldCheck, Download, CalendarDays,
  Target, ShoppingBag, MapPin, Sliders, Bell
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

// ── MOCK DATA FOR ENTERPRISE ANALYTICS ──
const PIE_MARKETING_CHART = [
  { name: 'Push Notify CTR', value: 4200, color: '#FC8019' },
  { name: 'Email CTR', value: 1800, color: '#3B82F6' },
  { name: 'Referral Growth', value: 2400, color: '#10B981' }
];

const GEOGRAPHIC_DENSITY = [
  { city: 'Delhi NCR', revenue: '₹14.2L', orders: 8400, density: 'CRITICAL_SURGE' },
  { city: 'Mumbai', revenue: '₹11.8L', orders: 6900, density: 'HIGH' },
  { city: 'Bangalore', revenue: '₹9.4L', orders: 5500, density: 'HIGH' },
  { city: 'Lucknow', revenue: '₹4.1L', orders: 2400, density: 'STANDARD' }
];

const REVENUE_TIMELINE = [
  { hour: '09:00', revenue: 45000, orders: 120 },
  { hour: '12:00', revenue: 120000, orders: 380 },
  { hour: '15:00', revenue: 85000, orders: 210 },
  { hour: '18:00', revenue: 210000, orders: 580 },
  { hour: '21:00', revenue: 295000, orders: 840 }
];

const CUSTOMER_RETENTION = [
  { cohort: 'Month 1', retention: 100 },
  { cohort: 'Month 2', retention: 78 },
  { cohort: 'Month 3', retention: 64 },
  { cohort: 'Month 4', retention: 55 },
  { cohort: 'Month 5', retention: 48 }
];

const AdminBusinessForecast = () => {
  // Role based access filter
  const [selectedRole, setSelectedRole] = useState('CEO'); // CEO, Admin, Finance, Marketing, Operations
  const [dateRange, setDateRange] = useState('today'); // today, week, month, year
  
  // Real-time counter simulation
  const [activeUsers, setActiveUsers] = useState(1420);
  const [liveOrders, setLiveOrders] = useState(84);
  const [serverHealth, setServerHealth] = useState(99.8);

  // Custom Report Builder Form State
  const [reportConfig, setReportConfig] = useState({
    metric: 'revenue',
    format: 'PDF',
    includeTaxes: true
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 9) - 4);
      setLiveOrders(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
      setServerHealth(prev => Math.min(100, Math.max(99.0, prev + (Math.random() * 0.2 - 0.1))));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadReport = () => {
    toast.success(`Exporting customized ${reportConfig.metric.toUpperCase()} report as ${reportConfig.format}. Check downloads directory.`);
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-150 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-violet-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-violet-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-violet-500/10 text-violet-400 border border-violet-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Sparkles size={10} />
                  Enterprise BI & Analytics Hub
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">Real-time WebSocket Sync</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Business Intelligence <span className="text-violet-500 font-light">Matrix</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Tableau-grade data analytics, marketing CTR feeds, geography heatmaps, and financial statements.
              </p>
            </div>
          </div>

          {/* Role selector dropdown */}
          <div className="flex items-center gap-3 bg-[#111827] border border-gray-850 p-2 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">View Persona:</span>
            <div className="flex bg-black/20 p-1 rounded-xl border border-gray-800">
              {['CEO', 'Admin', 'Finance', 'Marketing', 'Operations'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedRole === role ? 'bg-violet-500 text-black shadow-lg shadow-violet-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL-TIME LIVE COCKPIT TELEMETRY ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Active Users</span>
            <p className="text-lg font-black text-white">{activeUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Live Orders</span>
            <p className="text-lg font-black text-emerald-400">{liveOrders} Active</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
            <Server size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Server Health</span>
            <p className="text-lg font-black text-violet-400">{serverHealth.toFixed(2)}% SLA</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-850 rounded-2.5xl p-5 flex items-center gap-4">
          <div className="h-10 w-10 bg-[#FC8019]/10 rounded-xl flex items-center justify-center text-[#FC8019] shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Active WebSockets</span>
            <p className="text-lg font-black text-[#FC8019]">2,840 nodes</p>
          </div>
        </div>
      </div>

      {/* ── CENTRALIZED ANALYTICS CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Panels: Financials, Retention, and Custom Report Forms (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Executive & Financials (Visible to CEO, Admin, Finance) */}
          {(selectedRole === 'CEO' || selectedRole === 'Admin' || selectedRole === 'Finance') && (
            <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <DollarSign className="text-violet-400" size={16} /> Financial Statements & Profit Yields
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#070A13] border border-gray-850 rounded-2xl">
                  <span className="text-[9px] text-gray-500 uppercase">Gross Revenue Today</span>
                  <p className="text-lg font-black text-white mt-1">₹4.85 Lakhs</p>
                </div>
                <div className="p-4 bg-[#070A13] border border-gray-850 rounded-2xl">
                  <span className="text-[9px] text-gray-500 uppercase">Commission Earned</span>
                  <p className="text-lg font-black text-emerald-400 mt-1">₹97,200</p>
                </div>
                <div className="p-4 bg-[#070A13] border border-gray-850 rounded-2xl">
                  <span className="text-[9px] text-gray-500 uppercase">Taxes Collected</span>
                  <p className="text-lg font-black text-violet-400 mt-1">₹24,250</p>
                </div>
              </div>

              {/* Area chart representing revenue peaks */}
              <div className="h-[220px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_TIMELINE}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="hour" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 750 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Customer Retention & Retention cohorts (Visible to CEO, Admin, Marketing) */}
          {(selectedRole === 'CEO' || selectedRole === 'Admin' || selectedRole === 'Marketing') && (
            <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Target className="text-emerald-400" size={16} /> Customer Retention Cohort & Lifetime Value (CLV)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={CUSTOMER_RETENTION}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="cohort" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 750 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                      <Line type="monotone" dataKey="retention" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 font-bold text-xs">
                  <div className="p-3 bg-[#070A13] border border-gray-850 rounded-xl flex justify-between">
                    <span className="text-gray-400">Average Spending / Order</span>
                    <span className="text-white">₹420.00</span>
                  </div>
                  <div className="p-3 bg-[#070A13] border border-gray-850 rounded-xl flex justify-between">
                    <span className="text-gray-400">Customer Lifetime Value (CLV)</span>
                    <span className="text-emerald-400">₹8,450</span>
                  </div>
                  <div className="p-3 bg-[#070A13] border border-gray-850 rounded-xl flex justify-between">
                    <span className="text-gray-400">Customer Churn Rate</span>
                    <span className="text-rose-400">4.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Reports Builder */}
          <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <CalendarDays className="text-cyan-400" size={16} /> Custom Analytics Report Generator
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-400">Metrics Target</label>
                <select 
                  value={reportConfig.metric}
                  onChange={(e) => setReportConfig({ ...reportConfig, metric: e.target.value })}
                  className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none"
                >
                  <option value="revenue">Revenue Breakdown</option>
                  <option value="delivery">Delivery SLA Speed</option>
                  <option value="inventory">Inventory Wastage Cost</option>
                  <option value="marketing">Campaign Conversions</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400">Export Format</label>
                <select 
                  value={reportConfig.format}
                  onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value })}
                  className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none"
                >
                  <option value="PDF">Adobe PDF</option>
                  <option value="Excel">Microsoft Excel (XLSX)</option>
                  <option value="CSV">Comma Separated (CSV)</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleDownloadReport} className="w-full py-3 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Download size={14} /> Download Report
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Panels: Geographic Density, Marketing CTRs, and Fault Alerts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Geographic density map list */}
          <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <MapPin className="text-[#FC8019]" size={16} /> Geographic Density
            </h3>
            
            <div className="space-y-3 font-bold text-xs">
              {GEOGRAPHIC_DENSITY.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#070A13] border border-gray-850 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-white block">{item.city}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{item.orders} orders</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${
                    item.density === 'CRITICAL_SURGE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    item.density === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {item.density}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing Campaign CTRs */}
          <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="text-violet-400" size={16} /> Campaign Analytics
            </h3>
            
            <div className="h-[140px] flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_MARKETING_CHART}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {PIE_MARKETING_CHART.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2 text-[10px] font-bold">
              {PIE_MARKETING_CHART.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-white">{item.value} clicks</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminBusinessForecast;
