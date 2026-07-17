import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Globe, TrendingUp, Sparkles, AlertTriangle, 
  MapPin, Flame, Award, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const AdminGlobalIntelligence = () => {
  const [selectedRegion, setSelectedRegion] = useState('All Cities');

  // Trend list
  const trendingDishes = [
    { name: 'Peri Peri Momos', growth: '+142%', category: 'Snack Fusion', density: 'High in Noida' },
    { name: 'Keto Avocado Salad', growth: '+85%', category: 'Healthy Diet', density: 'High in South Delhi' },
    { name: 'Tandoori Garlic Pizza', growth: '+64%', category: 'Main Fusion', density: 'High in Noida' },
    { name: 'Vegan Matcha Shake', growth: '+45%', category: 'Beverage', density: 'High in Gurgaon' }
  ];

  // Recharts data for regional cuisine share
  const cuisineShareData = [
    { name: 'North Indian', share: 42, color: '#8b5cf6' },
    { name: 'Chinese Fusion', share: 24, color: '#06b6d4' },
    { name: 'Italian Pizza', share: 18, color: '#10b981' },
    { name: 'South Indian', share: 16, color: '#f59e0b' }
  ];

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
                  <Globe size={10} />
                  Global Food Trends Analytics
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">Real-Time Regional Crawl</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Global Food <span className="text-emerald-500 font-light">Intelligence</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Continuously track trending cuisines, regional ingredient demands, and emerging dining habits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111827] border border-gray-800 p-2 rounded-2xl">
            {['All Cities', 'Noida', 'Delhi', 'Gurgaon'].map(city => (
              <button
                key={city}
                onClick={() => setSelectedRegion(city)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedRegion === city 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Trending Items (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Flame size={16} className="text-emerald-400" />
              Fastest-Growing Dishes ({selectedRegion})
            </h3>
            <span className="text-[10px] font-bold text-gray-500">Based on past 7 days order velocity</span>
          </div>

          <div className="space-y-4">
            {trendingDishes.map((dish, i) => (
              <div key={i} className="bg-black/20 p-5 border border-gray-850 hover:border-emerald-500/20 rounded-2.5xl flex items-center justify-between transition-all">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">{dish.name}</h4>
                  <p className="text-[10px] text-gray-455 font-bold flex items-center gap-1">
                    <MapPin size={10} /> {dish.density} · <span className="text-gray-500 font-medium">{dish.category}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-450 font-black text-sm">{dish.growth}</span>
                  <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-widest">Order Spike</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Regional Cuisine distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col justify-between h-[450px]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-8">
              <Award size={16} className="text-emerald-400" />
              Regional Cuisine Share
            </h3>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cuisineShareData} layout="vertical">
                  <XAxis type="number" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="share" radius={[0, 8, 8, 0]}>
                    {cuisineShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-gray-850 pt-4 text-[10px] text-gray-400 leading-relaxed bg-[#070A13]/55 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
              <Sparkles size={10} /> AI Trend Alert:
            </span>
            South Delhi is witnessing an exponential shift towards vegan menu descriptions. Restaurants incorporating "gluten-free plant flour" labels are experiencing +18.4% conversion spikes.
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminGlobalIntelligence;
