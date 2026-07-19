import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Heart, 
  Clock, 
  MapPin, 
  Activity, 
  Compass, 
  ChevronRight, 
  Plus, 
  ShoppingBag,
  Star,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

const HomeRecommendations = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-detect browser location & weather mock
  const [weather] = useState(() => {
    const hours = new Date().getHours();
    // Simulate weather depending on season / current rain factor
    return hours % 3 === 0 ? 'RAINY' : 'SUMMER';
  });

  const [timeOfDay] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'MORNING';
    if (hour >= 11 && hour < 16) return 'AFTERNOON';
    if (hour >= 16 && hour < 22) return 'EVENING';
    return 'MIDNIGHT';
  });

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/recommendations/home', {
        params: {
          userId: user?.id || '',
          weather: weather,
          timeOfDay: timeOfDay,
          location: 'Noida'
        }
      });
      if (response.data?.success) {
        setRecommendations(response.data.data);
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const handleTrackClick = async (itemId, strategy) => {
    try {
      await apiClient.post('/recommendations/track', null, {
        params: {
          userId: user?.id || '',
          itemId: itemId,
          action: 'CLICK'
        }
      });
    } catch (e) {
      // Telemetry fail safe
    }
  };

  const handleAddToCart = (e, item, strategy) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      quantity: 1
    });
    toast.success(`${item.name} added to cart!`);
    
    // Log conversion/purchase interest telemetry
    apiClient.post('/recommendations/track', null, {
      params: {
        userId: user?.id || '',
        itemId: item.id,
        action: 'CONVERSION'
      }
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
        {[1, 2].map((idx) => (
          <div key={idx} className="space-y-4">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4].map((itemIdx) => (
                <div key={itemIdx} className="h-44 w-72 shrink-0 bg-gray-150 dark:bg-gray-850 rounded-3xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!recommendations) return null;

  // Filter sections that actually contain recommendations
  const sections = [
    { key: 'recommendedForYou', title: 'Recommended For You', icon: <Sparkles className="text-primary" /> },
    { key: 'trendingNearYou', title: 'Trending Near You', icon: <Flame className="text-orange-500" /> },
    { key: 'healthyChoices', title: 'Healthy & Dietary Choices', icon: <Activity className="text-green-500" /> },
    { key: 'timeBasedSpecials', title: `${timeOfDay.charAt(0) + timeOfDay.slice(1).toLowerCase()} Specials`, icon: <Clock className="text-blue-500" /> },
    { key: 'weatherSpecials', title: `${weather === 'RAINY' ? 'Rainy Day comfort' : 'Summer Chills'} Specials`, icon: <Compass className="text-yellow-500" /> },
    { key: 'chefRecommendations', title: "Chef's Featured Specials", icon: <Heart className="text-red-500" /> }
  ];

  return (
    <div className="space-y-12 py-8 bg-gray-50/50 dark:bg-gray-900/10">
      {sections.map((sec) => {
        const list = recommendations[sec.key] || [];
        if (list.length === 0) return null;

        return (
          <section key={sec.key} className="container mx-auto px-4 md:px-6">
            <div className="flex items-center gap-2 mb-6">
              {sec.icon}
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-[#1C1C1C] dark:text-white">
                {sec.title}
              </h3>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory scroll-smooth">
              {list.map((rec, index) => {
                const isItem = rec.type === 'MENU_ITEM';
                const item = rec.data;
                if (!item) return null;

                return (
                  <motion.div
                    key={item.id || index}
                    whileHover={{ y: -4 }}
                    className="snap-start shrink-0 w-72 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-[2rem] overflow-hidden shadow-sm flex flex-col justify-between"
                    onClick={() => handleTrackClick(item.id, rec.strategy)}
                  >
                    <div>
                      {/* Image section */}
                      <div className="h-40 w-full relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={item.imageUrl || (isItem 
                            ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
                            : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'
                          )}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Explainable AI Tag */}
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold tracking-wide">
                          {rec.reason}
                        </div>
                      </div>

                      {/* Info section */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-sm text-[#1C1C1C] dark:text-white truncate flex-1">{item.name}</h4>
                          {isItem && (
                            <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${item.vegetarian ? 'border-green-500' : 'border-red-500'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${item.vegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                          {isItem ? item.description : `${item.cuisineType} | Delivery in ${item.avgDeliveryTime} mins`}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-850/50 mt-2 flex items-center justify-between">
                      {isItem ? (
                        <>
                          <span className="text-sm font-black text-[#1C1C1C] dark:text-white">₹{item.price}</span>
                          <button
                            onClick={(e) => handleAddToCart(e, item, rec.strategy)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Plus size={14} /> Add
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <Star size={14} fill="currentColor" /> {item.rating || '4.2'}
                          </span>
                          <Link
                            to={`/restaurants/${item.id}`}
                            className="text-xs font-black text-primary flex items-center gap-1"
                          >
                            Order Now <ChevronRight size={14} />
                          </Link>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default HomeRecommendations;
