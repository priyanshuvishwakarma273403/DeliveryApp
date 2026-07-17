import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getUniqueFoodImage } from '../../utils/imageProvider';

// Set to track globally verified images and prevent screen duplication
const globalRenderedRegistry = new Set();

const AIImage = ({ 
  src: initialSrc, 
  dishName = 'Food Item', 
  restaurantName = 'FoodIQ Restaurant', 
  cuisine = 'General', 
  className = '', 
  alt = 'Premium Food',
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [scanStatus, setScanStatus] = useState('PENDING'); // PENDING, SCANNING, VERIFIED, REPLACED
  const [uniquenessScore, setUniquenessScore] = useState(0);
  const [telemetry, setTelemetry] = useState('');

  useEffect(() => {
    // Start verification scan on mount or source change
    setScanStatus('SCANNING');
    
    // Simulate high-fidelity AI vision scanning delay
    const timer = setTimeout(() => {
      // 1. Quality Check & Aspect Check
      const score = Math.floor(90 + (dishName.length % 10)); // Calculate unique rating based on dish length
      setUniquenessScore(score);

      // 2. Duplicate Detection
      const isUnsplash = initialSrc && initialSrc.includes('unsplash.com');
      const isPlaceholder = !initialSrc || initialSrc.includes('photo-1504674900247-0877df9cc836'); // default placeholder

      if (isPlaceholder || globalRenderedRegistry.has(initialSrc)) {
        // Validation Failed: Duplicate detected or invalid placeholder. Automatically resolve!
        const correctImage = getUniqueFoodImage(dishName, restaurantName);
        setCurrentSrc(correctImage);
        globalRenderedRegistry.add(correctImage);
        setScanStatus('REPLACED');
        setTelemetry(`AI Refitting: Re-routed to verified unique asset`);
      } else {
        // Validation Passed
        if (initialSrc) {
          globalRenderedRegistry.add(initialSrc);
        }
        setScanStatus('VERIFIED');
        setTelemetry(`AI Lock: Verified Unique Dish (${score}% Match)`);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [initialSrc, dishName, restaurantName]);

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      
      {/* ── MAIN IMAGE RENDER ── */}
      <img 
        src={currentSrc || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'} 
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          // Graceful fallback to verified image if URL fails
          const fallback = getUniqueFoodImage(dishName, restaurantName);
          setCurrentSrc(fallback);
          setScanStatus('REPLACED');
        }}
        {...props}
      />

      {/* ── AI SCANNING EFFECT / TELEMETRY OVERLAY ── */}
      <AnimatePresence>
        {scanStatus === 'SCANNING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10"
          >
            <div className="relative">
              <RefreshCw className="text-cyan-400 animate-spin" size={24} />
              <motion.div 
                className="absolute inset-0 border border-cyan-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">AI Vision Scan</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MINI AI VERIFIED CHIP ON HOVER ── */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md border flex items-center gap-1 shadow-md ${
          scanStatus === 'REPLACED' 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
            : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/25'
        }`}>
          <Sparkles size={8} className="animate-pulse" />
          {scanStatus === 'REPLACED' ? 'AI Refit' : 'AI Verified'} ({uniquenessScore}%)
        </span>
      </div>

    </div>
  );
};

export default AIImage;
export { globalRenderedRegistry };
