import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, X, Send, Brain, Bot, AlertTriangle, ArrowRight } from 'lucide-react';
import { sendAiMessage } from '../../services/aiService';
import { playNotificationTick, playSuccessChime, playAlertBleep } from '../../utils/audioSynth';
import { toast } from 'react-hot-toast';

const QUICK_PROMPTS = [
  { text: "Run Ratings Diagnostic", query: "Analyze my recent reviews. Why did my ratings drop?" },
  { text: "Check Stock Levels", query: "Check raw material inventory. What is critical?" },
  { text: "Staff Productivity Audit", query: "Analyze kitchen staff shift roster and productivity." },
  { text: "Forecast Profitability", query: "Suggest practical action items to increase profit margins." }
];

export const AiCopilotSidebar = ({ restaurantName = "Sector 18 Noida Branch" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Hello! I am your **FoodIQ AI Copilot**. I analyze real-time sales telemetry, client feedback, inventory fluctuations, and chef rosters to optimize your restaurant.\n\nHow can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;
    
    playNotificationTick();
    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendAiMessage(textToSend, restaurantName);
      playSuccessChime();
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      playAlertBleep();
      toast.error("Failed to fetch response from AI Copilot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Agent Trigger Button */}
      <button
        onClick={() => {
          playNotificationTick();
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-tr from-[#FC8019] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-2xl z-[999] hover:scale-105 transition-all group"
        title="Open AI Copilot"
      >
        <div className="relative">
          <Brain className="h-6 w-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-bounce" />
        </div>
      </button>

      {/* AI Copilot Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex justify-end pointer-events-none">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900 pointer-events-auto cursor-pointer"
            />

            {/* Main Chat Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full sm:w-[480px] h-full bg-[#0F172A] text-slate-100 border-l border-slate-800 shadow-2xl flex flex-col justify-between pointer-events-auto relative"
            >
              {/* Header */}
              <div className="p-4 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-tr from-amber-500 to-[#FC8019] rounded-xl flex items-center justify-center shadow-inner">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      FoodIQ AI Copilot
                    </h3>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" /> Vector DB Memory Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playNotificationTick();
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Message Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl p-3.5 text-xs leading-relaxed font-medium shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[#FC8019] text-white rounded-tr-none'
                          : 'bg-[#1E293B] text-slate-200 border border-slate-800 rounded-tl-none'
                      }`}
                    >
                      {/* Simple Markdown renderer placeholder */}
                      <div className="space-y-2 whitespace-pre-wrap">
                        {msg.content.split('\n\n').map((paragraph, pIdx) => {
                          // Check if paragraph is list or header
                          if (paragraph.startsWith('###')) {
                            return <h4 key={pIdx} className="font-black text-sm text-amber-500 mt-2">{paragraph.replace('###', '')}</h4>;
                          }
                          if (paragraph.startsWith('####')) {
                            return <h5 key={pIdx} className="font-bold text-xs text-slate-100 mt-1">{paragraph.replace('####', '')}</h5>;
                          }
                          return <p key={pIdx}>{paragraph}</p>;
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1E293B] text-slate-200 border border-slate-800 rounded-3xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-[#FC8019] rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-[#FC8019] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 bg-[#FC8019] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bottom Console Area */}
              <div className="p-4 bg-[#1E293B] border-t border-slate-800 space-y-3">
                {/* Quick Prompts */}
                {messages.length === 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(qp.query)}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <span>{qp.text}</span>
                        <ArrowRight size={10} className="text-slate-500 group-hover:text-[#FC8019]" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI Copilot about operations..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-[#FC8019]"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-[#FC8019] hover:bg-orange-600 rounded-2xl text-white transition-all flex items-center justify-center"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
