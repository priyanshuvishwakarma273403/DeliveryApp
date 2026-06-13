import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronDown, 
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowLeft,
  RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import orderService from '../services/orderService';
import { toast } from 'react-hot-toast';
import { useOrderSocket } from '../hooks/useOrderSocket';
import dayjs from 'dayjs';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      if (response.success) {
        setOrders([...response.data].reverse());
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time updates via WebSocket
  useOrderSocket((updatedOrder) => {
    setOrders(prev => {
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
        // New order placed
        toast.success('New order received!', {
          icon: '🛍️',
          duration: 5000
        });
        return [updatedOrder, ...prev];
      }
    });
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await orderService.updateOrderStatus(id, status);
      if (response.success) {
        setOrders(prev => prev.map(o => o.id === id ? response.data : o));
        toast.success('Status updated successfully');
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const getAvailableActions = (status) => {
    switch (status) {
      case 'PLACED':
        return [
          { label: 'Confirm Order', val: 'CONFIRMED' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' }
        ];
      case 'CONFIRMED':
        return [
          { label: 'Mark Preparing', val: 'PREPARING' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' }
        ];
      case 'PREPARING':
        return [
          { label: 'Mark Packed', val: 'PACKED' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' }
        ];
      case 'PACKED':
        return [
          { label: 'Mark Ready', val: 'READY_FOR_PICKUP' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' }
        ];
      case 'READY_FOR_PICKUP':
        return [
          { label: 'Out for Delivery', val: 'OUT_FOR_DELIVERY' },
          { label: 'Cancel Order', val: 'CANCELLED', color: 'text-red-500 hover:bg-red-50' }
        ];
      case 'OUT_FOR_DELIVERY':
        return [
          { label: 'Mark Delivered', val: 'DELIVERED' }
        ];
      default:
        return [];
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(search) || 
                          o.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED': return <Clock size={14} className="text-blue-500" />;
      case 'CONFIRMED': return <CheckCircle2 size={14} className="text-blue-600" />;
      case 'PREPARING': return <RefreshCcw size={14} className="text-orange-500 animate-spin-slow" />;
      case 'PACKED': return <Package size={14} className="text-pink-500" />;
      case 'READY_FOR_PICKUP': return <Package size={14} className="text-purple-500" />;
      case 'OUT_FOR_DELIVERY': return <Package size={14} className="text-indigo-500" />;
      case 'DELIVERED': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'CANCELLED': return <XCircle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="h-12 w-12 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-text-primary">Manage Orders</h1>
              <p className="text-text-secondary text-sm font-medium">
                {orders.length} total orders · <span className="text-green-600">Real-time updates active</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Order ID or Customer..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-text-primary outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="PACKED">Packed</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="OUT_FOR_DELIVERY">On its way</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto md:overflow-visible pb-24 md:pb-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order, index) => {
                    const showUpward = index >= Math.max(0, filteredOrders.length - 2);
                    return (
                    <motion.tr 
                      key={order.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-text-primary mb-1">#{order.id}</span>
                          <span className="text-[10px] font-bold text-text-secondary uppercase">
                            {dayjs(order.createdAt).format('DD MMM, hh:mm A')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center text-xs font-black">
                            {order.customerName?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">{order.customerName}</span>
                            <span className="text-xs text-text-secondary font-medium">{order.customerPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          {order.orderItems?.map((item, i) => (
                            <span key={i} className="text-xs font-medium text-text-secondary truncate max-w-[150px]">
                              {item.quantity}x {item.menuItemName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-primary">₹{order.totalAmount}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge variant={
                            order.status === 'DELIVERED' ? 'success' : 
                            order.status === 'CANCELLED' ? 'error' : 
                            order.status === 'PLACED' ? 'info' : 'warning'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="relative dropdown-container inline-block">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === order.id ? null : order.id);
                            }}
                            className="h-10 w-10 bg-gray-50 hover:bg-white border border-gray-100 rounded-xl flex items-center justify-center transition-all hover:shadow-md"
                          >
                            <MoreVertical size={18} className="text-gray-400" />
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
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-xl font-black text-text-primary">No orders found</h3>
              <p className="text-text-secondary font-medium mt-2">Try adjusting your filters or wait for new orders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
