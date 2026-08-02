import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Utensils, Pizza, Soup, Coffee, Cookie, Leaf } from 'lucide-react';
import { getUniqueFoodImage, getFoodCategory } from '../../utils/imageProvider';

const AIImage = ({ 
  src, 
  dishName = 'Food Item', 
  restaurantName = 'FoodIQ Restaurant', 
  cuisine = 'General', 
  className = '', 
  alt = 'Premium Food',
  ...props 
}) => {
  // Determine if the initial src is a placeholder or invalid
  const isPlaceholder = !src || 
    src.includes('photo-1504674900247-0877df9cc836') || 
    src.includes('placeholder') || 
    src.includes('default') ||
    src.includes('photo-1500000');

  // Generate target unique URL if placeholder
  const initialSrc = isPlaceholder 
    ? getUniqueFoodImage(dishName, restaurantName) 
    : src;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);

  // When src/dishName/restaurantName changes, reset the state
  useEffect(() => {
    setCurrentSrc(initialSrc);
    setLoading(true);
    setErrorCount(0);
    setHasFailed(false);
  }, [src, dishName, restaurantName, initialSrc]);

  const handleLoad = () => {
    setLoading(false);
    setHasFailed(false);
  };

  const handleError = () => {
    if (errorCount === 0) {
      // Try a secondary high-quality fallback from our category pool
      setErrorCount(1);
      const fallbackUrl = getUniqueFoodImage(dishName, restaurantName);
      if (fallbackUrl !== currentSrc) {
        setCurrentSrc(fallbackUrl);
        return;
      }
    }
    
    // Absolute fallback to a generic Unsplash image
    if (errorCount === 1) {
      setErrorCount(2);
      setCurrentSrc('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80');
      return;
    }

    setHasFailed(true);
    setLoading(false);
  };

  // Category and Gradient mapping for beautiful CSS placeholders
  const category = getFoodCategory(dishName || restaurantName || cuisine);
  
  const getPlaceholderGradient = (cat) => {
    const gradients = {
      pizza: 'from-amber-500 to-red-500',
      burger: 'from-orange-500 to-amber-600',
      biryani: 'from-amber-600 to-yellow-500',
      curry: 'from-red-600 to-orange-500',
      noodles: 'from-yellow-500 to-amber-500',
      sushi: 'from-rose-500 to-red-400',
      desserts: 'from-pink-500 to-rose-400',
      salad: 'from-emerald-500 to-teal-500',
      drinks: 'from-cyan-500 to-blue-500',
      generic: 'from-[#EF4444] to-orange-500',
    };
    return gradients[cat] || gradients.generic;
  };

  const gradient = getPlaceholderGradient(category);

  // Pick the right icon
  let IconComponent = Utensils;
  if (category === 'pizza') IconComponent = Pizza;
  else if (category === 'salad') IconComponent = Leaf;
  else if (category === 'drinks') IconComponent = Coffee;
  else if (category === 'desserts') IconComponent = Cookie;
  else if (['biryani', 'curry', 'noodles'].includes(category)) IconComponent = Soup;

  return (
    <div className={`relative overflow-hidden group w-full h-full ${className}`}>
      {/* ── SKELETON LOADER ── */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center gap-1.5 opacity-60">
              <Sparkles className="text-primary animate-pulse" size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest text-[#686B78]">FoodIQ Vision...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BEAUTIFUL GRADIENT FALLBACK (When loading fails or offline) ── */}
      {hasFailed ? (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white text-center select-none`}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 shadow-lg">
              <IconComponent size={28} className="text-white drop-shadow-md" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-90 drop-shadow-sm">
              {category}
            </span>
            <span className="text-[10px] font-bold opacity-75 line-clamp-1 max-w-[80%]">
              {dishName}
            </span>
          </motion.div>
        </div>
      ) : (
        /* ── MAIN IMAGE RENDER ── */
        <img 
          src={currentSrc} 
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          {...props}
        />
      )}

      {/* ── AI VERIFIED BADGE ── */}
      {!loading && !hasFailed && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="bg-emerald-500/95 backdrop-blur-sm text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-400/20 flex items-center gap-1 shadow-md">
            <Sparkles size={8} className="animate-pulse" />
            AI Verified
          </span>
        </div>
      )}
    </div>
  );
};

export default AIImage;
