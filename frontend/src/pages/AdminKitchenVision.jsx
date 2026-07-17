import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Eye, Sparkles, AlertTriangle, CheckCircle2,
  RefreshCw, ShieldCheck, Zap, Video, Camera, Info
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const AdminKitchenVision = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, quality
  const [visionActive, setVisionActive] = useState(true);

  // Simulated CV inventory detections
  const [cvInventory, setCvInventory] = useState([
    { name: 'Tomatoes', qtyDetected: '42 units', confidence: '98%', status: 'Normal', expiry: '4 days' },
    { name: 'Lettuce Head', qtyDetected: '12 units', confidence: '95%', status: 'Low Stock Alert', expiry: '2 days' },
    { name: 'Cheddar Block', qtyDetected: '8.5 kg', confidence: '99%', status: 'Normal', expiry: '12 days' },
    { name: 'Onions', qtyDetected: '15 kg', confidence: '94%', status: 'Normal', expiry: '9 days' }
  ]);

  // Simulated Quality checks on packaging line
  const [qualityChecks, setQualityChecks] = useState([
    { id: 'Q-8492', dish: 'Paneer Tikka Pizza', status: 'PASS', score: '98%', defect: 'None', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
    { id: 'Q-8493', dish: 'Veg Cheese Burger', status: 'PASS', score: '92%', defect: 'Minor bun alignment deviation', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
    { id: 'Q-8494', dish: 'French Fries Extra Large', status: 'WARNING', score: '78%', defect: 'Overcooked brown color detected', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300' }
  ]);

  const handleRefreshVision = () => {
    toast.success("Camera feeds refreshed. AI model rerun successfully.");
  };

  const handleReprepareDish = (id) => {
    toast.success(`Defect flagged on checklist. Dish ${id} sent back to kitchen queue!`);
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
                  <Eye size={10} />
                  AI Computer Vision Quality Hub
                </span>
                <span className="text-gray-500 text-xs font-bold">Kitchen Telemetry & Quality Enforcement</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Kitchen Vision & <span className="text-cyan-500 font-light">Quality Control</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Monitor live camera feeds for auto-ingredient counting and detect preparation defects before dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#111827] border border-gray-800 p-2 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Camera Feed Status:</span>
            <button
              onClick={() => setVisionActive(!visionActive)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                visionActive ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-gray-850 text-gray-400'
              }`}
            >
              {visionActive ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTIONS NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="flex border-b border-gray-800 gap-6 mb-8">
          {[
            { id: 'inventory', label: 'AI Smart Inventory Vision', desc: 'Real-time Camera Feed Detections' },
            { id: 'quality', label: 'AI Food Quality Diagnostics', desc: 'Prep defect inspections & scans' }
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
          
          {/* Main Vision Panel (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ════ TAB 1: SMART INVENTORY VISION ════ */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                
                {/* Live simulation frame */}
                <div className="bg-[#111827] border border-gray-850 rounded-[2rem] overflow-hidden relative shadow-2xl">
                  
                  {/* Camera Simulator overlay graphic */}
                  <div className="aspect-video w-full bg-cover bg-center relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800')` }}>
                    <div className="absolute inset-0 bg-black/40" />
                    
                    {/* Bounding box graphics */}
                    {visionActive && (
                      <>
                        <div className="absolute top-[20%] left-[25%] border-2 border-cyan-500 bg-cyan-500/10 p-1 text-[9px] font-black text-white rounded">
                          Cheese block: 8.5kg (Conf: 99%)
                        </div>
                        <div className="absolute top-[45%] left-[50%] border-2 border-rose-500 bg-rose-500/10 p-1 text-[9px] font-black text-white rounded animate-pulse">
                          Lettuce: 12 units (Low Stock)
                        </div>
                        <div className="absolute top-[60%] left-[15%] border-2 border-cyan-500 bg-cyan-500/10 p-1 text-[9px] font-black text-white rounded">
                          Tomatoes (98% Conf)
                        </div>
                      </>
                    )}

                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <Video className="text-cyan-400 animate-pulse" size={14} />
                      <span className="text-[9px] font-black tracking-widest text-gray-200">KITCHEN_CAM_01</span>
                    </div>

                    {!visionActive && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-black uppercase text-xs tracking-widest">
                        Camera Feed Offline
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-black text-white">Live Ingredient Detections</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Autonomous counts derived from CAM_01 texture evaluations</p>
                    </div>
                    <Button onClick={handleRefreshVision} className="px-4 py-2 border-gray-800 text-gray-300 flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-xl">
                      <RefreshCw size={12} /> Refilter Camera
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cvInventory.map((item, idx) => (
                      <div key={idx} className="bg-black/20 p-5 rounded-2.5xl border border-gray-850 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] text-gray-500 font-bold block">Est. expiry: {item.expiry}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-cyan-400">{item.qtyDetected}</p>
                          <span className="text-[9px] text-gray-500">Conf: {item.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 2: AI FOOD QUALITY DETECTION ════ */}
            {activeTab === 'quality' && (
              <div className="space-y-6">
                
                {/* Live Quality scans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {qualityChecks.map((item) => (
                    <div key={item.id} className="bg-[#111827] border border-gray-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
                      <div className="aspect-square relative overflow-hidden bg-gray-900">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.dish} />
                        
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[9px] font-mono text-gray-300">
                          {item.id}
                        </div>

                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-black ${
                          item.status === 'PASS' ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
                        }`}>
                          {item.status} ({item.score})
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="text-xs font-black text-white">{item.dish}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            <strong>Detection:</strong> {item.defect}
                          </p>
                        </div>

                        {item.status === 'WARNING' && (
                          <Button 
                            onClick={() => handleReprepareDish(item.id)}
                            className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] uppercase py-2 rounded-lg"
                          >
                            Flag & Redo Dish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Right Live CV Logs (4 Cols) */}
          <div className="lg:col-span-4 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[500px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Zap className="text-cyan-400" size={16} />
              Live CV Node Broadcasts
            </h3>
            
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar">
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-cyan-400 font-black">CV MODEL RERUN</span>
                <p className="text-gray-300">Tomato shelf density detected at 42 units. Low stock re-order recommendations generated.</p>
              </div>

              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-rose-400 font-black">PACKAGING EXCLUSION</span>
                <p className="text-gray-300">Camera 4 flagged Dish Q-8494: overcooked surface detected. Sent warning alert to head chef.</p>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-emerald-400 font-black">QUALITY COMPLIANCE</span>
                <p className="text-gray-300">Dish Q-8492 passed automated presentation check with 98% confidence score.</p>
              </div>
            </div>
            
            <div className="border-t border-gray-850 pt-4 mt-4 text-center">
              <span className="text-[10px] font-bold text-gray-500">
                Connected to VisionEngine 2.9
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminKitchenVision;
