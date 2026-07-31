import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const CRAVINGS = [
  { 
    id: 1, 
    name: 'Biryani', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-hot-food-steam-rising-from-a-plate-of-rice-41006-large.mp4',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80' 
  },
  { 
    id: 2, 
    name: 'Pizza', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-pizza-in-a-traditional-oven-40656-large.mp4',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' 
  },
  { 
    id: 3, 
    name: 'Burgers', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-a-juicy-burger-and-fries-41007-large.mp4',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' 
  },
  { 
    id: 4, 
    name: 'Desserts', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-chocolate-cake-with-fruit-40662-large.mp4',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' 
  },
  { 
    id: 5, 
    name: 'Healthy', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-being-washed-in-a-sink-40644-large.mp4',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' 
  },
  { 
    id: 6, 
    name: 'Coffee', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-40659-large.mp4',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' 
  },
  { 
    id: 7, 
    name: 'Chinese', 
    video: 'https://assets.mixkit.co/videos/preview/mixkit-serving-hot-noodles-with-vegetables-and-meat-40658-large.mp4',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80' 
  }
];

const Stories = () => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState({});
  const [activeVideoLoaded, setActiveVideoLoaded] = useState(false);

  const scrollToCategory = (category) => {
    const element = document.getElementById('category-tabs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (activeStoryIndex === null) return;
    
    setActiveVideoLoaded(false);
    setProgress(0);
    
    const intervalTime = 50;
    const step = 1;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < CRAVINGS.length - 1) {
            setActiveStoryIndex((idx) => idx + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [activeStoryIndex]);

  const handlePrevStory = (e) => {
    e.stopPropagation();
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      setProgress(0);
    }
  };

  const handleNextStory = (e) => {
    e.stopPropagation();
    if (activeStoryIndex < CRAVINGS.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
             <motion.div
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
             >
               ✨
             </motion.div>
          </div>
          <h3 className="text-sm font-black text-[#1C1C1C] uppercase tracking-[0.2em]">Trending Cravings</h3>
        </div>
        
        <div className="flex overflow-x-auto gap-5 md:gap-10 pb-6 scrollbar-hide snap-x snap-mandatory">
          {CRAVINGS.map((item, index) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveStoryIndex(index)}
              className="flex flex-col items-center gap-4 cursor-pointer snap-start min-w-[85px]"
            >
              <div className="relative group">
                {/* Instagram-style Ring */}
                <div className="absolute -inset-[3px] bg-gradient-to-tr from-[#FFD600] via-[#FF0069] to-[#7638FA] rounded-full p-[2px] animate-spin-slow group-hover:p-[4px] transition-all duration-500 shadow-lg">
                  <div className="bg-white rounded-full h-full w-full" />
                </div>
                
                {/* Image/Video Container */}
                <div className="h-16 w-16 md:h-22 md:w-22 rounded-full overflow-hidden relative z-10 border-[3px] border-white shadow-2xl bg-gray-100">
                  {/* Background Fallback Image */}
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                  
                  {/* High Quality Video - Always playing like a story */}
                  <video
                    src={item.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onPlay={() => setVideoLoaded(prev => ({ ...prev, [item.id]: true }))}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-300",
                      videoLoaded[item.id] ? "opacity-100" : "opacity-0"
                    )}
                  />

                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-black/10 z-30 group-hover:bg-transparent transition-colors" />
                </div>
                
                {/* LIVE / HOT Badge */}
                {item.id % 3 === 1 && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-40 bg-primary text-[8px] font-black text-white px-2 py-0.5 rounded-full border-2 border-white shadow-xl uppercase tracking-widest whitespace-nowrap"
                  >
                    HOT NOW
                  </motion.div>
                )}
              </div>
              <span className="text-[10px] md:text-xs font-black text-[#1C1C1C] uppercase tracking-widest group-hover:text-primary transition-colors">{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Screen Instagram-style Story Player */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/98 flex flex-col items-center justify-center select-none"
          >
            {/* Instagram-style top progress bars */}
            <div className="absolute top-4 left-0 right-0 px-4 flex gap-1 z-50 max-w-lg mx-auto">
              {CRAVINGS.map((item, idx) => (
                <div key={item.id} className="h-1 flex-1 bg-white/35 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{
                      width: 
                        idx < activeStoryIndex 
                          ? '100%' 
                          : idx === activeStoryIndex 
                            ? `${progress}%` 
                            : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Close Button and Info Header */}
            <div className="absolute top-8 left-0 right-0 px-4 flex justify-between items-center z-50 max-w-lg mx-auto w-full">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-white/20 overflow-hidden bg-white/10">
                  <img src={CRAVINGS[activeStoryIndex].image} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-wider">{CRAVINGS[activeStoryIndex].name}</h4>
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full">Live Craving</span>
                </div>
              </div>
              <button
                onClick={() => setActiveStoryIndex(null)}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold">✕</span>
              </button>
            </div>

            {/* Left/Right Click zones */}
            <div className="absolute inset-0 z-40 flex max-w-lg mx-auto w-full">
              <div onClick={handlePrevStory} className="w-[30%] h-full cursor-w-resize" />
              <div onClick={handleNextStory} className="w-[70%] h-full cursor-e-resize" />
            </div>

            {/* Main Video & Fallback Image Container */}
            <div className="w-full max-w-lg aspect-[9/16] relative overflow-hidden bg-black flex items-center justify-center">
              <img
                src={CRAVINGS[activeStoryIndex].image}
                alt={CRAVINGS[activeStoryIndex].name}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none animate-pulse"
              />
              
              <video
                key={CRAVINGS[activeStoryIndex].video}
                src={CRAVINGS[activeStoryIndex].video}
                autoPlay
                loop
                muted
                playsInline
                onPlay={() => setActiveVideoLoaded(true)}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover z-20 select-none pointer-events-none transition-opacity duration-300",
                  activeVideoLoaded ? "opacity-100" : "opacity-0"
                )}
              />

              {/* Dark overlay at bottom for readable actions */}
              <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30 pointer-events-none" />
            </div>

            {/* Bottom Order Action Button */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 px-4 max-w-lg mx-auto w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToCategory(CRAVINGS[activeStoryIndex].name);
                  setActiveStoryIndex(null);
                }}
                className="w-full max-w-xs bg-primary hover:bg-primary-dark text-white font-black text-sm uppercase py-4 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                Explore {CRAVINGS[activeStoryIndex].name} Cravings
                <span className="text-lg">➔</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Stories;
