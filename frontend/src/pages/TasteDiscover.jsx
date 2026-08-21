import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Sparkles, Sliders, DollarSign, Flame, 
  Leaf, Info, Heart, ThumbsUp, ThumbsDown, CheckCircle,
  TrendingUp, Clock, Compass, AlertCircle
} from 'lucide-react';
import personalizationService from '../services/personalizationService';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const EXAMPLE_CRAVINGS = [
  { text: "Spicy chicken biryani under 400", icon: "🌶️" },
  { text: "Healthy light vegetarian dinner with no mushrooms", icon: "🥬" },
  { text: "Sweet dessert with chocolate or waffle", icon: "🍩" },
  { text: "Cheap Italian pasta or pizza under 300", icon: "🍕" },
  { text: "Filling fast food like burger and fries", icon: "🍔" }
];

const TasteDiscover = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [parsedIntent, setParsedIntent] = useState(null);
  const [results, setResults] = useState([]);

  // Handles submitting NL query
  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await personalizationService.parseCraving(q);
      if (res && res.success && res.data) {
        setParsedIntent(res.data.parsedIntent);
        setResults(res.data.results || []);
      } else {
        toast.error("Failed to parse query.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error executing taste search.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (itemId, actionType) => {
    if (!user) {
      toast.error("Please login to record feedback!");
      return;
    }
    try {
      await personalizationService.submitRecommendationFeedback({
        itemId,
        itemType: 'DISH',
        feedback: actionType
      });
      toast.success(actionType === 'LIKE' ? "Added to your favorites!" : "Excluded from recommendations.");
      // Dynamically update UI state
      setResults(prev => prev.map(r => {
        if (r.id === itemId) {
          return { ...r, score: actionType === 'LIKE' ? r.score + 10 : r.score - 15 };
        }
        return r;
      }));
    } catch (err) {
      toast.error("Failed to save feedback.");
    }
  };

  const handleAddToCart = (dish) => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      restaurantId: dish.restaurantId
    });
    toast.success(`${dish.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 pt-16 md:pt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-gray-900 via-[#1C1C1C] to-gray-950 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl mb-10 border border-gray-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
              <Sparkles size={12} className="animate-spin" /> TasteIntelligence v2.1
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
              Natural Language <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Craving Search</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-semibold leading-relaxed">
              Describe exactly what you want to eat in plain English. The AI Food Genome translates your craving into structured dietary constraints.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Type your craving (e.g., 'spicy vegetarian paneer curry under 350')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-14 pr-5 py-5 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm md:text-base text-gray-800 placeholder:font-semibold placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="py-5 px-10 bg-primary hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Compass size={18} />
                  Discover
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-6">
            <p className="text-[10px] font-black text-[#686B78] uppercase tracking-widest mb-3">Try these cravings:</p>
            <div className="flex flex-wrap gap-2.5">
              {EXAMPLE_CRAVINGS.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(ex.text);
                    handleSearch(ex.text);
                  }}
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 rounded-xl border border-gray-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{ex.icon}</span>
                  {ex.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Parsed Intent */}
          {searched && (
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                  <Sliders className="text-primary" size={20} />
                  <h3 className="font-black text-base text-gray-800">Parsed Search Intent</h3>
                </div>

                {parsedIntent ? (
                  <div className="space-y-4 text-xs font-bold text-gray-600">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Cuisines Deteted</span>
                      <span className="text-primary">
                        {parsedIntent.cuisines?.length > 0 ? parsedIntent.cuisines.join(', ') : 'Any'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Dish Target</span>
                      <span className="text-[#1C1C1C]">
                        {parsedIntent.dishes?.length > 0 ? parsedIntent.dishes.join(', ') : 'Any'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Max Price Limit</span>
                      <span className="text-amber-600 flex items-center gap-0.5">
                        {parsedIntent.budgetMax ? `₹${parsedIntent.budgetMax}` : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Spice Requirement</span>
                      <span className="text-orange-600 flex items-center gap-0.5">
                        <Flame size={12} /> {parsedIntent.spiceLevel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Meal Profile Style</span>
                      <span className="text-gray-800">{parsedIntent.mealStyle}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span>Vegetarian Only</span>
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        {parsedIntent.vegetarian ? <Leaf size={12} /> : 'No'}
                      </span>
                    </div>
                    {parsedIntent.excludedIngredients?.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-red-500 uppercase tracking-wider block">Excluding Ingredients</span>
                        <div className="flex flex-wrap gap-1">
                          {parsedIntent.excludedIngredients.map(ing => (
                            <span key={ing} className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No search intent parsed.</p>
                )}
              </div>
            </div>
          )}

          {/* Right panel: Candidates list */}
          <div className={`${searched ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : searched ? (
              results.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-black text-lg text-gray-800 pl-2">Matching Cravings ({results.length})</h3>
                  {results.map((dto) => {
                    const dish = dto.data;
                    return (
                      <motion.div
                        key={dto.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] border border-gray-100 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
                      >
                        {/* Score Indicator */}
                        <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-xl text-[10px] font-black border border-orange-100">
                          {Math.round(dto.score)} Match Score
                        </div>

                        {/* Dish Image */}
                        <div className="h-28 w-full sm:w-28 rounded-2xl bg-gray-50 overflow-hidden relative shrink-0">
                          <img
                            src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
                            alt={dish.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {dish.vegetarian && (
                            <div className="absolute top-2 left-2 bg-emerald-50 text-emerald-600 p-1 rounded-lg border border-emerald-100">
                              <Leaf size={12} />
                            </div>
                          )}
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-black text-lg text-[#1C1C1C]">{dish.name}</h4>
                          <p className="text-xs text-[#686B78] font-semibold leading-relaxed line-clamp-2">
                            {dish.description || 'No description available.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="text-lg font-black text-gray-900">₹{dish.price}</span>
                            <span className="text-gray-300 text-xs">•</span>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                              {dto.explanation}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto pt-4 sm:pt-0 shrink-0">
                          <Button
                            onClick={() => handleAddToCart(dish)}
                            className="flex-1 sm:flex-none py-3 px-6 rounded-xl text-xs font-black"
                          >
                            Add to Cart
                          </Button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleFeedback(dish.id, 'LIKE')}
                              className="h-10 w-10 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 transition-colors cursor-pointer"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button
                              onClick={() => handleFeedback(dish.id, 'DISLIKE')}
                              className="h-10 w-10 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 transition-colors cursor-pointer"
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center space-y-4">
                  <div className="h-16 w-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="font-black text-xl text-gray-800">No Cravings Matched</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto font-semibold">
                    We couldn't find any dishes matching those exact requirements. Try simplifying your filters or looking for another dish category.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center space-y-4">
                <Compass className="mx-auto text-gray-300 animate-pulse" size={56} />
                <h3 className="font-black text-xl text-[#1C1C1C]">Start Discovering</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto font-semibold">
                  Type your craving in the input field above or click one of our curated suggestions to test the intelligence engine.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TasteDiscover;
