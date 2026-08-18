import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, CheckCircle2, XCircle, Clock, Star, Users, ArrowUpRight, 
  ArrowDownRight, AlertTriangle, MapPin, Edit2, Trash2, Search, SlidersHorizontal, 
  Check, RefreshCw, Sparkles, Coffee, ShieldAlert, Award
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { subscribeTelemetry } from '../utils/telemetrySync';
import { playNotificationTick, playAlertBleep } from '../utils/audioSynth';

const LOCAL_OUTLET = {
  name: "Sector 18 Noida Branch",
  manager: "Amit Verma",
  status: "OPEN",
  ordersToday: 82,
  salesToday: 24500,
  averagePrep: 14.2
};

const INITIAL_INVENTORY = [
  { id: 'INV-01', name: 'Fresh Pizza Sourdough Dough', current: '12 kg', min: '25 kg', status: 'CRITICAL' },
  { id: 'INV-02', name: 'Fresh Mozzarella Cheese blocks', current: '4.8 kg', min: '15 kg', status: 'LOW' },
  { id: 'INV-03', name: 'San Marzano Tomato puree', current: '18 Litres', min: '15 Litres', status: 'SUFFICIENT' },
  { id: 'INV-04', name: 'Fresh Basil leaves bundle', current: '0.2 kg', min: '2.0 kg', status: 'CRITICAL' }
];

const MOCK_ORDERS = [
  { id: "ORD-9832", customerName: "Aarav Sharma", items: "1x Margherita Pizza, 1x Tiramisu", total: 548, status: "PENDING", date: "15:42 PM", instructions: "Make the pizza extra thin crust, please." },
  { id: "ORD-9831", customerName: "Priya Patel", items: "2x Truffle Pasta", total: 858, status: "PREPARING", date: "15:30 PM", instructions: "No mushrooms if possible." },
  { id: "ORD-9830", customerName: "Rohit Verma", items: "1x Garlic Bread, 1x Coke", total: 249, status: "READY", date: "15:20 PM", instructions: "" }
];

const MOCK_REVIEWS = [
  { id: "REV-201", customerName: "Ananya Roy", rating: 5, comment: "The wood-fired pizza was absolutely amazing! Reminds me of Naples. Great packaging too.", reply: "" },
  { id: "REV-202", customerName: "Vikram Malhotra", rating: 2, comment: "Pasta was a bit cold when it arrived. The truffle flavour was good though.", reply: "" }
];

const SHIFT_STAFF = [
  { name: 'Giovanni (Head Chef)', station: 'Pizza Oven', status: 'ON_DUTY', shift: 'Morning' },
  { name: 'Sarah (Assistant Chef)', station: 'Saute Station', status: 'ON_DUTY', shift: 'Morning' },
  { name: 'Rajesh (Kitchen helper)', station: 'Prep Station', status: 'OFF_DUTY', shift: 'Evening' }
];

const BranchManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [outletStatus, setOutletStatus] = useState(LOCAL_OUTLET.status);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [replies, setReplies] = useState({});

  // Real-Time POS Sync to Live Orders
  useEffect(() => {
    const unsubscribe = subscribeTelemetry((event) => {
      if (event.type === 'CASHIER_ORDER_CREATED') {
        const newOrder = event.payload;
        const formattedOrder = {
          id: newOrder.id.replace('KD-', 'ORD-'),
          customerName: newOrder.customer,
          items: newOrder.items.map(item => `${item.qty}x ${item.name}`).join(', '),
          total: newOrder.items.reduce((sum, item) => sum + (item.qty * 300), 0),
          status: 'PENDING',
          date: newOrder.timeReceived,
          instructions: newOrder.specialInstructions
        };
        setOrders(prev => {
          if (prev.some(o => o.id === formattedOrder.id)) return prev;
          return [formattedOrder, ...prev];
        });
        playAlertBleep();
        toast(`Manager Alert: POS Order ${formattedOrder.id} generated!`, { icon: '🛎️' });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = (status) => {
    setOutletStatus(status);
    playNotificationTick();
    toast.success(`Outlet is now marked as ${status}`);
  };

  const handleOrderTransition = (orderId, nextStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    playNotificationTick();
    toast.success(`Order ${orderId} moved to ${nextStatus}`);
  };

  const handleReviewReply = (revId) => {
    const text = replies[revId];
    if (!text) return;
    setReviews(reviews.map(r => r.id === revId ? { ...r, reply: text } : r));
    setReplies({ ...replies, [revId]: '' });
    playNotificationTick();
    toast.success('Reply published to customer feed!');
  };

  const handleReorder = (itemName) => {
    playNotificationTick();
    toast.success(`Procurement requisition raised for ${itemName}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col lg:flex-row">
      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden bg-[#1E293B] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#FC8019] rounded-lg flex items-center justify-center font-black text-white">
            IQ
          </div>
          <div>
            <h2 className="text-xs font-black tracking-tight">FoodIQ Manager</h2>
            <p className="text-[8px] text-gray-400 font-bold uppercase">Noida Branch</p>
          </div>
        </div>
        
        <select 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl outline-none"
        >
          <option value="orders">Live Orders ({orders.filter(o => o.status !== 'DELIVERED').length})</option>
          <option value="inventory">Stock & Inventory</option>
          <option value="staff">Shift Roster</option>
          <option value="reviews">Customer Reviews</option>
        </select>
      </header>

      {/* Sidebar navigation (desktop) */}
      <aside className="hidden lg:flex w-full lg:w-72 bg-[#1E293B] text-white p-6 shrink-0 flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#FC8019] rounded-xl flex items-center justify-center font-black shadow-lg text-white">
              IQ
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">FoodIQ Outlet</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Branch Operations</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-black uppercase">
              <span>{LOCAL_OUTLET.name}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['OPEN', 'BUSY', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    outletStatus === st 
                      ? 'bg-[#FC8019] text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'orders', label: 'Live Orders', icon: ShoppingBag, badge: orders.filter(o => o.status !== 'DELIVERED').length },
              { id: 'inventory', label: 'Stock & Inventory', icon: AlertTriangle },
              { id: 'staff', label: 'Shift Roster', icon: Users },
              { id: 'reviews', label: 'Customer Reviews', icon: Star },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#FC8019] text-white shadow-lg shadow-orange-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Branch Dashboard v1.1</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Coffee className="text-[#FC8019]" /> Branch Operations Center
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Authorized: {LOCAL_OUTLET.manager} (Branch Manager) • Sector 18 Noida Outlet</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-rose-500 animate-bounce" /> 2 critical shortages
            </span>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>POS Connection: Sync Active</span>
            </div>
          </div>
        </header>

        {/* Local Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Today's Sales</span>
            <p className="text-2xl font-black text-slate-900">₹{LOCAL_OUTLET.salesToday.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">Total volume today</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Active Tickets</span>
            <p className="text-2xl font-black text-slate-900">{orders.filter(o => o.status !== 'DELIVERED').length}</p>
            <p className="text-[9px] text-orange-500 font-bold">Kitchen load: Moderate</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Avg Prep Speed</span>
            <p className="text-2xl font-black text-slate-900">{LOCAL_OUTLET.averagePrep} min</p>
            <div className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -0.8m faster than target
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Customer Sentiment</span>
            <p className="text-2xl font-black text-slate-900">4.8 / 5.0</p>
            <p className="text-[9px] text-slate-400">Based on recent ratings</p>
          </div>
        </div>

        {/* Dynamic tabs components */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Live Orders Pipeline */}
            {activeTab === 'orders' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending */}
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg flex justify-between items-center">
                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Pending Acceptance</span>
                    <span className="bg-amber-500 text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center">{orders.filter(o => o.status === 'PENDING').length}</span>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'PENDING').map((o) => (
                      <div key={o.id} className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-xs font-black text-slate-950">
                          <span>{o.id}</span>
                          <span>{o.date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{o.items}</p>
                        {o.instructions && <p className="text-[10px] text-rose-500 font-bold bg-rose-50/50 p-2 rounded-lg border border-rose-100 font-semibold">💡 {o.instructions}</p>}
                        <div className="pt-2 flex gap-2">
                          <button onClick={() => handleOrderTransition(o.id, 'PREPARING')} className="flex-1 py-1.5 bg-[#FC8019] text-white font-black text-[10px] rounded-lg">Accept</button>
                          <button onClick={() => handleOrderTransition(o.id, 'CANCELLED')} className="py-1.5 px-2 bg-slate-50 border text-red-500 font-black text-[10px] rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preparing */}
                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-lg flex justify-between items-center">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-wider">In Kitchen cooking</span>
                    <span className="bg-blue-500 text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center">{orders.filter(o => o.status === 'PREPARING').length}</span>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'PREPARING').map((o) => (
                      <div key={o.id} className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-xs font-black text-slate-950">
                          <span>{o.id}</span>
                          <span className="text-[9px] text-blue-500 font-black uppercase">Cooking</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{o.items}</p>
                        <div className="pt-2">
                          <button onClick={() => handleOrderTransition(o.id, 'READY')} className="w-full py-1.5 bg-blue-600 text-white font-black text-[10px] rounded-lg">Mark Ready</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ready */}
                <div className="space-y-4">
                  <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded-lg flex justify-between items-center">
                    <span className="text-xs font-black text-green-700 uppercase tracking-wider">Ready / Packing</span>
                    <span className="bg-green-500 text-white text-[10px] font-black h-5 px-2 rounded-full flex items-center justify-center">{orders.filter(o => o.status === 'READY').length}</span>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'READY').map((o) => (
                      <div key={o.id} className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-xs font-black text-slate-950">
                          <span>{o.id}</span>
                          <span className="text-[9px] text-green-500 font-black uppercase">Packed</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{o.items}</p>
                        <div className="pt-2">
                          <button onClick={() => handleOrderTransition(o.id, 'DELIVERED')} className="w-full py-1.5 bg-green-600 text-white font-black text-[10px] rounded-lg">Handover to Rider</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stock and Inventory */}
            {activeTab === 'inventory' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black uppercase text-slate-900">Local Raw Materials Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-bold text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                        <th className="pb-4">Material / Item</th>
                        <th className="pb-4">Current Stock</th>
                        <th className="pb-4">Min. Threshold</th>
                        <th className="pb-4">Stock Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-none">
                          <td className="py-4 font-black text-slate-900">{item.name}</td>
                          <td className="py-4 text-slate-700">{item.current}</td>
                          <td className="py-4 text-slate-400">{item.min}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              item.status === 'CRITICAL' ? 'bg-red-50 text-red-600 border border-red-200' :
                              item.status === 'LOW' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-green-50 text-green-600 border border-green-200'
                            }`}>{item.status}</span>
                          </td>
                          <td className="py-4 text-right">
                            {item.status !== 'SUFFICIENT' && (
                              <button 
                                onClick={() => handleReorder(item.name)}
                                className="py-1 px-3 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-slate-800"
                              >
                                Reorder
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Staff Shifts */}
            {activeTab === 'staff' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-900">Branch Employee Duty Roster</h3>
                <div className="divide-y divide-slate-100">
                  {SHIFT_STAFF.map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 font-bold text-xs">
                      <div>
                        <p className="text-slate-900 font-black">{staff.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase mt-0.5">Station: {staff.station} • Shift: {staff.shift}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        staff.status === 'ON_DUTY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                      }`}>{staff.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews replies */}
            {activeTab === 'reviews' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black uppercase text-slate-900">Customer Feedback & Response Desk</h3>
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 border rounded-2xl space-y-3 font-bold text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">{rev.customerName}</span>
                        <span className="text-yellow-600">★ {rev.rating} / 5</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-semibold italic">"{rev.comment}"</p>
                      {rev.reply ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                          <span className="text-[9px] font-black uppercase tracking-wider block mb-1">Manager Reply:</span>
                          <p className="text-[11px] leading-relaxed">{rev.reply}</p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Write professional response..."
                            value={replies[rev.id] || ''}
                            onChange={(e) => setReplies({ ...replies, [rev.id]: e.target.value })}
                            className="flex-1 bg-white border rounded-xl px-3 py-2 outline-none"
                          />
                          <Button onClick={() => handleReviewReply(rev.id)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">Publish Reply</Button>
                        </div>
                      )}
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

export default BranchManagerDashboard;
