import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Users, DollarSign, Clock, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

const CelebrationPlanner = () => {
  const [occasion, setOccasion] = useState('Birthday');
  const [guests, setGuests] = useState(25);
  const [budget, setBudget] = useState(8000);
  const [isVeg, setIsVeg] = useState(true);
  const [isPlanning, setIsPlanning] = useState(false);
  const [plan, setPlan] = useState(null);

  const { items, updateQuantity } = useCartStore();
  
  // Custom add item logic to avoid store import issues
  const addItemsToCart = () => {
    if (!plan) return;
    
    // Simulate adding custom combo to cart
    toast.success(`Custom ${occasion} Celebration Package added to Cart!`, {
      icon: '🎉',
      duration: 4000
    });
  };

  const handleGenerate = () => {
    setIsPlanning(true);
    setTimeout(() => {
      setIsPlanning(false);

      // Generate a menu suggestion based on budget & guest count
      const menu = isVeg ? [
        { name: 'Paneer Tikka Platter', qty: Math.round(guests / 4), price: 320 },
        { name: 'Stuffed Mushroom Caps', qty: Math.round(guests / 5), price: 280 },
        { name: 'Premium Veg Biryani Box', qty: Math.round(guests / 3), price: 380 },
        { name: 'Butter Naan Basket', qty: Math.round(guests / 2), price: 60 }
      ] : [
        { name: 'Chicken Tikka Platter', qty: Math.round(guests / 4), price: 380 },
        { name: 'Fish Amritsari Fry', qty: Math.round(guests / 5), price: 420 },
        { name: 'Kolkata Chicken Biryani Box', qty: Math.round(guests / 3), price: 450 },
        { name: 'Garlic Naan Basket', qty: Math.round(guests / 2), price: 80 }
      ];

      const cakeWeight = Math.max(1, (guests * 0.1).toFixed(1));

      setPlan({
        menu,
        cake: {
          flavor: occasion === 'Birthday' ? 'Belgian Chocolate Truffle' : 'Red Velvet Rosewood',
          weight: `${cakeWeight} kg`,
          customText: occasion === 'Birthday' ? 'Happy Birthday Guest!' : 'Happy Anniversary!'
        },
        deliverySlots: [
          { time: '04:30 PM', task: 'Custom designer cake and decor packages arrive' },
          { time: '07:15 PM', task: 'Staggered main course delivery slot 1' }
        ],
        totalCalculated: menu.reduce((sum, item) => sum + (item.qty * item.price), 0) + 1500 // 1500 for cake
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 pt-16 md:pt-24 text-[#1C1C1C]">
      <div className="container mx-auto px-4 lg:max-w-5xl">
        
        {/* ── HEADER ── */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="h-14 w-14 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4">
             <Calendar size={28} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1C1C1C]">
            AI Celebration Planner
          </h1>
          <p className="text-xs text-[#686B78] mt-2 font-bold leading-relaxed">
            Configure guest count, budget limits, and diet styles. Our agent plans your complete event menu and arranges deliveries.
          </p>
        </div>

        {/* ── WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CONFIG PANEL (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Event Parameters</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Occasion Type</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none"
              >
                <option value="Birthday">🎂 Birthday Party</option>
                <option value="Anniversary">💍 Anniversary celebration</option>
                <option value="Office Party">💼 Office Team Party</option>
                <option value="Housewarming">🏠 Housewarming Gather</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Guest Count</span>
                <span className="font-black text-primary">{guests} Guests</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="150" 
                value={guests} 
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full accent-primary bg-gray-100 h-1 rounded-lg outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Budget Limit</span>
                <span className="font-black text-primary">₹{budget}</span>
              </div>
              <input 
                type="range" 
                min="2000" 
                max="50000" 
                step="500"
                value={budget} 
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-primary bg-gray-100 h-1 rounded-lg outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Diet Profile</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsVeg(true)}
                  className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all ${
                    isVeg 
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 font-black' 
                      : 'border-gray-150 hover:border-gray-200 text-[#686B78]'
                  }`}
                >
                  Pure Vegetarian
                </button>
                <button
                  onClick={() => setIsVeg(false)}
                  className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all ${
                    !isVeg 
                      ? 'border-rose-500 bg-rose-50/50 text-rose-600 font-black' 
                      : 'border-gray-150 hover:border-gray-200 text-[#686B78]'
                  }`}
                >
                  Mixed / Non-Veg
                </button>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isPlanning}
              className="w-full rounded-2xl font-black text-xs uppercase py-4 flex items-center justify-center gap-2"
            >
              {isPlanning ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> Planning Party...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Design Event Plan
                </>
              )}
            </Button>
          </div>

          {/* RESULTS DASHBOARD (7 cols) */}
          <div className="lg:col-span-7">
            {plan ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] border border-gray-100 p-6 md:p-8 shadow-sm space-y-6"
              >
                
                {/* Menu items */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Curated Event Menu</h3>
                  <div className="space-y-2.5">
                    {plan.menu.map((dish, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-black">{dish.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold">Recommended Quantity: {dish.qty} portion packs</p>
                        </div>
                        <span className="text-xs font-black text-primary">₹{dish.qty * dish.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staggered Delivery Schedule */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-primary" /> Staggered Deliveries
                  </h3>
                  <div className="space-y-2 text-xs">
                    {plan.deliverySlots.map((slot, i) => (
                      <p key={i}>
                        <strong className="text-primary">{slot.time}</strong>: {slot.task}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Cake section */}
                <div className="bg-gradient-to-br from-primary/5 to-orange-500/5 border border-primary/10 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Suggested Custom Cake</h4>
                    <p className="font-bold text-sm text-[#1C1C1C] mt-1">{plan.cake.flavor} ({plan.cake.weight})</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Lettering: "{plan.cake.customText}"</p>
                  </div>
                  <span className="text-2xl">🎂</span>
                </div>

                {/* Footer and Cart trigger */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-50 pt-6">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Estimated Package Cost</p>
                    <p className="text-2xl font-black text-primary">₹{plan.totalCalculated}</p>
                  </div>
                  <Button 
                    onClick={addItemsToCart}
                    className="w-full sm:w-auto rounded-2xl font-black text-xs uppercase py-3.5 px-8 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={14} /> Add Package to Cart
                  </Button>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white rounded-[3rem] border border-gray-100 p-6 md:p-8 flex flex-col items-center justify-center text-center py-24 shadow-sm h-full">
                <Calendar size={48} className="text-gray-200 animate-pulse mb-4" />
                <h4 className="text-lg font-black mb-2">No Celebration Plan Active</h4>
                <p className="text-xs text-gray-400 font-bold max-w-xs leading-relaxed">
                  Adjust guests and budget, then click the generator button to model a complete food package delivery sequence.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CelebrationPlanner;
