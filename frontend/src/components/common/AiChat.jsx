import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, Sparkles, Mic, MicOff, 
  Camera, Calendar, ShieldAlert, CheckCircle, Plus, Info, 
  Award, RefreshCw, ShoppingCart, Zap, Flame, Award as GoldIcon
} from 'lucide-react';
import apiClient from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import { ALL_RESTAURANTS } from '../../data/restaurants';

const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'scanner' | 'diet'
  
  // 💬 Assistant State
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Welcome to FoodIQ AI Center! 🧠 I am your advanced culinary and diet intelligence assistant. Ask me anything about dishes, ingredients, or health goals!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedDishes, setSuggestedDishes] = useState([]);
  
  // 📷 Scanner State
  const [scannedPreset, setScannedPreset] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // 📅 Diet Planner State
  const [dietGoal, setDietGoal] = useState('loss'); // 'loss' | 'gain' | 'keto'
  const [planGenerated, setPlanGenerated] = useState(false);

  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const { addItem } = useCartStore();

  // Scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Helper to find matching dishes from our static catalogue
  const findMatchingDishes = (text) => {
    const query = text.toLowerCase();
    const matches = [];
    
    for (const r of ALL_RESTAURANTS) {
      if (!r.menu) continue;
      for (const cat of r.menu) {
        if (!cat.items) continue;
        for (const item of cat.items) {
          if (query.includes(item.name.toLowerCase()) || 
              (item.description && query.includes(item.description.toLowerCase())) ||
              (query.includes("pizza") && item.name.toLowerCase().includes("pizza")) ||
              (query.includes("biryani") && item.name.toLowerCase().includes("biryani")) ||
              (query.includes("burger") && item.name.toLowerCase().includes("burger")) ||
              (query.includes("salad") && item.name.toLowerCase().includes("salad")) ||
              (query.includes("healthy") && cat.category.toLowerCase().includes("healthy")) ||
              (query.includes("dessert") && cat.category.toLowerCase().includes("dessert")) ||
              (query.includes("shake") && item.name.toLowerCase().includes("shake"))) {
            
            // Check if already in list to avoid duplicates
            if (!matches.some(m => m.id === item.id)) {
              matches.push({ ...item, restaurantId: r.id, restaurantName: r.name });
            }
            if (matches.length >= 3) return matches;
          }
        }
      }
    }
    return matches;
  };

  const handleSend = async (customText = '') => {
    const queryText = (customText || input).trim();
    if (!queryText) return;

    if (!customText) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: queryText }]);
    setIsTyping(true);
    setSuggestedDishes([]);

    // Extract local matches for instant relevance
    const localMatches = findMatchingDishes(queryText);

    try {
      const response = await apiClient.post('/ai/chat', { message: queryText });

      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'bot', text: response.data.data }]);
        if (localMatches.length > 0) {
          setSuggestedDishes(localMatches);
        }
      } else {
        throw new Error('Fallback to local');
      }
    } catch (error) {
      // Local fallback
      let botResponse = "I've searched our FoodIQ catalog! Here are the best matches for your craving:";
      if (localMatches.length === 0) {
        botResponse = "I couldn't find exact catalog items for that, but here are some general recommendations! Try asking for 'pizza', 'salad', 'biryani', or 'shake'.";
      }
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      if (localMatches.length > 0) {
        setSuggestedDishes(localMatches);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Preset Scanning Cards
  const scannerPresets = [
    {
      name: 'Avocado Salad',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      healthScore: 94,
      calories: 320,
      protein: 8,
      carbs: 12,
      fat: 22,
      description: 'Superb nutrient density! Packed with heart-healthy monounsaturated fats, dietary fiber, and essential potassium. Ideal for low-carb keto or general health goals.',
      warnings: [],
      matches: [
        { id: 5002, name: 'Quinoa Buddha Bowl', price: 399, description: 'Quinoa, roasted veggies, avocado, and tahini dressing.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', restaurantId: 5, restaurantName: 'Healthy Hub' },
        { id: 5004, name: 'Caesar Salad', price: 249, description: 'Romaine lettuce with parmesan, croutons, and creamy dressing.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', restaurantId: 5, restaurantName: 'Healthy Hub' }
      ]
    },
    {
      name: 'Pepperoni Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
      healthScore: 42,
      calories: 850,
      protein: 34,
      carbs: 95,
      fat: 38,
      description: 'High in sodium and saturated fats. Provides significant protein but carries a heavy glycemic load from refined flour. Enjoy in moderation.',
      warnings: ['🚨 High Sodium (1800mg)', '⚠️ High Saturated Fat (16g)'],
      matches: [
        { id: 4002, name: 'Pepperoni Feast', price: 399, description: 'Loaded with pepperoni slices and extra mozzarella.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', restaurantId: 4, restaurantName: 'Pizza Express' },
        { id: 4001, name: 'Margherita Pizza', price: 249, description: 'Classic tomato sauce, mozzarella, and fresh basil.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', restaurantId: 4, restaurantName: 'Pizza Express' }
      ]
    },
    {
      name: 'Strawberry Shake',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
      healthScore: 52,
      calories: 450,
      protein: 6,
      carbs: 65,
      fat: 18,
      description: 'High sugar content from syrups and milk fats. Quick energy spike, but very low in dietary fiber. Best as an occasional indulgence.',
      warnings: ['🚨 High Sugar (48g)'],
      matches: [
        { id: 19004, name: 'Strawberry Shake', price: 159, description: 'Fresh strawberry milkshake.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', restaurantId: 19, restaurantName: 'Shake Shack' },
        { id: 19002, name: 'Belgian Chocolate Shake', price: 199, description: 'Rich Belgian chocolate with whipped cream.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', restaurantId: 19, restaurantName: 'Shake Shack' }
      ]
    }
  ];

  const handleStartScan = (preset) => {
    setScannedPreset(preset);
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(preset);
    }, 2000);
  };

  // Diet Plans
  const dietPlans = {
    loss: {
      limit: '1400 kcal',
      protein: '75g',
      meals: [
        { day: 'Mon', item: 'Green Detox Smoothie Bowl', cal: 320, price: 199, restaurantId: 5, id: 5007 },
        { day: 'Tue', item: 'Caesar Salad (No Croutons)', cal: 249, price: 249, restaurantId: 5, id: 5009 },
        { day: 'Wed', item: 'Quinoa Buddha Bowl', cal: 399, price: 399, restaurantId: 5, id: 5002 },
        { day: 'Thu', item: 'Asian Sesame Salad', cal: 299, price: 299, restaurantId: 5, id: 5011 },
        { day: 'Fri', item: 'Greek Salad', cal: 279, price: 279, restaurantId: 5, id: 5010 },
        { day: 'Sat', item: 'Acai Berry Bowl', cal: 349, price: 349, restaurantId: 5, id: 5001 },
        { day: 'Sun', item: 'Green Detox Smoothie', cal: 199, price: 199, restaurantId: 5, id: 5012 }
      ]
    },
    gain: {
      limit: '2800 kcal',
      protein: '160g',
      meals: [
        { day: 'Mon', item: 'Double Whopper Burger', cal: 599, price: 299, restaurantId: 1, id: 1004 },
        { day: 'Tue', item: 'Grilled Chicken Steak', cal: 499, price: 499, restaurantId: 17, id: 17001 },
        { day: 'Wed', item: 'Hyderabadi Dum Biryani', cal: 650, price: 349, restaurantId: 2, id: 2001 },
        { day: 'Thu', item: 'BBQ Chicken Pizza', cal: 700, price: 449, restaurantId: 4, id: 4003 },
        { day: 'Fri', item: 'Tonkotsu Ramen', cal: 550, price: 449, restaurantId: 3, id: 3005 },
        { day: 'Sat', item: 'Chicken Shawarma Wrap', cal: 480, price: 149, restaurantId: 15, id: 15006 },
        { day: 'Sun', item: 'Death by Chocolate Cake Slice', cal: 600, price: 249, restaurantId: 19, id: 19007 }
      ]
    },
    keto: {
      limit: '1800 kcal',
      protein: '110g',
      meals: [
        { day: 'Mon', item: 'Butter Garlic Prawns', cal: 449, price: 449, restaurantId: 16, id: 16005 },
        { day: 'Tue', item: 'Protein Power Bowl', cal: 429, price: 429, restaurantId: 5, id: 5003 },
        { day: 'Wed', item: 'Tandoori Chicken (Half)', cal: 449, price: 249, restaurantId: 20, id: 20003 },
        { day: 'Thu', item: 'Salmon Nigiri (6 pcs)', cal: 399, price: 599, restaurantId: 3, id: 3001 },
        { day: 'Fri', item: 'Chicken Malai Tikka', cal: 450, price: 349, restaurantId: 11, id: 11002 },
        { day: 'Sat', item: 'Egg Frankie (No Wrap)', cal: 220, price: 79, restaurantId: 15, id: 15002 },
        { day: 'Sun', item: 'Greek Salad with Extra Feta', cal: 320, price: 279, restaurantId: 5, id: 5010 }
      ]
    }
  };

  const handleAddPlanToCart = () => {
    const plan = dietPlans[dietGoal];
    if (!plan) return;

    // Pick Monday, Wednesday, and Friday meals to demonstrate batch adding
    const sampleMeals = [plan.meals[0], plan.meals[2], plan.meals[4]];
    sampleMeals.forEach(meal => {
      addItem({
        id: meal.id,
        name: meal.item,
        price: meal.price,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80',
        description: `Plan Meal (${meal.day}) - ${meal.cal} kcal`
      }, meal.restaurantId);
    });

    alert('Successfully added 3 target meals from your Diet Plan to your cart!');
  };

  const handleAddScannedItem = (match) => {
    addItem({
      id: match.id,
      name: match.name,
      price: match.price,
      imageUrl: match.image,
      description: match.description
    }, match.restaurantId);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[430px] h-[640px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden text-gray-800 dark:text-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 animate-pulse">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg flex items-center gap-1.5 leading-none">
                    FoodIQ AI Center <GoldIcon size={16} className="text-yellow-400" />
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">Intelligent Food Ecosystem</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-50 dark:bg-gray-850 p-1.5 border-b border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                💬 Assistant
              </button>
              <button 
                onClick={() => setActiveTab('scanner')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'scanner' 
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                📷 Scanner
              </button>
              <button 
                onClick={() => setActiveTab('diet')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'diet' 
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                📅 Planner
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
              
              {/* TAB 1: 💬 ASSISTANT CHAT */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col justify-between">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                          msg.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                          : 'bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 rounded-tl-none border border-gray-150 dark:border-gray-700 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-150 dark:border-gray-700 flex gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}

                    {/* Interactive Recommended Dishes */}
                    {suggestedDishes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <p className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                          <Award size={12} className="text-yellow-500" /> Recommended Matching Foods
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {suggestedDishes.map((dish) => (
                            <div key={dish.id} className="bg-white dark:bg-gray-850 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3">
                                <img src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                <div>
                                  <h4 className="font-bold text-xs leading-snug">{dish.name}</h4>
                                  <p className="text-[10px] text-gray-400">{dish.restaurantName}</p>
                                  <p className="text-xs font-black text-primary mt-0.5">₹{dish.price}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleAddScannedItem(dish)}
                                className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2 rounded-xl transition-all"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Preset Prompt Tags */}
                  <div className="px-5 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 dark:border-gray-850 bg-white dark:bg-gray-900 scrollbar-none">
                    {['🥗 High Protein', '🌶️ Biryani Special', '🥑 Healthy Salad', '🍕 Pizza Fast'].map((tag) => (
                      <button 
                        key={tag}
                        onClick={() => handleSend(tag)}
                        className="text-[11px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-primary/5 hover:text-primary border border-transparent rounded-full px-3 py-1.5 whitespace-nowrap transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Input Box */}
                  <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-850">
                    <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask food queries (e.g. 'I want healthy salad')..."
                        className="flex-1 pl-4 pr-12 py-3.5 bg-gray-100 dark:bg-gray-850 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white border border-transparent focus:border-primary/20"
                      />
                      <button 
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isListening 
                            ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                            : 'bg-gray-100 dark:bg-gray-850 text-gray-400 hover:text-primary dark:hover:text-primary border-transparent'
                        }`}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                      <button 
                        onClick={() => handleSend()}
                        className="bg-primary p-2.5 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 📷 AI SCANNER */}
              {activeTab === 'scanner' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Simulated AI Plate Scanner</h3>
                    <p className="text-xs text-gray-500 mt-1">Select a mock dish below to simulate FoodIQ visual nutrition scanning.</p>
                  </div>

                  {/* Presets Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {scannerPresets.map((preset) => (
                      <button 
                        key={preset.name}
                        onClick={() => handleStartScan(preset)}
                        className={`p-2 bg-white dark:bg-gray-850 border rounded-2xl overflow-hidden text-center hover:scale-105 transition-transform ${
                          scannedPreset?.name === preset.name ? 'border-primary ring-2 ring-primary/25' : 'border-gray-150 dark:border-gray-800'
                        }`}
                      >
                        <img src={preset.image} className="w-full h-16 object-cover rounded-xl mb-1.5" alt="" />
                        <span className="text-[10px] font-bold block truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Scanning Animation Area */}
                  {isScanning && (
                    <div className="relative h-44 bg-black rounded-3xl overflow-hidden flex items-center justify-center border border-primary/30">
                      <img src={scannedPreset?.image} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                      
                      {/* Sweep Laser */}
                      <motion.div 
                        animate={{ y: [-80, 80] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="absolute w-full h-1 bg-green-400 shadow-2xl shadow-green-400 z-10"
                      />
                      
                      <div className="relative z-20 text-center text-white">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-green-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-shadow">Analyzing Nutrition...</span>
                      </div>
                    </div>
                  )}

                  {/* Scan Result Details */}
                  {scanResult && !isScanning && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-gray-850 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-premium space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-base">{scanResult.name}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Scanner Analysis Ready</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
                            scanResult.healthScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Award size={14} /> Score: {scanResult.healthScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Macronutrient Bars */}
                      <div className="grid grid-cols-4 gap-2 text-center bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Calories</p>
                          <p className="text-xs font-black text-primary mt-0.5">{scanResult.calories}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Protein</p>
                          <p className="text-xs font-black text-blue-600 mt-0.5">{scanResult.protein}g</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Carbs</p>
                          <p className="text-xs font-black text-yellow-600 mt-0.5">{scanResult.carbs}g</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Fat</p>
                          <p className="text-xs font-black text-purple-600 mt-0.5">{scanResult.fat}g</p>
                        </div>
                      </div>

                      {/* Health Description */}
                      <p className="text-xs leading-relaxed text-gray-500 font-medium">{scanResult.description}</p>

                      {/* Warnings if any */}
                      {scanResult.warnings.length > 0 && (
                        <div className="space-y-1.5">
                          {scanResult.warnings.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-xl">
                              <ShieldAlert size={14} />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Orderable items recommendation */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Perfect menu pairings on FoodIQ</p>
                        <div className="space-y-2">
                          {scanResult.matches.map((match) => (
                            <div key={match.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs">
                              <div>
                                <p className="font-bold">{match.name}</p>
                                <p className="text-[10px] text-gray-400">{match.restaurantName} · ₹{match.price}</p>
                              </div>
                              <button 
                                onClick={() => handleAddScannedItem(match)}
                                className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                              >
                                <Plus size={12} /> Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* TAB 3: 📅 DIET PLANNER */}
              {activeTab === 'diet' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">AI Target Diet Planner</h3>
                    <p className="text-xs text-gray-500 mt-1">Get an instantly orderable plan aligned with your specific nutritional goals.</p>
                  </div>

                  {/* Goal Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'loss', label: 'Weight Loss', icon: Flame },
                      { key: 'gain', label: 'Muscle Gain', icon: Zap },
                      { key: 'keto', label: 'Keto Diet', icon: Info }
                    ].map((goal) => (
                      <button 
                        key={goal.key}
                        onClick={() => {
                          setDietGoal(goal.key);
                          setPlanGenerated(true);
                        }}
                        className={`p-3 rounded-2xl text-center border font-bold flex flex-col items-center gap-1.5 hover:bg-primary/5 transition-all ${
                          dietGoal === goal.key ? 'border-primary bg-primary/5 text-primary' : 'border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-850'
                        }`}
                      >
                        <goal.icon size={18} />
                        <span className="text-[10px] uppercase font-black tracking-wider">{goal.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Generated Plan Display */}
                  {planGenerated && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Daily target limit</p>
                          <p className="text-sm font-black text-gray-700 dark:text-gray-100">{dietPlans[dietGoal].limit}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Target protein</p>
                          <p className="text-sm font-black text-blue-600">{dietPlans[dietGoal].protein}</p>
                        </div>
                      </div>

                      {/* Daily Meals Rows */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {dietPlans[dietGoal].meals.map((meal) => (
                          <div key={meal.day} className="flex justify-between items-center p-2.5 bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-[10px]">
                                {meal.day}
                              </span>
                              <div>
                                <p className="font-bold">{meal.item}</p>
                                <p className="text-[9px] text-gray-400">{meal.cal} kcal · ₹{meal.price}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Plan actions */}
                      <button 
                        onClick={handleAddPlanToCart}
                        className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} /> Add entire diet plan to cart
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 bg-gradient-to-tr from-primary to-primary-dark rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white relative group border border-primary/20"
      >
        <MessageCircle size={30} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 bg-yellow-400 p-1.5 rounded-full border-4 border-white dark:border-gray-900 animate-bounce">
          <Sparkles size={11} className="text-white" />
        </div>
      </motion.button>
    </div>
  );
};

export default AiChat;
