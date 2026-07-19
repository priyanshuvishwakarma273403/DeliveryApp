import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getUniqueFoodImage, getFallbackUnsplashImage } from '../../utils/imageProvider';

// Global cache to track resolved image statuses and prevent layout reflows/flickering
// Maps src -> { status: 'LOADED' | 'FAILED', resolvedSrc: string }
const imageCache = new Map();

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
  const targetSrc = isPlaceholder 
    ? getUniqueFoodImage(dishName, restaurantName) 
    : src;

  // Check if we already resolved/cached this URL
  const cached = imageCache.get(targetSrc);
  const initialResolvedSrc = cached ? cached.resolvedSrc : null;
  const initialLoading = !cached;

  const [resolvedSrc, setResolvedSrc] = useState(initialResolvedSrc || targetSrc);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    // If already cached, we don't need to do any background loading
    if (imageCache.has(targetSrc)) {
      const cachedData = imageCache.get(targetSrc);
      setResolvedSrc(cachedData.resolvedSrc);
      setLoading(false);
      return;
    }

    setLoading(true);
    let active = true;

    const img = new Image();
    img.src = targetSrc;
    img.onload = () => {
      if (!active) return;
      imageCache.set(targetSrc, { status: 'LOADED', resolvedSrc: targetSrc });
      setResolvedSrc(targetSrc);
      setLoading(false);
    };

    img.onerror = () => {
      if (!active) return;
      console.warn(`Primary image load failed: ${targetSrc}. Cascading to verified Unsplash fallback.`);
      
      // Fallback to verified category-specific Unsplash image
      const fallbackUrl = getFallbackUnsplashImage(dishName, restaurantName);
      
      const fallbackImg = new Image();
      fallbackImg.src = fallbackUrl;
      fallbackImg.onload = () => {
        if (!active) return;
        imageCache.set(targetSrc, { status: 'FAILED', resolvedSrc: fallbackUrl });
        setResolvedSrc(fallbackUrl);
        setLoading(false);
      };
      fallbackImg.onerror = () => {
        if (!active) return;
        // Absolute fallback to a generic Unsplash image
        const absoluteFallback = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';
        imageCache.set(targetSrc, { status: 'FAILED', resolvedSrc: absoluteFallback });
        setResolvedSrc(absoluteFallback);
        setLoading(false);
      };
    };

    return () => {
      active = false;
    };
  }, [targetSrc, dishName, restaurantName]);

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
            <div className="flex flex-col items-center gap-1.5 opacity-65">
              <Sparkles className="text-primary animate-pulse" size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">FoodIQ Vision...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN IMAGE RENDER ── */}
      <img 
        src={resolvedSrc} 
        alt={alt}
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
export { imageCache };
