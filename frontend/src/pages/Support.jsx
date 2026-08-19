import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Phone, MessageSquare, AlertTriangle, ShieldCheck, 
  HelpCircle, Clock, Send, ChevronRight, CheckCircle2,
  RefreshCw, Info, ArrowLeft, Ticket
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/axios';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const Support = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [activeTickets, setActiveTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Form states
  const [orderId, setOrderId] = useState('ORD-8812');
  const [complaintType, setComplaintType] = useState('Missing Items');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect Support Executive to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'SUPPORT_EXECUTIVE') {
      navigate('/support/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch tickets from database
  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await apiClient.get('/support/tickets');
      if (res.data && res.data.success) {
        setActiveTickets(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      // Fallback local tickets if server is booting up or fails
      setActiveTickets([
        { id: 'TKT-9041', orderId: 'ORD-8790', issue: 'Late Delivery: Delayed due to rain.', status: 'ACTIVE', createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the issue in detail.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/support/tickets', {
        orderId,
        type: complaintType,
        description: description
      });

      if (res.data && res.data.success) {
        toast.success('Dispute ticket raised! Support desk notified.', { icon: '🛡️' });
        setDescription('');
        fetchTickets(); // Refresh list
      } else {
        toast.error('Failed to submit ticket');
      }
    } catch (err) {
      toast.error('Failed to connect to support services.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
    toast.success('AI Chatbot opened!');
  };

  return (
    <div className="min-h-screen pb-24 pt-16 md:pt-24 bg-[#F8F9FB]">
      <div className="container mx-auto px-4 lg:max-w-6xl">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200/65">
          <div className="flex items-center gap-3">
            <Link to="/" className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-[#1C1C1C]">FoodIQ Help & Disputes</h1>
              <p className="text-xs text-[#686B78] font-bold">Speak with our AI agent, trace refunds, and manage dispute claims</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-xl">
              AI Support Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Side: Interactive Channels ── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Exotel Voice Call Assistant */}
            <div className="bg-[#1C1C1C] rounded-[2.5rem] p-6 text-white relative overflow-hidden group shadow-xl">
              <Phone size={140} className="absolute -right-12 -bottom-12 text-white/5 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative z-10">
                <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Live Telephony
                </span>
                
                <h3 className="text-2xl font-black mt-3">AI Voice Assistant</h3>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Call our official support line directly. Our AI agent will verify your number, process refunds, or redirect to a human desk!
                </p>

                <div className="my-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exophone Helpline</p>
                  <p className="text-lg font-black text-primary select-all">+91 80 4728 0783</p>
                  <p className="text-[9px] text-gray-500 font-bold leading-normal">
                    *Verification Code: 123456 (or your email OTP)
                  </p>
                  <p className="text-[8px] text-amber-400 font-bold leading-normal mt-1">
                    ⚠️ Trial Account: Ensure your caller number is whitelisted in your Exotel Dashboard.
                  </p>
                </div>

                <a 
                  href="tel:+918047280783"
                  className="w-full bg-white text-black py-3.5 rounded-xl font-black text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={14} /> Call Support Line
                </a>
              </div>
            </div>

            {/* AI Chatbot Channel */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group">
              <MessageSquare size={120} className="absolute -right-8 -bottom-8 text-gray-50 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative z-10">
                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Chat Support
                </span>
                
                <h3 className="text-xl font-black text-[#1C1C1C] mt-3">Smart Culinary AI</h3>
                <p className="text-[#686B78] text-xs mt-1 leading-relaxed">
                  Get instant nutrition information, allergy warnings, food recommendations, and answers to culinary queries.
                </p>

                <button 
                  onClick={handleOpenChat}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black text-xs transition-transform flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} /> Open AI Chatbot
                </button>
              </div>
            </div>

            {/* Offline Fallback Support info */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Info size={14} className="text-orange-500" /> Corporate Desk
              </h4>
              <div className="mt-4 space-y-3 text-xs font-bold text-text-secondary">
                <p><strong>Primary Agent:</strong> +91 9369420619</p>
                <p><strong>Email Address:</strong> support@foodiq.ai</p>
              </div>
            </div>

          </div>

          {/* ── Right Side: Dispute Form & Tickets ── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Raise Dispute Ticket Form */}
            <form onSubmit={handleSubmitTicket} className="bg-white border border-gray-100 shadow-sm rounded-[2.5rem] p-6 md:p-8 space-y-5">
              <h3 className="text-xl font-black text-[#1C1C1C] flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" /> Raise Order Dispute
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Order ID</label>
                  <select
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3.5 text-xs font-black outline-none transition-all"
                  >
                    <option value="ORD-8812">ORD-8812 (₹240 - Pizza Paradise)</option>
                    <option value="ORD-8811">ORD-8811 (₹180 - Burger King)</option>
                    <option value="ORD-8810">ORD-8810 (₹480 - Biriyani Box)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Complaint Type</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3.5 text-xs font-black outline-none transition-all"
                  >
                    <option value="Missing Items">Missing Items</option>
                    <option value="Late Delivery">Late Delivery / Cold Food</option>
                    <option value="Wrong Dish Served">Wrong Dish Served</option>
                    <option value="Hygiene Concern">Hygiene Concern</option>
                    <option value="Payment / Double Charged">Payment / Double Charged</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Please describe exactly what was incorrect or missing in your order..."
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-4 text-xs font-bold outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-450 font-bold max-w-sm">
                  Raising fraudulent claims will lead to coupon restriction on your FoodIQ profile.
                </p>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto rounded-xl font-black text-xs uppercase px-8 py-3.5 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Dispute'} <Send size={12} />
                </Button>
              </div>
            </form>

            {/* Active Tickets List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#686B78] flex items-center gap-1.5">
                <Ticket size={14} className="text-primary" /> Active Support Tickets
              </h3>

              {loadingTickets ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={24} className="text-gray-300 animate-spin" />
                  <p className="text-xs font-bold text-gray-400">Fetching tickets...</p>
                </div>
              ) : activeTickets.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {activeTickets.map((ticket) => (
                    <motion.div 
                      layout
                      key={ticket.id} 
                      className="bg-white border border-gray-150/70 rounded-3xl p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-primary">#{ticket.id}</span>
                          <span className="text-[10px] text-gray-400 font-bold">• Order ID: {ticket.orderId}</span>
                        </div>
                        <Badge variant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'success' : 'warning'} className="text-[8px] uppercase font-black py-0.5 px-2">
                          {ticket.status}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-gray-450 uppercase tracking-wide">Issue Logged:</p>
                        <p className="text-xs text-[#1C1C1C] font-semibold bg-gray-50 p-4 rounded-2xl border border-gray-100/50 leading-relaxed">
                          {ticket.issue}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-[9px] text-gray-400 font-bold">
                        <span>Opened on {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>Assigned: FoodIQ Support Agent</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3">
                  <CheckCircle2 size={36} className="text-emerald-500" />
                  <p className="text-sm font-black text-[#1C1C1C]">All clear! No active dispute tickets.</p>
                  <p className="text-xs text-gray-400 font-bold max-w-xs leading-normal">
                    If you experience any issues with current or recent orders, raise a dispute above.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Support;
