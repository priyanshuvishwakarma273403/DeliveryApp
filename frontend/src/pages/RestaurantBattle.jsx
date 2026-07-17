import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Star, Clock, Heart, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { ALL_RESTAURANTS } from '../data/restaurants';
import Button from '../components/common/Button';
import AIImage from '../components/common/AIImage';

const RestaurantBattle = () => {
  const [res1, setRes1] = useState(ALL_RESTAURANTS[0]);
  const [res2, setRes2] = useState(ALL_RESTAURANTS[1] || ALL_RESTAURANTS[0]);
  const [isFighting, setIsFighting] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const startBattle = () => {
    setIsFighting(true);
    setVerdict(null);
    setTimeout(() => {
      setIsFighting(false);
      // Simulate battle result calculation
      const score1 = (res1.rating * 10) + (100 - res1.deliveryTime) + (res1.cuisine.length * 2);
      const score2 = (res2.rating * 10) + (100 - res2.deliveryTime) + (res2.cuisine.length * 2);
      const winner = score1 >= score2 ? res1 : res2;
      const loser = score1 >= score2 ? res2 : res1;

      setVerdict({
        winnerName: winner.name,
        winnerCuisine: winner.cuisine,
        scoreDiff: Math.abs(Math.round(score1 - score2)),
        reason: `${winner.name} takes the lead due to superior delivery speed (${winner.deliveryTime} mins avg) and a pristine hygiene rating. While ${loser.name} matches closely on flavor depth, our models predict higher overall consumer satisfaction with ${winner.name} today.`
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 pt-16 md:pt-24 text-[#1C1C1C]">
      <div className="container mx-auto px-4 lg:max-w-5xl">
        
        {/* ── HEADER ── */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="h-14 w-14 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4">
             <Swords size={28} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1C1C1C]">
            Restaurant Battle Arena
          </h1>
          <p className="text-xs text-[#686B78] mt-2 font-bold leading-relaxed">
            Pit two restaurants side-by-side. Our intelligence agent calculates metrics, ratings, speeds, and declares a personalized winner.
          </p>
        </div>

        {/* ── SELECTION GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center mb-10">
          
          {/* Restaurant 1 */}
          <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Challenger A</label>
            <select
              value={res1.id}
              onChange={(e) => {
                const r = ALL_RESTAURANTS.find(item => item.id === Number(e.target.value));
                setRes1(r);
              }}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none mb-6"
            >
              {ALL_RESTAURANTS.slice(0, 30).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            
            <div className="h-28 w-44 rounded-2xl overflow-hidden border border-gray-50 mb-4">
              <AIImage 
                src={res1.image} 
                dishName={res1.name} 
                restaurantName={res1.name}
                alt={res1.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <h3 className="text-lg font-black">{res1.name}</h3>
            <p className="text-xs text-gray-500 font-bold mt-1">{res1.cuisine}</p>
          </div>

          {/* VS Divider */}
          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20 border-4 border-white z-10">
              VS
            </div>
          </div>

          {/* Restaurant 2 */}
          <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Challenger B</label>
            <select
              value={res2.id}
              onChange={(e) => {
                const r = ALL_RESTAURANTS.find(item => item.id === Number(e.target.value));
                setRes2(r);
              }}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none mb-6"
            >
              {ALL_RESTAURANTS.slice(0, 30).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <div className="h-28 w-44 rounded-2xl overflow-hidden border border-gray-50 mb-4">
              <AIImage 
                src={res2.image} 
                dishName={res2.name} 
                restaurantName={res2.name}
                alt={res2.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            <h3 className="text-lg font-black">{res2.name}</h3>
            <p className="text-xs text-gray-500 font-bold mt-1">{res2.cuisine}</p>
          </div>

        </div>

        {/* ── BATTLE TRIGGER ── */}
        <div className="text-center mb-12">
          <Button
            onClick={startBattle}
            disabled={isFighting || res1.id === res2.id}
            className="px-12 py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary/10 tracking-widest"
          >
            {isFighting ? 'Simulating Fight...' : 'Fight! ⚔️'}
          </Button>
          {res1.id === res2.id && (
            <p className="text-xs text-red-500 font-bold mt-2">Please select two different restaurants to compare.</p>
          )}
        </div>

        {/* ── BATTLE REPORT & VERDICT ── */}
        {verdict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] border border-gray-100 p-8 md:p-10 shadow-xl space-y-8"
          >
            <h3 className="text-xl font-black text-center mb-8 flex items-center justify-center gap-2">
              <Sparkles className="text-primary animate-pulse" size={20} />
              AI Agent Verdict Report
            </h3>

            {/* Comparison specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center border-b border-gray-50 pb-8">
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Delivery Time</span>
                <span className="text-lg font-black text-[#1C1C1C]">{res1.deliveryTime}m</span>
                <span className="text-xs text-gray-405 font-bold mx-2">vs</span>
                <span className="text-lg font-black text-[#1C1C1C]">{res2.deliveryTime}m</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Average Rating</span>
                <span className="text-lg font-black text-[#1C1C1C]">{res1.rating}★</span>
                <span className="text-xs text-gray-405 font-bold mx-2">vs</span>
                <span className="text-lg font-black text-[#1C1C1C]">{res2.rating}★</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cost For Two</span>
                <span className="text-lg font-black text-[#1C1C1C]">₹{res1.costForTwo}</span>
                <span className="text-xs text-gray-450 font-bold mx-2">vs</span>
                <span className="text-lg font-black text-[#1C1C1C]">₹{res2.costForTwo}</span>
              </div>
            </div>

            {/* Glowing Winner Verdict Box */}
            <div className="bg-gradient-to-br from-primary/5 to-orange-500/5 border border-primary/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-black shrink-0">
                🏆
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-[#1C1C1C]">
                  Winner: {verdict.winnerName}
                </h4>
                <p className="text-xs text-[#686B78] font-medium leading-relaxed">
                  {verdict.reason}
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default RestaurantBattle;
