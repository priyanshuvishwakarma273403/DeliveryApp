import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Trash2, Search, Sparkles, Printer, User, CreditCard, DollarSign,
  Plus, Minus, RefreshCw, Layers, Clipboard, AlertCircle, CheckCircle, Percent
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import { playSuccessChime, playNotificationTick, playAlertBleep } from '../utils/audioSynth';
import { publishTelemetry } from '../utils/telemetrySync';

const POS_MENU = [
  { id: 'pos-1', name: 'Classic Neapolitan Margherita Pizza', price: 299, category: 'Pizza', isVeg: true, code: 'R-1' },
  { id: 'pos-2', name: 'Gourmet Truffle Burger', price: 349, category: 'Burgers', isVeg: false, code: 'R-2' },
  { id: 'pos-3', name: 'Paneer Butter Masala', price: 289, category: 'Indian', isVeg: true, code: 'R-3' },
  { id: 'pos-4', name: 'Peri Peri French Fries', price: 119, category: 'Sides', isVeg: true, code: 'D-1' },
  { id: 'pos-5', name: 'Salted Caramel Shake', price: 159, category: 'Drinks', isVeg: true, code: 'D-2' },
  { id: 'pos-6', name: 'Cheesy Garlic Bread', price: 149, category: 'Sides', isVeg: true, code: 'D-3' },
];

const CashierDashboard = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, CARD, UPI
  const [recentBills, setRecentBills] = useState([
    { id: 'BILL-4820', customer: 'Aarav Sharma', total: 648, time: '14:20 PM', status: 'PAID' },
    { id: 'BILL-4819', customer: 'Walk-in Customer', total: 418, time: '13:55 PM', status: 'PAID' }
  ]);

  const categories = ['All', 'Pizza', 'Burgers', 'Indian', 'Sides', 'Drinks'];

  const filteredMenu = useMemo(() => {
    return POS_MENU.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const addToCart = (item) => {
    playNotificationTick();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (itemId, d) => {
    playNotificationTick();
    const existing = cart.find(i => i.id === itemId);
    if (!existing) return;
    if (existing.qty + d <= 0) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, qty: i.qty + d } : i));
    }
  };

  const applyPromo = () => {
    if (couponCode.toUpperCase() === 'FREE20') {
      setCouponApplied(true);
      playSuccessChime();
      toast.success('20% promo code applied to cart!');
    } else {
      playAlertBleep();
      toast.error('Invalid cashier promo code.');
    }
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const discount = couponApplied ? subtotal * 0.2 : 0;
    const cgst = (subtotal - discount) * 0.025;
    const sgst = (subtotal - discount) * 0.025;
    const grandTotal = Math.round(subtotal - discount + cgst + sgst);
    return { subtotal, discount, cgst, sgst, grandTotal };
  }, [cart, couponApplied]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      playAlertBleep();
      toast.error('Add items to cart before checkout.');
      return;
    }
    const billId = `BILL-${Math.floor(4000 + Math.random() * 5999)}`;
    const customerName = customerPhone ? `Phone: ${customerPhone}` : 'Walk-in Customer';
    
    const newBill = {
      id: billId,
      customer: customerName,
      total: totals.grandTotal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PAID'
    };

    // Format new kitchen order payload for KDS
    const kitchenOrderPayload = {
      id: `KD-${Math.floor(550 + Math.random() * 400)}`,
      customer: customerName,
      type: 'DINE-IN',
      priority: 'NORMAL',
      timeReceived: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedTime: 15,
      timeElapsed: 0,
      assignedChef: 'Unassigned',
      station: cart[0]?.category || 'General',
      status: 'ACCEPTED',
      paymentStatus: 'PAID',
      allergyNotes: 'None',
      specialInstructions: 'Urgent POS order',
      items: cart.map(item => ({
        code: item.code || 'R-1',
        name: item.name,
        qty: item.qty,
        prepDone: false
      }))
    };

    // Publish to Real-Time Telemetry pipeline
    publishTelemetry('CASHIER_ORDER_CREATED', kitchenOrderPayload);

    setRecentBills([newBill, ...recentBills]);
    playSuccessChime();
    toast.success(`Bill generated successfully! Sent to Kitchen KDS.`, { icon: '🔥' });
    setCart([]);
    setCustomerPhone('');
    setCouponCode('');
    setCouponApplied(false);
  };

  const handlePrint = (billId) => {
    playNotificationTick();
    toast.success(`Sending invoice ${billId} to POS receipt thermal printer...`);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* POS Top Header */}
      <header className="bg-[#1E293B] border-b border-slate-800 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#FC8019] rounded-xl flex items-center justify-center font-black text-white shadow-lg">
            POS
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">FoodIQ Billing Engine</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cashier Cockpit Node</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Counter 01 Lane (Online)</span>
          </div>
          <button 
            onClick={() => {
              playNotificationTick();
              setCart([]);
              setCustomerPhone('');
              setCouponCode('');
              setCouponApplied(false);
              toast.success('POS billing terminal reset done.');
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            title="Reset Terminal"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* POS Grid Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Categories & Menu Grid */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Category Scrollers */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playNotificationTick(); setSelectedCategory(cat); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-[#FC8019] text-white shadow-md' 
                    : 'bg-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search dishes or item codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#FC8019]"
            />
          </div>

          {/* Dish items list */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMenu.map((item) => (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="bg-[#1E293B] border border-slate-850 hover:border-slate-750 p-4 rounded-3xl cursor-pointer transition-all space-y-3 relative overflow-hidden group select-none"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{item.id}</span>
                  <span className={`h-2.5 w-2.5 rounded-full border ${item.isVeg ? 'bg-emerald-500 border-emerald-600' : 'bg-red-500 border-red-600'}`} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white group-hover:text-[#FC8019] transition-colors">{item.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">{item.category}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-xs font-black text-white">₹{item.price}</span>
                  <span className="text-[9px] text-[#FC8019] font-black uppercase tracking-wider group-hover:underline">Add +</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Billing Cart Terminal */}
        <div className="w-full lg:w-96 bg-[#1E293B] border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShoppingBag size={16} className="text-[#FC8019]" /> Active Billing Ticket
            </h2>

            {/* Cart items listing */}
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-[#0F172A] border border-slate-850 rounded-2xl text-xs font-bold">
                  <div className="space-y-1">
                    <p className="text-white font-black">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">₹{item.price} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-800 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <Minus size={10} />
                      </button>
                      <span className="text-[10px] font-black px-1 text-white">{item.qty}</span>
                      <button onClick={() => addToCart(item)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <Plus size={10} />
                      </button>
                    </div>
                    <button onClick={() => updateQty(item.id, -99)} className="text-slate-500 hover:text-rose-500 p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-12 text-[11px] text-slate-500 font-bold">
                  Ticket empty. Tap menu items to add billing items.
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Customer phone no.</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Enter 10 digit mobile..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#FC8019]"
                />
              </div>
            </div>

            {/* Coupon Promo */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Promo code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. FREE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#0F172A] border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-[#FC8019]"
                />
                <button onClick={applyPromo} className="px-3 bg-slate-850 hover:bg-slate-850 text-xs font-black uppercase rounded-xl border border-slate-800 text-[#FC8019]">Apply</button>
              </div>
            </div>
          </div>

          {/* Pricing Ledger summary */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="space-y-2 font-bold text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-500 text-[11px]">
                  <span>Discount (20%)</span>
                  <span>-₹{totals.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>CGST (2.5%)</span>
                <span>₹{totals.cgst.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (2.5%)</span>
                <span>₹{totals.sgst.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-white text-sm font-black border-t border-slate-800 pt-2">
                <span>Grand Total</span>
                <span className="text-[#FC8019]">₹{totals.grandTotal}</span>
              </div>
            </div>

            {/* Payment Modes */}
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'CARD', 'UPI'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { playNotificationTick(); setPaymentMode(mode); }}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                    paymentMode === mode 
                      ? 'bg-slate-900 text-white border-[#FC8019]' 
                      : 'bg-[#0F172A] border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Checkout buttons */}
            <Button onClick={handleCheckout} className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-[#FC8019] hover:bg-orange-600 text-white">
              Complete Payment ({paymentMode})
            </Button>
          </div>
        </div>
      </div>

      {/* POS Bottom History Tray */}
      <footer className="bg-[#1E293B] border-t border-slate-800 p-4 shadow-inner">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Recent Invoices Generated Today</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentBills.map((bill) => (
            <div key={bill.id} className="p-3 bg-[#0F172A] border border-slate-850 rounded-2xl flex items-center justify-between text-xs font-bold">
              <div>
                <p className="text-white font-black">{bill.id}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{bill.customer} • {bill.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-black">₹{bill.total}</span>
                <button 
                  onClick={() => handlePrint(bill.id)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                  title="Print Thermal Receipt"
                >
                  <Printer size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default CashierDashboard;
