import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Minus, Flame, Heart, Sparkles, Check, Info, ShieldAlert, Star,
  Compass, Coffee, IceCream, MessageSquare, CornerDownRight
} from 'lucide-react';
import AIImage from '../components/common/AIImage';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const FoodDetailModal = ({ isOpen, onClose, item, restaurantName, cuisine, onAdd }) => {
  if (!isOpen || !item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [cookingNote, setCookingNote] = useState('');
  const [selectedSpice, setSelectedSpice] = useState('Medium'); // Mild, Medium, Spicy
  
  // Calculate mock nutritional breakdown dynamically
  const basePrice = item.price;
  const cal = item.calories || Math.floor(Math.random() * 400) + 300;
  const carbs = Math.floor(cal * 0.12);
  const protein = Math.floor(cal * 0.04);
  const fats = Math.floor(cal * 0.03);

  // Mock list of ingredients for this item
  const defaultIngredients = item.ingredients || ['Fresh Herbs', 'Organic Olive Oil', 'Secret Seasoning Blend', 'Garlic', 'Sea Salt'];

  // Addons list with pricing
  const addonsList = [
    { name: 'Extra Mozzarella Cheese', price: 60, id: 'add-cheese' },
    { name: 'House Secret Chili Sauce', price: 30, id: 'add-sauce' },
    { name: 'Grilled Herb Mushrooms', price: 45, id: 'add-mushrooms' },
    { name: 'Avocado Cream Spread', price: 50, id: 'add-avocado' },
  ];

  // Dynamic drink recommendations
  const drinkRecs = [
    { name: 'Iced Peach Green Tea', price: 90, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=150' },
    { name: 'Cold Pressed Orange Juice', price: 120, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=150' },
    { name: 'Diet Lemon Fizz', price: 70, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150' }
  ];

  // Dynamic dessert recommendations
  const dessertRecs = [
    { name: 'Double Chocolate Fudge Brownie', price: 110, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=150' },
    { name: 'Classic Vanilla Bean Gelato', price: 95, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150' }
  ];

  const handleToggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.id === addon.id) 
        ? prev.filter(a => a.id !== addon.id) 
        : [...prev, addon]
    );
  };

  const handleToggleRemoveIng = (ing) => {
    setRemovedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const calculateTotalPrice = () => {
    const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    return (basePrice + addonsTotal) * quantity;
  };

  const handleAddToCart = () => {
    const customizedItem = {
      ...item,
      price: basePrice + selectedAddons.reduce((acc, a) => acc + a.price, 0),
      customized: true,
      selectedAddons,
      removedIngredients,
      cookingNote,
      selectedSpice
    };
    
    // Add multiple quantities
    for(let i = 0; i < quantity; i++) {
      onAdd(customizedItem);
    }
    
    toast.success(`${quantity}x ${item.name} (Customized) added to cart!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10 p-6 md:p-8 space-y-8"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 h-10 w-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1c1c1c] transition-all z-20 shadow-sm border border-gray-200"
          >
            <X size={20} />
          </button>

          {/* Banner Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 relative group">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-premium bg-gray-50 border border-gray-100">
                <AIImage 
                  src={item.image} 
                  dishName={item.name} 
                  restaurantName={restaurantName}
                  cuisine={cuisine}
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">
                <span className={`h-5 w-5 border-2 flex items-center justify-center rounded-md bg-white ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                </span>
                {item.isRecommended && (
                  <span className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                    Best Seller
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-[#1C1C1C] leading-tight">{item.name}</h2>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">{item.description || 'Delicately prepared with hand-selected ingredients to deliver a bursting taste experience.'}</p>
              
              {/* Price Tag */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">₹{basePrice}</span>
                {item.originalPrice && <span className="text-sm font-semibold text-gray-400 line-through">₹{item.originalPrice}</span>}
              </div>

              {/* Nutrition breakdown cards */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-center">
                  <span className="text-base font-black text-amber-600 block">{cal}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Calories</span>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-2xl text-center">
                  <span className="text-base font-black text-blue-600 block">{carbs}g</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Carbs</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-center">
                  <span className="text-base font-black text-emerald-600 block">{protein}g</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Protein</span>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl text-center">
                  <span className="text-base font-black text-rose-600 block">{fats}g</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Fats</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            {/* Customizations / Addons */}
            <div className="space-y-6">
              {/* Spice selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#1c1c1c] tracking-wider flex items-center gap-1.5">
                  <Flame size={14} className="text-rose-500 animate-bounce" /> Customize Heat Level
                </h4>
                <div className="flex gap-2">
                  {['Mild', 'Medium', 'Extra Hot'].map(spice => (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpice(spice)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedSpice === spice 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-200 text-text-secondary hover:bg-gray-50'
                      }`}
                    >
                      {spice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Addons Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#1c1c1c] tracking-wider">Premium Add-ons</h4>
                <div className="space-y-2.5">
                  {addonsList.map(addon => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => handleToggleAddon(addon)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-gray-150 text-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                          {addon.name}
                        </span>
                        <span>+₹{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ingredient removal & Notes */}
            <div className="space-y-6">
              {/* Ingredient Exclusion */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#1c1c1c] tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-500" /> Exclude Ingredients
                </h4>
                <div className="flex flex-wrap gap-2">
                  {defaultIngredients.map(ing => {
                    const isRemoved = removedIngredients.includes(ing);
                    return (
                      <button
                        key={ing}
                        type="button"
                        onClick={() => handleToggleRemoveIng(ing)}
                        className={`py-1.5 px-3 rounded-full border text-[11px] font-bold transition-all ${
                          isRemoved 
                            ? 'border-red-500 bg-red-50 text-red-600 line-through' 
                            : 'border-gray-200 text-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        {isRemoved ? `No ${ing}` : `Include ${ing}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cooking Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#1c1c1c] tracking-wider">Special Chef Instructions</h4>
                <textarea
                  placeholder="e.g. Please make it extra crispy, hold the garlic..."
                  value={cookingNote}
                  onChange={(e) => setCookingNote(e.target.value)}
                  className="w-full h-24 p-3 bg-gray-50 border border-gray-200 focus:border-primary/20 focus:bg-white rounded-2xl text-xs font-bold outline-none resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Drinks & Desserts Side Recommendations */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase text-[#1c1c1c] tracking-wider flex items-center gap-1.5">
                <Coffee size={14} className="text-primary" /> Complete your meal
              </h4>
              <p className="text-[10px] text-gray-400 font-bold">Recommended drink pairings for this dish</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {drinkRecs.map((drink, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={drink.image} className="w-full h-full object-cover" alt={drink.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-[#1c1c1c] truncate">{drink.name}</p>
                    <p className="text-[10px] font-black text-primary">₹{drink.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50/50 overflow-hidden shadow-sm">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-3 hover:bg-gray-150 transition-colors"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="px-4 font-black text-sm text-[#1c1c1c]">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="p-3 hover:bg-gray-150 transition-colors"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>

            {/* Add to Basket button */}
            <Button
              onClick={handleAddToCart}
              className="flex-1 py-4 text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Add customized meal to basket • ₹{calculateTotalPrice()}
            </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FoodDetailModal;
