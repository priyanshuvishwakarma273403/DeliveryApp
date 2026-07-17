import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, ChevronRight, Clock, MapPin, 
  Package, RotateCcw, Search, Filter, 
  HelpCircle, Receipt, TrendingUp, CheckCircle2,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';
import orderService from '../services/orderService';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useAuthStore } from '../store/authStore';
import AIImage from '../components/common/AIImage';

const statusConfig = {
  PLACED: { label: 'Placed', variant: 'info', color: 'text-blue-500', step: 1 },
  CONFIRMED: { label: 'Confirmed', variant: 'info', color: 'text-blue-600', step: 1 },
  PREPARING: { label: 'Preparing', variant: 'warning', color: 'text-orange-500', step: 2 },
  PACKED: { label: 'Packed', variant: 'warning', color: 'text-amber-500', step: 2 },
  READY_FOR_PICKUP: { label: 'Ready', variant: 'warning', color: 'text-purple-500', step: 3 },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'warning', color: 'text-indigo-500', step: 3 },
  DELIVERED: { label: 'Delivered', variant: 'success', color: 'text-green-500', step: 4 },
  CANCELLED: { label: 'Cancelled', variant: 'error', color: 'text-red-500', step: 0 },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { client } = useWebSocket();
  const { user } = useAuthStore();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!client || !user?.id) return;
    const sub = client.subscribe(`/topic/order/${user.id}`, (message) => {
      if (message.body) {
        const updatedOrder = JSON.parse(message.body);
        setOrders(prev => {
          const index = prev.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            const copy = [...prev];
            copy[index] = updatedOrder;
            return copy;
          } else {
            return [updatedOrder, ...prev];
          }
        });
      }
    });
    return () => sub.unsubscribe();
  }, [client, user?.id]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.id?.toString().includes(searchQuery);
    const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    return activeTab === 'active' ? (isActive && matchesSearch) : (!isActive && matchesSearch);
  });

  const totalSpent = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Orders Made', value: orders.length, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Saved Coins', value: user?.wallet?.balance || 0, icon: Star, color: 'text-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-bold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-[#F8F9FB] pt-16 md:pt-24">
      <div className="container mx-auto px-4 lg:max-w-6xl">
        
        {/* ── Stats Header ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 flex items-center gap-4"
            >
              <div className={cn("h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center", stat.color)}>
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-[#1C1C1C] leading-none">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Main Dashboard ── */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1C1C1C] tracking-tighter">Order Dashboard</h1>
                <div className="flex items-center gap-6 mt-4">
                  <button 
                    onClick={() => setActiveTab('active')}
                    className={cn(
                      "text-sm font-black transition-all relative pb-2 px-1",
                      activeTab === 'active' ? "text-primary" : "text-gray-400 hover:text-[#1C1C1C]"
                    )}
                  >
                    Active Orders
                    {activeTab === 'active' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('past')}
                    className={cn(
                      "text-sm font-black transition-all relative pb-2 px-1",
                      activeTab === 'past' ? "text-primary" : "text-gray-400 hover:text-[#1C1C1C]"
                    )}
                  >
                    Order History
                    {activeTab === 'past' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                  </button>
                </div>
              </div>

              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by restaurant or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 space-y-4">
            <AnimatePresence mode="wait">
              {filteredOrders.length > 0 ? (
                <motion.div
                  key={activeTab + searchQuery}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {filteredOrders.map((order, idx) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      idx={idx} 
                      isActive={activeTab === 'active'} 
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24"
                >
                  <div className="h-20 w-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1C1C1C] mb-2">No orders found</h3>
                  <p className="text-[#686B78] font-medium max-w-xs mx-auto">Try adjusting your search or browse our top restaurants.</p>
                  <Link to="/restaurants">
                    <Button className="mt-8 rounded-2xl px-10 py-4 h-auto font-black text-sm">Explore Restaurants</Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order, idx, isActive }) => {
  const config = statusConfig[order.status] || { label: order.status, variant: 'gray', color: 'text-gray-500', step: 1 };
  const totalItemsCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const firstItemImage = order.orderItems?.[0]?.menuItemImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';
  const orderDate = dayjs(order.createdAt).format('MMM DD, YYYY hh:mm A');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-white rounded-[2.5rem] border border-gray-100 hover:border-primary/20 p-5 md:p-8 transition-all hover:shadow-2xl hover:shadow-primary/5 group"
    >
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        {/* Restaurant Profile */}
        <div className="flex items-center gap-4 flex-1">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-[2rem] overflow-hidden shrink-0 border-4 border-gray-50 shadow-inner">
            <AIImage 
              src={firstItemImage} 
              dishName={order.orderItems?.[0]?.menuItemName || "Dish"} 
              restaurantName={order.restaurantName || "FoodIQ"}
              alt={order.restaurantName} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.variant} className="text-[9px] uppercase tracking-widest font-black px-2.5 py-1">
                {config.label}
              </Badge>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{order.id}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#1C1C1C] tracking-tight group-hover:text-primary transition-colors">
              {order.restaurantName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#686B78] font-bold mt-1">
              <Clock size={14} className="text-gray-300" />
              {orderDate}
            </div>
          </div>
        </div>

        {/* Price & Summary */}
        <div className="flex items-center md:flex-col md:items-end gap-6 md:gap-2 px-4 md:px-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</p>
            <p className="text-2xl font-black text-primary leading-tight">₹{order.totalAmount}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</p>
            <p className="text-sm font-black text-[#1C1C1C] leading-tight">{totalItemsCount} Packs</p>
          </div>
        </div>
      </div>

      {/* ── Conditional Footer ── */}
      <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {isActive ? (
          <div className="flex-1 max-w-xl">
             <div className="flex justify-between mb-3 px-1">
                <p className="text-xs font-black text-[#1C1C1C] uppercase tracking-widest">Live Status Tracker</p>
                <p className={cn("text-xs font-black uppercase", config.color)}>{config.label}</p>
             </div>
             <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex-1 h-2 rounded-full relative">
                     <div className="absolute inset-0 bg-gray-100 rounded-full" />
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: config.step >= step ? '100%' : '0%' }}
                        className={cn(
                          "absolute inset-0 rounded-full transition-all duration-1000",
                          config.step >= step ? (step === 4 ? "bg-green-500" : "bg-primary") : ""
                        )}
                     />
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-500">
             <CheckCircle2 size={16} strokeWidth={3} />
             <span className="text-xs font-black uppercase tracking-widest">Successfully {order.status}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isActive ? (
            <Link to={`/orders/${order.id}`} className="flex-1 md:flex-none">
              <Button className="w-full md:px-8 py-3.5 rounded-2xl h-auto font-black text-xs shadow-xl shadow-primary/10">
                <MapPin size={16} className="mr-2" /> Track Live
              </Button>
            </Link>
          ) : (
            <>
              <Button variant="secondary" className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl h-auto font-black text-xs text-[#1C1C1C] bg-gray-100 hover:bg-gray-200 border-none">
                <RotateCcw size={16} className="mr-2" /> Reorder
              </Button>
              <Link to="/faq" className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                <HelpCircle size={20} />
              </Link>
            </>
          )}
          <Link to={`/orders/${order.id}`} className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#1C1C1C] hover:bg-gray-100 transition-all">
             <Receipt size={20} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Orders;
