import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Bike, 
  ArrowLeft,
  Package,
  Soup,
  CheckCircle2,
  AlertCircle,
  Star,
  Navigation
} from 'lucide-react';
import GoogleLiveMap from '../components/order/GoogleLiveMap';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import orderService from '../services/orderService';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const STEPS = [
  { id: 1, name: 'Placed', icon: CheckCircle2, status: 'PLACED' },
  { id: 2, name: 'Confirmed', icon: Check, status: 'CONFIRMED' },
  { id: 3, name: 'Preparing', icon: Soup, status: 'PREPARING' },
  { id: 4, name: 'On its way', icon: Bike, status: 'OUT_FOR_DELIVERY' },
  { id: 5, name: 'Delivered', icon: Package, status: 'DELIVERED' },
];

const getStepNumber = (status) => {
  switch (status) {
    case 'PLACED': return 1;
    case 'CONFIRMED': return 2;
    case 'PREPARING':
    case 'PACKED':
    case 'READY_FOR_PICKUP':
      return 3;
    case 'OUT_FOR_DELIVERY': return 4;
    case 'DELIVERED': return 5;
    default: return 1;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderPos, setRiderPos] = useState({ lat: 28.6139, lng: 77.2090 });
  const [eta, setEta] = useState(12);

  const { client } = useWebSocket();
  const { user } = useAuthStore();

  // Positions
  const restaurantPos = { lat: 28.6239, lng: 77.2290 };
  const userPos = { lat: 28.6039, lng: 77.1890 };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Real-time status update via WebSockets
  useEffect(() => {
    if (!client || !user?.id) return;
    const sub = client.subscribe(`/topic/order/${user.id}`, (message) => {
      if (message.body) {
        const updated = JSON.parse(message.body);
        if (updated.id === Number(id)) {
          setOrder(updated);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [client, user?.id, id]);

  // Live location updates via WebSockets from rider
  useEffect(() => {
    if (!client || !id) return;

    // Set initial position if available in order delivery payload
    if (order && order.delivery && order.delivery.currentLatitude && order.delivery.currentLongitude) {
      setRiderPos({
        lat: order.delivery.currentLatitude,
        lng: order.delivery.currentLongitude
      });
    }

    const sub = client.subscribe(`/topic/location/${id}`, (message) => {
      if (message.body) {
        const loc = JSON.parse(message.body);
        setRiderPos({
          lat: loc.latitude,
          lng: loc.longitude
        });
        setEta(prev => Math.max(2, prev - 1));
      }
    });

    return () => sub.unsubscribe();
  }, [client, id, order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-bold">Fetching order tracking...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-text-primary mb-2">Order Not Found</h2>
        <p className="text-text-secondary mb-6 text-center max-w-xs">We couldn't retrieve tracking information for order #{id}.</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStep = getStepNumber(order.status);

  return (
    <div className="min-h-screen pb-20 md:pb-10">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[56px] md:top-[72px] z-30">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/orders" className="h-8 w-8 md:h-10 md:w-10 bg-gray-50 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1">
              <h1 className="text-base md:text-xl font-black text-text-primary">Track Order</h1>
              <p className="text-[10px] md:text-xs text-text-secondary font-medium">Order #{id}</p>
            </div>
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
              <Badge variant="warning" className="text-[10px] md:text-xs">Live</Badge>
            ) : (
              <Badge variant={order.status === 'DELIVERED' ? 'success' : 'error'} className="text-[10px] md:text-xs">{order.status}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: ETA Banner */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="md:hidden bg-gradient-to-r from-primary to-primary-dark px-4 py-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Estimated Arrival</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={20} strokeWidth={3} className="animate-pulse" />
                <span className="text-3xl font-black">{eta} min</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Status</p>
              <p className="text-sm font-bold mt-1">
                {STEPS.find(s => s.id === currentStep)?.name || order.status}
              </p>
            </div>
          </div>
          
          {/* Mobile Progress Bar */}
          <div className="mt-3 flex items-center gap-1">
            {STEPS.map((step) => (
              <div key={step.id} className="flex-1 h-1 rounded-full overflow-hidden bg-white/20">
                <div className={`h-full rounded-full transition-all duration-500 ${currentStep >= step.id ? 'bg-white' : ''}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map(step => (
              <span key={step.id} className="text-[8px] font-bold text-white/60">{step.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Tracking Sidebar - Desktop */}
          <div className="hidden md:block lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full" />
              
              <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'warning'} className="mb-3">
                Order #{id}
              </Badge>

              {order.status === 'CANCELLED' ? (
                <div>
                  <h2 className="text-2xl font-black text-red-500 mb-2">Order Cancelled</h2>
                  <p className="text-text-secondary text-sm font-medium">This order was cancelled. Any refunded amount will reflect in your account.</p>
                </div>
              ) : order.status === 'DELIVERED' ? (
                <div>
                  <h2 className="text-2xl font-black text-green-600 mb-2">Delivered!</h2>
                  <p className="text-text-secondary text-sm font-medium">Delivered on {dayjs(order.updatedAt).format('DD MMM, hh:mm A')}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-black text-text-primary mb-2">Estimated Arrival</h2>
                  <div className="flex items-center gap-3 text-primary mb-8">
                    <Clock size={28} strokeWidth={3} className="animate-pulse" />
                    <span className="text-4xl font-black">{eta} Mins</span>
                  </div>

                  {/* Stepper */}
                  <div className="relative space-y-6 ml-4">
                    <div className="absolute left-[-16px] top-4 bottom-4 w-0.5 bg-gray-100" />
                    {STEPS.map((step) => (
                      <div key={step.id} className="relative flex items-center gap-5">
                        <div className={`z-10 h-7 w-7 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 ${
                          currentStep >= step.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {currentStep > step.id ? <Check size={12} strokeWidth={4} /> : <step.icon size={12} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-wider ${currentStep >= step.id ? 'text-text-primary' : 'text-gray-400'}`}>
                            {step.name}
                          </span>
                          {currentStep === step.id && (
                            <span className="text-xs text-primary font-bold animate-pulse">In Progress...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Rider Card */}
            {order.delivery && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-primary font-bold">
                     <User size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Partner</p>
                    <h4 className="text-base font-black text-text-primary">{order.delivery.deliveryPartnerName || 'Assigned Agent'}</h4>
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                      <Star size={10} fill="currentColor" /> 4.9
                    </div>
                  </div>
                  {order.delivery.deliveryPartnerPhone && (
                    <a href={`tel:${order.delivery.deliveryPartnerPhone}`} className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                      <Phone size={18} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-8">
            <div className="h-[300px] md:h-[500px] lg:h-full lg:min-h-[500px] rounded-2xl md:rounded-[3rem] overflow-hidden shadow-sm border-4 border-white bg-gray-100 relative">
              <GoogleLiveMap 
                riderPos={riderPos}
                restaurantPos={restaurantPos}
                userPos={userPos}
              />
            </div>
          </div>
        </div>

        {/* Mobile Rider & Order Info */}
        <div className="md:hidden space-y-3 mt-4">
          {/* Rider Card Mobile */}
          {order.delivery && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Partner</p>
                  <h4 className="text-sm font-bold text-text-primary">{order.delivery.deliveryPartnerName || 'Assigned Agent'}</h4>
                </div>
                <div className="flex items-center gap-1 text-orange-500 text-xs font-bold mr-2">
                  <Star size={10} fill="currentColor" /> 4.9
                </div>
                {order.delivery.deliveryPartnerPhone && (
                  <a href={`tel:${order.delivery.deliveryPartnerPhone}`} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Order Summary Mobile */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Restaurant</p>
                <h4 className="text-sm font-bold">{order.restaurantName}</h4>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver to</p>
                <p className="text-[10px] text-text-secondary mt-0.5 truncate">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Order Summary */}
        <div className="hidden md:block mt-8 bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg md:text-xl font-black text-text-primary mb-6">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-primary pl-4">Restaurant</p>
              <h4 className="text-lg font-bold mb-1">{order.restaurantName}</h4>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-secondary pl-4">Delivery Address</p>
              <p className="text-sm text-text-secondary">{order.deliveryAddress}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Ordered</p>
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm font-medium">
                  <span className="text-text-secondary">{item.quantity}x {item.menuItemName}</span>
                  <span className="text-text-primary font-bold">₹{item.subtotal || (item.priceAtOrderTime * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 flex justify-between font-black text-base">
                <span>Total Paid</span>
                <span className="text-primary">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
