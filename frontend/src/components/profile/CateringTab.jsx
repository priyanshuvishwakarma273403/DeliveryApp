import { useState } from 'react';
import { ClipboardList, Users, ShieldCheck, Mail, ArrowRight, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Badge from '../common/Badge';

const CateringTab = () => {
  const [guests, setGuests] = useState(80);
  const [eventType, setEventType] = useState('Corporate Event');
  const [cateringBudget, setCateringBudget] = useState(30000);
  const [menuStyle, setMenuStyle] = useState('North Indian & Continental');
  const [isInquiring, setIsInquiring] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState(null);

  const [activeQuotes, setActiveQuotes] = useState([
    { id: 'CAT-1092', type: 'Office Party', guests: 45, status: 'QUOTATION_ISSUED', price: 18500, date: '12 Jul 2026' },
    { id: 'CAT-1088', type: 'House Birthday', guests: 30, status: 'CONFIRMED', price: 12000, date: '04 Jul 2026' }
  ]);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setIsInquiring(true);
    setTimeout(() => {
      setIsInquiring(false);
      const newQuote = {
        id: `CAT-${Math.floor(Math.random() * 9000) + 1000}`,
        type: eventType,
        guests,
        status: 'SUBMITTED',
        price: cateringBudget,
        date: '17 Jul 2026'
      };
      setActiveQuotes([newQuote, ...activeQuotes]);
      toast.success('Catering inquiry submitted! Our manager will call back in 1 hour.', { icon: '📞' });
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C] space-y-8">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
          <ClipboardList size={24} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black">Catering & Bulk Orders</h3>
          <p className="text-xs text-[#686B78] font-bold">Request custom event quotations, live chef counters, and bulk corporate deliveries</p>
        </div>
      </div>

      {/* ── Active Inquiries ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78]">My Catering Requests</h4>
        
        <div className="grid grid-cols-1 gap-3">
          {activeQuotes.map((quote) => (
            <div key={quote.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-black text-primary">#{quote.id}</span>
                  <Badge variant={quote.status === 'CONFIRMED' ? 'success' : quote.status === 'QUOTATION_ISSUED' ? 'warning' : 'info'} className="text-[8px] uppercase font-black py-0.5 px-2">
                    {quote.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h5 className="font-bold text-sm text-[#1C1C1C]">{quote.type} ({quote.guests} guests)</h5>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Submitted on {quote.date} • Style: {menuStyle}</p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between border-t sm:border-t-0 border-gray-200/60 pt-3 sm:pt-0">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Estimated Quote</p>
                  <p className="font-black text-sm text-[#1C1C1C]">₹{quote.price}</p>
                </div>
                {quote.status === 'QUOTATION_ISSUED' && (
                  <button 
                    onClick={() => {
                      toast.success('Catering quotation approved! Payment link sent.');
                      setActiveQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'CONFIRMED' } : q));
                    }}
                    className="bg-[#1C1C1C] hover:bg-black text-white font-black text-xs uppercase px-4 py-2 rounded-xl"
                  >
                    Accept Quote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form Config ── */}
      <form onSubmit={handleInquirySubmit} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78]">New Event Inquiry</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-405 uppercase tracking-widest">Occasion / Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-black outline-none"
            >
              <option value="Corporate Lunch">Corporate Lunch</option>
              <option value="Wedding catering">Wedding catering</option>
              <option value="Birthday Gathering">Birthday Gathering</option>
              <option value="Housewarming party">Housewarming party</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-405 uppercase tracking-widest">Menu Theme Style</label>
            <input 
              type="text" 
              value={menuStyle}
              onChange={(e) => setMenuStyle(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-bold outline-none" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-405 uppercase tracking-widest">Approx Guest Count</label>
            <input 
              type="number" 
              min="20" 
              max="1000"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-black outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-405 uppercase tracking-widest">Estimated Budget (₹)</label>
            <input 
              type="number" 
              min="5000" 
              max="500000"
              value={cateringBudget}
              onChange={(e) => setCateringBudget(Number(e.target.value))}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-black outline-none" 
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-sm">
            All catering packages include professional delivery set-ups, premium food warmers, plates/spoons, and dedicated servers.
          </p>
          <Button 
            type="submit"
            disabled={isInquiring}
            className="w-full md:w-auto rounded-2xl font-black text-xs uppercase px-8 py-3.5 flex items-center justify-center gap-1.5"
          >
            {isInquiring ? 'Sending Request...' : 'Request AI Quotation'}
          </Button>
        </div>
      </form>

    </div>
  );
};

export default CateringTab;
