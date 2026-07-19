import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingCart, 
  ArrowRight, 
  AlertCircle,
  Truck,
  ShieldCheck,
  Tag,
  ChevronLeft,
  Leaf,
  ShieldAlert,
  Sparkles,
  Gift,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import CoinRedeemer from '../components/wallet/CoinRedeemer';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import AIImage from '../components/common/AIImage';
import apiClient from '../api/axios';
import toast from 'react-hot-toast';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, addItem } = useCartStore();
  const { coins, isApplyingCoins } = useWalletStore();
  const { user } = useAuthStore();

  const [greenDelivery, setGreenDelivery] = useState(false);
  const [noCutlery, setNoCutlery] = useState(true);

  // Dynamic Combo States
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  const fetchCombos = async () => {
    if (items.length === 0) return;
    setLoadingCombos(true);
    try {
      const res = await apiClient.get('/recommendations/combos', {
        params: {
          cartItemIds: items.map(item => item.id)
        }
      });
      if (res.data?.success) {
        setCombos(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCombos(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [items]);

  const handleAddCombo = (combo) => {
    combo.items.forEach(cItem => {
      const exists = items.some(i => i.id === cItem.id);
      if (!exists) {
        addItem({
          id: cItem.id,
          name: cItem.name,
          price: cItem.price,
          imageUrl: cItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
          quantity: 1
        });
      }
    });
    toast.success(`🎉 Combo "${combo.name}" added to cart!`);
  };

  const subtotal = getTotalAmount();
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const greenCourierFee = greenDelivery ? 5 : 0;
  const intermediateTotal = subtotal + deliveryFee + tax + greenCourierFee;
  const discountAmount = isApplyingCoins ? Math.min(coins, intermediateTotal) : 0;
  const total = intermediateTotal - discountAmount;

  // Allergy Check Logic
  const activeAllergens = user?.allergens || [];
  const activeDietary = user?.dietary || [];

  const detectedAllergyWarnings = [];
  items.forEach(item => {
    const itemName = item.name.toLowerCase();
    
    if (activeAllergens.includes('Peanut') && (itemName.includes('peanut') || itemName.includes('nut'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Peanut', risk: 'HIGH' });
    }
    if (activeAllergens.includes('Dairy') && (itemName.includes('pizza') || itemName.includes('paneer') || itemName.includes('cheese') || itemName.includes('butter') || itemName.includes('milk') || itemName.includes('shake'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Dairy', risk: 'HIGH' });
    }
    if (activeAllergens.includes('Gluten') && (itemName.includes('pizza') || itemName.includes('burger') || itemName.includes('bread') || itemName.includes('bun') || itemName.includes('naan') || itemName.includes('noodle'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Gluten', risk: 'HIGH' });
    }
    if (activeAllergens.includes('Shellfish') && (itemName.includes('prawn') || itemName.includes('shrimp') || itemName.includes('crab') || itemName.includes('fish'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Shellfish', risk: 'HIGH' });
    }
    if (activeAllergens.includes('Soy') && (itemName.includes('tofu') || itemName.includes('soy') || itemName.includes('soya'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Soy', risk: 'HIGH' });
    }

    if (activeDietary.includes('Vegetarian') && (itemName.includes('chicken') || itemName.includes('mutton') || itemName.includes('fish') || itemName.includes('prawn') || itemName.includes('meat') || itemName.includes('egg'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Vegetarian Restriction (Contains Meat)', risk: 'CRITICAL' });
    }
    if (activeDietary.includes('Vegan') && (itemName.includes('chicken') || itemName.includes('mutton') || itemName.includes('fish') || itemName.includes('meat') || itemName.includes('egg') || itemName.includes('paneer') || itemName.includes('cheese') || itemName.includes('butter') || itemName.includes('milk') || itemName.includes('shake') || itemName.includes('curd'))) {
      detectedAllergyWarnings.push({ item: item.name, allergen: 'Vegan Restriction (Contains Dairy/Meat)', risk: 'CRITICAL' });
    }
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24 text-center pb-24 md:pb-24">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="max-w-md mx-auto"
        >
          <div className="h-32 w-32 md:h-48 md:w-48 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
            <ShoppingCart size={60} className="text-gray-200 md:w-20 md:h-20" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary mb-3 md:mb-4">Your Cart is Empty</h1>
          <p className="text-text-secondary text-sm md:text-base mb-8 md:mb-10 leading-relaxed">
            Good food is always just a few clicks away. <br className="hidden md:block" />Go ahead, order from our menu!
          </p>
          <Link to="/restaurants">
            <Button className="px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg shadow-xl shadow-primary/20">
              Explore Restaurants
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[56px] md:top-[72px] z-30">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/restaurants" className="md:hidden h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <ChevronLeft size={18} />
              </Link>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-text-primary">Cart ({items.length})</h1>
                <p className="text-[10px] md:text-xs text-text-secondary font-medium hidden sm:block">Review your items and checkout</p>
              </div>
            </div>
            <button 
              onClick={clearCart}
              className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors px-3 py-1.5 bg-red-50 rounded-lg"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          
          {/* Cart Items List */}
          <div className="flex-1">
            
            {/* AI Allergy Guardian Alerts */}
            {detectedAllergyWarnings.length > 0 && (
              <div className="mb-6 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] p-5 shadow-sm">
                <h3 className="text-sm font-black text-rose-800 flex items-center gap-2 mb-2">
                  <ShieldAlert size={18} className="text-rose-600 animate-bounce" />
                  AI Allergy Guardian Alert
                </h3>
                <div className="space-y-2">
                  {detectedAllergyWarnings.map((warn, i) => (
                    <p key={i} className="text-xs text-rose-700 leading-relaxed">
                      ⚠️ <strong>{warn.item}</strong> may conflict with your saved profile: <strong>{warn.allergen}</strong>. (Cross-contamination risk: <strong>{warn.risk}</strong>).
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-card-main rounded-[1.5rem] p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 md:gap-6 items-center group transition-all hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-gray-50 dark:border-gray-700">
                      <AIImage 
                        src={item.image || item.imageUrl} 
                        dishName={item.name} 
                        restaurantName={item.restaurantName || "FoodIQ"}
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm md:text-lg font-black text-[#1C1C1C] dark:text-white truncate leading-tight">{item.name}</h3>
                          <p className="text-[10px] md:text-xs text-[#686B78] line-clamp-1 mt-1 font-medium">
                            {item.description || 'Deliciously prepared with fresh ingredients.'}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 md:mt-4">
                        <span className="text-base md:text-xl font-black text-primary">₹{item.price * item.quantity}</span>
                        
                        {/* Quantity Controls */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center p-1 border border-gray-100 dark:border-gray-700">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 md:h-9 md:w-9 flex items-center justify-center text-[#686B78] hover:text-primary transition-colors"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-6 md:w-10 text-center font-black text-xs md:text-base text-[#1C1C1C] dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 md:h-9 md:w-9 flex items-center justify-center text-[#686B78] hover:text-primary transition-colors"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Free delivery banner */}
            <div className="mt-4 md:mt-6 bg-blue-50/50 p-3 md:p-5 rounded-xl md:rounded-2xl border border-blue-100/50 flex items-center gap-3 md:gap-4">
              <div className="h-9 w-9 md:h-10 md:w-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                <Truck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold text-blue-900">
                  {subtotal >= 500 ? '🎉 Free delivery applied!' : `Free delivery on ₹500+`}
                </p>
                {subtotal < 500 && (
                  <p className="text-[10px] md:text-xs text-blue-700/70">Add ₹{500 - subtotal} more to save ₹40</p>
                )}
              </div>
              <Link to="/restaurants">
                <Button variant="ghost" className="text-blue-600 hover:bg-white text-xs px-3 py-1.5 shrink-0 hidden sm:flex">Browse</Button>
              </Link>
            </div>

            {/* Frequently Bought Together Combos */}
            {combos.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-base font-black text-[#1C1C1C] dark:text-white flex items-center gap-2">
                  <Gift className="text-primary animate-pulse" size={18} />
                  Frequently Bought Together (Save 15%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {combos.map((combo, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                    >
                      <div>
                        <span className="bg-amber-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                          Smart Combo
                        </span>
                        <h4 className="font-bold text-sm text-[#1C1C1C] dark:text-white mt-1">{combo.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{combo.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {combo.items.map((cItem, iIdx) => (
                            <span 
                              key={iIdx} 
                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md text-[10px] text-gray-600 dark:text-gray-300 font-medium"
                            >
                              {cItem.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-amber-500/10">
                        <div>
                          <span className="text-xs line-through text-gray-400 font-semibold mr-2">₹{combo.originalPrice}</span>
                          <span className="text-sm font-black text-[#1C1C1C] dark:text-white">₹{combo.comboPrice}</span>
                        </div>
                        <button
                          onClick={() => handleAddCombo(combo)}
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl shadow-sm transition-all"
                        >
                          <PlusCircle size={12} /> Add Combo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Column */}
          <div className="lg:w-80 xl:w-96 space-y-4 md:space-y-6">
            <CoinRedeemer cartTotal={intermediateTotal} />
            
            {/* Carbon Footprint Intelligence card */}
            <div className="bg-white rounded-xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-[#1C1C1C] flex items-center gap-2">
                  <Leaf className="text-emerald-500 animate-pulse" size={18} />
                  Carbon Intelligence
                </h3>
                <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Sustainability Score: A+
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                  <span className="text-[9px] font-bold text-emerald-800/70 uppercase block">Est. CO2</span>
                  <p className="text-emerald-600 font-black mt-0.5">
                    {Math.max(0.1, (subtotal * 0.0012 - (noCutlery ? 0.15 : 0) - (greenDelivery ? 0.35 : 0))).toFixed(2)} kg
                  </p>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                  <span className="text-[9px] font-bold text-emerald-800/70 uppercase block">Packaging Impact</span>
                  <p className="text-emerald-600 font-black mt-0.5">Sugarcane Pulp</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <label className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={greenDelivery} 
                      onChange={(e) => setGreenDelivery(e.target.checked)} 
                      className="accent-emerald-500 h-4 w-4" 
                    />
                    <div>
                      <span className="font-bold text-[#1C1C1C] block">Greener EV Delivery</span>
                      <span className="text-[10px] text-text-secondary">Reduce transit emissions by 85%</span>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">+₹5</span>
                </label>

                <label className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={noCutlery} 
                      onChange={(e) => setNoCutlery(e.target.checked)} 
                      className="accent-emerald-500 h-4 w-4" 
                    />
                    <div>
                      <span className="font-bold text-[#1C1C1C] block">No Plastic Cutlery</span>
                      <span className="text-[10px] text-text-secondary">Saves 0.15 kg CO2 footprint</span>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">Saved</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6">
                <h3 className="text-sm md:text-lg font-bold text-text-primary mb-4 md:mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-text-secondary font-medium">Item Total</span>
                    <span className="font-bold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-text-secondary font-medium">Delivery Fee</span>
                    <span className={cn("font-bold", deliveryFee === 0 ? "text-green-500" : "")}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {greenDelivery && (
                    <div className="flex justify-between items-center text-xs md:text-sm text-emerald-600 font-bold">
                      <span>EV Delivery Charge</span>
                      <span>₹5</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-text-secondary font-medium">Taxes (5%)</span>
                    <span className="font-bold">₹{tax}</span>
                  </div>
                  
                  {isApplyingCoins && (
                    <div className="flex justify-between items-center text-xs md:text-sm text-green-600">
                      <span className="font-bold">Coins Discount</span>
                      <span className="font-bold">-₹{discountAmount}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm md:text-lg font-black text-text-primary">Total</span>
                    <span className="text-lg md:text-2xl font-black text-primary">₹{total}</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="relative mb-4 md:mb-6">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                  <input 
                    type="text" 
                    placeholder="Promo code" 
                    className="w-full pl-9 pr-20 py-2.5 md:py-3 bg-gray-50 border border-transparent rounded-xl text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all uppercase placeholder:normal-case"
                  />
                  <button className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-white text-primary text-[10px] md:text-xs font-black rounded-lg border border-primary/20 hover:border-primary transition-all">APPLY</button>
                </div>

                {/* Checkout Button */}
                <div className="hidden md:block">
                  <Link to="/checkout">
                    <Button className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base shadow-xl shadow-primary/20">
                      Proceed to Checkout <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-green-500" /> Secure Checkout
                </div>
                <div className="flex gap-3 grayscale opacity-50">
                  <img src="https://www.vectorlogo.zone/logos/visa/visa-icon.svg" className="h-3 md:h-4" alt="Visa" />
                  <img src="https://www.vectorlogo.zone/logos/mastercard/mastercard-icon.svg" className="h-3 md:h-4" alt="Mastercard" />
                  <img src="https://www.vectorlogo.zone/logos/upi/upi-icon.svg" className="h-3 md:h-4" alt="UPI" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-orange-100 flex gap-3">
              <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-xs text-orange-800 leading-relaxed font-medium">
                Tip: Avoid multiple restaurant orders to get your food delivered faster!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Fixed Bottom Checkout Bar */}
      <div className="md:hidden fixed bottom-[64px] left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-text-secondary font-medium">Total Amount</p>
            <p className="text-lg font-black text-primary">₹{total}</p>
          </div>
          <Link to="/checkout" className="flex-1 max-w-[200px]">
            <Button className="w-full py-3 rounded-xl font-black text-sm shadow-lg shadow-primary/20">
              Checkout →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
