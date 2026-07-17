import { useState } from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Badge from '../common/Badge';

const HelpSupportTab = () => {
  const [orderId, setOrderId] = useState('ORD-8812');
  const [complaintType, setComplaintType] = useState('Missing Items');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTickets, setActiveTickets] = useState([
    { id: 'TKT-9041', orderId: 'ORD-8790', type: 'Late Delivery', status: 'REFUND_APPROVED', date: '15 Jul 2026', msg: 'Late delivery by 25 mins due to rain. 50 coins refund credited.' },
    { id: 'TKT-9022', orderId: 'ORD-8772', type: 'Wrong Dish Served', status: 'RESOLVED', date: '10 Jul 2026', msg: 'Replacement item was hand-delivered. Closed.' }
  ]);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newTicket = {
        id: `TKT-${Math.floor(Math.random() * 9000) + 1000}`,
        orderId,
        type: complaintType,
        status: 'UNDER_REVIEW',
        date: '17 Jul 2026',
        msg: 'Our support team is verifying the cook logs with the restaurant. Refund request initiated.'
      };
      setActiveTickets([newTicket, ...activeTickets]);
      setDescription('');
      toast.success('Dispute ticket raised! Review will complete in 10 minutes.', { icon: '🛡️' });
    }, 1000);
  };

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C] space-y-8">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
          <HelpCircle size={24} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black">Help & Dispute Resolution</h3>
          <p className="text-xs text-[#686B78] font-bold">Report order defects, missing food, driver complaints, and review refund claims</p>
        </div>
      </div>

      {/* ── Active Ticket History ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78]">Open Dispute Tickets</h4>
        
        <div className="grid grid-cols-1 gap-4">
          {activeTickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-primary">#{ticket.id}</span>
                  <span className="text-[10px] text-gray-400 font-bold">• Order {ticket.orderId}</span>
                </div>
                <Badge variant={ticket.status === 'REFUND_APPROVED' ? 'success' : ticket.status === 'RESOLVED' ? 'info' : 'warning'} className="text-[8px] uppercase font-black py-0.5 px-2">
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <h5 className="font-bold text-xs text-[#686B78] uppercase tracking-wide">Category: {ticket.type}</h5>
                <p className="text-xs text-[#1C1C1C] font-semibold mt-1 bg-white p-3 rounded-xl border border-gray-200/50">
                  {ticket.msg}
                </p>
              </div>

              <p className="text-[9px] text-gray-400 font-bold">Logged on {ticket.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Raise Dispute Form ── */}
      <form onSubmit={handleSubmitTicket} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8 space-y-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78] flex items-center gap-1">
          <AlertTriangle size={14} className="text-rose-500" /> Raise Dispute Ticket
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-450 uppercase tracking-widest">Select Order ID</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-black outline-none"
            >
              <option value="ORD-8812">ORD-8812 (₹240 - Pizza Paradise)</option>
              <option value="ORD-8811">ORD-8811 (₹180 - Burger King)</option>
              <option value="ORD-8810">ORD-8810 (₹480 - Biriyani Box)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-450 uppercase tracking-widest">Complaint Type</label>
            <select
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-black outline-none"
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
          <label className="text-xs font-black text-gray-455 uppercase tracking-widest">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Please detail precisely what was missing or incorrect..."
            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl p-3 text-xs font-bold outline-none" 
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 border-t border-gray-100">
          <p className="text-[9px] text-gray-400 font-bold max-w-sm">
            Please note that raising fake dispute claims may restrict coupon allocation on your customer profile.
          </p>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto rounded-2xl font-black text-xs uppercase px-8 py-3.5 flex items-center justify-center gap-1.5"
          >
            Submit Dispute
          </Button>
        </div>
      </form>

    </div>
  );
};

export default HelpSupportTab;
