import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, MessageSquare, Search, Send, Phone, Clipboard, AlertCircle, 
  HelpCircle, Trash2, CheckCircle2, User, RefreshCw, XCircle, Info, Ticket, 
  DollarSign, Sparkles
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import { playNotificationTick, playSuccessChime, playAlertBleep } from '../utils/audioSynth';
import { sendAiMessage } from '../services/aiService'; 

const MOCK_TICKETS = [
  { id: 'TKT-101', customer: 'Siddharth Roy', phone: '+91 9988776655', issue: 'Cold food delivered', orderId: 'OD-9921', priority: 'HIGH', status: 'ACTIVE', chat: [
    { sender: 'customer', text: 'Hi, I received my order OD-9921 just now but the food is completely cold. The burger bun is also soggy.' },
    { sender: 'system', text: 'Support agent joined the session.' }
  ]},
  { id: 'TKT-102', customer: 'Preeti Deshmukh', phone: '+91 8877665544', issue: 'Refund status inquiry', orderId: 'OD-9918', priority: 'MEDIUM', status: 'ACTIVE', chat: [
    { sender: 'customer', text: 'I cancelled my order OD-9918 yesterday but the money has not been refunded to my UPI account yet.' }
  ]},
  { id: 'TKT-103', customer: 'Kunal Kapoor', phone: '+91 7766554433', issue: 'Rider took wrong route', orderId: 'OD-9925', priority: 'LOW', status: 'ACTIVE', chat: [
    { sender: 'customer', text: 'My delivery driver is going in the completely opposite direction. Can you please call them?' }
  ]}
];

const SupportExecutiveDashboard = () => {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState('TKT-101');
  const [chatInput, setChatInput] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [orderLookupResult, setOrderLookupResult] = useState(null);

  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId);
  }, [tickets, selectedTicketId]);

  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  const handleSendChat = () => {
    if (!chatInput.trim() || !selectedTicket) return;
    const updated = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          chat: [...t.chat, { sender: 'agent', text: chatInput }]
        };
      }
      return t;
    });
    setTickets(updated);
    setChatInput('');
    playNotificationTick();
    toast.success('Reply dispatched to customer app!');
  };

  const handleAiDraft = async () => {
    if (!selectedTicket) return;
    setAiDraftLoading(true);
    playNotificationTick();
    
    const lastCustomerMsg = selectedTicket.chat.filter(c => c.sender === 'customer').pop()?.text || selectedTicket.issue;
    const prompt = `Customer says: "${lastCustomerMsg}". Ticket issue: "${selectedTicket.issue}". Order ID: "${selectedTicket.orderId}". Provide a brief, polite, empathetic support resolution draft in 2 sentences. Don't include formatting or placeholders.`;
    
    try {
      const response = await sendAiMessage(prompt, "Customer Support Desk");
      const cleaned = response.replace(/^"|"$/g, '').trim();
      setChatInput(cleaned);
      playSuccessChime();
      toast.success("AI draft populated!");
    } catch (err) {
      playAlertBleep();
      toast.error("Failed to generate AI reply draft.");
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleOrderLookup = () => {
    if (!searchOrder.trim()) return;
    playNotificationTick();
    if (searchOrder.includes('9921')) {
      setOrderLookupResult({
        id: 'OD-9921',
        customer: 'Siddharth Roy',
        restaurant: 'Tuscany Grill - South Ext',
        items: '1x Gourmet Truffle Burger, 1x Truffle Fries',
        total: 540,
        status: 'DELIVERED',
        time: '15:10 PM'
      });
    } else {
      setOrderLookupResult({
        id: searchOrder.toUpperCase(),
        customer: 'Walk-in Customer',
        restaurant: 'Sector 18 Noida Branch',
        items: '2x Margherita Pizza',
        total: 598,
        status: 'DISPATCHED',
        time: '15:35 PM'
      });
    }
    toast.success('Order journals retrieved successfully!');
  };

  const triggerRefund = (orderId) => {
    playSuccessChime();
    toast.success(`IMPS Refund initiated for order ${orderId}. Reference ID: RFD-${Math.floor(100000 + Math.random() * 899999)}`, { icon: '💰', duration: 4000 });
  };

  const cancelOrder = (orderId) => {
    playAlertBleep();
    toast.success(`Order ${orderId} has been manually cancelled. Notifying kitchen & rider.`);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">FoodIQ Support Center</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Executive Helpdesk Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1.5 border border-emerald-100 rounded-xl">
            Shift Active: Desk 04
          </span>
        </div>
      </header>

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Ticket Queue */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 p-6 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">Incoming Helpdesk Tickets</h2>
          <div className="space-y-3.5">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all space-y-3 ${
                  selectedTicketId === t.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-150 bg-gray-50/50 hover:bg-gray-100/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-slate-900">{t.id}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                    t.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-200' :
                    t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>{t.priority}</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 truncate">{t.customer}</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{t.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Live Chat Terminal */}
        <div className="flex-1 bg-gray-50 p-6 flex flex-col justify-between overflow-y-auto border-r border-gray-200">
          {selectedTicket ? (
            <div className="flex flex-col h-full justify-between gap-6">
              {/* Chat Header */}
              <div className="bg-white border p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{selectedTicket.customer} ({selectedTicket.phone})</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Reference Ticket: {selectedTicket.id} • Order: {selectedTicket.orderId}</p>
                </div>
                <button 
                  onClick={() => toast.success(`Call routed to customer: ${selectedTicket.phone}`)}
                  className="bg-slate-900 text-white p-2 hover:bg-slate-800 rounded-xl text-xs font-black flex items-center gap-1"
                >
                  <Phone size={12} /> Call Customer
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {selectedTicket.chat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl text-xs font-bold max-w-[80%] leading-relaxed ${
                      msg.sender === 'agent' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : msg.sender === 'system'
                        ? 'bg-gray-200 text-slate-600 text-[10px] text-center w-full rounded-lg'
                        : 'bg-white border rounded-tl-none text-slate-800 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Inputs */}
              <div className="flex gap-2">
                <button 
                  onClick={handleAiDraft}
                  disabled={aiDraftLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                  title="Generate AI reply draft"
                >
                  <Sparkles size={14} className={aiDraftLoading ? "animate-spin" : ""} />
                  {aiDraftLoading ? "Drafting..." : "AI Draft"}
                </button>
                <input 
                  type="text" 
                  placeholder="Type professional reply..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
                <button 
                  onClick={handleSendChat}
                  className="bg-[#FC8019] text-white p-3 hover:bg-orange-600 rounded-2xl font-black shadow-lg shadow-orange-100 flex items-center justify-center shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 font-bold text-xs">
              <MessageSquare size={36} className="mb-2 text-gray-300" />
              <p>Select a ticket to begin supporting customers.</p>
            </div>
          )}
        </div>

        {/* Right Side: Order Lookup & Actions */}
        <div className="w-full lg:w-80 bg-white p-6 space-y-6 overflow-y-auto">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Ticket size={14} className="text-primary" /> Core Actions Center
          </h2>

          {/* Search order */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase block">Retrieve Order Details</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Order ID, e.g. OD-9921"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleOrderLookup} className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black">Find</button>
            </div>
          </div>

          {/* Order Details result */}
          {orderLookupResult && (
            <div className="bg-slate-50 border p-4 rounded-2xl space-y-3 font-bold text-xs shadow-sm">
              <div className="flex justify-between items-center text-slate-900">
                <span className="font-black">{orderLookupResult.id}</span>
                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 rounded">{orderLookupResult.status}</span>
              </div>
              <div className="text-[10px] text-gray-500 space-y-1">
                <p><span className="font-black text-slate-600">Customer:</span> {orderLookupResult.customer}</p>
                <p><span className="font-black text-slate-600">Merchant:</span> {orderLookupResult.restaurant}</p>
                <p><span className="font-black text-slate-600">Dishes:</span> {orderLookupResult.items}</p>
                <p><span className="font-black text-slate-600">Paid:</span> ₹{orderLookupResult.total}</p>
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-2">
                <button 
                  onClick={() => triggerRefund(orderLookupResult.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg uppercase tracking-wider"
                >
                  Issue Instant Refund
                </button>
                <button 
                  onClick={() => cancelOrder(orderLookupResult.id)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-lg uppercase tracking-wider"
                >
                  Manually Cancel Order
                </button>
              </div>
            </div>
          )}

          {/* Goodwill Coupon generator */}
          <div className="pt-4 border-t border-gray-150 space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase block">Issue Compensatory Voucher</label>
            <button 
              onClick={() => toast.success('Compensation Coupon generated: COLD50. Sent via SMS & Push notification!')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-black text-[10px] rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} className="text-[#FC8019]" /> Generate ₹50 Goodwill Coupon
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportExecutiveDashboard;
