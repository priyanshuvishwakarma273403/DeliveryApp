import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, AlertTriangle, Truck, ShieldCheck, 
  MapPin, Clock, Navigation, CheckCircle, RefreshCw 
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const mockOrders = [
  { id: 'ORD-8812', restaurant: 'Pizza Paradise', distance: 3.4, basePrep: 15, currentEta: 22, status: 'PREPARING' },
  { id: 'ORD-8813', restaurant: 'Burger King', distance: 1.8, basePrep: 8, currentEta: 12, status: 'PLACED' },
  { id: 'ORD-8814', restaurant: 'Biriyani Box', distance: 6.2, basePrep: 20, currentEta: 32, status: 'PREPARING' },
  { id: 'ORD-8815', restaurant: 'Bombay Sandwich Co.', distance: 2.2, basePrep: 10, currentEta: 16, status: 'READY_FOR_PICKUP' },
];

const AdminDeliveryRisk = () => {
  const [rainIntensity, setRainIntensity] = useState(40);
  const [trafficIndex, setTrafficIndex] = useState(50);
  const [driverShortage, setDriverShortage] = useState(20);
  const [mitigationApplied, setMitigationApplied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [riskData, setRiskData] = useState([]);

  const calculateRiskScores = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      const computed = mockOrders.map(order => {
        // Base math: rain adds risk, traffic adds risk, longer distance escalates risk
        let riskScore = Math.min(
          100,
          Math.round(
            (rainIntensity * 0.4) + 
            (trafficIndex * 0.35) + 
            (driverShortage * 0.2) + 
            (order.distance * 3)
          )
        );

        if (mitigationApplied) {
          riskScore = Math.max(10, Math.round(riskScore * 0.65)); // 35% risk reduction
        }

        let label = 'LOW';
        let variant = 'success';
        if (riskScore > 75) {
          label = 'CRITICAL';
          variant = 'error';
        } else if (riskScore > 50) {
          label = 'HIGH';
          variant = 'warning';
        } else if (riskScore > 25) {
          label = 'MEDIUM';
          variant = 'info';
        }

        const etaMultiplier = 1 + (rainIntensity / 150) + (trafficIndex / 120);
        const finalEta = Math.round(order.basePrep + (order.distance * 3 * etaMultiplier));

        return {
          ...order,
          riskScore,
          riskLabel: label,
          riskVariant: variant,
          finalEta
        };
      });
      setRiskData(computed);
    }, 800);
  };

  useEffect(() => {
    calculateRiskScores();
  }, [rainIntensity, trafficIndex, driverShortage, mitigationApplied]);

  // Aggregate stats
  const averageRisk = riskData.length > 0 ? Math.round(riskData.reduce((sum, o) => sum + o.riskScore, 0) / riskData.length) : 0;
  const criticalCount = riskData.filter(o => o.riskScore > 70).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-white p-6 md:p-10 font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Route Telemetry Node</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            <CloudRain className="text-rose-500" size={36} />
            AI Delivery Risk Simulator
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Real-time logistical stress testing. Simulate rainfall, traffic bottlenecks, and dispatcher routing mitigations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setMitigationApplied(!mitigationApplied)}
            className={`font-black text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all ${
              mitigationApplied 
                ? 'bg-emerald-500 hover:bg-emerald-450 text-black shadow-emerald-500/10' 
                : 'bg-[#1E293B] hover:bg-gray-800 text-white'
            }`}
          >
            {mitigationApplied ? (
              <>
                <ShieldCheck size={14} /> Mitigation Active (-35% Risk)
              </>
            ) : (
              <>
                <RefreshCw size={14} /> Apply Smart Dispatch Reroute
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── SIMULATION SETTINGS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Sliders (4 cols) */}
        <div className="lg:col-span-4 bg-[#0F172A] rounded-[2rem] border border-gray-800 p-6 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Environmental Parameters</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Rain Intensity</span>
              <span>{rainIntensity}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={rainIntensity} 
              onChange={(e) => setRainIntensity(Number(e.target.value))}
              className="w-full accent-rose-500 bg-[#090D16] h-1 rounded-lg outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Traffic Congestion</span>
              <span>{trafficIndex}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={trafficIndex} 
              onChange={(e) => setTrafficIndex(Number(e.target.value))}
              className="w-full accent-rose-500 bg-[#090D16] h-1 rounded-lg outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-450">Driver Shortage Factor</span>
              <span>{driverShortage}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={driverShortage} 
              onChange={(e) => setDriverShortage(Number(e.target.value))}
              className="w-full accent-rose-500 bg-[#090D16] h-1 rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Global Gauge & Alerts (8 cols) */}
        <div className="lg:col-span-8 bg-[#0F172A] rounded-[2rem] border border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Gauge display */}
          <div className="flex flex-col items-center justify-center relative w-48 h-48 border-4 border-gray-800 rounded-full">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Risk index</p>
              <p className={`text-4xl font-black leading-none ${
                averageRisk > 70 ? 'text-rose-500' : averageRisk > 40 ? 'text-amber-500' : 'text-emerald-500'
              }`}>{averageRisk}%</p>
              <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-wide">
                {averageRisk > 70 ? 'HIGH COLLATERAL' : averageRisk > 40 ? 'CAUTION ADVISED' : 'STABLE FLUX'}
              </p>
            </div>
          </div>

          {/* Warnings and Mitigation logs */}
          <div className="flex-1 space-y-4 text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={16} />
              AI Route Analytics
            </h3>
            
            <div className="space-y-2.5 text-xs text-gray-300">
              <p>• {criticalCount} orders currently in <strong>Critical Risk Zones</strong> (ETA delays &gt; 15 mins).</p>
              <p>• Weather coefficient adds <strong>+{Math.round(rainIntensity * 0.25)} mins</strong> to driver transit times.</p>
              {mitigationApplied ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl font-bold">
                  ✓ Dispatch Mitigation Applied: Route optimization algorithm active. All ETAs adjusted. Priority chef queues locked.
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl font-bold">
                  ⚠️ System Advisory: Logistical strain rising. Click "Apply Smart Dispatch Reroute" to optimize drivers.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── SIMULATED DISPATCH QUEUE ── */}
      <div className="bg-[#0F172A] rounded-[2.5rem] border border-gray-800 p-6 md:p-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
          <Truck className="text-rose-400" size={16} />
          Active Logistical Queue
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4">Order ID</th>
                <th className="pb-4">Restaurant</th>
                <th className="pb-4">Distance</th>
                <th className="pb-4">Environmental Delay</th>
                <th className="pb-4">Target ETA</th>
                <th className="pb-4 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {riskData.map((order) => (
                <tr key={order.id} className="border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 align-middle font-black text-xs text-white">#{order.id}</td>
                  <td className="py-4 align-middle text-xs font-bold text-gray-400">{order.restaurant}</td>
                  <td className="py-4 align-middle text-xs font-bold text-gray-400">{order.distance} km</td>
                  <td className="py-4 align-middle text-xs font-bold text-gray-400">
                    +{Math.round((rainIntensity / 10) + (trafficIndex / 15))} mins
                  </td>
                  <td className="py-4 align-middle text-xs font-black text-white">{order.finalEta} mins</td>
                  <td className="py-4 align-middle text-right">
                    <Badge variant={order.riskVariant} className="text-[8px] uppercase tracking-widest font-black py-0.5 px-2">
                      {order.riskLabel} ({order.riskScore}%)
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDeliveryRisk;
