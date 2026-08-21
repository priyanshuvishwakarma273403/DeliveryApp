import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Activity, 
  Trash2, 
  Save, 
  Plus, 
  X, 
  ShieldAlert, 
  TrendingUp, 
  Heart,
  DollarSign
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import personalizationService from '../../services/personalizationService';
import { useAuthStore } from '../../store/authStore';

const POPULAR_CUISINES = [
  'NORTH INDIAN', 'SOUTH INDIAN', 'CHINESE', 'ITALIAN', 'MEXICAN', 'AMERICAN', 'THAI', 'DESSERTS', 'FAST FOOD'
];

const DIETARY_OPTIONS = [
  { id: 'VEGETARIAN', label: 'Vegetarian 🥬' },
  { id: 'VEGAN', label: 'Vegan 🌱' },
  { id: 'HIGH_PROTEIN', label: 'High Protein 🍗' }
];

const TasteDNA = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [overrides, setOverrides] = useState([]);

  // Form states for Preference Overrides
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [budgetTier, setBudgetTier] = useState('MEDIUM');
  const [budgetLimit, setBudgetLimit] = useState(500);
  
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fetchTasteData = async () => {
    setLoading(true);
    try {
      const data = await personalizationService.getTasteDNA();
      if (data) {
        setProfile(data.profile || {});
        setDimensions(data.dimensions || []);
        setOverrides(data.overrides || []);

        // Initialize form states from overrides and profile
        setBudgetTier(data.profile?.budgetTier || 'MEDIUM');
        
        // Extract cuisines
        const favCuisines = (data.overrides || [])
          .filter(o => o.preferenceKey === 'FAVORITE_CUISINES')
          .map(o => o.preferenceValue);
        setSelectedCuisines(favCuisines);

        // Extract dietary
        const diets = (data.overrides || [])
          .filter(o => o.preferenceKey === 'DIETARY_PREF')
          .map(o => o.preferenceValue);
        setSelectedDiets(diets);

        // Extract excluded ingredients
        const excluded = (data.overrides || [])
          .filter(o => o.preferenceKey === 'EXCLUDED_INGREDIENT')
          .map(o => o.preferenceValue);
        setExcludedIngredients(excluded);

        // Extract budget limit
        const limitOverride = (data.overrides || [])
          .find(o => o.preferenceKey === 'BUDGET_LIMIT');
        setBudgetLimit(limitOverride ? Number(limitOverride.preferenceValue) : 500);
      }
    } catch (err) {
      console.error("Failed to load Taste DNA:", err);
      toast.error("Could not fetch Taste DNA profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasteData();
  }, [user]);

  // Construct data for Radar Chart
  const getRadarData = () => {
    const getDimensionScore = (type, key) => {
      const dim = dimensions.find(d => d.dimensionType === type && d.dimensionKey === key);
      return dim ? Math.round(dim.score * 100) : 10; // default 10% for visualization symmetry
    };

    return [
      { subject: 'Sweet 🍩', A: getDimensionScore('FLAVOR', 'SWEET'), fullMark: 100 },
      { subject: 'Spicy 🌶️', A: getDimensionScore('FLAVOR', 'SPICY'), fullMark: 100 },
      { subject: 'Sour 🍋', A: getDimensionScore('FLAVOR', 'SOUR'), fullMark: 100 },
      { subject: 'Salty 🍟', A: getDimensionScore('FLAVOR', 'SALTY'), fullMark: 100 },
      { subject: 'High Protein 💪', A: getDimensionScore('DIETARY', 'HIGH_PROTEIN'), fullMark: 100 },
      { subject: 'Veg 🥬', A: getDimensionScore('DIETARY', 'VEGETARIAN'), fullMark: 100 },
      { subject: 'Non-Veg 🍗', A: getDimensionScore('DIETARY', 'NON_VEG'), fullMark: 100 },
      { subject: 'Exploration 🚀', A: profile?.explorationScore ? Math.round(profile.explorationScore * 100) : 50, fullMark: 100 }
    ];
  };

  const handleCuisineToggle = (cuisine) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleDietToggle = (diet) => {
    setSelectedDiets(prev => 
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (newIngredient.trim()) {
      const upper = newIngredient.trim().toUpperCase();
      if (!excludedIngredients.includes(upper)) {
        setExcludedIngredients(prev => [...prev, upper]);
      }
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ing) => {
    setExcludedIngredients(prev => prev.filter(x => x !== ing));
  };

  const handleSavePreferences = async () => {
    try {
      await personalizationService.savePreferences({
        preferredCuisines: selectedCuisines,
        dietaryPreferences: selectedDiets,
        excludedIngredients: excludedIngredients,
        budgetTier: budgetTier,
        budgetLimit: budgetLimit
      });
      toast.success('AI Taste DNA Overrides updated successfully!');
      fetchTasteData(); // reload
    } catch (err) {
      toast.error('Failed to save preferences.');
    }
  };

  const handleResetTasteDna = async () => {
    try {
      await personalizationService.deleteTasteData();
      toast.success('Taste DNA reset successfully. Cache evicted.');
      setIsResetConfirmOpen(false);
      fetchTasteData(); // reload
    } catch (err) {
      toast.error('Failed to reset Taste DNA.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-64 bg-gray-150 dark:bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-100 dark:bg-gray-850 rounded-[2rem] animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-850 rounded-[2rem] animate-pulse" />
        </div>
      </div>
    );
  }

  const radarData = getRadarData();

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C] dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black">AI Taste DNA & Food Genome</h3>
            <p className="text-xs text-[#686B78] dark:text-gray-400 font-bold">Computed dynamically from flavor profiles & order history</p>
          </div>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-black text-xs transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
          Reset DNA Profile
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Left: Recharts Radar Chart */}
        <div className="lg:col-span-6 bg-gradient-to-br from-gray-900 to-gray-950 dark:from-slate-900 dark:to-slate-950 p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden h-[360px] shadow-xl border border-gray-800">
          <div className="absolute top-4 left-4">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-black tracking-widest uppercase">Live Taste Graph</span>
          </div>

          <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={false} />
                <Radar
                  name="Taste DNA"
                  dataKey="A"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Genome Metrics Details */}
        <div className="lg:col-span-6 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Structural DNA Metrics</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Exploration Affinity</span>
              <p className="text-2xl font-black text-[#1C1C1C] dark:text-white mt-1">
                {profile?.explorationScore ? Math.round(profile.explorationScore * 100) : 50}%
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                How often you try new restaurants vs order favorites.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Budget Alignment</span>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {budgetTier}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                Average Order Value matches {profile?.averageOrderValue ? `₹${Math.round(profile.averageOrderValue)}` : 'N/A'}.
              </p>
            </div>
          </div>

          <div className="bg-orange-500/5 dark:bg-orange-500/10 p-5 rounded-2xl border border-orange-500/10 space-y-2">
            <h5 className="text-xs font-black uppercase text-orange-500 tracking-wide flex items-center gap-1.5">
              <Sparkles size={14} /> AI Engine Insight
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold leading-relaxed">
              Your Taste DNA has processed {dimensions.length} signal dimensions. We automatically boost cuisines like{' '}
              <span className="font-bold text-orange-600">
                {profile?.preferredCuisines?.slice(0, 3).join(', ') || 'your recently searched items'}
              </span>{' '}
              to optimize your personalization index.
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Overrides Form */}
      <div className="border-t border-gray-150 dark:border-gray-800 pt-8 space-y-8">
        <div>
          <h4 className="text-base font-black text-[#1C1C1C] dark:text-white">AI Preference Overrides & Constraints</h4>
          <p className="text-xs text-gray-400 mt-0.5 font-bold">Hard-guide the AI recommendations engine. These rules take absolute priority.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cuisines Choice */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Favorite Cuisines Override</h5>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CUISINES.map((cuisine) => {
                const active = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    onClick={() => handleCuisineToggle(cuisine)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      active 
                        ? 'bg-amber-500 border-amber-500 text-white font-black shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Prefs */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Dietary Profile Constraints</h5>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((diet) => {
                const active = selectedDiets.includes(diet.id);
                return (
                  <button
                    key={diet.id}
                    onClick={() => handleDietToggle(diet.id)}
                    className={`px-4 py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500 border-emerald-500 text-white font-black shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {diet.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Excluded Ingredients */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Excluded Ingredients (Negative Preferences)</h5>
            <form onSubmit={handleAddIngredient} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Mushroom, Onion, Peanut"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-amber-400 text-xs font-semibold placeholder:font-normal placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="px-4 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 text-white rounded-xl font-black text-xs transition-colors cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {excludedIngredients.length > 0 ? (
                excludedIngredients.map((ing) => (
                  <span 
                    key={ing} 
                    className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-[10px] px-2.5 py-1 rounded-lg"
                  >
                    {ing}
                    <button 
                      onClick={() => handleRemoveIngredient(ing)}
                      className="text-red-400 hover:text-red-600 shrink-0 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-semibold italic">No active ingredient exclusions. Safe list is clean.</p>
              )}
            </div>
          </div>

          {/* Budget Limit & Tier */}
          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Budget constraints</h5>
            
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/50">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-600 dark:text-gray-300">Target Budget Tier:</span>
                <div className="flex gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-xl">
                  {['BUDGET', 'MEDIUM', 'PREMIUM'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setBudgetTier(tier)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-colors cursor-pointer ${
                        budgetTier === tier 
                          ? 'bg-amber-500 text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-600 dark:text-gray-300">Maximum Dish Limit:</span>
                  <span className="text-xs font-black text-amber-500">₹{budgetLimit}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>₹100</span>
                  <span>₹1500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Action */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSavePreferences}
            className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black text-xs tracking-wider uppercase shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Save size={16} />
            Save Profile Guidelines
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div onClick={() => setIsResetConfirmOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert size={28} />
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Reset Taste DNA Profile?</h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              This action is <span className="text-red-500 font-bold">permanent</span>. We will delete all computed flavor profile histories, ingredients exclusions, and contextual dimensions. Your personalization feed will return to default state.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetTasteDna}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-colors cursor-pointer"
              >
                Delete Profile Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasteDNA;
