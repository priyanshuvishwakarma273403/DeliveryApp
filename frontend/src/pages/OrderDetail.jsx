import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Send,
  CloudRain,
  ShieldCheck,
  TrendingUp,
  Settings,
  AlertTriangle,
  Heart,
  RotateCcw,
  XCircle,
  Activity
} from 'lucide-react';
import GoogleLiveMap from '../components/order/GoogleLiveMap';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import orderService from '../services/orderService';
import { getGroqResponse } from '../services/aiService';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

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
    case 'FOOD_READY':
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

  // Order Brain States
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [risks, setRisks] = useState([]);
  const [recoveryActions, setRecoveryActions] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedItemForSubstitution, setSelectedItemForSubstitution] = useState(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [decisionPendingAction, setDecisionPendingAction] = useState(null);

  // Recovery Preferences
  const [settings, setSettings] = useState({
    autoUpdateEta: true,
    autoSubstituteSamePrice: false,
    autoRemoveItem: false,
    askEveryTime: true
  });

  const { client, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  // Positions
  const restaurantPos = { lat: 28.6239, lng: 77.2290 };
  const userPos = { lat: 28.6039, lng: 77.1890 };

  // AI chat states
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am Foodie, your AI Delivery Assistant. I'm monitoring traffic and weather on your route. Ask me anything about the rider's progress, ETA adjustments, or road risks!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
      
      // Fetch twin
      try {
        const twinRes = await orderService.getOrderTwin(id);
        if (twinRes.success) {
          setDigitalTwin(twinRes.data);
          if (twinRes.data.predictedDeliveryAt) {
            const diff = dayjs(twinRes.data.predictedDeliveryAt).diff(dayjs(), 'minute');
            setEta(Math.max(1, diff));
          }
        }
      } catch (err) {
        console.error("Twin fetch error", err);
      }

      // Fetch timeline
      try {
        const timelineRes = await orderService.getOrderTimeline(id, true);
        if (timelineRes.success) {
          setTimeline(timelineRes.data);
        }
      } catch (err) {
        console.error("Timeline fetch error", err);
      }

      // Fetch risks
      try {
        const risksRes = await orderService.getOrderRisks(id);
        if (risksRes.success) {
          setRisks(risksRes.data);
        }
      } catch (err) {
        console.error("Risks fetch error", err);
      }

      // Fetch recovery actions
      try {
        const recoveryRes = await orderService.getOrderRecoveryActions(id);
        if (recoveryRes.success) {
          setRecoveryActions(recoveryRes.data);
          const pending = recoveryRes.data.find(a => a.status === 'WAITING_APPROVAL');
          if (pending) {
            setDecisionPendingAction(pending);
            // Fetch alternatives for items in the order
            if (res.data?.orderItems && res.data.orderItems.length > 0) {
              setSelectedItemForSubstitution(res.data.orderItems[0]);
              fetchAlternativesForDish(res.data.orderItems[0].menuItemId);
            }
          }
        }
      } catch (err) {
        console.error("Recovery actions fetch error", err);
      }

      // Fetch recovery preferences
      try {
        const prefRes = await orderService.getRecoverySettings();
        if (prefRes.success) {
          setSettings(prefRes.data);
        }
      } catch (err) {
        console.error("Preferences fetch error", err);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlternativesForDish = async (menuItemId) => {
    try {
      setLoadingAlternatives(true);
      const altRes = await orderService.getAlternatives(id, menuItemId);
      if (altRes.success) {
        setAlternatives(altRes.data);
      }
    } catch (err) {
      console.error("Alternatives fetch error", err);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleDecisionSubmit = async (alternativeName) => {
    if (!decisionPendingAction) return;
    try {
      await orderService.submitRecoveryDecision(id, decisionPendingAction.actionId, alternativeName);
      toast.success(`Selected replacement item: ${alternativeName}`);
      setDecisionPendingAction(null);
      setSelectedItemForSubstitution(null);
      setAlternatives([]);
      fetchOrderDetails();
    } catch (err) {
      console.error("Submit decision error", err);
      toast.error("Failed to process recovery choice.");
    }
  };

  const updatePreferenceSetting = async (key, val) => {
    try {
      const updated = { ...settings, [key]: val };
      setSettings(updated);
      await orderService.updateRecoverySettings(updated);
      toast.success("Recovery settings updated");
    } catch (err) {
      console.error(err);
      toast.error("Could not update settings");
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Real-time status update via WebSockets
  useEffect(() => {
    if (!client || !user?.id) return;

    const subOrder = client.subscribe(`/topic/order/${user.id}`, (message) => {
      if (message.body) {
        const updated = JSON.parse(message.body);
        if (updated.id === Number(id)) {
          setOrder(updated);
        }
      }
    });

    const subTwin = client.subscribe(`/topic/order/${id}/twin`, (message) => {
      if (message.body) {
        const updatedTwin = JSON.parse(message.body);
        setDigitalTwin(updatedTwin);
        if (updatedTwin.predictedDeliveryAt) {
          const diff = dayjs(updatedTwin.predictedDeliveryAt).diff(dayjs(), 'minute');
          setEta(Math.max(1, diff));
        }
      }
    });

    const subRecovery = client.subscribe(`/topic/order/${id}/recovery`, (message) => {
      if (message.body) {
        const event = JSON.parse(message.body);
        if (event.eventType === 'CUSTOMER_DECISION_REQUIRED') {
          fetchOrderDetails();
        } else {
          fetchOrderDetails();
        }
      }
    });

    return () => {
      subOrder.unsubscribe();
      subTwin.unsubscribe();
      subRecovery.unsubscribe();
    };
  }, [client, user?.id, id]);

  // Simulate rider movement
  useEffect(() => {
    const interval = setInterval(() => {
      setRiderPos(prev => ({
        lat: prev.lat - 0.0001,
        lng: prev.lng - 0.0001
      }));
      if (!digitalTwin) {
        setEta(prev => Math.max(1, prev - 1));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [digitalTwin]);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    setChatMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsTyping(true);

    try {
      const systemContext = `
You are "Foodie AI", the dedicated delivery assistant for Order #${id}.
Current Order Status: ${order?.status || 'PREPARING'}.
Current ETA: ${eta} minutes.
Rider Location coordinates: lat ${riderPos.lat.toFixed(4)}, lng ${riderPos.lng.toFixed(4)}.
Weather: Light rain (causes ~10% travel speed penalty).
Traffic Status: Moderate congestion at South Extension crossing.
Rider is wearing a safety helmet and carrying a thermal-sealed bag.

Keep answers extremely helpful, highly concise, reassuring, and related to this specific route.
`;

      const response = await getGroqResponse([
        { role: 'system', content: systemContext },
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText }
      ]);

      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm checking the live telemetry database now. The rider is currently moving past South Extension bypass. Current eta is approximately " + eta + " minutes. 🛵"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-gray-900">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Fetching order tracking...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-gray-900 p-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6 text-center max-w-xs">We couldn't retrieve tracking information for order #{id}.</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStep = getStepNumber(order.status);

  return (
    <div className="min-h-screen pb-20 md:pb-10 bg-[#F8F9FB] dark:bg-gray-950">
      {/* Top sticky tracker header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-[56px] md:top-[72px] z-30">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/orders" className="h-8 w-8 md:h-10 md:w-10 bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1">
              <h1 className="text-base md:text-xl font-black text-text-primary dark:text-white">Track Order</h1>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Order #{id}</p>
            </div>
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
              <Badge variant="warning" className="text-[10px] md:text-xs">Live Tracking</Badge>
            ) : (
              <Badge variant={order.status === 'DELIVERED' ? 'success' : 'error'} className="text-[10px] md:text-xs">{order.status}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mobile ETA Banner */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="md:hidden bg-gradient-to-r from-primary to-orange-600 px-4 py-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Estimated Arrival</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={20} strokeWidth={3} className="animate-pulse" />
                <span className="text-3xl font-black">{eta} min</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Current Status</p>
              <p className="text-sm font-bold mt-1">
                {STEPS.find(s => s.id === currentStep)?.name || order.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Col 1: Stepper, Digital Twin HUD, preferences */}
          <div className="hidden md:block lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative">
              <div className="absolute top-0 right-0 h-20 w-20 bg-primary/5 rounded-bl-full" />
              
              <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'warning'} className="mb-3">
                Order #{id}
              </Badge>

              {order.status === 'CANCELLED' ? (
                <div>
                  <h2 className="text-xl font-black text-red-500 mb-2">Order Cancelled</h2>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">This order was cancelled. Any refunded amount will reflect in your account.</p>
                </div>
              ) : order.status === 'DELIVERED' ? (
                <div>
                  <h2 className="text-xl font-black text-green-600 mb-2">Delivered!</h2>
                  <p className="text-gray-500 text-xs font-medium">Delivered on {dayjs(order.updatedAt).format('DD MMM, hh:mm A')}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Estimated Arrival</h2>
                  <div className="flex items-center gap-2.5 text-primary mb-6">
                    <Clock size={24} strokeWidth={3} className="animate-pulse" />
                    <span className="text-3xl font-black">{eta} Mins</span>
                  </div>

                  {/* Stepper */}
                  <div className="relative space-y-5 ml-3">
                    <div className="absolute left-[-14px] top-3.5 bottom-3.5 w-0.5 bg-gray-100 dark:bg-gray-800" />
                    {STEPS.map((step) => (
                      <div key={step.id} className="relative flex items-center gap-4">
                        <div className={`z-10 h-6.5 w-6.5 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 transition-all duration-500 ${
                          currentStep >= step.id ? 'bg-primary text-white scale-105 shadow-md shadow-primary/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                          {currentStep > step.id ? <Check size={10} strokeWidth={4} /> : <step.icon size={10} />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-wider ${currentStep >= step.id ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
                            {step.name}
                          </span>
                          {currentStep === step.id && (
                            <span className="text-[9px] text-primary font-bold animate-pulse">In Progress...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Digital Twin HUD */}
            {digitalTwin && (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Digital Twin HUD</span>
                  </div>
                  <Badge variant={
                    digitalTwin.overallHealth === 'HEALTHY' ? 'success' :
                    digitalTwin.overallHealth === 'WATCH' ? 'warning' : 'error'
                  } className="text-[9px]">{digitalTwin.overallHealth}</Badge>
                </div>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prep Progress</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.round((digitalTwin.kitchenProgress || 0) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Predicted Food Ready</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {digitalTwin.predictedFoodReadyAt ? dayjs(digitalTwin.predictedFoodReadyAt).format('hh:mm A') : 'Calculating'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Predicted Delivery</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {digitalTwin.predictedDeliveryAt ? dayjs(digitalTwin.predictedDeliveryAt).format('hh:mm A') : 'Calculating'}
                    </span>
                  </div>
                </div>

                {risks.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Active Risks</span>
                    {risks.map((risk, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-xl border border-red-100 dark:border-red-900/30">
                        <AlertTriangle size={14} className="flex-shrink-0" />
                        <span className="font-bold truncate">{risk.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recovery Preferences Settings Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Settings size={18} className="text-gray-500" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Auto-Recovery Settings</span>
              </div>
              
              <div className="space-y-3.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Auto Update ETA</span>
                    <span className="text-[10px] text-gray-400">Adjust delivery expectation without confirmation</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoUpdateEta} 
                    onChange={(e) => updatePreferenceSetting('autoUpdateEta', e.target.checked)} 
                    className="accent-primary h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Auto Substitute Similar</span>
                    <span className="text-[10px] text-gray-400">Instantly replace item if out-of-stock</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoSubstituteSamePrice} 
                    onChange={(e) => updatePreferenceSetting('autoSubstituteSamePrice', e.target.checked)} 
                    className="accent-primary h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Ask Every Time</span>
                    <span className="text-[10px] text-gray-400">Require approval for all recovery actions</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.askEveryTime} 
                    onChange={(e) => updatePreferenceSetting('askEveryTime', e.target.checked)} 
                    className="accent-primary h-4 w-4"
                  />
                </label>
              </div>
            </div>

            {/* Rider Card */}
            {order.delivery && (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-primary font-bold">
                     <User size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery Partner</p>
                    <h4 className="text-sm font-black text-gray-950 dark:text-white truncate">{order.delivery.deliveryPartnerName || 'Rider Agent'}</h4>
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                       <Star size={10} fill="currentColor" /> 4.9
                    </div>
                  </div>
                  {order.delivery.deliveryPartnerPhone && (
                    <a href={`tel:${order.delivery.deliveryPartnerPhone}`} className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Live Map, Recovery Actions prompt, Operational Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="h-[320px] md:h-[380px] rounded-[2.5rem] overflow-hidden shadow-sm border-4 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-900 relative">
              <GoogleLiveMap 
                riderPos={riderPos}
                restaurantPos={restaurantPos}
                userPos={userPos}
              />
            </div>

            {/* Order Recovery Center - Customer Decision required */}
            <AnimatePresence>
              {decisionPendingAction && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-xl border-2 border-primary/20 dark:border-primary/30 space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={48} className="text-primary animate-pulse" />
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Order Recovery Center</span>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">Substitution Required</h3>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        The kitchen is out of an item. Choose a Taste DNA-approved alternative below, or request a refund.
                      </p>
                    </div>
                  </div>

                  {loadingAlternatives ? (
                    <div className="py-4 text-center">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs text-gray-400 font-bold">Ranking Taste DNA alternatives...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">AI Recommended Alternatives</span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {alternatives.map((alt) => (
                          <div 
                            key={alt.id} 
                            onClick={() => handleDecisionSubmit(alt.name)}
                            className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-primary/5 dark:bg-gray-850 dark:hover:bg-gray-800 rounded-2xl border border-gray-100 hover:border-primary/20 dark:border-gray-800 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="h-8 w-8 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center text-primary font-bold">
                                <Heart size={14} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{alt.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold">{alt.category}</span>
                                  {alt.vegetarian && <Badge variant="success" className="text-[7px] py-0 px-1">VEG</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900 dark:text-white">₹{alt.price}</span>
                              <div className="h-6 w-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-primary shadow-sm">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => handleDecisionSubmit("REFUND_ITEM")}
                          className="flex-1 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-600 dark:bg-gray-850 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold border border-gray-100 dark:border-gray-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw size={14} /> Remove & Refund
                        </button>
                        <button 
                          onClick={() => handleDecisionSubmit("CANCEL_ORDER")}
                          className="flex-1 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-600 dark:bg-gray-850 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold border border-gray-100 dark:border-gray-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={14} /> Cancel Order
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Operational Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Live Journey Timeline</h3>
              </div>

              <div className="space-y-6 relative ml-3">
                <div className="absolute left-[-11px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-850" />
                
                {timeline.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">No events logged yet. Tracking is initializing...</div>
                ) : (
                  timeline.map((item, idx) => (
                    <div key={item.id || idx} className="relative flex items-start gap-4">
                      <div className="z-10 h-5.5 w-5.5 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 bg-primary shadow-sm text-white flex-shrink-0">
                        <Check size={9} strokeWidth={4} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900 dark:text-white">{item.title}</span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {dayjs(item.timestamp).format('hh:mm A')}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Col 3: AI Copilot Sidebar & Chat Bubble */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col h-[500px]">
              {/* Sidebar Header */}
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="h-9 w-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">AI Delivery Copilot</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Realtime Route Diagnostics</p>
                </div>
              </div>

              {/* Route Insights HUD */}
              <div className="grid grid-cols-2 gap-3 py-4 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl flex flex-col justify-between">
                  <span className="text-gray-400 uppercase text-[8px] tracking-wide">Weather impact</span>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-800 dark:text-gray-200">
                    <CloudRain size={12} className="text-blue-500" />
                    <span>Rainy delay (+3m)</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl flex flex-col justify-between">
                  <span className="text-gray-400 uppercase text-[8px] tracking-wide">ETA Model Conf</span>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={12} />
                    <span>94% Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Chat Bubble Window */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-hide">
                <div className="space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-800'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 dark:bg-gray-850 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-800 flex gap-1">
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendChat} className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                <input
                  type="text"
                  placeholder="Ask Foodie AI about your route..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-primary placeholder:font-normal placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="p-3 bg-primary hover:bg-orange-600 text-white rounded-xl shadow-md shadow-primary/10 transition-colors cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Mobile details footer */}
        <div className="md:hidden space-y-4 mt-6">
          {/* Order Summary Mobile */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-black mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Restaurant</p>
                <h4 className="text-gray-900 dark:text-white">{order.restaurantName}</h4>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver to</p>
                <p className="text-gray-500 truncate">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Order Summary (bottom of page) */}
        <div className="hidden md:block mt-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-6">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-primary pl-4">Restaurant Details</p>
              <h4 className="text-base font-bold mb-1 text-gray-900 dark:text-white">{order.restaurantName}</h4>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-orange-500 pl-4">Delivery Coordinates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryAddress}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-850 pt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Summary</p>
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500 dark:text-gray-400">{item.quantity}x {item.menuItemName}</span>
                  <span className="text-gray-900 dark:text-white font-bold">₹{item.subtotal || (item.priceAtOrderTime * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-850 pt-4 flex justify-between font-black text-base">
                <span className="text-gray-900 dark:text-white">Total Amount Paid</span>
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
