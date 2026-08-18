import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  DollarSign, ShoppingBag, CheckCircle2, XCircle, Clock, Star, Users, ArrowUpRight, 
  ArrowDownRight, TrendingUp, AlertTriangle, UserCheck, Activity, Award, Bell, 
  MapPin, Phone, Mail, Globe, Image as ImageIcon, Plus, Edit2, Trash2, Eye, Copy, 
  Search, SlidersHorizontal, Check, RefreshCw, PlusCircle, ShieldAlert, Calendar, 
  Sparkles, Download, FileText, Printer, Trash, Coffee, Lock, HelpCircle, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

// Mock Initial Data
const MOCK_RESTAURANT = {
  name: "La Piazza Authentica",
  businessName: "La Piazza Food Ventures LLP",
  ownerName: "Marco Silva",
  gstNumber: "07AAAAA1111A1Z1",
  fssaiLicense: "12345678901234",
  panNumber: "ABCDE1234F",
  description: "Authentic Italian wood-fired pizzas, handmade pastas, and fine desserts.",
  cuisineTypes: ["Italian", "Pizza", "Pasta", "Desserts"],
  openingHours: "11:00 AM - 11:00 PM",
  holidaySchedule: "Open all days except National Holidays",
  deliveryRadius: 8, // km
  address: "Block C-2, Ground Floor, SDA Market, New Delhi - 110016",
  contactNumbers: "+91 9876543219, 011-4567890",
  email: "contact@lapiazza.com",
  website: "www.lapiazza-delhi.com",
  status: "OPEN", // OPEN, CLOSED, BUSY, VACATION
};

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Wood-Fired Pizza', active: true },
  { id: 'cat-2', name: 'Handmade Pasta', active: true },
  { id: 'cat-3', name: 'Starters & Sides', active: true },
  { id: 'cat-4', name: 'Gourmet Desserts', active: true },
];

const MOCK_FOODS = [
  { 
    id: "FD-101", 
    name: "Margherita Wood-Fired Pizza", 
    description: "San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.", 
    category: "Wood-Fired Pizza", 
    price: 349, 
    discountPrice: 299,
    isVeg: true, 
    isVegan: false, 
    isJain: false, 
    spiceLevel: "Mild", 
    calories: 680, 
    allergens: ["Gluten", "Dairy"],
    ingredients: ["San Marzano Tomato", "Mozzarella Cheese", "Fresh Basil", "Flour"],
    availability: true, 
    isBestSeller: true,
    isFeatured: true,
    isTrending: false,
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80",
    kitchenStation: "Pizza Oven",
    prepTime: 12
  },
  { 
    id: "FD-102", 
    name: "Truffle Mushroom Fettuccine", 
    description: "Creamy truffle sauce with wild mushrooms, parmesan cheese, and fresh microgreens.", 
    category: "Handmade Pasta", 
    price: 429, 
    isVeg: true, 
    isVegan: false, 
    isJain: false, 
    spiceLevel: "Medium", 
    calories: 790, 
    allergens: ["Gluten", "Dairy"],
    ingredients: ["Fettuccine", "Truffle Paste", "Mushrooms", "Heavy Cream"],
    availability: true, 
    isBestSeller: false,
    isFeatured: true,
    isTrending: true,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80",
    kitchenStation: "Sauté Station",
    prepTime: 15
  },
  { 
    id: "FD-103", 
    name: "Classic Garlic Herb Bread", 
    description: "Freshly baked baguette slices toasted with garlic butter, parsley, and sea salt.", 
    category: "Starters & Sides", 
    price: 189, 
    isVeg: true, 
    isVegan: false, 
    isJain: true, 
    spiceLevel: "Mild", 
    calories: 320, 
    allergens: ["Gluten", "Dairy"],
    ingredients: ["Baguette", "Garlic Butter", "Parsley", "Sea Salt"],
    availability: true, 
    isBestSeller: true,
    isFeatured: false,
    isTrending: false,
    image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&q=80",
    kitchenStation: "Bake Station",
    prepTime: 8
  },
  { 
    id: "FD-104", 
    name: "Dark Chocolate Fondant", 
    description: "Warm chocolate cake with a molten core, served with vanilla bean gelato.", 
    category: "Gourmet Desserts", 
    price: 249, 
    isVeg: true, 
    isVegan: false, 
    isJain: false, 
    spiceLevel: "Mild", 
    calories: 450, 
    allergens: ["Gluten", "Dairy", "Egg"],
    ingredients: ["Belgian Dark Chocolate", "Butter", "Sugar", "Vanilla Gelato"],
    availability: false, 
    isBestSeller: true,
    isFeatured: false,
    isTrending: true,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    kitchenStation: "Dessert Prep",
    prepTime: 10
  }
];

const MOCK_ORDERS = [
  { id: "ORD-9832", customerName: "Aarav Sharma", phone: "+91 9988776655", items: "1x Margherita Pizza, 1x Tiramisu", total: 548, status: "PENDING", date: "15:42 PM", instructions: "Make the pizza extra thin crust, please.", priority: true },
  { id: "ORD-9831", customerName: "Priya Patel", phone: "+91 8877665544", items: "2x Truffle Pasta", total: 858, status: "PREPARING", date: "15:30 PM", instructions: "No mushrooms if possible.", priority: false },
  { id: "ORD-9830", customerName: "Rohit Verma", phone: "+91 7766554433", items: "1x Garlic Bread, 1x Coke", total: 249, status: "READY", date: "15:20 PM", instructions: "", priority: false },
  { id: "ORD-9829", customerName: "Neha Sen", phone: "+91 6655443322", items: "1x Margherita Pizza", total: 299, status: "OUT_FOR_DELIVERY", date: "15:10 PM", instructions: "Leave at reception.", priority: false },
  { id: "ORD-9828", customerName: "Kabir Mehta", phone: "+91 5544332211", items: "1x Truffle Pasta, 1x Chocolate Fondant", total: 678, status: "DELIVERED", date: "14:45 PM", instructions: "Deliver hot", priority: true }
];

const MOCK_REVIEWS = [
  { id: "REV-201", customerName: "Ananya Roy", rating: 5, comment: "The wood-fired pizza was absolutely amazing! Reminds me of Naples. Great packaging too.", reply: "Thank you so much Ananya! Looking forward to serving you again.", date: "Today" },
  { id: "REV-202", customerName: "Vikram Malhotra", rating: 2, comment: "Pasta was a bit cold when it arrived. The truffle flavour was good though.", reply: "", date: "Yesterday" }
];

const MOCK_STAFF = [
  { id: "STF-01", name: "Chef Giovanni", role: "Chef", status: "Active", shift: "Morning", contact: "+91 9911223344", salary: 45000 },
  { id: "STF-02", name: "Rajesh Kumar", role: "Kitchen Staff", status: "Active", shift: "Morning", contact: "+91 9922334455", salary: 22000 },
  { id: "STF-03", name: "Amit Sharma", role: "Manager", status: "Active", shift: "Evening", contact: "+91 9933445566", salary: 38000 },
  { id: "STF-04", name: "Vikrant Singh", role: "Cashier", status: "Offline", shift: "Evening", contact: "+91 9944556677", salary: 18000 }
];

const MOCK_COUPONS = [
  { code: "PIZZA50", type: "Percentage", discount: 50, minOrder: 499, maxDiscount: 150, limit: 100, active: true },
  { code: "EATFREE", type: "Flat", discount: 100, minOrder: 799, maxDiscount: 100, limit: 50, active: true }
];

const MOCK_AUDIT_LOGS = [
  { timestamp: "2026-07-19 14:30", user: "Marco Silva (Owner)", action: "PRICE_CHANGE", details: "Margherita Pizza price updated from ₹329 to ₹349" },
  { timestamp: "2026-07-19 12:15", user: "Giovanni (Chef)", action: "AVAILABILITY_CHANGE", details: "Chocolate Fondant status toggled to unavailable (Out of Stock)" },
  { timestamp: "2026-07-19 10:00", user: "Amit Sharma (Manager)", action: "SHIFT_START", details: "Morning shift login successful" }
];

const RestaurantPortal = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'RESTAURANT_OWNER') {
      navigate('/restaurant/owner', { replace: true });
    } else if (user?.role === 'BRANCH_MANAGER') {
      navigate('/restaurant/manager', { replace: true });
    } else if (user?.role === 'CASHIER') {
      navigate('/restaurant/cashier', { replace: true });
    } else if (user?.role === 'KITCHEN_STAFF') {
      navigate('/restaurant/kds', { replace: true });
    } else if (user?.role === 'SUPPORT_EXECUTIVE') {
      navigate('/support/dashboard', { replace: true });
    } else if (user?.role === 'MODERATOR') {
      navigate('/moderator/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [restaurantProfile, setRestaurantProfile] = useState(MOCK_RESTAURANT);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [foods, setFoods] = useState(MOCK_FOODS);
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDIT_LOGS);

  // Forms states
  const [newCatName, setNewCatName] = useState('');
  const [selectedFood, setSelectedFood] = useState(null); // for edit/add modal
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [reviewReplies, setReviewReplies] = useState({});
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'Percentage', discount: 10, minOrder: 299, maxDiscount: 100, limit: 100, active: true });
  
  // Custom Food Form state
  const [foodForm, setFoodForm] = useState({
    id: '', name: '', description: '', category: 'Wood-Fired Pizza', price: '', discountPrice: '',
    isVeg: true, isVegan: false, isJain: false, spiceLevel: 'Mild', calories: 400,
    allergens: [], ingredients: '', availability: true, image: '', kitchenStation: 'General Prep', prepTime: 10
  });

  // Food Filter / Search
  const [foodSearch, setFoodSearch] = useState('');
  const [foodFilterCat, setFoodFilterCat] = useState('All');

  // Chart Timeframe
  const [timeframe, setTimeframe] = useState('weekly');

  // Image validation details
  const [imageErrors, setImageErrors] = useState({});
  const [duplicateImageAlert, setDuplicateImageAlert] = useState(null);

  // Auto detect broken images simulation
  useEffect(() => {
    const checkImages = async () => {
      const checkedErrors = {};
      for (const food of foods) {
        if (food.image) {
          try {
            // Simulated validation
            const isOk = food.image.startsWith('http');
            if (!isOk) checkedErrors[food.id] = true;
          } catch {
            checkedErrors[food.id] = true;
          }
        }
      }
      setImageErrors(checkedErrors);
    };
    checkImages();
  }, [foods]);

  // Check for duplicate images
  const checkDuplicateImage = (imageUrl, currentId = '') => {
    if (!imageUrl) return false;
    const match = foods.find(f => f.image === imageUrl && f.id !== currentId);
    if (match) {
      setDuplicateImageAlert(`⚠️ Duplicate image detected! Already used on: "${match.name}" (ID: ${match.id}). Ensure unique presentation to stay compliant with FoodIQ portal standards.`);
      return true;
    }
    setDuplicateImageAlert(null);
    return false;
  };

  // Add/Edit category handlers
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = { id: `cat-${Date.now()}`, name: newCatName, active: true };
    setCategories([...categories, newCat]);
    setNewCatName('');
    toast.success('Category created successfully!');
  };

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
    toast.success('Category removed.');
  };

  // Food handlers
  const handleOpenFoodModal = (food = null) => {
    if (food) {
      setFoodForm({
        ...food,
        ingredients: food.ingredients.join(', '),
        price: food.price.toString(),
        discountPrice: food.discountPrice ? food.discountPrice.toString() : ''
      });
      setSelectedFood(food);
    } else {
      setFoodForm({
        id: `FD-${Math.floor(100 + Math.random() * 900)}`,
        name: '', description: '', category: categories[0]?.name || 'Wood-Fired Pizza',
        price: '', discountPrice: '', isVeg: true, isVegan: false, isJain: false,
        spiceLevel: 'Medium', calories: 500, allergens: [], ingredients: '',
        availability: true, image: '', kitchenStation: 'General Prep', prepTime: 12
      });
      setSelectedFood(null);
    }
    setDuplicateImageAlert(null);
    setIsFoodModalOpen(true);
  };

  const handleSaveFood = () => {
    if (!foodForm.name || !foodForm.price) {
      toast.error('Name and Base Price are required.');
      return;
    }

    // Check duplicate image before saving
    if (checkDuplicateImage(foodForm.image, selectedFood?.id)) {
      toast.error('Image already allocated to another food item. Choose a unique photo.');
      return;
    }

    const processedFood = {
      ...foodForm,
      price: Number(foodForm.price),
      discountPrice: foodForm.discountPrice ? Number(foodForm.discountPrice) : undefined,
      ingredients: foodForm.ingredients ? foodForm.ingredients.split(',').map(s => s.trim()) : [],
      allergens: typeof foodForm.allergens === 'string' ? foodForm.allergens.split(',').map(s => s.trim()) : foodForm.allergens
    };

    if (selectedFood) {
      // Edit
      setFoods(foods.map(f => f.id === selectedFood.id ? processedFood : f));
      // Add Audit log
      setAuditLogs([{
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        user: "Marco Silva (Owner)",
        action: "MENU_EDIT",
        details: `Edited item details for "${processedFood.name}"`
      }, ...auditLogs]);
      toast.success('Food item updated!');
    } else {
      // Create
      setFoods([...foods, processedFood]);
      setAuditLogs([{
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        user: "Marco Silva (Owner)",
        action: "MENU_CREATE",
        details: `Created new menu item "${processedFood.name}"`
      }, ...auditLogs]);
      toast.success('Food item created!');
    }
    setIsFoodModalOpen(false);
  };

  const handleDeleteFood = (id) => {
    setFoods(foods.filter(f => f.id !== id));
    toast.success('Food item removed.');
  };

  const handleDuplicateFood = (food) => {
    const duplicated = {
      ...food,
      id: `FD-${Math.floor(100 + Math.random() * 900)}`,
      name: `${food.name} (Copy)`,
      image: '' // Force upload new unique image
    };
    setFoods([...foods, duplicated]);
    toast.success('Item duplicated. Please link a unique image before enabling.');
  };

  // Order status transition
  const handleTransitionOrder = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // Add to Audit logs
    const actionDesc = `Order ${id} transitioned to ${newStatus}`;
    setAuditLogs([{
      timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
      user: "Giovanni (Chef)",
      action: "ORDER_UPDATE",
      details: actionDesc
    }, ...auditLogs]);

    toast.success(`Order moved to ${newStatus}`);
  };

  // Review Reply
  const handleSubmitReply = (revId) => {
    const replyText = reviewReplies[revId];
    if (!replyText) return;
    setReviews(reviews.map(r => r.id === revId ? { ...r, reply: replyText } : r));
    setReviewReplies({ ...reviewReplies, [revId]: '' });
    toast.success('Reply submitted.');
  };

  // Coupon Creation
  const handleCreateCoupon = () => {
    if (!newCoupon.code) return;
    setCoupons([...coupons, newCoupon]);
    setNewCoupon({ code: '', type: 'Percentage', discount: 10, minOrder: 299, maxDiscount: 100, limit: 100, active: true });
    toast.success('Promo coupon scheduled!');
  };

  const handleToggleCoupon = (code) => {
    setCoupons(coupons.map(c => c.code === code ? { ...c, active: !c.active } : c));
  };

  // Filtered foods for display
  const filteredFoodsDisplay = useMemo(() => {
    return foods.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase()) || f.id.toLowerCase().includes(foodSearch.toLowerCase());
      const matchCat = foodFilterCat === 'All' || f.category === foodFilterCat;
      return matchSearch && matchCat;
    });
  }, [foods, foodSearch, foodFilterCat]);

  // Chart Data calculations
  const chartDataWeekly = [
    { day: 'Mon', revenue: 24000, orders: 85, profit: 11000 },
    { day: 'Tue', revenue: 28000, orders: 98, profit: 12500 },
    { day: 'Wed', revenue: 32000, orders: 110, profit: 14000 },
    { day: 'Thu', revenue: 30000, orders: 105, profit: 13000 },
    { day: 'Fri', revenue: 42000, orders: 138, profit: 18500 },
    { day: 'Sat', revenue: 58000, orders: 180, profit: 26000 },
    { day: 'Sun', revenue: 64000, orders: 195, profit: 29000 },
  ];

  const chartDataMonthly = [
    { name: 'Jan', revenue: 840000, orders: 2850 },
    { name: 'Feb', revenue: 920000, orders: 3100 },
    { name: 'Mar', revenue: 1100000, orders: 3800 },
    { name: 'Apr', revenue: 980000, orders: 3400 },
    { name: 'May', revenue: 1250000, orders: 4200 },
    { name: 'Jun', revenue: 1420000, orders: 4900 },
  ];

  const activeChartData = timeframe === 'weekly' ? chartDataWeekly : chartDataMonthly;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* ── Left Sidebar Control Center ── */}
      <div className="w-full md:w-64 bg-[#1C1C1C] text-white shrink-0 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
            IQ
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">FoodIQ</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Restaurant Portal</p>
          </div>
        </div>

        {/* Restaurant Quick Timings Status in Sidebar */}
        <div className="p-4 bg-white/5 rounded-2xl mb-6 border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-bold">Outlet Timings</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs font-bold text-white">{restaurantProfile.name}</p>
          <div className="flex gap-1.5 flex-wrap">
            {['Open', 'Busy', 'Closed'].map(st => (
              <button 
                key={st}
                onClick={() => {
                  setRestaurantProfile({ ...restaurantProfile, status: st.toUpperCase() });
                  toast.success(`Outlet status updated to ${st}`);
                }}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  restaurantProfile.status === st.toUpperCase() 
                    ? 'bg-primary text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', label: 'Telemetry Cockpit', icon: Activity },
            { id: 'orders', label: 'Live Orders', icon: ShoppingBag, badge: orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length },
            { id: 'menu', label: 'Menu & Dishes', icon: Coffee },
            { id: 'coupons', label: 'Promo Coupons', icon: Award },
            { id: 'reviews', label: 'Reviews & Feedback', icon: Star },
            { id: 'staff', label: 'Employee Shifts', icon: Users },
            { id: 'profile', label: 'Outlet Profile', icon: MapPin },
            { id: 'settings', label: 'Delivery Rules', icon: SlidersHorizontal },
            { id: 'logs', label: 'Audit Trail', icon: ShieldAlert }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-rose-500 text-white font-black text-[9px] h-4.5 px-1.5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Version 2.4.0 (Enterprise)</p>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 space-y-8">
        
        {/* Header Alert Notifications */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#1C1C1C] capitalize">{activeTab} Manager</h2>
            <p className="text-text-secondary text-xs font-medium mt-1">Authorized Node: {restaurantProfile.name} • Location: Delhi, IN</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} /> 3 Low Stock Items
            </span>
            <div className="h-8 w-[1px] bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-500">POS Connection: Online</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* ── TAB 1: TELEMETRY COCKPIT (DASHBOARD) ── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider">Today's Revenue</span>
                      <DollarSign size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-black text-[#1C1C1C]">₹42,850</p>
                    <div className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">
                      <ArrowUpRight size={10} /> +12.4% <span className="text-gray-400 font-medium">vs yesterday</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider">Active Prep Orders</span>
                      <ShoppingBag size={16} className="text-orange-500" />
                    </div>
                    <p className="text-2xl font-black text-[#1C1C1C]">12</p>
                    <div className="text-[10px] font-bold text-orange-500">
                      Kitchen Load: 78% (High)
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider">Avg Rating</span>
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-[#1C1C1C]">4.85 / 5.0</p>
                    <div className="text-[10px] font-bold text-gray-400">Based on 320 reviews</div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-black uppercase tracking-wider">Average Prep Time</span>
                      <Clock size={16} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-[#1C1C1C]">13.5 min</p>
                    <div className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">
                      <ArrowDownRight size={10} /> -1.2 min <span className="text-gray-400 font-medium">faster delivery</span>
                    </div>
                  </div>
                </div>

                {/* Analytical Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Revenue Trend */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Sales Telemetry</h3>
                        <p className="text-[10px] text-gray-400 font-bold">Hourly performance insights</p>
                      </div>
                      <div className="flex gap-1.5">
                        {['weekly', 'monthly'].map(tf => (
                          <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                              timeframe === tf ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FC8019" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#FC8019" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                          <XAxis dataKey={timeframe === 'weekly' ? 'day' : 'name'} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#FC8019" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Low Stock & Alerts Panel */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Low Stock & Safety Alerts</h3>
                    <div className="space-y-3.5">
                      {[
                        { name: "Fresh Buffalo Mozzarella", current: "2.4 kg", req: "10.0 kg", status: "Critical" },
                        { name: "San Marzano Tomato Sauce", current: "4.5 Litre", req: "15.0 Litre", status: "Low" },
                        { name: "Fresh Basil Leaves", current: "0.2 kg", req: "2.0 kg", status: "Critical" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-[#1c1c1c]">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Qty: {item.current} • Min: {item.req}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            item.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Popular Dishes & Best Sellers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Best Selling Foods */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Best Selling Items</h3>
                    <div className="divide-y divide-gray-100">
                      {foods.map(food => (
                        <div key={food.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                              <img src={food.image} className="w-full h-full object-cover" alt={food.name} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#1c1c1c]">{food.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{food.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-primary">₹{food.price}</span>
                            <p className="text-[10px] text-gray-400 font-bold">Prep: {food.prepTime} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Customer Profiles */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Top Customer Insights</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Aarav Sharma", totalOrders: 42, spent: 15400, tier: "Gold Member" },
                        { name: "Ananya Roy", totalOrders: 28, spent: 9800, tier: "Gold Member" },
                        { name: "Priya Patel", totalOrders: 19, spent: 7200, tier: "Regular" }
                      ].map((cust, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                          <div>
                            <p className="text-xs font-black text-[#1c1c1c]">{cust.name}</p>
                            <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">{cust.tier}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-[#1c1c1c]">{cust.totalOrders} Orders</p>
                            <p className="text-[10px] text-gray-400 font-bold">Total Spent: ₹{cust.spent}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: LIVE ORDERS PIPELINE ── */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Status column: PENDING */}
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-black text-amber-700 uppercase tracking-widest">New / Pending</span>
                      <span className="h-5 min-w-[20px] px-1 bg-amber-500 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                        {orders.filter(o => o.status === 'PENDING').length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'PENDING').map(o => (
                        <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-text-primary">{o.id}</span>
                            {o.priority && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 rounded uppercase">Urgent</span>}
                          </div>
                          <p className="text-xs font-bold text-[#1c1c1c]">{o.items}</p>
                          {o.instructions && <p className="text-[10px] text-rose-500 font-bold bg-rose-50/50 p-2 rounded-lg border border-rose-100">💡 {o.instructions}</p>}
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                            <span>{o.customerName}</span>
                            <span>{o.date}</span>
                          </div>
                          <div className="pt-2 flex gap-1.5">
                            <button onClick={() => handleTransitionOrder(o.id, 'PREPARING')} className="flex-1 py-1.5 bg-primary text-white font-black text-[10px] rounded-lg">Accept</button>
                            <button onClick={() => handleTransitionOrder(o.id, 'CANCELLED')} className="py-1.5 px-2 bg-gray-50 border text-red-500 font-black text-[10px] rounded-lg">Cancel</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status column: PREPARING */}
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Preparing / Cooking</span>
                      <span className="h-5 min-w-[20px] px-1 bg-blue-500 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                        {orders.filter(o => o.status === 'PREPARING').length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'PREPARING').map(o => (
                        <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-text-primary">{o.id}</span>
                            <span className="text-[9px] text-blue-500 font-bold uppercase">In Kitchen</span>
                          </div>
                          <p className="text-xs font-bold text-[#1c1c1c]">{o.items}</p>
                          <div className="pt-2">
                            <button onClick={() => handleTransitionOrder(o.id, 'READY')} className="w-full py-1.5 bg-blue-600 text-white font-black text-[10px] rounded-lg">Mark Ready</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status column: READY */}
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border-l-4 border-green-500 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-black text-green-700 uppercase tracking-widest">Ready / Packed</span>
                      <span className="h-5 min-w-[20px] px-1 bg-green-500 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                        {orders.filter(o => o.status === 'READY').length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'READY').map(o => (
                        <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-text-primary">{o.id}</span>
                            <span className="text-[9px] text-green-500 font-bold uppercase">Ready</span>
                          </div>
                          <p className="text-xs font-bold text-[#1c1c1c]">{o.items}</p>
                          <div className="pt-2">
                            <button onClick={() => handleTransitionOrder(o.id, 'OUT_FOR_DELIVERY')} className="w-full py-1.5 bg-green-600 text-white font-black text-[10px] rounded-lg">Dispatch Agent</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status column: DISPATCHED / DELIVERY */}
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-500/10 border-l-4 border-purple-500 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Out For Delivery</span>
                      <span className="h-5 min-w-[20px] px-1 bg-purple-500 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                        {orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'OUT_FOR_DELIVERY').map(o => (
                        <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-text-primary">{o.id}</span>
                            <span className="text-[9px] text-purple-500 font-bold uppercase">In Transit</span>
                          </div>
                          <p className="text-xs font-bold text-[#1c1c1c]">{o.items}</p>
                          <div className="pt-2">
                            <button onClick={() => handleTransitionOrder(o.id, 'DELIVERED')} className="w-full py-1.5 bg-purple-600 text-white font-black text-[10px] rounded-lg">Mark Delivered</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: MENU & DISHES ── */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                {/* Image Duplication Warnings */}
                {duplicateImageAlert && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
                    <ShieldAlert className="text-rose-500 animate-bounce shrink-0" size={16} />
                    <span>{duplicateImageAlert}</span>
                  </div>
                )}

                {/* Categories Manager Panel */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Manage Menu Categories</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter new Category Name (e.g. Handmade Pasta)" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                    <button onClick={handleAddCategory} className="px-5 bg-primary text-white text-xs font-black rounded-xl flex items-center gap-1">
                      <Plus size={14} /> Add Category
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-full border text-xs font-bold">
                        <span>{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search foods, unique IDs..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <select
                      value={foodFilterCat}
                      onChange={(e) => setFoodFilterCat(e.target.value)}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="All">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <button onClick={() => handleOpenFoodModal()} className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl flex items-center gap-1">
                      <Plus size={14} /> Create Food
                    </button>
                  </div>
                </div>

                {/* Foods list table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[#686B78] font-black uppercase tracking-wider">
                          <th className="p-4">Food / ID</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Veg/Non-veg</th>
                          <th className="p-4">Image Check</th>
                          <th className="p-4">Availability</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-bold">
                        {filteredFoodsDisplay.map(food => (
                          <tr key={food.id} className="hover:bg-gray-50/50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border">
                                <img src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                <p className="font-bold text-[#1c1c1c]">{food.name}</p>
                                <p className="text-[10px] text-gray-400">{food.id}</p>
                              </div>
                            </td>
                            <td className="p-4 text-text-secondary">{food.category}</td>
                            <td className="p-4 text-primary">₹{food.price}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${
                                food.isVeg ? 'bg-green-50 text-green-600 border border-green-150' : 'bg-red-50 text-red-600 border border-red-150'
                              }`}>{food.isVeg ? 'Veg' : 'Non-Veg'}</span>
                            </td>
                            <td className="p-4">
                              {imageErrors[food.id] ? (
                                <span className="text-[10px] text-red-500 font-black">⚠️ Missing/Broken Image</span>
                              ) : food.image ? (
                                <span className="text-[10px] text-green-500 font-black">✓ Verified Unique</span>
                              ) : (
                                <span className="text-[10px] text-amber-500 font-black">⚠️ No Image</span>
                              )}
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => {
                                  setFoods(foods.map(f => f.id === food.id ? { ...f, availability: !f.availability } : f));
                                  toast.success(`Toggled availability of ${food.name}`);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  food.availability ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {food.availability ? 'In Stock' : 'Out of Stock'}
                              </button>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-1">
                              <button onClick={() => handleOpenFoodModal(food)} className="p-1.5 text-gray-400 hover:text-[#1c1c1c]"><Edit2 size={12} /></button>
                              <button onClick={() => handleDuplicateFood(food)} className="p-1.5 text-gray-400 hover:text-primary" title="Duplicate"><Copy size={12} /></button>
                              <button onClick={() => handleDeleteFood(food.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: PROMO COUPONS ── */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Create Outlet Specific Coupon</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Promo Code</label>
                      <input 
                        type="text" 
                        placeholder="PIZZA100" 
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Type</label>
                      <select 
                        value={newCoupon.type}
                        onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="Percentage">Percentage %</option>
                        <option value="Flat">Flat Discount ₹</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Discount</label>
                      <input 
                        type="number" 
                        value={newCoupon.discount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Min Order Amount</label>
                      <input 
                        type="number" 
                        value={newCoupon.minOrder}
                        onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateCoupon} className="py-2.5 px-6 rounded-xl text-xs font-black">Schedule Campaign</Button>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Active Campaign List</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coupons.map((c, i) => (
                      <div key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-sm font-black text-[#1c1c1c]">{c.code}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{c.type === 'Percentage' ? `${c.discount}% Off` : `₹${c.discount} Flat`} • Min Order: ₹{c.minOrder}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleCoupon(c.code)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                            c.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {c.active ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: REVIEWS & FEEDBACK ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Recent Reviews & Sentiment</h3>
                  <div className="space-y-4">
                    {reviews.map(rev => (
                      <div key={rev.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-[#1c1c1c]">{rev.customerName}</p>
                            <div className="flex gap-0.5 text-amber-500 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{rev.date}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">"{rev.comment}"</p>
                        
                        {rev.reply ? (
                          <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-start gap-2 text-xs">
                            <span className="font-bold text-primary shrink-0">Reply:</span>
                            <p className="text-text-secondary italic">"{rev.reply}"</p>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Write a professional customer reply..."
                              value={reviewReplies[rev.id] || ''}
                              onChange={(e) => setReviewReplies({ ...reviewReplies, [rev.id]: e.target.value })}
                              className="flex-1 p-2 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                            />
                            <button onClick={() => handleSubmitReply(rev.id)} className="px-4 bg-primary text-white text-[10px] font-black rounded-xl">Send</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: STAFF MANAGEMENT ── */}
            {activeTab === 'staff' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Shift Attendance & Roles</h3>
                  <button onClick={() => toast.success('Staff roster synchronized')} className="px-4 py-2 bg-gray-50 border rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw size={12} /> Sync Shift Logs
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-black uppercase">
                        <th className="p-3">Staff ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Shift Time</th>
                        <th className="p-3">Monthly Wage</th>
                        <th className="p-3">Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold">
                      {staff.map(s => (
                        <tr key={s.id}>
                          <td className="p-3 text-text-secondary">{s.id}</td>
                          <td className="p-3 text-[#1c1c1c]">{s.name}</td>
                          <td className="p-3"><span className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[10px] font-black">{s.role}</span></td>
                          <td className="p-3 text-text-secondary">{s.shift}</td>
                          <td className="p-3 text-[#1c1c1c]">₹{s.salary}</td>
                          <td className="p-3">
                            <span className={`h-2.5 w-2.5 rounded-full inline-block ${
                              s.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                            }`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 7: PROFILE SETTINGS ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Compliance & Regulatory Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">FSSAI License No</label>
                      <input 
                        type="text" 
                        value={restaurantProfile.fssaiLicense} 
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, fssaiLicense: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">GSTIN No</label>
                      <input 
                        type="text" 
                        value={restaurantProfile.gstNumber} 
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, gstNumber: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">PAN No</label>
                      <input 
                        type="text" 
                        value={restaurantProfile.panNumber} 
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, panNumber: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Timings & Radius Rules</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Delivery Radius Threshold (km)</label>
                      <input 
                        type="number" 
                        value={restaurantProfile.deliveryRadius} 
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, deliveryRadius: Number(e.target.value) })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Contact Numbers</label>
                      <input 
                        type="text" 
                        value={restaurantProfile.contactNumbers} 
                        onChange={(e) => setRestaurantProfile({ ...restaurantProfile, contactNumbers: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                  <Button onClick={() => {
                    toast.success('Outlet profile changes saved.');
                  }} className="py-2.5 px-6 rounded-xl text-xs font-black">Save profile changes</Button>
                </div>
              </div>
            )}

            {/* ── TAB 8: DELIVERY SURCHARGE SETTINGS ── */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Dynamic Surge Charge Schedulers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Rain Surcharge Fee (₹)</label>
                    <input type="number" defaultValue="45" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Holiday Extra Fee (₹)</label>
                    <input type="number" defaultValue="30" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Peak Hour Surcharge (₹)</label>
                    <input type="number" defaultValue="25" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                  </div>
                </div>
                <div className="pt-2">
                  <Button onClick={() => toast.success('Surcharge configurations synchronized')} className="py-2.5 px-6 rounded-xl text-xs font-black">Sync Surge Settings</Button>
                </div>
              </div>
            )}

            {/* ── TAB 9: AUDIT LOGS & REPORTS ── */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                {/* Reports Export Widget */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Generate & Download Reports</h3>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => {
                        toast.success('Sales telemetry compiled. Download started!');
                      }}
                      className="p-3 rounded-xl border border-gray-250 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText size={14} className="text-primary" />
                      <span>Download Sales PDF</span>
                    </button>
                    <button 
                      onClick={() => {
                        toast.success('Inventory Audit Log sheets compiled to CSV!');
                      }}
                      className="p-3 rounded-xl border border-gray-250 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      <span>Export Inventory Excel</span>
                    </button>
                  </div>
                </div>

                {/* Audit Logs list */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Regulatory Operations Audit Trail</h3>
                  <div className="space-y-3 font-bold text-xs">
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[9px] font-black uppercase border border-primary/10 mr-2">{log.action}</span>
                          <span className="text-[#1c1c1c]">{log.details}</span>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-[10px] text-gray-400 font-bold">{log.timestamp}</p>
                          <p className="text-[9px] text-[#686B78]">{log.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

      {/* ── FOOD CREATE/EDIT MODAL ── */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFoodModalOpen(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full relative z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-black text-[#1C1C1C]">{selectedFood ? 'Edit Food Item' : 'Create New Food Item'}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Food ID</label>
                <input type="text" disabled value={foodForm.id} className="w-full p-3 bg-gray-100 border border-transparent rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Food Name</label>
                <input 
                  type="text" 
                  value={foodForm.name} 
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="e.g. Margherita Wood-Fired Pizza"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black">Description</label>
                <textarea 
                  value={foodForm.description} 
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  placeholder="San Marzano tomatoes, fresh buffalo mozzarella..."
                  className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none resize-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Category</label>
                <select 
                  value={foodForm.category} 
                  onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Base Price (₹)</label>
                <input 
                  type="number" 
                  value={foodForm.price} 
                  onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                  placeholder="349"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Discount Price (₹ - Optional)</label>
                <input 
                  type="number" 
                  value={foodForm.discountPrice} 
                  onChange={(e) => setFoodForm({ ...foodForm, discountPrice: e.target.value })}
                  placeholder="299"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Spice Level</label>
                <select 
                  value={foodForm.spiceLevel} 
                  onChange={(e) => setFoodForm({ ...foodForm, spiceLevel: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Extra Hot">Extra Hot</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black">Ingredients (Comma Separated)</label>
                <input 
                  type="text" 
                  value={foodForm.ingredients} 
                  onChange={(e) => setFoodForm({ ...foodForm, ingredients: e.target.value })}
                  placeholder="San Marzano Tomato, Mozzarella Cheese, Fresh Basil"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black">Food Image URL (Must be Unique)</label>
                <input 
                  type="text" 
                  value={foodForm.image} 
                  onChange={(e) => {
                    setFoodForm({ ...foodForm, image: e.target.value });
                    checkDuplicateImage(e.target.value, selectedFood?.id);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setIsFoodModalOpen(false)} variant="outline" className="px-6 py-2 rounded-xl text-xs">Cancel</Button>
              <Button onClick={handleSaveFood} className="px-8 py-2 rounded-xl text-xs font-black">Save Dish</Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default RestaurantPortal;
