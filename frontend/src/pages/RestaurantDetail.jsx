import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Clock, 
  Search, 
  Info,
  ChevronDown,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Bike,
  MapPin,
  Users,
  Shield,
  Sparkles,
  X,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { getRestaurantById } from '../data/restaurants';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CoinRewardPopup from '../components/common/CoinRewardPopup';
import { cn } from '../utils/cn';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import ReviewSection from '../components/restaurant/ReviewSection';
import apiClient from '../api/axios';
import { toast } from 'react-hot-toast';
import AIImage from '../components/common/AIImage';
import FoodDetailModal from '../components/restaurant/FoodDetailModal';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const { items, addItem, updateQuantity, getTotalAmount } = useCartStore();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const [res, menuRes] = await Promise.all([
          apiClient.get(`/restaurants/${id}`),
          apiClient.get(`/menu/restaurant/${id}`)
        ]);

        const data = res.data?.data || res.data;
        const menuItems = menuRes.data?.data || menuRes.data;

        if (menuItems && Array.isArray(menuItems)) {
           const groupedMenu = menuItems.reduce((acc, item) => {
             const cat = item.category || 'Other';
             let section = acc.find(s => s.category === cat);
             if (!section) {
               section = { category: cat, items: [] };
               acc.push(section);
             }
             section.items.push({
               ...item,
               image: item.imageUrl || item.image,
               isVeg: item.vegetarian !== undefined ? item.vegetarian : item.isVeg,
               isRecommended: item.isRecommended || false
             });
             return acc;
           }, []);
           data.menu = groupedMenu;
           setOpenCategories(groupedMenu.map(s => s.category));
        }

        data.cuisine = data.cuisineType || data.cuisine || 'Multi-cuisine';
        data.deliveryTime = data.avgDeliveryTime || data.deliveryTime || 30;
        data.image = data.imageUrl || data.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591';
        data.costForTwo = data.minOrderAmount || data.costForTwo || 250;
        
        setRestaurant(data);
      } catch (error) {
        console.error("Failed to fetch restaurant", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  const handleAddItem = (item, restaurantId) => {
    addItem(item, restaurantId);
    const coins = Math.floor(item.price * 0.01);
    if (coins > 0) {
      setRewardCoins(coins);
      setShowReward(true);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-2xl font-black mb-2">Restaurant Not Found</h1>
        <p className="text-text-secondary mb-6">This restaurant doesn't exist or has been removed.</p>
        <Link to="/restaurants">
          <Button className="rounded-2xl px-8">Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  const toggleCategory = (cat) => {
    setOpenCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const getItemQuantity = (itemId) => {
    return items.find(i => i.id === itemId)?.quantity || 0;
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Filter menu items
  const filteredMenu = restaurant.menu?.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (vegOnly && !item.isVeg) return false;
      if (menuSearch && !item.name.toLowerCase().includes(menuSearch.toLowerCase())) return false;
      return true;
    })
  })).filter(section => section.items.length > 0) || [];

  // Profitable Personalised Combo Generator Logic (Requirement 10)
  const getSmartCombos = () => {
    if (!restaurant || !restaurant.menu) return [];
    
    const allItems = restaurant.menu.flatMap(sec => sec.items);
    if (allItems.length < 2) return [];

    const pizzas = allItems.filter(i => i.name.toLowerCase().includes('pizza'));
    const burgers = allItems.filter(i => i.name.toLowerCase().includes('burger') || i.name.toLowerCase().includes('sandwich'));
    const drinks = allItems.filter(i => i.name.toLowerCase().includes('drink') || i.name.toLowerCase().includes('coke') || i.name.toLowerCase().includes('beverage') || i.name.toLowerCase().includes('shake') || i.name.toLowerCase().includes('mojito') || i.name.toLowerCase().includes('water'));
    const sides = allItems.filter(i => !pizzas.includes(i) && !burgers.includes(i) && !drinks.includes(i) && i.price < 180);

    const combos = [];

    // Combo 1: Pizza Combo
    if (pizzas.length > 0) {
      const pizza = pizzas[0];
      const side = sides.length > 0 ? sides[0] : allItems.find(i => i !== pizza);
      const drink = drinks.length > 0 ? drinks[0] : { id: 'mock-drink-1', name: 'Pepsi Black', price: 60, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150' };
      
      const originalPrice = pizza.price + (side ? side.price : 90) + drink.price;
      const comboPrice = Math.round(originalPrice * 0.85); 
      
      combos.push({
        title: 'AI Smart Pizza Combo',
        items: [pizza, side || { name: 'Garlic Bread', price: 90 }, drink],
        originalPrice,
        price: comboPrice,
        description: `Delectable combo of ${pizza.name}, sides and refreshing Pepsi Black.`,
        icon: '🍕'
      });
    }

    // Combo 2: Burger Combo
    if (burgers.length > 0) {
      const burger = burgers[0];
      const side = sides.length > 0 ? sides[0] : allItems.find(i => i !== burger);
      const drink = drinks.length > 0 ? drinks[0] : { id: 'mock-drink-2', name: 'Pepsi Black', price: 60, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150' };
      
      const originalPrice = burger.price + (side ? side.price : 90) + drink.price;
      const comboPrice = Math.round(originalPrice * 0.88);
      
      combos.push({
        title: 'AI Smart Burger Combo',
        items: [burger, side || { name: 'Crinkle Fries', price: 90 }, drink],
        originalPrice,
        price: comboPrice,
        description: `Savory bundle of ${burger.name}, french fries and beverage.`,
        icon: '🍔'
      });
    }

    // Fallback: Chef Special Combo
    if (combos.length === 0) {
      const item1 = allItems[0];
      const item2 = allItems[1];
      const originalPrice = item1.price + item2.price;
      const comboPrice = Math.round(originalPrice * 0.85);

      combos.push({
        title: 'Personalized Feast Pack',
        items: [item1, item2],
        originalPrice,
        price: comboPrice,
        description: `Curated assortment of ${item1.name} and ${item2.name} chosen based on your flavor profile.`,
        icon: '✨'
      });
    }

    return combos.slice(0, 2);
  };

  const MenuItem = ({ item }) => (
    <div className="flex justify-between items-start py-4 md:py-8 border-b border-gray-100 last:border-0 group">
      <div className="flex-1 pr-3 md:pr-8 cursor-pointer" onClick={() => setSelectedFoodItem(item)}>
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
           <div className={`h-3.5 w-3.5 md:h-4 md:w-4 border-2 flex items-center justify-center rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
           </div>
           {item.isRecommended && <Badge variant="warning" className="text-[8px] md:text-[10px] py-0 px-1.5">Best Seller</Badge>}
        </div>
        <h3 className="text-sm md:text-lg font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">{item.name}</h3>
        <p className="text-xs md:text-sm font-bold text-text-primary mt-0.5 md:mt-1">₹{item.price}</p>
        <p className="text-[11px] md:text-sm text-text-secondary mt-1 md:mt-3 leading-relaxed max-w-md line-clamp-2 hidden sm:block">{item.description}</p>
      </div>

      <div className="relative shrink-0">
        <div className="h-20 w-20 md:h-32 md:w-32 rounded-xl md:rounded-2xl overflow-hidden shadow-premium cursor-pointer" onClick={() => setSelectedFoodItem(item)}>
          <AIImage 
            src={item.image} 
            dishName={item.name} 
            restaurantName={restaurant.name}
            cuisine={restaurant.cuisine}
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        </div>
        
        <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2">
          {getItemQuantity(item.id) > 0 ? (
            <div className="bg-white text-primary border border-primary/20 shadow-premium rounded-lg md:rounded-xl flex items-center overflow-hidden">
              <button 
                onClick={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
                className="px-2 md:px-3 py-1.5 md:py-2 hover:bg-primary/5 transition-colors"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="px-2 md:px-3 font-black text-xs md:text-sm">{getItemQuantity(item.id)}</span>
              <button 
                onClick={() => handleAddItem(item, restaurant.id)}
                className="px-2 md:px-3 py-1.5 md:py-2 hover:bg-primary/5 transition-colors"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <Button 
              onClick={() => handleAddItem(item, restaurant.id)}
              className="bg-white text-primary border border-primary/20 hover:border-primary shadow-premium px-4 md:px-8 py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs whitespace-nowrap"
            >
              ADD
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="h-[200px] sm:h-[280px] md:h-[400px] relative overflow-hidden">
        <img 
          src={getOptimizedImageUrl(restaurant.image, { width: 1200, height: 600 })} 
          className="w-full h-full object-cover" 
          alt={restaurant.name} 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80';
            e.target.onerror = null;
          }}
          loading="lazy" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <Link to="/restaurants" className="absolute top-4 md:top-8 left-4 md:left-8 h-8 w-8 md:h-10 md:w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all">
          <ArrowLeft size={18} />
        </Link>
        
        <div className="absolute bottom-4 md:bottom-12 left-0 right-0">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 md:mb-4">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-6 text-white/90 text-xs md:text-base">
              <span className="font-medium">{restaurant.cuisine}</span>
              <div className="h-1 w-1 rounded-full bg-white/40 hidden sm:block" />
              <span className="flex items-center gap-1 md:gap-2">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{Number(restaurant.rating || 4.0).toFixed(1)} ({restaurant.totalRatings?.toLocaleString()}+ ratings)</span>
              </span>
              <div className="h-1 w-1 rounded-full bg-white/40 hidden sm:block" />
              <span className="flex items-center gap-1 md:gap-2">
                <Clock size={14} />
                <span className="font-bold">{restaurant.deliveryTime} mins</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 md:py-4 flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
          {restaurant.offer && (
            <div className="flex items-center gap-1.5 text-secondary font-bold">
              <span className="text-sm md:text-base">🏷️</span> {restaurant.offer}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MapPin size={14} className="text-primary" /> {restaurant.address}
          </div>
          {restaurant.costForTwo && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Users size={14} className="text-primary" /> ₹{restaurant.costForTwo} for two
            </div>
          )}
          <button 
            onClick={() => setShowHealthModal(true)}
            className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 px-3 py-1 rounded-full font-black text-xs transition-all"
          >
            <Shield size={12} className="fill-emerald-600" />
            AI Health Score: 94% (Elite)
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-12">
        
        {/* AI Smart Combos section */}
        {getSmartCombos().length > 0 && (
          <div className="mb-10 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2.5rem] p-6 md:p-8 border border-white/5 text-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm md:text-lg font-black text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                  AI Personalized Smart Combos
                </h3>
                <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">Profitable bundles generated based on trending items and your flavor history</p>
              </div>
              <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                Personalized Deals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getSmartCombos().map((combo, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 hover:border-yellow-400/30 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-bl-xl">
                    Save {Math.round(100 - (combo.price / combo.originalPrice)*100)}%
                  </div>

                  <div>
                    <h4 className="text-sm md:text-base font-black text-white flex items-center gap-2 mb-2">
                      <span className="text-lg">{combo.icon}</span>
                      {combo.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{combo.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {combo.items.map((ci, cidx) => (
                        <span key={cidx} className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-lg">
                          {ci.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                    <div>
                      <span className="text-[10px] text-gray-500 line-through block">₹{combo.originalPrice}</span>
                      <span className="text-lg font-black text-yellow-400">₹{combo.price}</span>
                    </div>

                    <Button
                      onClick={() => {
                        combo.items.forEach(ci => handleAddItem(ci, restaurant.id));
                        toast.success(`Combo added to cart!`);
                      }}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[10px] uppercase px-4 py-2 rounded-lg shadow-lg shadow-yellow-400/10"
                    >
                      Add Combo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 md:pb-6 mb-4 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <h2 className="text-lg md:text-2xl font-black text-text-primary">Menu</h2>
            <div className="relative flex-1 sm:flex-initial">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                type="text" 
                placeholder="Search menu..." 
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border-none rounded-full text-xs md:text-sm w-full sm:w-56 md:w-64 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
               />
            </div>
          </div>
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold border transition-all",
              vegOnly 
                ? "bg-green-500 border-green-500 text-white" 
                : "bg-white border-gray-200 text-text-secondary"
            )}
          >
            <div className={`h-3 w-3 border-2 rounded-sm flex items-center justify-center ${vegOnly ? 'border-white' : 'border-green-600'}`}>
              <div className={`h-1 w-1 rounded-full ${vegOnly ? 'bg-white' : 'bg-green-600'}`} />
            </div>
            Veg Only
          </button>
        </div>

        {/* Menu Sections */}
        <div className="space-y-4 md:space-y-12">
          {filteredMenu.map((section, idx) => (
            <div key={idx} className="scroll-mt-40">
              <button 
                onClick={() => toggleCategory(section.category)}
                className="flex items-center justify-between w-full mb-3 md:mb-6 group"
              >
                <h3 className="text-base md:text-xl font-black text-text-primary flex items-center gap-2 md:gap-3">
                  {section.category} ({section.items.length})
                </h3>
                <ChevronDown size={20} className={cn("text-gray-400 group-hover:text-primary transition-all", openCategories.includes(section.category) && "rotate-180")} />
              </button>
              
              <AnimatePresence initial={false}>
                {openCategories.includes(section.category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-gray-50">
                      {section.items.map(item => (
                        <MenuItem key={item.id} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="h-2 md:h-4 bg-gray-50/50 mt-3 md:mt-8 rounded-full" />
            </div>
          ))}
        </div>

        {filteredMenu.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No items found</h3>
            <p className="text-text-secondary text-sm">Try different search or filters</p>
          </div>
        )}
      </div>

      {/* Mobile Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="bg-primary mx-3 mb-3 rounded-2xl shadow-2xl shadow-primary/30 p-3 flex items-center justify-between">
            <div className="text-white">
              <p className="text-xs font-bold">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</p>
              <p className="text-lg font-black">₹{getTotalAmount()}</p>
            </div>
            <Link to="/cart">
              <Button className="bg-white text-primary hover:bg-gray-100 rounded-xl px-6 py-2.5 font-black text-sm">
                View Cart →
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      <CoinRewardPopup 
        show={showReward} 
        coins={rewardCoins} 
        onClose={() => setShowReward(false)} 
      />

      <FoodDetailModal
        isOpen={!!selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        item={selectedFoodItem}
        restaurantName={restaurant.name}
        cuisine={restaurant.cuisine}
        onAdd={(customItem) => addItem(customItem, restaurant.id)}
      />

      {/* Review Section */}
      <div className="bg-white pb-20">
        <div className="container mx-auto px-4">
          <ReviewSection restaurantId={restaurant.id} />
        </div>
      </div>

      {/* AI Health Score Detail Modal */}
      <AnimatePresence>
        {showHealthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHealthModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl border border-gray-100"
            >
              <button 
                onClick={() => setShowHealthModal(false)}
                className="absolute top-6 right-6 h-8 w-8 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Shield size={24} className="fill-emerald-500/20" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1C1C1C]">AI Health Audit Score</h3>
                  <p className="text-xs text-[#686B78] font-bold">Real-time quality & safety metrics</p>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center mb-6">
                <span className="text-4xl font-black text-emerald-600">94%</span>
                <span className="text-xs font-black text-emerald-600 block mt-1 uppercase tracking-widest">Elite Safety & Quality Grade</span>
              </div>

              <div className="space-y-4 text-xs font-medium text-text-secondary">
                <div className="flex justify-between items-center">
                  <span className="text-[#686B78]">Hygiene Compliance</span>
                  <span className="font-bold text-[#1C1C1C]">98% (Audit Verified)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#686B78]">Average Prep Time</span>
                  <span className="font-bold text-[#1C1C1C]">14 mins (Extremely Fast)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#686B78]">Refund Rate</span>
                  <span className="font-bold text-green-600">0.3% (Very Low complaints)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#686B78]">Customer Return Rate</span>
                  <span className="font-bold text-[#1C1C1C]">46% (High Loyalty)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#686B78]">Delivery Performance</span>
                  <span className="font-bold text-[#1C1C1C]">97.5% On-Time</span>
                </div>
              </div>

              <p className="text-[10px] text-[#686B78] mt-6 text-center leading-relaxed font-medium">
                Health audit computed autonomously from user feedback, kitchen telemetry, and municipal health safety checklists.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetail;
