import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Heart, 
  Clock, 
  Activity, 
  Compass, 
  ChevronRight, 
  Plus, 
  Star,
  Info,
  ThumbsDown,
  X,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import personalizationService from '../../services/personalizationService';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

// Map reason codes to premium, human-readable explanations
const REASON_EXPLANATIONS = {
  FAVORITE_CUISINE: 'Matches one of your top cuisine preferences.',
  SIMILAR_TO_FAVORITE: 'Similar to dishes or restaurants you order from frequently.',
  TOP_RATED: 'Highly rated by other foodies in your area.',
  NEARBY: 'Popular choice from a kitchen nearby for rapid delivery.',
  SPICY_PREFERENCE: 'Matches your preferred level of rich heat & spice.',
  WITHIN_BUDGET: 'Well within your usual comfortable budget range.',
  TIME_SPECIAL: 'An excellent dynamic choice for your current meal-time.',
  WEATHER_SPECIAL: 'Perfect comforting treat for the current weather conditions.',
  POPULAR_CHOICE: 'Trending choice representing great quality and taste.',
};

const getReasonText = (codes) => {
  if (!codes || codes.length === 0) return 'Recommended based on your Taste DNA';
  const primaryCode = codes[0];
  return REASON_EXPLANATIONS[primaryCode] || 'Personalized pick for you';
};

const HomeRecommendations = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeExplanation, setActiveExplanation] = useState(null); // { item, reasons }
  const [activeFeedbackItem, setActiveFeedbackItem] = useState(null); // item
  const [hiddenItems, setHiddenItems] = useState(new Set()); // IDs of items marked "not interested"

  // Fetch weather and time dynamically
  const getWeatherParam = () => {
    const hour = new Date().getHours();
    return hour % 3 === 0 ? 'RAINY' : 'NORMAL';
  };

  const getTimeOfDayParam = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'BREAKFAST';
    if (hour >= 11 && hour < 16) return 'LUNCH';
    if (hour >= 16 && hour < 22) return 'DINNER';
    return 'LATE_NIGHT';
  };

  const fetchHomeFeed = async () => {
    setLoading(true);
    try {
      const weather = getWeatherParam();
      const timeOfDay = getTimeOfDayParam();
      const response = await personalizationService.getHomeFeed({
        userId: user?.id ? `user-${user.id}` : '',
        weather,
        timeOfDay,
        location: 'Noida'
      });
      if (response?.success) {
        setFeedData(response.data);
      }
    } catch (e) {
      console.error("Failed to load personalized feed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeFeed();
  }, [user]);

  const handleTrackClick = async (itemId, type) => {
    try {
      await personalizationService.submitRecommendationFeedback({
        eventType: type === 'DISH' ? 'USER_VIEWED_DISH' : 'USER_VIEWED_RESTAURANT',
        itemId: itemId,
        additionalPayload: {
          action: 'CLICK',
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      // Telemetry fail safe
    }
  };

  const handleAddToCart = async (e, dish) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      quantity: 1
    });
    toast.success(`${dish.name} added to cart!`);
    
    // Log conversion/purchase interest telemetry
    try {
      await personalizationService.submitRecommendationFeedback({
        eventType: 'USER_COMPLETED_ORDER', // indicates purchase interest conversion
        itemId: dish.id,
        restaurantId: dish.restaurantId,
        amount: dish.price,
        additionalPayload: {
          action: 'CONVERSION',
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      // Telemetry fail safe
    }
  };

  const submitFeedback = async (reason) => {
    if (!activeFeedbackItem) return;
    const item = activeFeedbackItem;
    const isDish = item.type === 'DISH';
    
    try {
      await personalizationService.submitRecommendationFeedback({
        eventType: 'USER_DISLIKED',
        itemId: item.id,
        restaurantId: isDish ? item.data?.restaurantId : item.id,
        additionalPayload: {
          feedbackReason: reason,
          itemType: item.type,
          timestamp: new Date().toISOString()
        }
      });
      
      // Hide item with state animation
      setHiddenItems(prev => {
        const updated = new Set(prev);
        updated.add(item.id);
        return updated;
      });
      
      toast.success('Recommendation updated. We will adjust your Taste DNA.');
    } catch (err) {
      toast.error('Could not submit feedback at this time.');
    } finally {
      setActiveFeedbackItem(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
        {[1, 2].map((idx) => (
          <div key={idx} className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4].map((itemIdx) => (
                <div key={itemIdx} className="h-64 w-72 shrink-0 bg-gray-100 dark:bg-gray-850 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!feedData || !feedData.sections) return null;

  // Map backend sections to display sections
  const sectionMetadata = [
    { key: 'trendingNearYou', title: 'Popular Near You', icon: <Flame className="text-orange-500" /> },
    { key: 'quickAndHealthy', title: 'AI Picks: Fast & Healthy Choices', icon: <Activity className="text-green-500" /> },
    { key: 'exploration', title: 'Something New For You', icon: <Compass className="text-purple-500" /> },
    { key: 'contextualComfort', title: 'Perfect For Right Now', icon: <Clock className="text-blue-500" /> }
  ];

  return (
    <div className="space-y-12 py-8 bg-gray-50/30 dark:bg-gray-900/10">
      {/* Dynamic Context Banner */}
      {feedData.contextBanner && (
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-900 dark:to-orange-950/20 p-6 rounded-[2rem] border border-orange-100/50 dark:border-orange-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-orange-500 animate-pulse" size={20} />
                Good {feedData.contextBanner.timeOfDay === 'MORNING' ? 'Morning' : feedData.contextBanner.timeOfDay === 'LUNCH' ? 'Afternoon' : 'Evening'}, Foodie!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Weather is <span className="font-bold text-orange-600">{feedData.contextBanner.weather.toLowerCase()}</span> in <span className="font-bold text-orange-600">{feedData.contextBanner.location}</span>.
              </p>
            </div>
            {feedData.contextBanner.restaurantHealthMessage && (
              <div className="bg-white/80 dark:bg-gray-800/80 px-4 py-2.5 rounded-2xl border border-orange-100 dark:border-gray-700/50 shadow-sm text-xs font-semibold text-gray-600 dark:text-gray-300">
                {feedData.contextBanner.restaurantHealthMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Feed Sections */}
      {sectionMetadata.map((sec) => {
        const list = feedData.sections[sec.key] || [];
        // Filter out hidden items
        const visibleList = list.filter(item => !hiddenItems.has(item.id));
        if (visibleList.length === 0) return null;

        return (
          <section key={sec.key} className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {sec.icon}
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-[#1C1C1C] dark:text-white">
                  {sec.title}
                </h3>
              </div>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory scroll-smooth">
              <AnimatePresence>
                {visibleList.map((rec, index) => {
                  const isDish = rec.type === 'DISH';
                  const item = rec.data;
                  if (!item) return null;

                  return (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                      whileHover={{ y: -6 }}
                      className="snap-start shrink-0 w-76 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm flex flex-col justify-between group relative"
                      onClick={() => handleTrackClick(item.id, rec.type)}
                    >
                      <div>
                        {/* Image section */}
                        <div className="h-44 w-full relative bg-gray-50 dark:bg-gray-800 overflow-hidden">
                          <img
                            src={item.imageUrl || (isDish 
                              ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
                              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80'
                            )}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Explainable AI Tag */}
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold tracking-wide flex items-center gap-1">
                            <Sparkles size={10} className="text-orange-400" />
                            {getReasonText(rec.reasonCodes)}
                          </div>

                          {/* Quick Action Overlays */}
                          <div className="absolute top-3 right-3 flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveExplanation({
                                  item: item,
                                  reasons: rec.reasonCodes || []
                                });
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-md backdrop-blur-sm transition-colors cursor-pointer"
                              title="Why recommended?"
                            >
                              <Info size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFeedbackItem(rec);
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-500 rounded-full shadow-md backdrop-blur-sm transition-colors cursor-pointer"
                              title="Not interested"
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Info section */}
                        <div className="p-5 space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-black text-base text-[#1C1C1C] dark:text-white truncate flex-1 leading-tight">{item.name}</h4>
                            {isDish && (
                              <span className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${item.vegetarian ? 'border-green-500' : 'border-red-500'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${item.vegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium">
                            {isDish ? item.description : `${item.cuisineType} | ${item.city || 'Noida'}`}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="p-5 pt-0 border-t border-gray-50 dark:border-gray-800/50 mt-2 flex items-center justify-between">
                        {isDish ? (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Price</span>
                              <span className="text-base font-black text-[#1C1C1C] dark:text-white leading-none">₹{item.price}</span>
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, item)}
                              className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-full font-black text-xs flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all cursor-pointer"
                            >
                              <Plus size={14} /> Add
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                <Star size={14} fill="currentColor" /> {item.rating || '4.2'}
                              </span>
                              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                                <Clock size={12} /> {rec.estimatedDeliveryMinutes || item.avgDeliveryTime || 30}m
                              </span>
                            </div>
                            <Link
                              to={`/restaurants/${item.id}`}
                              className="text-xs font-black text-primary hover:text-orange-600 flex items-center gap-0.5 transition-colors"
                            >
                              Order Now <ChevronRight size={14} />
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        );
      })}

      {/* "Why This?" Explanation Drawer / Modal */}
      {activeExplanation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setActiveExplanation(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-150 dark:border-gray-800 p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <Sparkles className="text-orange-500 animate-pulse" size={20} />
                Why We Recommend This
              </h3>
              <button 
                onClick={() => setActiveExplanation(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img 
                  src={activeExplanation.item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'} 
                  alt={activeExplanation.item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">{activeExplanation.item.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{activeExplanation.item.cuisineType || activeExplanation.item.category || 'FoodIQ Special'}</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">AI Signals Evaluated:</p>
              {activeExplanation.reasons.length > 0 ? (
                activeExplanation.reasons.map((code) => (
                  <div key={code} className="flex items-start gap-3 bg-orange-500/5 dark:bg-orange-500/10 p-3 rounded-xl border border-orange-500/10">
                    <CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {code.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed font-semibold">
                        {REASON_EXPLANATIONS[code] || 'Matches your general food taste profile dynamic.'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-3 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                  <CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-gray-800">TASTE PROFILE ALIGNMENT</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Matches your overall preferences calculated from order history.</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveExplanation(null)}
              className="w-full py-4 bg-[#1C1C1C] dark:bg-gray-800 hover:bg-gray-900 text-white rounded-2xl font-black text-xs tracking-wider uppercase transition-colors"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}

      {/* "Not Interested" Feedback Options Modal */}
      {activeFeedbackItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setActiveFeedbackItem(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-150 dark:border-gray-800 p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <ThumbsDown size={20} className="text-red-500" />
                Not Interested?
              </h3>
              <button 
                onClick={() => setActiveFeedbackItem(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Help us tune your FoodIQ Taste DNA. Why don't you want to see recommendations for <span className="font-bold text-gray-900 dark:text-white">"{activeFeedbackItem.data?.name}"</span>?
            </p>

            <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {[
                'Not for me',
                'Too expensive',
                "Don't like this cuisine",
                "Don't like this ingredient",
                'Already had this',
                'Too spicy',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => submitFeedback(reason)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:border-red-900/50 text-xs font-bold text-[#1C1C1C] dark:text-gray-200 transition-all cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomeRecommendations;
