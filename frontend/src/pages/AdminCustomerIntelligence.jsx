import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Gift, TrendingUp, AlertTriangle, ShieldCheck, 
  Mail, Sparkles, Zap, Award, Target, ArrowUpRight, DollarSign,
  UserCheck, RefreshCw, BadgePercent
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const AdminCustomerIntelligence = () => {
  const [activeTab, setActiveTab] = useState('clv'); // clv, coupons
  const [selectedSegment, setSelectedSegment] = useState('all');

  // Customer CLV & Churn list
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Priyanshu Vishwakarma', spent: 18450, clv: 54000, loyaltyScore: 95, churnRisk: 'LOW', churnProb: 4, segment: 'VIP Loyal' },
    { id: 2, name: 'Rohan Sharma', spent: 8200, clv: 24000, loyaltyScore: 82, churnRisk: 'LOW', churnProb: 12, segment: 'Regular' },
    { id: 3, name: 'Aisha Kapoor', spent: 3100, clv: 8000, loyaltyScore: 45, churnRisk: 'MEDIUM', churnProb: 48, segment: 'Slipping' },
    { id: 4, name: 'Vikram Singh', spent: 12400, clv: 18000, loyaltyScore: 35, churnRisk: 'CRITICAL', churnProb: 86, segment: 'Churn-Risk VIP' },
    { id: 5, name: 'Neha Gupta', spent: 1500, clv: 4500, loyaltyScore: 60, churnRisk: 'LOW', churnProb: 18, segment: 'New Buyer' },
    { id: 6, name: 'Amit Verma', spent: 6500, clv: 9000, loyaltyScore: 28, churnRisk: 'CRITICAL', churnProb: 79, segment: 'Slipping' }
  ]);

  // AI Coupon list
  const [coupons, setCoupons] = useState([
    { code: 'LOYALVIP25', discount: '25%', targetSegment: 'VIP Loyal', minOrder: 500, conversionEst: '82%', marginImpact: '-4.5%', status: 'Active' },
    { code: 'COMEBACK40', discount: '40%', targetSegment: 'Slipping', minOrder: 300, conversionEst: '64%', marginImpact: '-6.2%', status: 'Active' },
    { code: 'RETENTION50', discount: '50%', targetSegment: 'Churn-Risk VIP', minOrder: 400, conversionEst: '78%', marginImpact: '-7.8%', status: 'Active' },
    { code: 'WELCOME150', discount: '₹150 Off', targetSegment: 'New Buyer', minOrder: 450, conversionEst: '55%', marginImpact: '-3.8%', status: 'Active' }
  ]);

  // Chart data showing campaign conversion rates
  const campaignData = [
    { name: 'VIP Loyalty', value: 85 },
    { name: 'Slipping Ret.', value: 68 },
    { name: 'Churn-Risk Win', value: 76 },
    { name: 'New Activation', value: 54 }
  ];

  const handleLaunchCampaign = (customerName, segment) => {
    toast.success(`AI Campaign triggered for ${customerName} (${segment}). Retention coupon dispatched!`);
  };

  const handleCreateAICoupon = () => {
    toast.success("AI Coupon Engine generated 3 optimal discount campaigns targeting slipping segments.");
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-indigo-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Award size={10} />
                  AI Customer Intelligence Center
                </span>
                <span className="text-gray-500 text-xs font-bold">Predictive Lifetime Engine</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                CLV & Churn <span className="text-indigo-500 font-light">Intelligence</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Generate personalized coupon discounts, predict churn probabilities, and calculate lifetime value metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="flex border-b border-gray-800 gap-6 mb-8">
          {[
            { id: 'clv', label: 'CLV & Churn Risk Tracker', desc: 'Loyalty index & predictive churn metrics' },
            { id: 'coupons', label: 'AI Coupon Engine', desc: 'Personalized margins & campaigns' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-left border-b-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-white' 
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
          
          {/* Main Dashboard Panel */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ════ MODULE 1: CLV & CHURN PREDICTOR ════ */}
            {activeTab === 'clv' && (
              <div className="space-y-6">
                
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#111827]/90 border border-gray-800 rounded-2.5xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Average CLV</span>
                      <p className="text-xl font-black text-white">₹19,650</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#111827]/90 border border-gray-800 rounded-2.5xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">High Churn Risk</span>
                      <p className="text-xl font-black text-rose-400">2 Customers</p>
                    </div>
                  </div>

                  <div className="bg-[#111827]/90 border border-gray-800 rounded-2.5xl p-5 flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Average Loyalty Score</span>
                      <p className="text-xl font-black text-emerald-400">67.5%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                    <Users className="text-indigo-400" size={20} />
                    Predictive Retention Dashboard
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-850 text-gray-500 font-bold uppercase tracking-widest text-[9px]">
                          <th className="pb-4">Customer Name</th>
                          <th className="pb-4">Total Spent</th>
                          <th className="pb-4">Predicted CLV</th>
                          <th className="pb-4">Loyalty index</th>
                          <th className="pb-4">Churn Risk</th>
                          <th className="pb-4 text-right">Retain Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {customers.map(cust => (
                          <tr key={cust.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 font-bold text-white">
                              {cust.name}
                              <span className="text-gray-500 font-medium block text-[10px]">{cust.segment}</span>
                            </td>
                            <td className="py-4 font-bold text-gray-300">₹{cust.spent.toLocaleString()}</td>
                            <td className="py-4 font-black text-indigo-400">₹{cust.clv.toLocaleString()}</td>
                            <td className="py-4 font-bold text-emerald-400">{cust.loyaltyScore}/100</td>
                            <td className="py-4">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                                cust.churnRisk === 'CRITICAL' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400 animate-pulse' :
                                cust.churnRisk === 'MEDIUM' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                                'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {cust.churnProb}% Prob ({cust.churnRisk})
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <Button 
                                onClick={() => handleLaunchCampaign(cust.name, cust.segment)}
                                className="py-1 px-3 bg-indigo-500 hover:bg-indigo-400 text-black text-[10px] font-black rounded-lg uppercase tracking-wider"
                              >
                                Trigger Retain
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════ MODULE 2: AI COUPON ENGINE ════ */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                
                {/* AI coupon creator promo box */}
                <div className="bg-gradient-to-br from-[#1E1B4B] to-[#0F172A] border border-indigo-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Gift size={120} className="text-indigo-400" />
                  </div>
                  
                  <div className="max-w-lg space-y-4">
                    <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <Sparkles size={10} className="animate-spin-slow" />
                      Dynamic margin preservation optimizer
                    </span>
                    <h3 className="text-2xl font-black text-white">Dynamic AI Discount Allocator</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Automatically configures discounts depending on customer loyalty levels, conversion probabilities, and restaurant margin protection thresholds. Rest assured, coupons adjust dynamically to preserve platform revenue.
                    </p>
                    <div className="pt-2">
                      <Button onClick={handleCreateAICoupon} className="bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center gap-2">
                        <Zap size={14} /> Run Dynamic Recommendation Engine
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active coupons list */}
                <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Active Dynamic Coupons</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coupons.map((coupon, idx) => (
                      <div key={idx} className="bg-black/20 border border-gray-850 p-5 rounded-2.5xl flex flex-col justify-between space-y-4 group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Target Segment</span>
                            <span className="text-sm font-black text-white">{coupon.targetSegment}</span>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-black">
                            {coupon.conversionEst} Conv
                          </span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                          <code className="text-sm font-mono font-black text-indigo-300">{coupon.code}</code>
                          <span className="text-xs font-black text-emerald-400">{coupon.discount}</span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-gray-850">
                          <span>Min Order: ₹{coupon.minOrder}</span>
                          <span className="text-rose-400 font-bold">Margin Impact: {coupon.marginImpact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right side analytics column */}
          <div className="lg:col-span-4 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[500px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <Target className="text-indigo-400" size={16} />
              AI Campaign Effectiveness
            </h3>

            <div className="flex-1 min-h-[220px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                  <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 border-t border-gray-850 pt-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Intelligence Diagnostics</h4>
              <div className="space-y-2 text-[11px] leading-relaxed text-gray-400">
                <p className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <strong>VIP Loyalty Segment</strong> shows maximum campaign responsiveness (85% redemption).
                </p>
                <p className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <strong>Churn probability</strong> triggered on 2 VIP accounts due to 14 days of inactivity.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCustomerIntelligence;
