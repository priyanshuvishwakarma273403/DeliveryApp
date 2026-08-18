import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ShoppingBag, Star, Users, ArrowUpRight, TrendingUp, AlertTriangle, 
  Activity, Award, MapPin, Plus, Edit2, Trash2, ShieldAlert, Calendar, Sparkles, 
  Download, FileText, Coffee, Lock, ShieldCheck, HelpCircle, ChevronRight, Briefcase,
  PieChart as PieIcon, Percent, BarChart3, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import { playNotificationTick, playSuccessChime } from '../utils/audioSynth';

const BRANCH_SALES = [
  { name: 'Noida Hub', revenue: 420000, orders: 1240, rating: 4.8, profit: 125000 },
  { name: 'Delhi Connaught', revenue: 580000, orders: 1950, rating: 4.9, profit: 180000 },
  { name: 'Gurgaon Cyber', revenue: 640000, orders: 2100, rating: 4.7, profit: 210000 },
];

const MOCK_FINANCIALS = [
  { month: 'Jan', revenue: 840000, expenses: 520000, profit: 320000 },
  { month: 'Feb', revenue: 920000, expenses: 580000, profit: 340000 },
  { month: 'Mar', revenue: 1100000, expenses: 690000, profit: 410000 },
  { month: 'Apr', revenue: 980000, expenses: 620000, profit: 360000 },
  { month: 'May', revenue: 1250000, expenses: 740000, profit: 510000 },
  { month: 'Jun', revenue: 1420000, expenses: 810000, profit: 610000 },
];

const PAYROLL_DATA = [
  { id: 'EMP-01', name: 'Chef Giovanni', role: 'Head Chef', salary: 75000, status: 'PAID' },
  { id: 'EMP-02', name: 'Rajesh Kumar', role: 'Kitchen Lead', salary: 35000, status: 'PAID' },
  { id: 'EMP-03', name: 'Amit Verma', role: 'Branch Manager', salary: 45000, status: 'PAID' },
  { id: 'EMP-04', name: 'Vikrant Singh', role: 'Head Cashier', salary: 28000, status: 'PAID' },
];

const MOCK_COUPONS = [
  { code: 'GOLD50', discount: '50%', usage: 412, status: 'ACTIVE', profitBoost: '+18%' },
  { code: 'WELCOME100', discount: '₹100 Flat', usage: 829, status: 'ACTIVE', profitBoost: '+22%' },
  { code: 'WEEKEND20', discount: '20% off', usage: 154, status: 'PAUSED', profitBoost: '+8%' },
];

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('monthly');
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [payroll, setPayroll] = useState(PAYROLL_DATA);

  const totalRevenue = useMemo(() => BRANCH_SALES.reduce((acc, curr) => acc + curr.revenue, 0), []);
  const totalProfit = useMemo(() => BRANCH_SALES.reduce((acc, curr) => acc + curr.profit, 0), []);
  const totalOrders = useMemo(() => BRANCH_SALES.reduce((acc, curr) => acc + curr.orders, 0), []);

  const handlePaySalary = (empId) => {
    setPayroll(payroll.map(p => p.id === empId ? { ...p, status: 'PAID_SUCCESS' } : p));
    playSuccessChime();
    toast.success('Salary dispatched via Corporate IMPS payout queue!');
  };

  const handleAddCoupon = () => {
    playNotificationTick();
    toast.success('New promotion scheduled for multi-branch sync!');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col lg:flex-row">
      
      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden bg-[#0F172A] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-black text-white">
            IQ
          </div>
          <div>
            <h2 className="text-xs font-black tracking-tight">FoodIQ Corporate</h2>
            <p className="text-[8px] text-gray-400 font-bold uppercase">Owner Desk</p>
          </div>
        </div>
        
        <select 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl outline-none"
        >
          <option value="overview">Strategic Overview</option>
          <option value="payroll">Payroll & HR</option>
          <option value="marketing">Marketing ROI</option>
        </select>
      </header>

      {/* Sidebar navigation (desktop) */}
      <aside className="hidden lg:flex w-full lg:w-72 bg-[#0F172A] text-white p-6 shrink-0 flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary/20 text-white">
              IQ
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">FoodIQ Enterprise</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Owner Cockpit</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-black uppercase">
              <span>Corporate Node</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white">L.P. Food Ventures LLP</p>
            <p className="text-[10px] text-gray-400">GSTIN: 07AAAAA1111A1Z1</p>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Strategic Overview', icon: TrendingUp },
              { id: 'payroll', label: 'Payroll & HR', icon: Users },
              { id: 'marketing', label: 'Marketing ROI', icon: Award }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { playNotificationTick(); setActiveTab(item.id); }}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">FoodIQ Corp v4.10</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="text-primary" /> Strategic Enterprise Cockpit
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Authorized: Marco Silva (Owner) • National Operations Control</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { playNotificationTick(); toast.success('Syncing financial journals with databases...'); }}
              className="bg-white px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-xs font-black text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw size={14} /> Refresh Books
            </button>
            <button 
              onClick={() => { playNotificationTick(); toast.success('Report download scheduled.'); }}
              className="bg-slate-900 text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </header>

        {/* Corporate Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Group Consolidated Revenue</span>
              <DollarSign size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-black text-slate-900">₹{(totalRevenue / 100000).toFixed(2)}L</p>
            <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
              <ArrowUpRight size={12} /> +18.2% <span className="text-slate-400 font-medium ml-1">vs last quarter</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Group EBITDA Net Profit</span>
              <Briefcase size={18} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">₹{(totalProfit / 100000).toFixed(2)}L</p>
            <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
              <ArrowUpRight size={12} /> +14.5% <span className="text-slate-400 font-medium ml-1">Profit margin 31.5%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Consolidated Orders</span>
              <ShoppingBag size={18} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">{totalOrders.toLocaleString()}</p>
            <div className="text-[10px] font-bold text-slate-400">Across 3 high-volume metro branches</div>
          </div>
        </div>

        {/* Tab-specific Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue trends chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-900">Revenue & Profit Projections</h3>
                      <p className="text-[10px] text-slate-400 font-bold">Group consolidated performance trend</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['weekly', 'monthly'].map(tf => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            timeframe === tf ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_FINANCIALS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FC8019" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#FC8019" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FC8019" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Branch Performance Roster */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-slate-900">Branch Leaderboard</h3>
                  <div className="space-y-4">
                    {BRANCH_SALES.map((branch, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-black text-slate-900">{branch.name}</p>
                            <span className="text-[9px] text-yellow-600 bg-yellow-50 px-1 rounded font-black">★ {branch.rating}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">Orders: {branch.orders} • Margin: {((branch.profit / branch.revenue) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">₹{(branch.revenue / 100000).toFixed(2)}L</p>
                          <p className="text-[9px] text-emerald-500 font-bold">Profit: ₹{(branch.profit / 100000).toFixed(2)}L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-slate-900">Corporate Staff Payroll Panel</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Consolidated Roster</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {payroll.map((emp) => (
                    <div key={emp.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-xs font-black text-slate-900">{emp.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{emp.role}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">₹{emp.salary.toLocaleString()}</p>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${
                            emp.status === 'PAID_SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>{emp.status === 'PAID_SUCCESS' ? 'TRANSFERRED' : 'PENDING'}</span>
                        </div>
                        {emp.status !== 'PAID_SUCCESS' && (
                          <button 
                            onClick={() => handlePaySalary(emp.id)}
                            className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                          >
                            Payout
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-slate-900">Brand Promotions & Coupon Manager</h3>
                  <button 
                    onClick={handleAddCoupon}
                    className="text-[10px] text-primary font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus size={12} /> Schedule Promo
                  </button>
                </div>

                <div className="space-y-3">
                  {coupons.map((coupon, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-2xl flex items-center justify-between text-xs font-bold">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 bg-white border px-2 py-0.5 rounded">{coupon.code}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 rounded">{coupon.discount}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5">Redeemed: {coupon.usage} times</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded font-black uppercase">{coupon.status}</span>
                        <p className="text-[9px] text-emerald-500 font-bold mt-1">Ticket Lift: {coupon.profitBoost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default OwnerDashboard;
