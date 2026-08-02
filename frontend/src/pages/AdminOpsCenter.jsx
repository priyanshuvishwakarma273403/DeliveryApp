import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, Shield, MapPin, Users, Flame, Navigation, 
  TrendingUp, RefreshCw, AlertTriangle, Zap, CheckCircle2, 
  Layers, Settings, Play, Pause, ChevronRight, BarChart2, ShieldAlert,
  Activity, Bike, DollarSign, Search, Filter, Trash2, XOctagon, 
  UserCheck, Ban, ShieldCheck, CreditCard, Gift, Star, Phone, MessageSquare,
  AlertCircle, Download, FileText, Send, Lock, Building
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

// ── MOCK DATA ENGINE ──
const MOCK_CUSTOMERS = [
  { id: "C-901", name: "Priyanshu Vishwakarma", email: "priyanshu@foodiq.com", phone: "+91 83768 41256", status: "ACTIVE", tier: "GOLD", points: 840, wallet: 1200, orders: 42, spent: 18450 },
  { id: "C-902", name: "Ananya Sen", email: "ananya.sen@gmail.com", phone: "+91 99218 90122", status: "VERIFIED", tier: "SILVER", points: 310, wallet: 150, orders: 18, spent: 6200 },
  { id: "C-903", name: "Rohan Malhotra", email: "rohan.m@yahoo.com", phone: "+91 85951 91162", status: "SUSPENDED", tier: "BRONZE", points: 0, wallet: 0, orders: 5, spent: 1100 }
];

const MOCK_RESTAURANTS = [
  { id: "R-501", name: "Tuscany Grill", owner: "Giovanni Rossi", status: "ACTIVE", gst: "09AAACT9012F1Z4", fssai: "12723001000892", branches: 4, orders: 1240, revenue: 384000, rating: 4.8 },
  { id: "R-502", name: "Bikanervala Sweets", owner: "Shyam Sundar", status: "PENDING_VERIFY", gst: "09AAACB1102A1Z9", fssai: "11521008000412", branches: 2, orders: 850, revenue: 192000, rating: 4.2 },
  { id: "R-503", name: "Punjab Grill Delhi", owner: "Gurpreet Singh", status: "VACATION", gst: "07AAACP9912E1Z8", fssai: "10014011002012", branches: 5, orders: 2200, revenue: 750000, rating: 4.6 }
];

const MOCK_RIDERS = [
  { id: "DP-301", name: "Rider Shiva", vehicle: "TVS iQube (EV)", status: "ONLINE", bgCheck: "VERIFIED", acceptRate: "98%", rating: 4.9, wallet: 840 },
  { id: "DP-302", name: "Kabir Singh", vehicle: "Bajaj Pulsar 150", status: "OFFLINE", bgCheck: "PENDING", acceptRate: "85%", rating: 4.2, wallet: 150 },
  { id: "DP-303", name: "Anita Desai", vehicle: "Ather 450X (EV)", status: "BUSY", bgCheck: "VERIFIED", acceptRate: "94%", rating: 4.7, wallet: 920 }
];

const MOCK_PAYMENTS = [
  { id: "TX-9002", orderId: "OD-4402", customer: "Aditya Roy", method: "UPI (GPay)", status: "SUCCESS", amount: 450, tax: 22.5, ref: "stripe_ref_99218902" },
  { id: "TX-9003", orderId: "OD-4403", customer: "Divya Negi", method: "Credit Card", status: "FAILED", amount: 280, tax: 14.0, ref: "stripe_ref_err_9082", reason: "Insufficient balance" },
  { id: "TX-9004", orderId: "OD-4404", customer: "Kabir Mehra", method: "Wallet Balance", status: "SUCCESS", amount: 1200, tax: 60.0, ref: "wallet_tx_091289" }
];

const MOCK_REFUNDS = [
  { id: "RF-8812", orderId: "OD-4403", amount: 280, reason: "Order delivery time exceeded 90 mins", requestedBy: "Customer", status: "PENDING" },
  { id: "RF-8813", orderId: "OD-4390", amount: 150, reason: "Spilled items / missing sauce packaging", requestedBy: "Support Team", status: "APPROVED" }
];

const MOCK_TICKETS = [
  { id: "TK-101", customer: "Aditya Roy", category: "Delayed Delivery", priority: "HIGH", status: "OPEN", assignedAgent: "Agent Clara" },
  { id: "TK-102", customer: "Rohan Malhotra", category: "Incorrect Order Refund", priority: "CRITICAL", status: "ESCALATED", assignedAgent: "Agent Vikram" }
];

const MOCK_REVIEWS = [
  { id: "RV-501", customer: "Priyanshu V.", rating: 5, text: "Excellent pizza packaging, double seal was perfect!", status: "APPROVED" },
  { id: "RV-502", customer: "Ananya Sen", rating: 2, text: "Food arrived cold and garlic sticks were missing.", status: "REPORTED_SPAM" }
];

const MOCK_AUDIT_LOGS = [
  { id: "LOG-9001", admin: "Super Admin", action: "SUSPEND_USER", target: "C-903", time: "15:05", ip: "192.168.1.100" },
  { id: "LOG-9002", admin: "Platform Admin", action: "APPROVE_RESTAURANT", target: "R-501", time: "14:52", ip: "192.168.1.102" }
];

const AdminOpsCenter = () => {
  const [activeTab, setActiveTab] = useState('customers'); // customers, restaurants, riders, payments, coupons, support, audits
  const [searchQuery, setSearchQuery] = useState('');

  // Local state directory stores
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [restaurants, setRestaurants] = useState(MOCK_RESTAURANTS);
  const [riders, setRiders] = useState(MOCK_RIDERS);
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [refunds, setRefunds] = useState(MOCK_REFUNDS);
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [audits, setAudits] = useState(MOCK_AUDIT_LOGS);

  // Coupon Generator State
  const [couponForm, setCouponForm] = useState({
    code: "", type: "PERCENTAGE", discount: 15, minOrder: 300, maxDiscount: 100, expiry: ""
  });
  const [couponList, setCouponList] = useState([
    { code: "FOODIQ50", type: "PERCENTAGE", discount: 50, minOrder: 499, maxDiscount: 150 },
    { code: "FREEDEL", type: "FREE_DELIVERY", discount: 100, minOrder: 200, maxDiscount: 40 }
  ]);

  // Operational toggles
  const handleToggleCustomerStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' || currentStatus === 'VERIFIED' ? 'SUSPENDED' : 'ACTIVE';
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    
    // Add audit log
    const logEntry = {
      id: `LOG-${Date.now()}`,
      admin: "Super Admin",
      action: nextStatus === 'SUSPENDED' ? 'SUSPEND_USER' : 'REACTIVATE_USER',
      target: id,
      time: new Date().toTimeString().split(' ')[0],
      ip: "192.168.1.100"
    };
    setAudits(prev => [logEntry, ...prev]);
    toast.success(`Customer status updated to ${nextStatus}!`);
  };

  const handleVerifyCustomer = (id) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: 'VERIFIED' } : c));
    toast.success('Customer profile marked as VERIFIED.');
  };

  const handleAdjustWallet = (id, amount) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, wallet: c.wallet + amount } : c));
    toast.success(`Wallet balance corrected by ₹${amount}`);
  };

  const handleToggleRestaurantStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'VACATION' : 'ACTIVE';
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));
    toast.success(`Restaurant operating state shifted to ${nextStatus}.`);
  };

  const handleVerifyFssai = (id) => {
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: 'ACTIVE' } : r));
    toast.success('FSSAI documents verified & restaurant account activated!');
  };

  const handleApproveRefund = (id) => {
    setRefunds(prev => prev.map(rf => rf.id === id ? { ...rf, status: 'APPROVED' } : rf));
    toast.success(`Refund approved! Credit queued at gateway processor.`);
  };

  const handleRejectRefund = (id) => {
    setRefunds(prev => prev.map(rf => rf.id === id ? { ...rf, status: 'REJECTED' } : rf));
    toast.error(`Refund request rejected.`);
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!couponForm.code) {
      toast.error('Coupon code cannot be empty.');
      return;
    }
    setCouponList(prev => [...prev, { ...couponForm }]);
    setCouponForm({ code: "", type: "PERCENTAGE", discount: 15, minOrder: 300, maxDiscount: 100, expiry: "" });
    toast.success(`Coupon ${couponForm.code} successfully deployed platform-wide!`);
  };

  const handleModerateReview = (id, action) => {
    if (action === 'DELETE') {
      setReviews(prev => prev.filter(rv => rv.id !== id));
      toast.success('Review removed.');
    } else {
      setReviews(prev => prev.map(rv => rv.id === id ? { ...rv, status: 'APPROVED' } : rv));
      toast.success('Review verified & approved.');
    }
  };

  const handleResolveTicket = (id) => {
    setTickets(prev => prev.map(tk => tk.id === id ? { ...tk, status: 'CLOSED' } : tk));
    toast.success('Support ticket closed.');
  };

  // Export CSV simulation
  const handleExportData = (type) => {
    toast.success(`Exporting ${type} dataset as CSV. Download queued.`);
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-150 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-[#0F172A] border-b border-gray-800/60 py-6 px-4 md:px-12">
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
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  FoodIQ Operations Console
                </span>
                <span className="text-gray-500 text-xs font-bold">Phase 2: Management & Moderation</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Platform Operations <span className="text-cyan-500 font-light">Control Room</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Centralized registry directory for managing customers, vendors, branches, delivery partners, and payments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTRALIZED DIRECTORY TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        
        {/* Navigation tabs row */}
        <div className="flex flex-wrap gap-2.5 bg-[#0F1524] p-2 rounded-2.5xl border border-gray-850 mb-8">
          {[
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'restaurants', label: 'Restaurants', icon: Building },
            { id: 'riders', label: 'Riders', icon: Bike },
            { id: 'payments', label: 'Payments & Refunds', icon: CreditCard },
            { id: 'coupons', label: 'Coupons Builder', icon: Gift },
            { id: 'support', label: 'Support & Reviews', icon: MessageSquare },
            { id: 'audits', label: 'Audit Logs', icon: Lock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT RENDERING ENGINE ── */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CUSTOMERS DIRECTORY */}
          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Registered Customer Directory</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => handleExportData('customers')} variant="outline" className="px-4 py-2 text-xs font-black flex items-center gap-1.5">
                      <Download size={14} /> Export CSV
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Customer Details</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Tier</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Spent</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Wallet</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Status</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {customers.map(c => (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-cyan-400">{c.id}</td>
                          <td className="py-4">
                            <p className="text-white">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{c.email} • {c.phone}</p>
                          </td>
                          <td className="py-4">
                            <span className="text-amber-500">★ {c.tier}</span>
                          </td>
                          <td className="py-4 text-white">₹{c.spent}</td>
                          <td className="py-4 text-emerald-400">₹{c.wallet}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              c.status === 'ACTIVE' || c.status === 'VERIFIED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {c.status !== 'VERIFIED' && c.status !== 'SUSPENDED' && (
                              <button onClick={() => handleVerifyCustomer(c.id)} className="text-green-500 hover:underline">Verify</button>
                            )}
                            <button onClick={() => handleAdjustWallet(c.id, 100)} className="text-emerald-400 hover:underline">+₹100</button>
                            <button 
                              onClick={() => handleToggleCustomerStatus(c.id, c.status)} 
                              className={c.status === 'SUSPENDED' ? 'text-green-500 hover:underline' : 'text-red-500 hover:underline'}
                            >
                              {c.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: RESTAURANT & BRANCHES */}
          {activeTab === 'restaurants' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Restaurant Network & FSSAI Logs</h3>
                  <Button onClick={() => handleExportData('restaurants')} variant="outline" className="px-4 py-2 text-xs font-black flex items-center gap-1.5">
                    <Download size={14} /> Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Restaurant Name</th>
                        <th className="pb-3 font-black uppercase tracking-widest">GST & FSSAI</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Branches</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Rating</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Status</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {restaurants.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-cyan-400">{r.id}</td>
                          <td className="py-4 text-white">
                            <p>{r.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Owner: {r.owner}</p>
                          </td>
                          <td className="py-4">
                            <p className="text-gray-300">GST: {r.gst}</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">FSSAI: {r.fssai}</p>
                          </td>
                          <td className="py-4 text-white">{r.branches} nodes</td>
                          <td className="py-4 text-amber-500">★ {r.rating}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              r.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                              r.status === 'PENDING_VERIFY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {r.status === 'PENDING_VERIFY' && (
                              <button onClick={() => handleVerifyFssai(r.id)} className="text-green-500 hover:underline">Verify FSSAI</button>
                            )}
                            <button onClick={() => handleToggleRestaurantStatus(r.id, r.status)} className="text-cyan-400 hover:underline">Vacation mode</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: RIDERS DIRECTORY */}
          {activeTab === 'riders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Delivery Partner Verification Console</h3>
                  <Button onClick={() => handleExportData('riders')} variant="outline" className="px-4 py-2 text-xs font-black flex items-center gap-1.5">
                    <Download size={14} /> Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">Rider Details</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Vehicle</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Accept Rate</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Background Check</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Wallet</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {riders.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-white">
                            <p>{r.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">ID: {r.id} • {r.status}</p>
                          </td>
                          <td className="py-4 text-gray-300">{r.vehicle}</td>
                          <td className="py-4 text-white">{r.acceptRate}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              r.bgCheck === 'VERIFIED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {r.bgCheck}
                            </span>
                          </td>
                          <td className="py-4 text-emerald-400">₹{r.wallet}</td>
                          <td className="py-4 text-right space-x-2">
                            <button onClick={() => toast.success(`Zone settings updated for ${r.name}`)} className="text-cyan-400 hover:underline">Zones</button>
                            <button onClick={() => toast.success(`Earnings adjusted`)} className="text-emerald-400 hover:underline">Pay adjustment</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: PAYMENTS & REFUNDS */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              
              {/* Transactions grid */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Gateway Transaction Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">Transaction ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Customer</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Method</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Amount</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Ref</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-cyan-400">{p.id}</td>
                          <td className="py-4 text-white">{p.customer}</td>
                          <td className="py-4 text-gray-300">{p.method}</td>
                          <td className="py-4 text-white">₹{p.amount}</td>
                          <td className="py-4 text-gray-450">{p.ref}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              p.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refund Management */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Refund Escalation Queue</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">Refund ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Reason</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Amount</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Status</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {refunds.map(rf => (
                        <tr key={rf.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-cyan-400">{rf.id}</td>
                          <td className="py-4 text-gray-300">
                            <p>{rf.reason}</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">Requested by: {rf.requestedBy}</p>
                          </td>
                          <td className="py-4 text-primary">₹{rf.amount}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              rf.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                              rf.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {rf.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {rf.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleApproveRefund(rf.id)} className="text-green-500 hover:underline">Approve</button>
                                <button onClick={() => handleRejectRefund(rf.id)} className="text-red-500 hover:underline">Reject</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 5: COUPONS BUILDER */}
          {activeTab === 'coupons' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Form */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6 lg:col-span-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Deploy Coupon Code</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-bold">
                  <div className="space-y-1">
                    <label className="text-gray-400">Coupon Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MONSOON30"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400">Discount type</label>
                    <select 
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                      className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none"
                    >
                      <option value="PERCENTAGE">Percentage Discount (%)</option>
                      <option value="FLAT">Flat Discount (₹)</option>
                      <option value="FREE_DELIVERY">Free Delivery</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400">Discount Value</label>
                    <input 
                      type="number"
                      value={couponForm.discount}
                      onChange={(e) => setCouponForm({ ...couponForm, discount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400">Minimum Order Value</label>
                    <input 
                      type="number"
                      value={couponForm.minOrder}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrder: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#070A13] border border-gray-800 rounded-xl p-3 text-white outline-none"
                    />
                  </div>

                  <Button type="submit" className="w-full py-3 rounded-xl font-black uppercase tracking-wider">Deploy Coupon</Button>
                </form>
              </div>

              {/* Roster of active coupons */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6 lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Active Coupons</h3>
                <div className="space-y-3 text-xs font-bold">
                  {couponList.map((c, i) => (
                    <div key={i} className="p-4 bg-[#070A13] border border-gray-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-primary font-black text-sm block">{c.code}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Min Order: ₹{c.minOrder} • Cap: ₹{c.maxDiscount}</span>
                      </div>
                      <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded-xl text-[10px] font-black uppercase">
                        {c.type === 'PERCENTAGE' ? `${c.discount}% Off` : c.type === 'FREE_DELIVERY' ? 'Free Shipping' : `₹${c.discount} Off`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 6: SUPPORT & REVIEWS */}
          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              
              {/* Ticket Roster */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Platform Support Tickets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">Ticket ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Customer</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Category</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Priority</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Status</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {tickets.map(tk => (
                        <tr key={tk.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-cyan-400">{tk.id}</td>
                          <td className="py-4 text-white">{tk.customer}</td>
                          <td className="py-4 text-gray-300">{tk.category}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              tk.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {tk.priority}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-gray-300">{tk.status}</span>
                          </td>
                          <td className="py-4 text-right">
                            {tk.status !== 'CLOSED' && (
                              <button onClick={() => handleResolveTicket(tk.id)} className="text-green-500 hover:underline">Mark Resolved</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Review Moderation */}
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Review Moderation Center</h3>
                <div className="space-y-4 text-xs font-bold">
                  {reviews.map(rv => (
                    <div key={rv.id} className="p-4 bg-[#070A13] border border-gray-850 rounded-2.5xl flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black">{rv.customer}</span>
                          <span className="text-amber-500">★ {rv.rating} stars</span>
                          <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/20">{rv.status}</span>
                        </div>
                        <p className="text-gray-300 italic">"{rv.text}"</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <button onClick={() => handleModerateReview(rv.id, 'APPROVE')} className="text-green-500 hover:underline">Approve</button>
                        <button onClick={() => handleModerateReview(rv.id, 'DELETE')} className="text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'audits' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Immutable Platform Audit Trail</h3>
                  <Badge variant="info">ReadOnly Log Feed</Badge>
                </div>
                
                <div className="space-y-3 font-bold text-xs">
                  {audits.map((l, i) => (
                    <div key={i} className="p-3 bg-[#070A13] border border-gray-850 rounded-2xl flex items-center justify-between text-gray-300">
                      <div>
                        <p className="text-white">Admin action: <span className="text-primary font-black uppercase">{l.action}</span> on target {l.target}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Admin: {l.admin} • IP: {l.ip}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold shrink-0">{l.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};

export default AdminOpsCenter;
