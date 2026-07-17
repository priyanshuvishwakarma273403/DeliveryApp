import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Leaf, ShoppingBag, AlertTriangle, ShieldAlert, 
  TrendingDown, RefreshCw, BarChart3, Truck, PackageCheck, 
  Trash2, Sparkles, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

const AdminSupplyWaste = () => {
  const [activeTab, setActiveTab] = useState('supply'); // supply, waste
  const [autoReorder, setAutoReorder] = useState(true);

  // Supply inventory data
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Mozzarella Cheese', stock: 12, unit: 'kg', minLimit: 20, consumption: '4.5 kg/day', forecastShortage: '2 days', supplierRisk: 'LOW', recommendPO: 50 },
    { id: 2, name: 'Fresh Paneer', stock: 5, unit: 'kg', minLimit: 8, consumption: '3.2 kg/day', forecastShortage: '1 day', supplierRisk: 'MEDIUM', recommendPO: 25 },
    { id: 3, name: 'Basmati Rice', stock: 120, unit: 'kg', minLimit: 50, consumption: '15.0 kg/day', forecastShortage: '8 days', supplierRisk: 'LOW', recommendPO: 100 },
    { id: 4, name: 'Chicken Breast', stock: 8, unit: 'kg', minLimit: 15, consumption: '9.5 kg/day', forecastShortage: '12 hours', supplierRisk: 'HIGH (Transit Delay)', recommendPO: 40 },
    { id: 5, name: 'Refined Flour', stock: 150, unit: 'kg', minLimit: 80, consumption: '22.0 kg/day', forecastShortage: '6 days', supplierRisk: 'LOW', recommendPO: 120 }
  ]);

  // Waste logs & analytics data
  const wasteData = [
    { name: 'Prep Waste (Trimmings)', value: 42, color: '#10b981' },
    { name: 'Unsold Spoilage', value: 38, color: '#f59e0b' },
    { name: 'Customer Leftovers', value: 20, color: '#ef4444' }
  ];

  // Simulated chart for consumption forecasting
  const forecastChartData = [
    { day: 'Mon', Actual: 60, Projected: 62 },
    { day: 'Tue', Actual: 58, Projected: 64 },
    { day: 'Wed', Actual: 72, Projected: 70 },
    { day: 'Thu', Actual: 68, Projected: 75 },
    { day: 'Fri', Actual: 85, Projected: 90 },
    { day: 'Sat', Actual: null, Projected: 110 },
    { day: 'Sun', Actual: null, Projected: 105 }
  ];

  const handleTriggerPO = (ingredient, qty) => {
    toast.success(`Purchase Order generated: ${qty} units of ${ingredient}`);
  };

  const handleApplyWasteOptimization = () => {
    toast.success("AI portion scaling applied. Future prep waste estimated to drop by 15%.");
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-emerald-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Leaf size={10} />
                  AI Green Intelligence Engine
                </span>
                <span className="text-gray-500 text-xs font-bold">Carbon & Waste Verified</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Supply Chain & <span className="text-emerald-500 font-light">Waste Intel</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Predictive ingredient shortages, supplier risk metrics, and portion waste minimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111827] border border-gray-800 p-2 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Auto-PO Reorders:</span>
            <button
              onClick={() => setAutoReorder(!autoReorder)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                autoReorder ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-gray-850 text-gray-400'
              }`}
            >
              {autoReorder ? 'ACTIVE' : 'SUSPENDED'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTIONS NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="flex border-b border-gray-800 gap-6 mb-8">
          {[
            { id: 'supply', label: 'AI Supply Chain & Forecasts', desc: 'Stock prediction & PO reorders' },
            { id: 'waste', label: 'AI Food Waste Analytics', desc: 'Portion optimizer & spoilage logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-left border-b-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'border-emerald-500 text-white' 
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
            
            {/* ════ MODULE 1: AI SUPPLY CHAIN FORECASTS ════ */}
            {activeTab === 'supply' && (
              <div className="space-y-6">
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Truck className="text-emerald-400" size={20} />
                        Predictive Shortage Monitor
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5">Ingredients tracking using real-time dining/order forecasting</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-850 text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                          <th className="pb-4">Ingredient</th>
                          <th className="pb-4">Current Stock</th>
                          <th className="pb-4">Est. Shortage In</th>
                          <th className="pb-4">Supplier Risk</th>
                          <th className="pb-4">AI Recommended PO</th>
                          <th className="pb-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {inventory.map(item => {
                          const isLow = item.stock <= item.minLimit;
                          return (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 font-bold text-white flex items-center gap-2">
                                {isLow && <AlertTriangle className="text-rose-500 shrink-0" size={14} />}
                                {item.name}
                              </td>
                              <td className="py-4 font-bold text-gray-300">
                                <span className={isLow ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                                  {item.stock} {item.unit}
                                </span>
                                <span className="text-gray-500 font-medium block text-[10px]">Min: {item.minLimit} {item.unit}</span>
                              </td>
                              <td className="py-4 text-gray-300 font-bold">
                                {item.forecastShortage}
                                <span className="text-gray-500 font-medium block text-[10px]">{item.consumption}</span>
                              </td>
                              <td className="py-4 font-bold">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  item.supplierRisk.startsWith('HIGH') ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                                  item.supplierRisk.startsWith('MEDIUM') ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {item.supplierRisk}
                                </span>
                              </td>
                              <td className="py-4 font-black text-emerald-400">+{item.recommendPO} {item.unit}</td>
                              <td className="py-4 text-right">
                                <Button 
                                  onClick={() => handleTriggerPO(item.name, item.recommendPO)}
                                  className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black rounded-lg uppercase tracking-wider"
                                >
                                  Order Now
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supply Forecast Chart */}
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Aggregate Consumption & Projected Surge</h4>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastChartData}>
                        <XAxis dataKey="day" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="Actual" stroke="#10b981" fillOpacity={0.1} fill="url(#colorActual)" />
                        <Area type="monotone" dataKey="Projected" stroke="#3b82f6" fillOpacity={0.1} fill="url(#colorProjected)" />
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ════ MODULE 2: AI FOOD WASTE ANALYTICS ════ */}
            {activeTab === 'waste' && (
              <div className="space-y-6">
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left Pie chart */}
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                      <Trash2 className="text-rose-400" size={20} />
                      Kitchen Waste Diagnostics
                    </h3>
                    <p className="text-gray-400 text-xs mb-6">Percentage breakdown of ingredient losses and preparation waste</p>
                    
                    <div className="h-[200px] flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={wasteData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {wasteData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right diagnostics info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Waste Log Insights</h4>
                    
                    <div className="space-y-3">
                      {wasteData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-black/20 p-3.5 rounded-xl border border-gray-850">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-white">{item.name}</span>
                          </div>
                          <span className="text-xs font-black text-gray-300">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Portions Optimizer block */}
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="text-emerald-400" size={20} />
                      AI Portion & Purchase Optimizer
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">Automated recommendations targeting expired inventory and customer leftovers</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 border border-gray-850 rounded-2.5xl space-y-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Leftover Minimization</span>
                      <h4 className="text-sm font-bold text-white">Scale down Rice Biryani portions by 15%</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Data shows customers consistently leave 22% of large Biryani portions untouched. Scale down size, lowering menu price by ₹20 and ingredient prep waste by 18%.
                      </p>
                    </div>

                    <div className="p-5 bg-white/5 border border-gray-850 rounded-2.5xl space-y-2">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Expired Inventory Alert</span>
                      <h4 className="text-sm font-bold text-white">Surge discount on Paneer Sides</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        3.5 kg of fresh paneer will reach expiry within 24 hours. Suggest generating smart paneer combos for the lunch rush to clear inventory.
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleApplyWasteOptimization} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl">
                    Apply Recommended Scaling
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Right Supply PO Alerts Feed (4 Cols) */}
          <div className="lg:col-span-4 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[500px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Zap className="text-emerald-400" size={16} />
              Supply Alert Broadcasts
            </h3>
            
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar">
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-rose-400 font-black">CRITICAL SHORTAGE</span>
                  <span className="text-gray-500">14:26</span>
                </div>
                <p className="text-gray-300">Chicken breast stock is 8kg (Safety limit: 15kg). Consumption peak forecast: 19:30 Dinner rush.</p>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-amber-400 font-black">SUPPLIER TRANSIT RISK</span>
                  <span className="text-gray-500">14:15</span>
                </div>
                <p className="text-gray-300">National highway blockade has delayed Express Distributors truck. Cheese handoff delayed by 4.5 hours.</p>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-emerald-400 font-black">AUTO-PO SENT</span>
                  <span className="text-gray-500">12:00</span>
                </div>
                <p className="text-gray-300">Auto-Pilot successfully dispatched Purchase Order #8493 for 120kg Refined Flour to Metro Wholesalers.</p>
              </div>
            </div>
            
            <div className="border-t border-gray-850 pt-4 mt-4 text-center">
              <span className="text-[10px] font-bold text-gray-500">
                Connected to GreenChain Node 4.2
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSupplyWaste;
