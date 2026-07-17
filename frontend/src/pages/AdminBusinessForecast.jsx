import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Calendar, CloudRain, Sparkles, 
  HelpCircle, ChevronRight, Users, ShieldAlert, DollarSign,
  Briefcase, Percent, BarChart
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart as RechartsBarChart, Bar
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const AdminBusinessForecast = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Q3'); // Q3, Q4, FY27
  const [weatherFactor, setWeatherFactor] = useState('Rainy Surge'); // Clear, Rainy Surge, Extreme Heat
  const [festivalMode, setFestivalMode] = useState('Diwali Peak'); // None, Diwali Peak, Eid Surge, New Year

  // AI-predicted monthly charts
  const forecastData = [
    { month: 'Jul', Revenue: 4200000, Profit: 1250000, StaffNeeded: 45, Orders: 18000 },
    { month: 'Aug', Revenue: 4600000, Profit: 1380000, StaffNeeded: 48, Orders: 20000 },
    { month: 'Sep', Revenue: 5100000, Profit: 1530000, StaffNeeded: 52, Orders: 23000 },
    { month: 'Oct', Revenue: 6800000, Profit: 2100000, StaffNeeded: 68, Orders: 32000 },
    { month: 'Nov', Revenue: 7200000, Profit: 2300000, StaffNeeded: 72, Orders: 35000 },
    { month: 'Dec', Revenue: 8500000, Profit: 2750000, StaffNeeded: 85, Orders: 42000 }
  ];

  // Modify projections based on factors chosen
  const getAdjustedStats = () => {
    let multiplier = 1.0;
    if (weatherFactor === 'Rainy Surge') multiplier += 0.15;
    if (weatherFactor === 'Extreme Heat') multiplier -= 0.05;
    if (festivalMode === 'Diwali Peak') multiplier += 0.35;
    if (festivalMode === 'Eid Surge') multiplier += 0.25;
    if (festivalMode === 'New Year') multiplier += 0.30;

    return {
      revenue: Math.round(36400000 * multiplier),
      orders: Math.round(170000 * multiplier),
      staff: Math.round(62 * multiplier),
      profit: Math.round(11280000 * multiplier)
    };
  };

  const stats = getAdjustedStats();

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      
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
                  AI Business Forecasting Engine
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">Model V4.8 Activated</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Predictive Business <span className="text-violet-500 font-light">Forecaster</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Simulate revenue, weather impacts, festival demand, and staffing needs for upcoming quarters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN DASHBOARD CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters / Sim Toggles (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Calendar size={16} className="text-violet-400" />
              Simulation Factors
            </h3>

            {/* Timeframe selector */}
            <div className="space-y-4 mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Forecast Period</label>
              <div className="grid grid-cols-3 gap-2">
                {['Q3', 'Q4', 'FY27'].map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      selectedPeriod === period 
                        ? 'bg-violet-500 text-black shadow-lg shadow-violet-500/20' 
                        : 'bg-black/20 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Factor toggles */}
            <div className="space-y-4 mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Weather Influence</label>
              <div className="space-y-2">
                {['Clear', 'Rainy Surge', 'Extreme Heat'].map(w => (
                  <button
                    key={w}
                    onClick={() => setWeatherFactor(w)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex justify-between items-center ${
                      weatherFactor === w 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30' 
                        : 'bg-black/10 text-gray-450 border border-gray-850 hover:bg-black/25'
                    }`}
                  >
                    <span>{w}</span>
                    <span className="text-[9px] font-medium text-gray-500">
                      {w === 'Rainy Surge' ? '+15% Soup/Tea' : w === 'Extreme Heat' ? '-5% hot meals' : 'Neutral'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Festival peak modifier */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Festival Surge Impact</label>
              <div className="space-y-2">
                {['None', 'Diwali Peak', 'Eid Surge', 'New Year'].map(fest => (
                  <button
                    key={fest}
                    onClick={() => setFestivalMode(fest)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex justify-between items-center ${
                      festivalMode === fest 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30' 
                        : 'bg-black/10 text-gray-450 border border-gray-850 hover:bg-black/25'
                    }`}
                  >
                    <span>{fest}</span>
                    <span className="text-[9px] font-medium text-gray-500">
                      {fest === 'Diwali Peak' ? '+35% Dessert/Biryani' : fest === 'Eid Surge' ? '+25% Platters' : 'Neutral'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable AI Block (Requirement 24) */}
          <div className="bg-[#111827]/90 border border-gray-850 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <HelpCircle className="text-violet-400" size={14} />
              Explainable AI Trace
            </h4>
            <div className="text-[11px] leading-relaxed text-gray-400 space-y-3">
              <p>
                <strong>Why did AI forecast ₹{(stats.revenue / 10000000).toFixed(2)}Cr in Revenue?</strong>
              </p>
              <p className="bg-[#070A13]/50 p-3 rounded-xl border border-gray-800">
                1. <strong>Baseline demand:</strong> Historical ordering trend predicts 142,000 orders.<br/>
                2. <strong>Festival weight:</strong> Diwali event adds a 35% compound weight for sweets, snacks, and catering.<br/>
                3. <strong>Weather weight:</strong> Rainy conditions lock in +15% delivery volume over dining out.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Projections & Chart (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-gray-800 rounded-2.5xl p-5">
              <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Projected Revenue</span>
              <p className="text-xl font-black text-white mt-1">₹{(stats.revenue / 100000).toFixed(1)} Lakhs</p>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2.5xl p-5">
              <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Estimated Orders</span>
              <p className="text-xl font-black text-violet-400 mt-1">{stats.orders.toLocaleString()}</p>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2.5xl p-5">
              <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Required Staff</span>
              <p className="text-xl font-black text-emerald-400 mt-1">{stats.staff} Personnel</p>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2.5xl p-5">
              <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Net Profit (AI Est.)</span>
              <p className="text-xl font-black text-white mt-1">₹{(stats.profit / 100000).toFixed(1)}L</p>
            </div>
          </div>

          {/* Area Chart visualization */}
          <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BarChart className="text-violet-400" size={20} />
                  Revenue & Staff Allocation Projections
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">Estimated staff schedules matched against revenue volume peaks</p>
              </div>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminBusinessForecast;
