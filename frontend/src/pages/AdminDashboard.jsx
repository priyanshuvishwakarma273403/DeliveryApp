import { motion } from 'framer-motion';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Package,
  Plus,
  MoreVertical,
  Search,
  LayoutDashboard,
  Home as HomeIcon,
  Bell,
  Cpu,
  Activity,
  Leaf,
  Sliders,
  Eye,
  Globe,
  FlaskConical,
  Network,
  Image as ImageIcon
} from 'lucide-react';


import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

import { useState, useEffect } from 'react';
import apiClient from '../api/axios';

const CHART_DATA = [
  { day: 'Mon', revenue: 4000, orders: 24 },
  { day: 'Tue', revenue: 3000, orders: 13 },
  { day: 'Wed', revenue: 2000, orders: 98 },
  { day: 'Thu', revenue: 2780, orders: 39 },
  { day: 'Fri', revenue: 1890, orders: 48 },
  { day: 'Sat', revenue: 2390, orders: 38 },
  { day: 'Sun', revenue: 3490, orders: 43 },
];

const PIE_DATA = [
  { name: 'Delivered', value: 400, color: '#16A34A' },
  { name: 'Processing', value: 300, color: '#3B82F6' },
  { name: 'Cancelled', value: 100, color: '#EF4444' },
  { name: 'Out for Delivery', value: 200, color: '#F59E0B' },
];

const RECENT_ORDERS = [
  { id: 'ORD-1234', customer: 'John Doe', restaurant: 'Burger King 42', amount: 450, status: 'DELIVERED' },
  { id: 'ORD-1235', customer: 'Jane Smith', restaurant: 'Pizza Hut', amount: 890, status: 'PROCESSING' },
  { id: 'ORD-1236', customer: 'Mike Johnson', restaurant: 'Subway', amount: 320, status: 'OUT_FOR_DELIVERY' },
];

import { useOrderSocket } from '../hooks/useOrderSocket';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: '0',
    totalRevenue: '₹0',
    totalCustomers: '0',
    activeRestaurants: '0'
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await apiClient.get('/admin/analytics/stats');
        if (statsRes.data.success) {
          const data = statsRes.data.data;
          setStats({
            totalOrders: data.totalOrders.toLocaleString(),
            totalRevenue: `₹${(data.totalRevenue / 100000).toFixed(1)}L`,
            totalCustomers: data.totalCustomers.toLocaleString(),
            activeRestaurants: data.activeRestaurants.toLocaleString()
          });
        }
        
        const ordersRes = await apiClient.get('/orders');
        if (ordersRes.data?.success) {
           const reversedOrders = [...ordersRes.data.data].reverse();
           setRecentOrders(reversedOrders.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useOrderSocket((updatedOrder) => {
    setRecentOrders(prev => {
      const index = prev.findIndex(o => o.id === updatedOrder.id);
      if (index !== -1) {
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        toast.success(`Order #${updatedOrder.id} status updated to ${updatedOrder.status}`, {
          icon: '🔔',
          duration: 4000
        });
        return newOrders;
      } else {
        toast.success('New order received!', {
          icon: '🛍️',
          duration: 5000
        });
        const updatedList = [updatedOrder, ...prev];
        return updatedList.slice(0, 5);
      }
    });
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await apiClient.patch(`/orders/${id}/status?status=${status}`);
      if (response.data?.success) {
        setRecentOrders(prev => prev.map(o => o.id === id ? response.data.data : o));
        toast.success('Status updated successfully');
      }
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Update failed');
    }
  };

  const getAvailableActions = (status) => {
    switch (status) {
      case 'PLACED':
        return [
          { label: 'Confirm Order', val: 'CONFIRMED' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-55' }
        ];
      case 'CONFIRMED':
        return [
          { label: 'Mark Preparing', val: 'PREPARING' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-55' }
        ];
      case 'PREPARING':
        return [
          { label: 'Mark Packed', val: 'PACKED' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-55' }
        ];
      case 'PACKED':
        return [
          { label: 'Mark Ready', val: 'READY_FOR_PICKUP' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-55' }
        ];
      case 'READY_FOR_PICKUP':
        return [
          { label: 'Out for Delivery', val: 'OUT_FOR_DELIVERY' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-55' }
        ];
      case 'OUT_FOR_DELIVERY':
        return [
          { label: 'Mark Delivered', val: 'DELIVERED' }
        ];
      default:
        return [];
    }
  };

  const DYNAMIC_STATS = [
    { label: 'Total Orders', value: stats.totalOrders, color: 'bg-blue-500', icon: ShoppingBag, change: '+12.5%' },
    { label: 'Total Revenue', value: stats.totalRevenue, color: 'bg-green-500', icon: DollarSign, change: '+8.2%' },
    { label: 'Total Customers', value: stats.totalCustomers, color: 'bg-orange-500', icon: Users, change: '+15.3%' },
    { label: 'Active Restaurants', value: stats.activeRestaurants, color: 'bg-primary', icon: Package, change: '+5.0%' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 h-auto lg:h-screen bg-white border-r border-gray-100 p-8 lg:sticky lg:top-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-primary p-1.5 rounded-lg">
              <span className="text-white font-black text-xl tracking-tighter">F</span>
            </div>
            <span className="text-xl font-black text-primary">FoodIQAdmin</span>
          </div>

          <nav className="space-y-4">
            <Link to="/admin" className="flex items-center gap-4 text-primary font-black bg-primary/5 p-4 rounded-2xl">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link to="/admin/restaurants" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
              <Package size={20} /> Restaurants
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
              <ShoppingBag size={20} /> Manage Orders
            </Link>
            <Link to="/admin/copilot" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Cpu size={20} /> AI Copilot
            </Link>
            <Link to="/admin/ops" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <Activity size={20} /> AI Mission Control
            </Link>
            <Link to="/admin/supply-waste" className="flex items-center gap-4 text-emerald-600 font-black hover:text-emerald-500 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 transition-all">
              <Leaf size={20} /> Supply & Waste Intel
            </Link>
            <Link to="/admin/customer-intel" className="flex items-center gap-4 text-indigo-600 font-black hover:text-indigo-500 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 transition-all">
              <Users size={20} /> Customer Intel
            </Link>
            <Link to="/admin/simulations" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <Sliders size={20} /> AI Simulations
            </Link>
            <Link to="/admin/kitchen-vision" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Eye size={20} /> Kitchen Vision
            </Link>
            <Link to="/admin/business-forecast" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <TrendingUp size={20} /> Business Forecast
            </Link>
            <Link to="/admin/knowledge-graph" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Network size={20} /> Knowledge Graph
            </Link>
            <Link to="/admin/experiments" className="flex items-center gap-4 text-purple-600 font-black hover:text-purple-500 bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10 transition-all">
              <FlaskConical size={20} /> AI Experiments
            </Link>
            <Link to="/admin/global-intel" className="flex items-center gap-4 text-emerald-600 font-black hover:text-emerald-500 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 transition-all">
              <Globe size={20} /> Global Intel
            </Link>
            <Link to="/admin/image-verification" className="flex items-center gap-4 text-amber-600 font-black hover:text-amber-500 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 transition-all">
              <ImageIcon size={20} /> AI Image Audit
            </Link>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Link to="/" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
                <HomeIcon size={20} /> Back to Home
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 lg:p-12 overflow-hidden">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-text-primary">System Overview</h1>
              <p className="text-text-secondary font-medium mt-1">Real-time performance analytics</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Global search..." className="outline-none text-xs font-medium w-36" />
              </div>
              <Link to="/admin/copilot">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-cyan-200 text-cyan-600 hover:bg-cyan-50"><Cpu size={14} /> AI Copilot</Button>
              </Link>
              <Link to="/admin/ops">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-violet-200 text-violet-600 hover:bg-violet-50"><Activity size={14} /> AI Ops</Button>
              </Link>
              <Link to="/admin/supply-waste">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-55"><Leaf size={14} /> Supply & Waste</Button>
              </Link>
              <Link to="/admin/customer-intel">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Users size={14} /> Customer Intel</Button>
              </Link>
              <Link to="/admin/simulations">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-violet-200 text-violet-600 hover:bg-violet-50"><Sliders size={14} /> Simulations</Button>
              </Link>
              <Link to="/admin/kitchen-vision">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-cyan-200 text-cyan-600 hover:bg-cyan-50"><Eye size={14} /> Vision</Button>
              </Link>
              <Link to="/admin/business-forecast">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-violet-200 text-violet-600 hover:bg-violet-50"><TrendingUp size={14} /> Forecast</Button>
              </Link>
              <Link to="/admin/knowledge-graph">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-cyan-200 text-cyan-600 hover:bg-cyan-50"><Network size={14} /> Graph</Button>
              </Link>
              <Link to="/admin/experiments">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-purple-200 text-purple-600 hover:bg-purple-50"><FlaskConical size={14} /> A/B Tests</Button>
              </Link>
              <Link to="/admin/global-intel">
                <Button variant="secondary" className="px-4 py-2 rounded-xl text-xs gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50"><Globe size={14} /> Global Intel</Button>
              </Link>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {DYNAMIC_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-gray-100 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 h-24 w-24 ${stat.color} opacity-5 rounded-bl-[100px] transition-all group-hover:scale-110`} />
                <div className={`h-14 w-14 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200`}>
                   <stat.icon size={28} />
                </div>
                <h3 className="text-3xl font-black text-text-primary mb-1">{stat.value}</h3>
                <p className="text-sm font-bold text-text-secondary flex items-center gap-2">
                   {stat.label} <span className="text-green-500 font-black">{stat.change}</span>
                </p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
             <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-premium border border-gray-100">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xl font-black text-text-primary">Revenue & Order Trends</h3>
                   <div className="flex gap-2">
                      <Badge variant="info">Weekly</Badge>
                      <Badge variant="gray">Monthly</Badge>
                   </div>
                </div>
                <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={CHART_DATA}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                         <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                            dy={10}
                         />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                         />
                         <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                         />
                         <Line type="monotone" dataKey="revenue" stroke="#E23744" strokeWidth={4} dot={{ r: 6, fill: '#E23744', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                         <Line type="monotone" dataKey="orders" stroke="#FC8019" strokeWidth={4} dot={{ r: 6, fill: '#FC8019', strokeWidth: 3, stroke: '#fff' }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-gray-100 flex flex-col items-center">
                <h3 className="text-xl font-black text-text-primary w-full mb-10">Order Status</h3>
                <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={PIE_DATA} innerRadius={60} outerRadius={100} paddingAngle={10} dataKey="value">
                            {PIE_DATA.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                   {PIE_DATA.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-xs font-bold text-text-secondary">{item.name}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-gray-100 overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-text-primary">Recent Orders</h3>
                <Link to="/admin/orders" className="text-primary font-bold text-sm hover:underline">View All Orders</Link>
             </div>
             
             <div className="overflow-x-auto md:overflow-visible pb-24 md:pb-0">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-gray-100">
                         <th className="pb-6 text-xs font-black text-gray-450 uppercase tracking-widest">Order ID</th>
                         <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                         <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Restaurant</th>
                         <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                         <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                         <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                       </tr>
                   </thead>
                   <tbody>
                      {recentOrders.map((order, index) => {
                         const showUpward = index >= Math.max(0, recentOrders.length - 2);
                         return (
                          <tr key={order.id} className="border-b border-gray-50 last:border-0 group">
                             <td className="py-6 align-middle">
                                <span className="text-sm font-black text-text-primary">#{order.id}</span>
                             </td>
                             <td className="py-6 align-middle">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black">{order.customerName?.charAt(0)}</div>
                                   <span className="text-sm font-bold">{order.customerName}</span>
                                </div>
                             </td>
                             <td className="py-6 align-middle">
                                <span className="text-sm font-medium text-text-secondary">{order.restaurantName}</span>
                             </td>
                             <td className="py-6 align-middle text-sm font-black text-primary">₹{order.totalAmount}</td>
                             <td className="py-6 align-middle">
                                <Badge variant={
                                  order.status === 'DELIVERED' ? 'success' : 
                                  order.status === 'CANCELLED' ? 'error' : 
                                  order.status === 'PLACED' ? 'info' : 'warning'
                                }>
                                  {order.status}
                                </Badge>
                             </td>
                             <td className="py-6 align-middle text-right relative">
                               <div className="relative dropdown-container inline-block">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setActiveDropdownId(activeDropdownId === order.id ? null : order.id);
                                   }}
                                   className="text-gray-300 hover:text-primary transition-colors p-1"
                                 >
                                   <MoreVertical size={20} />
                                 </button>
                                 {activeDropdownId === order.id && getAvailableActions(order.status).length > 0 && (
                                     <div className={`absolute right-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden text-left ${showUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                       {getAvailableActions(order.status).map((action, i) => (
                                         <button 
                                           key={i}
                                           onClick={() => {
                                             handleStatusUpdate(order.id, action.val);
                                             setActiveDropdownId(null);
                                           }}
                                           className={`w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors ${action.color || 'text-text-secondary hover:text-primary'}`}
                                         >
                                           {action.label}
                                         </button>
                                       ))}
                                     </div>
                                   )}
                               </div>
                             </td>
                          </tr>
                         );
                      })}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500 font-medium">No recent orders.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
