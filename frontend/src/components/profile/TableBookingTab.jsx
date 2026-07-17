import { useState } from 'react';
import { Calendar, Users, Clock, CheckCircle2, Ticket, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';

const TableBookingTab = () => {
  const [guests, setGuests] = useState(4);
  const [date, setDate] = useState('2026-07-18');
  const [timeSlot, setTimeSlot] = useState('08:00 PM');
  const [restaurantName, setRestaurantName] = useState('Pizza Paradise');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  const handleBookTable = (e) => {
    e.preventDefault();
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setBookingConfirmed({
        id: 'TKT-8841',
        restaurantName,
        guests,
        date,
        timeSlot,
        tableNum: 'Table #14 (Window Side)'
      });
      toast.success('Table booking confirmed successfully!');
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C] space-y-8">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
          <Calendar size={24} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black">Live Table Booking</h3>
          <p className="text-xs text-[#686B78] font-bold">Reserve diner tables, manage waitlist queues, and QR check-in</p>
        </div>
      </div>

      {bookingConfirmed ? (
        <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[2.5rem] p-6 text-center space-y-6 shadow-sm">
          <div className="h-12 w-12 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-indigo-900">Reservation Confirmed</h4>
            <p className="text-xs text-indigo-700 font-bold mt-1">Show QR code at desk for priority VIP boarding</p>
          </div>

          {/* Ticket layout */}
          <div className="bg-white border border-indigo-100/55 rounded-2xl p-4 space-y-3 text-left relative overflow-hidden">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-[#1C1C1C]">{bookingConfirmed.restaurantName}</span>
              <span className="font-bold text-gray-400">ID: {bookingConfirmed.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-50 pt-3">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Guests</p>
                <p className="font-black mt-0.5">{bookingConfirmed.guests} Pax</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Date</p>
                <p className="font-black mt-0.5">{bookingConfirmed.date}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Time</p>
                <p className="font-black mt-0.5">{bookingConfirmed.timeSlot}</p>
              </div>
            </div>
            <p className="text-[10px] text-indigo-600 font-black mt-2 uppercase tracking-wide bg-indigo-50/50 px-2 py-1 rounded">
              Allocated: {bookingConfirmed.tableNum}
            </p>
          </div>

          {/* Mock QR Scan */}
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-3xl border border-indigo-100 w-36 h-36 mx-auto">
            <QrCode size={96} className="text-indigo-900" />
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-2">Check-in Scan</span>
          </div>

          <Button 
            onClick={() => setBookingConfirmed(null)}
            variant="ghost" 
            className="text-xs font-black text-indigo-600 hover:bg-indigo-100/30 w-full"
          >
            Book Another Table
          </Button>
        </div>
      ) : (
        <form onSubmit={handleBookTable} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Form setup (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Restaurant</label>
              <select 
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none"
              >
                <option value="Pizza Paradise">Pizza Paradise</option>
                <option value="Biriyani Box">Biriyani Box</option>
                <option value="Burger King">Burger King</option>
                <option value="Royal Mughal Restaurant">Royal Mughal Restaurant</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Guest Count</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Time Slot</label>
                <select 
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none"
                >
                  <option value="12:30 PM">12:30 PM (Lunch)</option>
                  <option value="02:00 PM">02:00 PM (Lunch)</option>
                  <option value="08:00 PM">08:00 PM (Dinner)</option>
                  <option value="09:30 PM">09:30 PM (Dinner)</option>
                  <option value="11:45 PM">11:45 PM (Midnight)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Reservation Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-sm font-black outline-none" 
              />
            </div>

            <Button 
              type="submit"
              disabled={isBooking}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isBooking ? 'Checking Availability...' : 'Confirm Table Booking'}
            </Button>
          </div>

          {/* Waitlist analytics (5 cols) */}
          <div className="md:col-span-5 bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78] flex items-center gap-1">
              <Clock size={12} className="text-primary" /> Live Crowd Index
            </h4>
            
            <div className="space-y-3.5 text-xs text-[#686B78] font-bold">
              <div className="flex justify-between items-center py-1">
                <span>Occupancy load</span>
                <span className="text-amber-600 font-black">74% Busy</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Average waitlist queue</span>
                <span className="text-[#1C1C1C] font-black">3 tables waiting</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Estimated seating speed</span>
                <span className="text-green-600 font-black">~12 minutes</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-2 border-t border-gray-200/60 pt-3">
              Table booking cancellation policy: Free cancellation up to 30 minutes before booking start. Post that, 50 coins deduction may apply.
            </p>
          </div>

        </form>
      )}

    </div>
  );
};

export default TableBookingTab;
