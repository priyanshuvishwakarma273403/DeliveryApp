import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FlaskConical, Play, CheckCircle2, TrendingUp,
  Percent, HelpCircle, BarChart2, Plus, Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

const AdminExperiments = () => {
  const [experiments, setExperiments] = useState([
    { 
      id: 1, 
      title: 'Pizza Price A/B Elasticity Test', 
      target: 'Paneer Tikka Pizza',
      variantA: 'Baseline: ₹350',
      variantB: 'Challenger: ₹380',
      impressions: 4800,
      convA: '8.4%',
      convB: '9.2%',
      confidence: '97.2%',
      status: 'SUCCESS',
      aiWinner: 'Variant B is the clear winner. Despite price increase, conversion improved due to perceived premium bundling.'
    },
    { 
      id: 2, 
      title: 'Burger Image Showcase Layout', 
      target: 'Crispy Veg Whopper',
      variantA: 'Studio Close-up Photo',
      variantB: 'Action Eating Photo',
      impressions: 1200,
      convA: '14.2%',
      convB: '11.8%',
      confidence: '82.0%',
      status: 'RUNNING',
      aiWinner: 'Trending towards Variant A. Close-up food imagery triggers higher immediate checkout intent.'
    }
  ]);

  const handleLaunchExperiment = () => {
    toast.success("New AI-guided A/B experiment initialized targeting high-margin side orders.");
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-purple-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <FlaskConical size={10} />
                  AI Experimentation Platform
                </span>
                <span className="text-gray-500 text-xs font-bold font-mono">Bayesian Model Engine</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                A/B Testing <span className="text-purple-500 font-light">Ecosystem</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Design and deploy split tests for menu listings, item pricing, hero imagery, and descriptions
              </p>
            </div>
          </div>

          <Button onClick={handleLaunchExperiment} className="bg-purple-500 hover:bg-purple-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center gap-1.5">
            <Plus size={14} /> Deploy New Experiment
          </Button>
        </div>
      </div>

      {/* ── EXPERIMENT LIST ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Experiments Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {experiments.map(exp => (
            <div key={exp.id} className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-black text-white">{exp.title}</h3>
                  <span className="text-xs text-gray-500 mt-1 block">Target Item: <strong>{exp.target}</strong></span>
                </div>
                <Badge variant={exp.status === 'SUCCESS' ? 'success' : 'warning'}>
                  {exp.status}
                </Badge>
              </div>

              {/* Variant comparison row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-5 border border-gray-850 rounded-2.5xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Variant A (Control)</span>
                    <p className="text-xs font-bold text-white mt-1">{exp.variantA}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-850 flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Conversion Rate:</span>
                    <span className="font-black text-white">{exp.convA}</span>
                  </div>
                </div>

                <div className="bg-black/20 p-5 border border-indigo-500/20 rounded-2.5xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Variant B (Challenger)</span>
                    <p className="text-xs font-bold text-white mt-1">{exp.variantB}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-850 flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Conversion Rate:</span>
                    <span className="font-black text-indigo-400">{exp.convB}</span>
                  </div>
                </div>
              </div>

              {/* AI Winner Recommendation (Explainable Trace Requirement 24) */}
              <div className="bg-purple-500/5 p-4 border border-purple-500/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="text-purple-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h5 className="text-xs font-bold text-white">AI Winner Evaluation:</h5>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{exp.aiWinner}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics & Configuration Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <BarChart2 className="text-purple-400" size={14} />
              A/B Performance Summary
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Experiments:</span>
                <span className="font-black text-white">2 Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Impressions:</span>
                <span className="font-black text-white">6,000 views</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Average Confidence Level:</span>
                <span className="font-black text-emerald-400">89.6%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminExperiments;
