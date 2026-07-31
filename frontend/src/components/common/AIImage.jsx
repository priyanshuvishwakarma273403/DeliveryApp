import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getUniqueFoodImage } from '../../utils/imageProvider';

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
    src.includes('default');

  // Generate target unique URL if placeholder
  const initialSrc = isPlaceholder 
    ? getUniqueFoodImage(dishName, restaurantName) 
    : src;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  // When src/dishName/restaurantName changes, reset the state
  useEffect(() => {
    setCurrentSrc(initialSrc);
    setLoading(true);
    setErrorCount(0);
  }, [src, dishName, restaurantName, initialSrc]);

  const handleLoad = () => {
    setLoading(false);
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

    setLoading(false);
  };

  return (
    <div className={`relative overflow-hidden group w-full h-full ${className}`}>
      {/* ── SKELETON LOADER ── */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-gray-150 via-gray-200 to-gray-150 animate-pulse flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center gap-1.5 opacity-60">
              <Sparkles className="text-primary animate-pulse" size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest text-[#686B78]">FoodIQ Vision...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN IMAGE RENDER ── */}
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

      {/* ── AI VERIFIED BADGE ── */}
      {!loading && (
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
