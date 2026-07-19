import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Mic, 
  Image as ImageIcon, 
  X, 
  SlidersHorizontal, 
  Clock, 
  TrendingUp, 
  Star, 
  MapPin, 
  Zap, 
  Check, 
  ChevronRight, 
  HelpCircle, 
  Ticket, 
  FileText, 
  ShieldAlert, 
  Package, 
  Users, 
  Trash2, 
  Upload, 
  AlertCircle, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/axios';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import { RestaurantSkeleton } from '../components/common/Skeleton';
import toast from 'react-hot-toast';

const ENTITY_ICONS = {
  RESTAURANT: '🏪',
  BRANCH: '🏢',
  FOOD_ITEM: '🍔',
  CATEGORY: '🏷️',
  COMBO: '🍱',
  INGREDIENT: '🥬',
  CUISINE: '🍜',
  CUSTOMER: '👤',
  ORDER: '📦',
  DELIVERY_PARTNER: '🛵',
  COUPON: '🎫',
  OFFER: '🎁',
  REVIEW: '⭐',
  SUPPORT_TICKET: '🎫',
  INVOICE: '📄',
  TRANSACTION: '💳',
  SUPPLIER: '🤝',
  INVENTORY_ITEM: '📦',
  EMPLOYEE: '💼'
};

const UniversalSearch = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(0);
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef(null);

  // Image search state
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageResults, setImageResults] = useState(null);

  // Filters & Sorting state
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterRating, setFilterRating] = useState(false);
  const [filterFast, setFilterFast] = useState(false);
  const [filterBudget, setFilterBudget] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Fetch initial history and trending
  useEffect(() => {
    fetchHistory();
    fetchTrending();
  }, [isAuthenticated]);

  // Debounced autocomplete suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await apiClient.get(`/search/autocomplete?q=${encodeURIComponent(query)}`);
        if (response.data && response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Main search trigger
  const handleSearch = async (searchQuery = query, types = selectedTypes) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setSuggestions([]);
    const startTime = performance.now();

    try {
      // Build query string
      let url = `/search/universal?q=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}`;
      if (types.length > 0) {
        url += `&types=${types.join(',')}`;
      }
      
      const response = await apiClient.get(url);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));

      if (response.data && response.data.success) {
        setResults(response.data.data);
        // Refresh history to include new queries
        fetchHistory();
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search request failed. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await apiClient.get('/search/history');
      if (response.data && response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await apiClient.get('/search/trending');
      if (response.data && response.data.success) {
        setTrending(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    }
  };

  const handleDeleteHistoryItem = async (e, q) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      await apiClient.delete(`/search/history?q=${encodeURIComponent(q)}`);
      toast.success('History item removed');
      fetchHistory();
    } catch (err) {
      console.error('Error deleting history:', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!isAuthenticated) return;
    try {
      await apiClient.delete('/search/history');
      toast.success('Search history cleared');
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Voice Search Handler
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    speechRecognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      setIsListening(false);
      toast.success(`Heard: "${speechToText}"`);
      
      // Send to backend voice parser
      try {
        const response = await apiClient.post('/search/voice', { voiceInput: speechToText });
        if (response.data && response.data.success) {
          handleSearch(speechToText);
        }
      } catch (err) {
        console.error('Voice parse error:', err);
        handleSearch(speechToText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('Could not recognize voice input.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Image upload simulator
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        // Call backend image search endpoint
        const response = await apiClient.post('/search/image', { image: base64Data });
        if (response.data && response.data.success) {
          setImageResults(response.data.data);
          toast.success('Food successfully identified!');
        }
      } catch (err) {
        console.error('Image search error:', err);
        toast.error('Image search failed.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle category type filter
  const handleTypeToggle = (type) => {
    let updatedTypes;
    if (selectedTypes.includes(type)) {
      updatedTypes = selectedTypes.filter(t => t !== type);
    } else {
      updatedTypes = [...selectedTypes, type];
    }
    setSelectedTypes(updatedTypes);
    handleSearch(query, updatedTypes);
  };

  // Filter & Sort dynamic results
  const filteredResults = results.filter(item => {
    // Tab filter mapping
    if (selectedTab !== 'ALL') {
      if (selectedTab === 'RESTAURANTS' && item.type !== 'RESTAURANT' && item.type !== 'BRANCH') return false;
      if (selectedTab === 'DISHES' && item.type !== 'FOOD_ITEM' && item.type !== 'COMBO') return false;
      if (selectedTab === 'OFFERS' && item.type !== 'COUPON' && item.type !== 'OFFER') return false;
      if (selectedTab === 'ORDERS' && item.type !== 'ORDER' && item.type !== 'SUPPORT_TICKET' && item.type !== 'INVOICE' && item.type !== 'TRANSACTION') return false;
      if (selectedTab === 'ADMIN' && !['SUPPLIER', 'INVENTORY_ITEM', 'EMPLOYEE', 'CUSTOMER', 'DELIVERY_PARTNER'].includes(item.type)) return false;
    }

    // Advanced Sub-Filters (based on metadata)
    if (filterVeg && item.metadata?.vegetarian === false) return false;
    if (filterRating && (item.rating || 0) < 4.3) return false;
    if (filterFast && (item.metadata?.avgDeliveryTime || 99) > 30) return false;
    if (filterBudget && (item.metadata?.price || item.metadata?.minOrderAmount || 0) > 300) return false;

    return true;
  });

  // Unique tabs dependent on role
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              FoodIQ <span className="text-primary font-black bg-primary/10 px-2.5 py-0.5 rounded-lg text-sm uppercase tracking-wide">Universal Search</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Search across restaurants, dishes, coupons, orders, invoices, inventory, and ecosystem nodes instantly.
            </p>
          </div>
          {results.length > 0 && (
            <Badge variant="success" className="text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
              <Zap size={13} className="fill-current text-green-600" />
              {filteredResults.length} matches in {latency}ms
            </Badge>
          )}
        </div>

        {/* Search & Input Container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-6 shadow-premium border border-gray-100 dark:border-gray-700/50 mb-8 relative">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700/80 focus-within:ring-4 focus-within:ring-primary/15 transition-all">
            <Search className="text-gray-400 shrink-0" size={20} />
            <input 
              type="text"
              placeholder="Search dishes, tags, branches, coupons, order IDs, invoices..."
              className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 font-medium placeholder-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            )}
            
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
            
            {/* Voice Search Button */}
            <button 
              onClick={isListening ? stopVoiceSearch : startVoiceSearch}
              className={`p-2 rounded-xl transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Voice Search"
            >
              <Mic size={18} />
            </button>

            {/* Image Search Button */}
            <button 
              onClick={() => setShowImageSearch(prev => !prev)}
              className={`p-2 rounded-xl transition-all shrink-0 ${showImageSearch ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Image Search"
            >
              <ImageIcon size={18} />
            </button>

            <Button 
              className="rounded-xl px-5 py-2 font-bold text-xs" 
              onClick={() => handleSearch()}
            >
              Search
            </Button>
          </div>

          {/* Voice Listening Waveform overlay */}
          <AnimatePresence>
            {isListening && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 bg-primary/95 text-white rounded-3xl flex flex-col items-center justify-center z-30"
              >
                <div className="flex gap-1.5 items-end mb-4">
                  {[...Array(6)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-1.5 bg-white rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.random() * 40 + 15}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s'
                      }}
                    />
                  ))}
                </div>
                <h3 className="text-lg font-black tracking-wide flex items-center gap-2">
                  <Volume2 className="animate-pulse" size={20} />
                  LISTENING...
                </h3>
                <p className="text-white/70 text-xs mt-1">Speak clearly (e.g. "Veg pizza with rating above 4")</p>
                <button 
                  onClick={stopVoiceSearch}
                  className="mt-4 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold border border-white/20 transition-all"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Autocomplete Suggestions Box */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-4 right-4 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/40"
              >
                {suggestions.map((sug, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setQuery(sug.text);
                      handleSearch(sug.text);
                    }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{ENTITY_ICONS[sug.type] || '🔍'}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sug.text}</p>
                        <p className="text-xs text-gray-400">{sug.description}</p>
                      </div>
                    </div>
                    <Badge variant="ghost" className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 border dark:border-gray-700 text-gray-400">
                      {sug.type}
                    </Badge>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image Search Panel */}
        <AnimatePresence>
          {showImageSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-3xl p-6 shadow-premium mb-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-3">
                <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-primary" />
                  Image Dish Detector (AI Preview)
                </h3>
                <button onClick={() => { setShowImageSearch(false); setImageResults(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {!imageResults ? (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer transition-all relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <p className="text-sm font-bold text-gray-500">Analyzing dish ingredients...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Upload a photo of food</p>
                      <p className="text-xs text-gray-400 mt-1">We will detect the dish and show similar items</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detected Dishes</h4>
                    <div className="space-y-2">
                      {imageResults.detectedDishes.map((dish, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-850 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                          <span className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                            🍕 {dish}
                          </span>
                          <Badge variant="success" className="text-[10px] font-black">{Math.round(imageResults.confidence * 100 - i * 5)}% match</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                      <Sparkles size={14} className="text-yellow-500" />
                      Confidence Level: {Math.round(imageResults.confidence * 100)}% | Model: FoodIQ-Vision-1.0
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Similar Dishes Live</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {imageResults.similarDishes.map((dish) => (
                        <div 
                          key={dish.id}
                          onClick={() => {
                            setQuery(dish.title);
                            handleSearch(dish.title);
                            setShowImageSearch(false);
                            setImageResults(null);
                          }}
                          className="flex items-center justify-between bg-white dark:bg-gray-850 px-3 py-2 rounded-xl border border-gray-150 dark:border-gray-800 hover:border-primary/40 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <img src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} className="h-8 w-8 rounded-lg object-cover" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-gray-800 dark:text-white">{dish.title}</p>
                              <p className="text-[10px] text-gray-400">₹{dish.metadata?.price}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Filters & Search Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
          {/* Main Entity Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'ALL', label: 'All Results' },
              { id: 'RESTAURANTS', label: 'Restaurants' },
              { id: 'DISHES', label: 'Dishes & Combos' },
              { id: 'OFFERS', label: 'Promo Codes' },
              { id: 'ORDERS', label: 'My Orders & Invoices' },
              ...(isAdmin ? [{ id: 'ADMIN', label: 'Admin Ops (Suppliers/Staff)' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 text-xs md:text-sm font-black rounded-xl whitespace-nowrap transition-all duration-200 ${selectedTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick sorting & Filter toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <select
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); handleSearch(query); }}
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="rating">Sort: Rating</option>
              <option value="distance">Sort: Distance</option>
              <option value="time">Sort: Speed</option>
              <option value="cost_low">Price: Low to High</option>
              <option value="cost_high">Price: High to Low</option>
            </select>

            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`p-2 border rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Drawer / Sidebar Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Food Diet</span>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <input type="checkbox" checked={filterVeg} onChange={(e) => setFilterVeg(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  Pure Veg 🥬
                </label>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Customer Rating</span>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <input type="checkbox" checked={filterRating} onChange={(e) => setFilterRating(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  Top Rated (4.3+ ⭐)
                </label>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Delivery Speed</span>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <input type="checkbox" checked={filterFast} onChange={(e) => setFilterFast(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  Under 30 mins ⚡
                </label>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Pricing Filter</span>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                  <input type="checkbox" checked={filterBudget} onChange={(e) => setFilterBudget(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  Under ₹300 💰
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {results.length === 0 && !isLoading ? (
          // History & Trending view when no query is performed yet
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 text-left">
            {/* Recent Searches */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-2">
                <h3 className="font-black text-gray-850 dark:text-white flex items-center gap-2 text-base">
                  <Clock size={16} className="text-gray-400" />
                  Recent Searches
                </h3>
                {history.length > 0 && (
                  <button onClick={handleClearAllHistory} className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1">
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
              </div>
              
              {history.length > 0 ? (
                <div className="space-y-1">
                  {history.map((hist) => (
                    <div 
                      key={hist.id}
                      onClick={() => {
                        setQuery(hist.query);
                        handleSearch(hist.query);
                      }}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl cursor-pointer transition-all"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Search size={14} className="text-gray-400" />
                        {hist.query}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-md font-bold">x{hist.count}</span>
                        <button onClick={(e) => handleDeleteHistoryItem(e, hist.query)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center gap-2">
                  <Clock size={24} />
                  No search history yet. Start searching!
                </div>
              )}
            </div>

            {/* Trending Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
              <h3 className="font-black text-gray-850 dark:text-white flex items-center gap-2 text-base mb-4 border-b dark:border-gray-700 pb-2">
                <TrendingUp size={16} className="text-primary" />
                Popular Trending Queries
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {trending.map((trend, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setQuery(trend.keyword);
                      handleSearch(trend.keyword);
                    }}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/40 hover:bg-primary/5 hover:border-primary/20 border border-transparent rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-primary">0{i+1}</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{trend.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full">
                        {trend.tag}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Search Results Area
          <div>
            {isLoading ? (
              // 4 skeleton cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <RestaurantSkeleton key={i} />
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((item) => {
                  // Direct RestaurantCard usage for restaurants
                  if (item.type === 'RESTAURANT') {
                    // Normalize document schema
                    const normalizedRes = {
                      id: item.id,
                      name: item.title,
                      cuisine: item.metadata?.cuisine,
                      city: item.metadata?.city,
                      rating: item.rating,
                      avgDeliveryTime: item.metadata?.avgDeliveryTime || 30,
                      minOrderAmount: item.metadata?.minOrderAmount || 150,
                      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
                      isPureVeg: item.metadata?.vegetarian || false,
                      offer: 'Flat 50% Off'
                    };
                    return <RestaurantCard key={item.id} restaurant={normalizedRes} />;
                  }

                  // Customized universal entity presentation cards
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col justify-between hover:shadow-premium transition-all text-left relative overflow-hidden group"
                    >
                      {/* Top Type Indicator Tag */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="ghost" className="text-[10px] font-black tracking-wider uppercase border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-300">
                          {ENTITY_ICONS[item.type] || '🔍'} {item.type}
                        </Badge>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-xs font-black text-yellow-500">
                            <Star size={13} className="fill-current" />
                            {item.rating}
                          </div>
                        )}
                      </div>

                      {/* Middle description */}
                      <div className="flex-1">
                        <h4 className="font-black text-base text-gray-850 dark:text-white group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-relaxed">
                          {item.subtitle}
                        </p>

                        {/* Extra metadata fields rendering based on type */}
                        {item.metadata && (
                          <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex flex-wrap gap-2">
                            {Object.entries(item.metadata).map(([key, val]) => {
                              if (['status', 'price', 'quantityInStock', 'discountPct', 'ticketId', 'paymentMethod', 'location'].includes(key)) {
                                return (
                                  <span key={key} className="text-[10px] bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 text-gray-500 dark:text-gray-300 font-bold px-2.5 py-0.5 rounded-full capitalize">
                                    {key}: <span className="font-extrabold text-gray-700 dark:text-gray-250">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}</span>
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex items-center justify-between">
                        {item.type === 'FOOD_ITEM' && (
                          <span className="text-xs font-extrabold text-gray-800 dark:text-white">
                            ₹{item.metadata?.price}
                          </span>
                        )}
                        {item.type === 'COUPON' && (
                          <span className="text-[10px] font-black tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            Active Coupon
                          </span>
                        )}
                        <Button variant="ghost" className="text-xs font-extrabold text-primary p-0 h-auto flex items-center gap-0.5 ml-auto group-hover:translate-x-1 transition-transform">
                          View details
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Empty search state
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={48} className="text-gray-300 mb-4 animate-bounce" />
                <h3 className="text-lg font-black text-gray-800 dark:text-white">No Matches Found</h3>
                <p className="text-gray-400 text-sm max-w-sm mt-1">
                  We couldn't find any results for "{query}". Try checking for typos or searching a different term.
                </p>
                <Button variant="outline" className="mt-6 rounded-full" onClick={() => { setQuery(''); setResults([]); }}>
                  Reset search filters
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UniversalSearch;
