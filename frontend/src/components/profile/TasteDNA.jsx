import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Cookie, Activity, Heart, ShieldAlert } from 'lucide-react';

const TasteDNA = () => {
  const [dnaStats, setDnaStats] = useState([
    { name: 'Spice Tolerance', value: 85, icon: Flame, color: 'text-red-500', barColor: 'bg-red-500', desc: 'Prefers high heat (Guntur chili, ghost pepper hints)' },
    { name: 'Sweet Preference', value: 25, icon: Cookie, color: 'text-amber-500', barColor: 'bg-amber-500', desc: 'Savory dominant, low processed sugar tolerance' },
    { name: 'Crunch Factor', value: 75, icon: Activity, color: 'text-cyan-500', barColor: 'bg-cyan-500', desc: 'Highly responsive to crispy/textured plating' },
    { name: 'Creaminess index', value: 65, icon: Heart, color: 'text-rose-500', barColor: 'bg-rose-500', desc: 'Favors smooth, yogurt-based, or slow-cooked gravies' }
  ]);

  const genomeDishes = [
    { name: 'Paneer Tikka Masala', Match: 98, tags: ['Creamy', 'Spicy', 'North Indian', 'Hot Servings'] },
    { name: 'Loaded Fries', Match: 91, tags: ['Crunchy', 'High-Sodium', 'Cheese Lock', 'Midnight popular'] },
    { name: 'Neapolitan Margherita', Match: 88, tags: ['Aromatic', 'Mild Sweet', 'Wood-Fired', 'Savory Base'] }
  ];

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C]">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
        <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black">AI Taste DNA & Food Genome</h3>
          <p className="text-xs text-[#686B78] font-bold">Computed dynamically from flavor profiles & ingredient history</p>
        </div>
      </div>

      {/* ── Main DNA Visualizer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Helix Render Area */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden h-[300px] shadow-lg">
          <div className="absolute top-4 left-4">
             <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-black tracking-widest uppercase">DNA Helix Active</span>
          </div>

          {/* Rotating Double Helix (Pure CSS) */}
          <div className="flex flex-col gap-3 justify-center items-center h-full relative" style={{ perspective: '500px' }}>
            <div className="flex flex-col gap-2.5 w-32 animate-[spin_8s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const rotation = i * 30;
                return (
                  <div 
                    key={i} 
                    className="flex justify-between items-center relative h-1.5" 
                    style={{ transform: `rotateY(${rotation}deg)` }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                    <div className="h-[1px] bg-white/20 w-full mx-1" />
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-lg shadow-red-400/50" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Structural Flavor Synthesis</span>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Genomic Taste Parameters</h4>
          
          <div className="space-y-4">
            {dnaStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <stat.icon size={14} className={stat.color} />
                    <span className="text-xs font-bold text-gray-700">{stat.name}</span>
                  </div>
                  <span className="text-xs font-black">{stat.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`h-full ${stat.barColor}`} 
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Food Genome Mappings & Recommended Matches ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Food Genome Match Score</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {genomeDishes.map((dish, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between group hover:border-amber-400/30 transition-all">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-black px-2 py-0.5 rounded-md">
                    {dish.Match}% DNA MATCH
                  </span>
                  <span className="text-xs">🧬</span>
                </div>
                <h5 className="font-black text-sm text-text-primary group-hover:text-primary transition-colors">{dish.name}</h5>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {dish.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[9px] bg-white border border-gray-200 text-gray-500 font-bold px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default TasteDNA;
