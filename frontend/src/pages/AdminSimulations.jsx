import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Cpu, Activity, Clock, Users, ShieldAlert,
  Sliders, TrendingUp, TrendingDown, DollarSign, Target,
  RefreshCw, Play, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const AdminSimulations = () => {
  const [activeTab, setActiveTab] = useState('pricing'); // pricing, queue
  
  // Price Simulator state
  const [selectedItem, setSelectedItem] = useState('Pizza');
  const [priceChange, setPriceChange] = useState(0); // percentage change: -30 to +30

  // Queue Prediction state
  const [kitchenLoad, setKitchenLoad] = useState('Medium'); // Low, Medium, High

  // Pricing elasticity data simulator
  const getSimulatedMetrics = () => {
    const basePrices = { Pizza: 350, Burger: 150, Biryani: 250 };
    const baseDemand = { Pizza: 120, Burger: 250, Biryani: 180 };
    const baseMargin = { Pizza: 0.70, Burger: 0.65, Biryani: 0.60 };

    const basePrice = basePrices[selectedItem];
    const demand = baseDemand[selectedItem];
    const margin = baseMargin[selectedItem];

    // Compute elasticity (Pizza is inelastic, Burger is highly elastic)
    const elasticityFactor = selectedItem === 'Burger' ? 1.8 : selectedItem === 'Biryani' ? 1.4 : 1.1;
    
    const newPrice = Math.round(basePrice * (1 + priceChange / 100));
    const demandMultiplier = 1 - (priceChange / 100) * elasticityFactor;
    const newDemand = Math.max(10, Math.round(demand * demandMultiplier));
    
    const newRevenue = Math.round(newPrice * newDemand);
    const oldRevenue = basePrice * demand;
    const revenueChange = ((newRevenue - oldRevenue) / oldRevenue) * 100;

    const costOfGoods = basePrice * (1 - margin);
    const newMarginPercent = ((newPrice - costOfGoods) / newPrice) * 100;

    // Competitor positioning
    let competitorStatus = 'Aggressive pricing edge';
    if (priceChange > 15) competitorStatus = 'Premium positioning (Low edge)';
    else if (priceChange < -15) competitorStatus = 'Market penetration discount';

    return {
      newPrice,
      newDemand,
      revenueChange: revenueChange.toFixed(1),
      marginPercent: newMarginPercent.toFixed(1),
      competitorStatus,
      retentionStatus: priceChange > 10 ? 'High Slipping Risk' : 'Stable Loyalty'
    };
  };

  const metrics = getSimulatedMetrics();

  // Simulated queue load charts
  const queueData = [
    { time: '17:00', Load: 25, Delay: 5 },
    { time: '18:00', Load: 45, Delay: 12 },
    { time: '19:00', Load: 85, Delay: 28 },
    { time: '20:00', Load: 95, Delay: 35 },
    { time: '21:00', Load: 75, Delay: 22 },
    { time: '22:00', Load: 40, Delay: 10 }
  ];

  const handleApplySimulatedPrice = () => {
    toast.success(`Pricing simulation deployed: ${selectedItem} base price set to ₹${metrics.newPrice}`);
  };

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
                  <Sliders size={10} />
                  AI Pricing & Queue Simulation Center
                </span>
                <span className="text-gray-500 text-xs font-bold">Predictive Elasticity & Workload Simulator</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Simulations & <span className="text-violet-500 font-light">Forecasting</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Predict demand elasticity and forecast kitchen waits before implementing changes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTIONS NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="flex border-b border-gray-800 gap-6 mb-8">
          {[
            { id: 'pricing', label: 'AI Elasticity Price Simulator', desc: 'Predict profit margins & demand responses' },
            { id: 'queue', label: 'AI Queue & Wait Predictor', desc: 'Kitchen workload scheduling recommendations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-left border-b-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'border-violet-500 text-white' 
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
          
          {/* Main Simulator Card (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ════ TAB 1: AI PRICE SIMULATOR ════ */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-8">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <DollarSign className="text-violet-400" size={20} />
                      Elasticity Pricing Simulator
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">Drag pricing slider to dynamically forecast sales responses</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Item selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Select Menu Item</label>
                      <div className="flex gap-2">
                        {['Pizza', 'Burger', 'Biryani'].map(item => (
                          <button
                            key={item}
                            onClick={() => setSelectedItem(item)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                              selectedItem === item 
                                ? 'bg-violet-500 text-black font-black' 
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <span>Price Adjustment</span>
                        <span className={priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {priceChange >= 0 ? `+${priceChange}` : priceChange}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="-30" 
                        max="30" 
                        value={priceChange}
                        onChange={(e) => setPriceChange(Number(e.target.value))}
                        className="w-full accent-violet-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Projections Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    <div className="bg-black/20 p-4 rounded-2xl border border-gray-850">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Simulated Price</span>
                      <p className="text-lg font-black text-white mt-1">₹{metrics.newPrice}</p>
                    </div>

                    <div className="bg-black/20 p-4 rounded-2xl border border-gray-850">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Demand Volume</span>
                      <p className="text-lg font-black text-white mt-1">{metrics.newDemand} orders</p>
                    </div>

                    <div className="bg-black/20 p-4 rounded-2xl border border-gray-850">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Est. Revenue Impact</span>
                      <p className={`text-lg font-black mt-1 ${Number(metrics.revenueChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Number(metrics.revenueChange) >= 0 ? '+' : ''}{metrics.revenueChange}%
                      </p>
                    </div>

                    <div className="bg-black/20 p-4 rounded-2xl border border-gray-850">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Profit Margin</span>
                      <p className="text-lg font-black text-emerald-400 mt-1">{metrics.marginPercent}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-gray-850">
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Competitor Positioning</span>
                      <p className="text-xs font-bold text-white mt-1">{metrics.competitorStatus}</p>
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-2xl border border-gray-850">
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Retention Warning</span>
                      <p className={`text-xs font-bold mt-1 ${metrics.retentionStatus.includes('Slipping') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {metrics.retentionStatus}
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleApplySimulatedPrice} className="w-full bg-violet-500 hover:bg-violet-400 text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest">
                    Deploy Simulated Pricing
                  </Button>
                </div>
              </div>
            )}

            {/* ════ TAB 2: AI QUEUE PREDICTION ════ */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Clock className="text-violet-400" size={20} />
                      Kitchen Workload Queue Forecaster
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5">Forecast backlog times and delivery delays based on real-time chef capacity</p>
                  </div>

                  {/* Forecaster chart */}
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={queueData}>
                        <XAxis dataKey="time" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="Load" stroke="#8b5cf6" fillOpacity={0.1} fill="url(#colorQueue)" />
                        <defs>
                          <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-5 bg-white/5 border border-gray-850 rounded-2.5xl space-y-3">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu size={12} />
                      Queue Scheduling Recommendation
                    </span>
                    <h4 className="text-sm font-bold text-white">Pre-assign 2 buffer riders for 19:00 dinner surge</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      AI queue system forecasts kitchen backlog to hit 85% with delays peaking at 28 mins around 19:30. Staggering preparation schedules by 10 mins will offset wait spikes.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Live Simulation Telemetry (4 Cols) */}
          <div className="lg:col-span-4 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[500px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Zap className="text-violet-400" size={16} />
              Simulator Audits
            </h3>
            
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar">
              <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-1">
                <span className="text-violet-400 font-black">SIMULATOR ACTIVE</span>
                <p className="text-gray-300">Elasticity coefficient computed: Burger elasticity 1.8 (highly price-sensitive).</p>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-emerald-400 font-black">STABLE LOG</span>
                <p className="text-gray-300">Marginal increase of Pizza base price by +5% yields +4% revenue increase with negligible retention drops.</p>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                <span className="text-amber-400 font-black">QUEUE WARNING</span>
                <p className="text-gray-300">Chef workload exceeding 80% threshold. Intelligent queuing algorithms have staggered chef order buffers.</p>
              </div>
            </div>
            
            <div className="border-t border-gray-850 pt-4 mt-4 text-center">
              <span className="text-[10px] font-bold text-gray-500">
                Connected to SimulationNode 7.1
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSimulations;
