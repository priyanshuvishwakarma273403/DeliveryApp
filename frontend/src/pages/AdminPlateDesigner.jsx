import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, ShieldAlert, Award, Grid, HelpCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { getUniqueFoodImage } from '../utils/imageProvider';

const platingStyles = [
  { id: 'minimal', name: 'Modern Minimalist', desc: 'High negative space, offset focal point, clean lines' },
  { id: 'modernist', name: 'Modernist / Avant-Garde', desc: 'Asymmetrical droplets, brush swoops, culinary foam' },
  { id: 'classic', name: 'Classic Ring', desc: 'Concentric layering, starch base, protein focal center' },
  { id: 'rustic', name: 'Rustic / Earthy', desc: 'Wooden slate boarding, coarse toppings, organic scattering' }
];

const AdminPlateDesigner = () => {
  const [dishName, setDishName] = useState('Paneer Tikka Pizza');
  const [style, setStyle] = useState('minimal');
  const [ingredients, setIngredients] = useState('Basil oil, paneer cubes, sun-dried tomatoes, micro-greens');
  const [isDesigning, setIsDesigning] = useState(false);
  const [designResult, setDesignResult] = useState(null);

  const handleGenerate = () => {
    setIsDesigning(true);
    setTimeout(() => {
      setIsDesigning(false);
      setDesignResult({
        harmonyScore: 98,
        contrastScore: 94,
        focalElement: '6 o\'clock position (main protein/dish focus)',
        sauceTechnique: style === 'minimal' ? 'Asymmetric drizzle drops' : 'Diagonal swoop stroke',
        garnishAdvice: 'Scatter micro-basil leaves at 2 o\'clock to contrast the red sauce base.',
        illustrationSrc: getUniqueFoodImage(dishName, 'Plating Studio')
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white p-6 md:p-10 font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Plating Aesthetics Agent</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            <Compass className="text-cyan-400 animate-spin-slow" size={36} />
            AI Plate Designer
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Simulate premium plated dish aesthetics, focal layouts, and color harmony balances.
          </p>
        </div>
      </div>

      {/* ── WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT FORMS (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F172A] rounded-[2.5rem] border border-gray-800 p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Design Inputs</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Dish Name</label>
            <input 
              type="text" 
              value={dishName} 
              onChange={(e) => setDishName(e.target.value)}
              className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Plating Style</label>
            <div className="grid grid-cols-1 gap-2.5">
              {platingStyles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    style === item.id 
                      ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400' 
                      : 'border-gray-800 bg-[#090D16] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <p className="text-xs font-black">{item.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Plating Elements / Garnishes</label>
            <textarea 
              value={ingredients} 
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
              className="w-full bg-[#090D16] border border-gray-800 rounded-xl p-4 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isDesigning}
            className="w-full bg-cyan-500 hover:bg-cyan-450 text-black font-black text-xs uppercase py-4 rounded-xl flex items-center justify-center gap-2"
          >
            {isDesigning ? (
              <>
                <RefreshCw className="animate-spin" size={14} /> Designing Plate...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Design Plate Presentation
              </>
            )}
          </Button>
        </div>

        {/* OUTPUT BLUEPRINT & MOCKUP (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Blueprint Layout Card */}
          <div className="bg-[#0F172A] rounded-[2.5rem] border border-gray-800 p-6 md:p-8 flex flex-col justify-between min-h-[480px]">
            {designResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                
                {/* Blueprint graphic */}
                <div className="flex flex-col items-center justify-center border border-gray-800 rounded-[2rem] p-6 bg-[#090D16] relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[8px] bg-cyan-500/10 text-cyan-400 font-black px-2 py-0.5 rounded">
                    <Grid size={10} /> GRID ALIGNED
                  </div>

                  <div className="h-44 w-44 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center relative">
                    {/* Focal dot */}
                    <div className="absolute h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center bottom-6 left-16">
                      <span className="text-[7px] text-amber-400 font-bold">FOCAL</span>
                    </div>

                    {/* Swoop track */}
                    <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 100">
                      <path d="M20,80 Q50,50 80,20" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3" />
                    </svg>
                    
                    {/* Center point */}
                    <div className="h-2 w-2 rounded-full bg-gray-800" />
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-4">Plating Canvas Blueprint</p>
                </div>

                {/* Agent recommendations */}
                <div className="flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white mb-4">Aesthetics Evaluation</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Focal Point</p>
                        <p className="font-bold text-gray-300">{designResult.focalElement}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Sauce Stroke</p>
                        <p className="font-bold text-gray-300">{designResult.sauceTechnique}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Garnish Position</p>
                        <p className="font-bold text-gray-300">{designResult.garnishAdvice}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Thematic Harmony</p>
                      <p className="text-2xl font-black text-emerald-400">{designResult.harmonyScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Color Contrast</p>
                      <p className="text-2xl font-black text-cyan-400">{designResult.contrastScore}%</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <Compass size={48} className="text-gray-700 animate-pulse mb-4" />
                <h4 className="text-lg font-black mb-2">No Plating Model Generated</h4>
                <p className="text-xs text-gray-500 font-bold max-w-xs leading-relaxed">
                  Enter dish name and select plating style to run the visual composition advisor agent.
                </p>
              </div>
            )}
          </div>

          {/* Plated Mockup render */}
          {designResult && (
            <div className="bg-[#0F172A] rounded-[2.5rem] border border-gray-800 overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                <Award size={12} className="text-yellow-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-wider">Target Plating Reference</span>
              </div>
              <img src={designResult.illustrationSrc} className="w-full h-64 object-cover" alt="" />
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AdminPlateDesigner;
