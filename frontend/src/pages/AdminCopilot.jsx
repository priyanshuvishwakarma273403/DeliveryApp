import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, MessageSquare, Send, Sparkles, AlertTriangle, 
  TrendingDown, TrendingUp, CheckCircle, ShieldAlert, Clock, Play, 
  HelpCircle, ChevronRight, Activity, Award, BarChart2
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';
import { getCopilotResponse } from '../services/aiService';
import { ALL_RESTAURANTS } from '../data/restaurants';

const AdminCopilot = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_RESTAURANTS[0]);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'assistant', 
      text: `Hello! I am your **FoodIQ Operations Copilot** 🚀. 

I've audited the live telemetry and historical logs for **${selectedRestaurant.name}**. I've identified several operational bottlenecks:
*   **Ratings Drop**: Customer rating fell to **4.1** due to late/cold deliveries.
*   **Refund Spike**: Spiked to **6.2%** from order assembly errors.
*   **Prep Latency**: Evening preparation times spike to **32 mins** under load.

Ask me any business questions, or select a quick diagnosis option below to start the operational audit!`,
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Active Audit metrics panel state
  const [selectedAuditTab, setSelectedAuditTab] = useState('root_causes');
  const [activeActions, setActiveActions] = useState({});

  useEffect(() => {
    // Reset conversation when restaurant changes
    setChatHistory([
      { 
        role: 'assistant', 
        text: `Hello! I am your **FoodIQ Operations Copilot** 🚀. 

I've audited the live telemetry and historical logs for **${selectedRestaurant.name}**. I've identified several operational bottlenecks:
*   **Ratings Drop**: Customer rating fell to **4.1** due to late/cold deliveries.
*   **Refund Spike**: Spiked to **6.2%** from order assembly errors.
*   **Prep Latency**: Evening preparation times spike to **32 mins** under load.

Ask me any business questions, or select a quick diagnosis option below to start the operational audit!`,
        timestamp: new Date()
      }
    ]);
  }, [selectedRestaurant]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || question;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', text: textToSend, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await getCopilotResponse(selectedRestaurant.name, textToSend);
      setChatHistory(prev => [...prev, { role: 'assistant', text: response, timestamp: new Date() }]);
    } catch (error) {
      toast.error("Failed to fetch Copilot analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q) => {
    handleSend(q);
  };

  const deployAction = (actionId, msg) => {
    setActiveActions(prev => {
      const isApplied = !prev[actionId];
      if (isApplied) {
        toast.success(msg || "Action deployed immediately!");
      } else {
        toast.error("Action suspended");
      }
      return { ...prev, [actionId]: isApplied };
    });
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-100 pb-12">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[400px] h-[120px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-cyan-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-violet-500/10 text-violet-400 border border-violet-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Cpu size={12} /> Operations Control
                </span>
                <span className="text-gray-500 text-xs font-bold">Copilot Engine Synced</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                AI Restaurant <span className="text-cyan-500 font-light">Copilot</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Explain bottlenecks, identify root causes, and deploy automated resolutions
              </p>
            </div>
          </div>

          {/* Restaurant Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Select Restaurant:</span>
            <select
              value={selectedRestaurant.id}
              onChange={(e) => {
                const res = ALL_RESTAURANTS.find(r => String(r.id) === String(e.target.value));
                if (res) setSelectedRestaurant(res);
              }}
              className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-colors"
            >
              {ALL_RESTAURANTS.map(res => (
                <option key={res.id} value={res.id}>{res.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── COPILOT METRICS DASHBOARD ROW ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Operational Rating', 
              value: '4.1 / 5.0', 
              desc: 'Rating drop: -0.5 points', 
              status: 'critical', 
              icon: <Award className="text-rose-400" size={18} /> 
            },
            { 
              label: 'Refund rate (Spike)', 
              value: '6.2%', 
              desc: 'Normal threshold: <1.5%', 
              status: 'alert', 
              icon: <ShieldAlert className="text-amber-400" size={18} /> 
            },
            { 
              label: 'Peak Preparation Delay', 
              value: '32 mins', 
              desc: 'Increases customer complaints', 
              status: 'warning', 
              icon: <Clock className="text-yellow-400" size={18} /> 
            },
            { 
              label: 'Ingredient Waste Rate', 
              value: '18% Avg', 
              desc: 'Lettuce/dairy over-stocking', 
              status: 'warning', 
              icon: <TrendingDown className="text-orange-400" size={18} /> 
            },
          ].map((m, i) => (
            <div key={i} className="bg-gradient-to-br from-[#111827] to-[#0B0F19] border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{m.label}</span>
                <div className="p-1.5 bg-white/5 rounded-lg">{m.icon}</div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-1">{m.value}</h3>
              <p className="text-[10px] text-gray-400 font-bold">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* ── COPILOT CHAT & AUDIT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Conversational Console (8 Cols) */}
          <div className="lg:col-span-8 bg-[#111827]/90 backdrop-blur-md border border-gray-800 rounded-3xl overflow-hidden flex flex-col h-[650px] shadow-2xl relative">
            
            {/* Header Status */}
            <div className="bg-[#1F2937]/35 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-300">FoodIQ Copilot Console</span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">MODEL: LLaMA-3.3-Versatile</div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-radial-gradient">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/10' 
                      : 'bg-white/5 border border-gray-800/80 text-gray-300 whitespace-pre-wrap'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                        <Sparkles size={12} /> FoodIQ Operations AI
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-gray-800 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-gray-400 font-bold">Diagnosing telemetry logs...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-6 py-3 border-t border-gray-850 bg-black/20 flex flex-wrap gap-2">
              {[
                { q: "Why did our ratings drop last week?", l: "📉 Ratings Drop Analysis" },
                { q: "How can we improve kitchen efficiency?", l: "🍳 Kitchen Bottlenecks" },
                { q: "What is causing high customer refunds?", l: "💸 Refund Leakage Diagnosis" },
                { q: "How do we reduce inventory waste?", l: "📦 Inventory & Waste" },
                { q: "What is our staff productivity breakdown?", l: "👥 Staff Output Audit" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(chip.q)}
                  className="px-3.5 py-2 bg-[#111827] hover:bg-cyan-500/10 border border-gray-800 hover:border-cyan-500/30 text-xs font-bold rounded-xl text-gray-400 hover:text-cyan-400 transition-all"
                >
                  {chip.l}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="p-4 bg-[#1F2937]/10 border-t border-gray-800 flex gap-3"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask Copilot: 'Why is there high food waste?' or 'How is trainee staff productivity?'..."
                className="flex-1 bg-[#111827] border border-gray-800 rounded-2xl px-5 text-sm font-medium outline-none focus:border-cyan-500/50 text-white"
              />
              <button 
                type="submit" 
                className="h-12 w-12 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl flex items-center justify-center transition-transform hover:scale-105 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>

          </div>

          {/* AI Auditing & Actions Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Intel Panel */}
            <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Activity className="text-cyan-400" size={18} />
                Copilot Diagnostic Panel
              </h3>

              {/* Tabs */}
              <div className="flex border-b border-gray-800 mb-6">
                {[
                  { id: 'root_causes', label: 'Root Causes' },
                  { id: 'telemetry', label: 'Telemetry Logs' },
                  { id: 'trends', label: 'Trends' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedAuditTab(tab.id)}
                    className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                      selectedAuditTab === tab.id 
                        ? 'border-cyan-500 text-white' 
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[220px]">
                {selectedAuditTab === 'root_causes' && (
                  <div className="space-y-4">
                    {[
                      { t: 'Trainee Packing Errors', d: 'Chef C error rate (12%) accounts for 78% of order discrepancies.' },
                      { t: 'Rider Congestion Delay', d: 'Lack of parking layout adds average 14 mins loading times.' },
                      { t: '8 PM Stove Bottleneck', d: 'Complex main course preps block stove stations.' },
                    ].map((rc, i) => (
                      <div key={i} className="flex gap-3 group">
                        <div className="h-6 w-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{rc.t}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{rc.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAuditTab === 'telemetry' && (
                  <div className="space-y-3 font-mono text-[9px] text-gray-400">
                    <div className="p-2 bg-black/30 border border-gray-850 rounded-lg">
                      <span className="text-rose-400">REFUND_THRESHOLD_VIOLATION</span>: 6.2% vs 1.5% limit.
                    </div>
                    <div className="p-2 bg-black/30 border border-gray-850 rounded-lg">
                      <span className="text-yellow-400">LOGISTICS_CONGESTION_LATENCY</span>: +14 mins waiting at dispatch dock.
                    </div>
                    <div className="p-2 bg-black/30 border border-gray-850 rounded-lg">
                      <span className="text-amber-400">SPIKE_TRAINEE_PACK_DISPUTES</span>: 24 reports for Chef C orders.
                    </div>
                    <div className="p-2 bg-black/30 border border-gray-850 rounded-lg">
                      <span className="text-cyan-400">METRIC_RAIN_DELAY_COEFFICIENT</span>: +68% transit latency.
                    </div>
                  </div>
                )}

                {selectedAuditTab === 'trends' && (
                  <div className="space-y-4">
                    {[
                      { t: 'Appetizer Dropoff', d: 'New customer retention on appetizer orders fell by 12%.' },
                      { t: 'Surge Leakage', d: 'Rainy days show a 25% revenue drop-off due to courier attrition.' },
                      { t: 'Weekday Over-purchase', d: 'Produce waste is 18% higher on Mon-Wed compared to weekend.' },
                    ].map((tr, i) => (
                      <div key={i} className="flex gap-2.5">
                        <TrendingDown size={14} className="text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{tr.t}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{tr.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Center - Deployable fixes */}
            <div className="bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-cyan-400" size={18} />
                Copilot Recommendations
              </h3>

              <div className="space-y-4">
                {[
                  { 
                    id: 'double_verify', 
                    title: 'Double-Verify Handoff', 
                    desc: 'Assign Chef A to check Chef C\'s order bags before rider handover.',
                    msg: 'Checklist dispatch station activated!'
                  },
                  { 
                    id: 'insulate_bags', 
                    title: 'Switch Insulated Packaging', 
                    desc: 'Implement aluminium hot bags to fix cold food complaints.',
                    msg: 'Hot bag guidelines deployed to packing counter.'
                  },
                  { 
                    id: 'rider_parking', 
                    title: 'Optimize Rider Handoff Dock', 
                    desc: 'Designate specific courier bays to cut pick-up delays by 10 mins.',
                    msg: 'Rider Bay assignments dispatched.'
                  },
                ].map(act => (
                  <div key={act.id} className="p-3 bg-white/5 border border-gray-800 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{act.title}</h4>
                      <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{act.desc}</p>
                    </div>
                    <button
                      onClick={() => deployAction(act.id, act.msg)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                        activeActions[act.id]
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {activeActions[act.id] ? 'Active' : 'Deploy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCopilot;
