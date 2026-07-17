import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Search, Network, HelpCircle, CornerDownRight,
  Database, GitPullRequest, Info, Award
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const AdminKnowledgeGraph = () => {
  const [activeNode, setActiveNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphTrace, setGraphTrace] = useState(null);

  // Nodes list (Restaurants, Dishes, Ingredients, Allergens, Cuisines)
  const nodes = [
    { id: '1', label: 'Burger King 42', type: 'restaurant', details: 'Noida Sector 62. Active since 2021.' },
    { id: '2', label: 'Paneer Butter Masala', type: 'dish', details: 'High-margin popular dish. 380 kcal.' },
    { id: '3', label: 'Gluten-Free Flour', type: 'ingredient', details: 'Alternative baking option. Allergen safe.' },
    { id: '4', label: 'Celiac Allergen', type: 'allergen', details: 'Strict warning: Cross-contamination risk.' },
    { id: '5', label: 'Indian Cuisine', type: 'cuisine', details: 'Rich vegetarian varieties.' },
    { id: '6', label: 'Chef Kabir', type: 'chef', details: 'Specialist in Tandoor dishes.' }
  ];

  // Links list representing the relationships
  const links = [
    { source: '1', target: '2', label: 'SERVES' },
    { source: '2', target: '5', label: 'BELONGS_TO' },
    { source: '2', target: '3', label: 'CONTAINS' },
    { source: '3', target: '4', label: 'PREVENTS' },
    { source: '5', target: '6', label: 'MANAGED_BY' }
  ];

  const handleQuerySearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Simulate query parsing against knowledge relationships
    if (searchQuery.toLowerCase().includes('gluten') || searchQuery.toLowerCase().includes('celiac')) {
      setGraphTrace({
        path: 'Indian Cuisine -> Paneer Butter Masala -> Contains -> Gluten-Free Flour -> Prevents -> Celiac Allergen',
        result: 'Option found: Chef Kabir confirms Paneer Butter Masala can be custom baked using Gluten-Free flour to prevent Celiac outbreaks.',
        confidence: '98% Semantic Match'
      });
      toast.success("Graph path resolved successfully.");
    } else {
      setGraphTrace({
        path: 'Burger King 42 -> Serves -> Paneer Butter Masala -> Indian Cuisine',
        result: 'Option found: Burger King serves Indian fusion wraps containing Paneer.',
        confidence: '84% Match'
      });
      toast.success("Graph path resolved successfully.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-cyan-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Database size={10} />
                  AI Ontology System
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">1.2M Relational Edges</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Food Knowledge <span className="text-cyan-500 font-light">Graph Explorer</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Understand recipes, cross-contamination allergens, ingredients, and restaurant profiles through semantic vectors
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DASHBOARD GRID ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Interactive SVG Visualization (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Network size={16} className="text-cyan-400" />
              Ontological Node Map
            </h3>
            <span className="text-[10px] font-bold text-gray-550">Click nodes to expand connections</span>
          </div>

          {/* Interactive SVG Diagram representing Graph */}
          <div className="relative h-[380px] bg-black/20 border border-gray-850 rounded-2.5xl overflow-hidden flex items-center justify-center">
            
            {/* Draw nodes as interactive motion points */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {/* Relationship lines */}
              <line x1="80" y1="80" x2="220" y2="120" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="220" y1="120" x2="380" y2="80" stroke="#334155" strokeWidth="2" />
              <line x1="220" y1="120" x2="200" y2="280" stroke="#334155" strokeWidth="2" />
              <line x1="200" y1="280" x2="360" y2="300" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            {/* Nodes placement */}
            <div className="relative w-full h-full">
              {/* Node 1: Burger King */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveNode(nodes[0])}
                className="absolute top-[60px] left-[40px] px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black rounded-xl"
              >
                🏢 Burger King 42
              </motion.button>

              {/* Node 2: Paneer Butter Masala */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveNode(nodes[1])}
                className="absolute top-[100px] left-[180px] px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black rounded-xl"
              >
                🍲 Paneer Masala
              </motion.button>

              {/* Node 3: Gluten-Free Flour */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveNode(nodes[2])}
                className="absolute top-[260px] left-[140px] px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl"
              >
                🌾 Gluten-Free Flour
              </motion.button>

              {/* Node 4: Celiac Allergen */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveNode(nodes[3])}
                className="absolute top-[280px] left-[320px] px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-xl"
              >
                ⚠️ Celiac Allergen
              </motion.button>

              {/* Node 5: Indian Cuisine */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveNode(nodes[4])}
                className="absolute top-[60px] left-[340px] px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black rounded-xl"
              >
                🍛 Indian Cuisine
              </motion.button>
            </div>

            {/* Selected Node Details overlay */}
            {activeNode && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#111827] border border-cyan-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">{activeNode.type}</span>
                  <h4 className="text-xs font-black text-white">{activeNode.label}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activeNode.details}</p>
                </div>
                <button 
                  onClick={() => setActiveNode(null)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Natural Language Q&A trace (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <HelpCircle size={16} className="text-cyan-400" />
              Ask Knowledge Graph AI
            </h3>

            <form onSubmit={handleQuerySearch} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Gluten-free options from Burger King 42..." 
                  className="w-full bg-black/30 border border-gray-800 focus:border-cyan-500/40 rounded-xl py-3 px-4 outline-none text-xs font-medium text-white placeholder-gray-500"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-550 hover:text-cyan-400">
                  <Search size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-500">AI semantic engine scans recipes, allergens, and local restaurant metadata instantly.</p>
            </form>
          </div>

          {/* AI Graph Trace result */}
          {graphTrace && (
            <div className="bg-gradient-to-br from-[#1E1B4B]/60 to-[#0F172A] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
              <div>
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block mb-2">
                  Graph Traversal Trace Resolved
                </span>
                <h4 className="text-xs font-bold text-white mb-2">Semantic Output:</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">"{graphTrace.result}"</p>
              </div>

              <div className="p-3 bg-black/30 border border-gray-850 rounded-xl font-mono text-[9px] text-cyan-400 space-y-1.5">
                <span className="text-gray-500 font-bold block">Execution Path:</span>
                <div className="flex items-start gap-1">
                  <CornerDownRight size={10} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{graphTrace.path}</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminKnowledgeGraph;
