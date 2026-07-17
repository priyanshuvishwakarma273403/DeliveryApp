import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Gift, RefreshCw, Send, ArrowUpRight, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

const WalletTab = () => {
  const [cashBalance, setCashBalance] = useState(450);
  const [refundBalance, setRefundBalance] = useState(120);
  const [giftBalance, setGiftBalance] = useState(250);
  const [couponCode, setCouponCode] = useState('');
  
  // Cashback progress
  const ordersCount = 3; 

  const handleRedeemGift = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    toast.success('Gift card worth ₹500 credited to your wallet!', { icon: '🎁' });
    setGiftBalance(prev => prev + 500);
    setCouponCode('');
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText('https://foodiq.io/ref/IQ-8831');
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <div className="p-6 md:p-10 text-[#1C1C1C] space-y-8">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <div className="h-12 w-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
          <Coins size={24} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black">My Wallet & Cashback</h3>
          <p className="text-xs text-[#686B78] font-bold">Manage cashbacks, gift vouchers, and referral program rewards</p>
        </div>
      </div>

      {/* ── Balances Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#F8F9FB] border border-gray-100 relative overflow-hidden">
          <Coins className="absolute -right-4 -bottom-4 text-gray-200/50" size={64} />
          <p className="text-[10px] font-black text-[#686B78] uppercase tracking-widest">Main Cashback Balance</p>
          <p className="text-3xl font-black text-primary mt-2">₹{cashBalance}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[#F8F9FB] border border-gray-100 relative overflow-hidden">
          <RefreshCw className="absolute -right-4 -bottom-4 text-gray-200/50" size={64} />
          <p className="text-[10px] font-black text-[#686B78] uppercase tracking-widest">Refund Wallet</p>
          <p className="text-3xl font-black text-[#1C1C1C] mt-2">₹{refundBalance}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[#F8F9FB] border border-gray-100 relative overflow-hidden">
          <Gift className="absolute -right-4 -bottom-4 text-gray-200/50" size={64} />
          <p className="text-[10px] font-black text-[#686B78] uppercase tracking-widest">Gift Credits</p>
          <p className="text-3xl font-black text-green-600 mt-2">₹{giftBalance}</p>
        </div>
      </div>

      {/* ── Cashback Engine Milestone ── */}
      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
            <Award size={14} /> Cashback Streak Progress
          </h4>
          <span className="text-xs font-black text-orange-800">{ordersCount}/5 Orders</span>
        </div>
        <div className="h-3 bg-orange-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary" style={{ width: `${(ordersCount/5)*100}%` }} />
        </div>
        <p className="text-[10px] text-orange-700 font-bold">Complete 2 more orders to unlock your milestone ₹100 cashback bonus!</p>
      </div>

      {/* ── Referral & Redeem Form ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        
        {/* Referral Card */}
        <div className="border border-gray-100 rounded-3xl p-6 space-y-4 bg-white shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78]">Invite & Earn Rewards</h4>
          <p className="text-xs text-[#686B78] font-medium leading-relaxed">
            Share your custom referral link. Get ₹100 credits directly in your Gift balance when they complete their first order.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value="https://foodiq.io/ref/IQ-8831" 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 outline-none" 
            />
            <button 
              onClick={handleCopyReferral}
              className="bg-primary hover:bg-red-600 text-white font-black text-xs uppercase px-4 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Send size={12} /> Share
            </button>
          </div>
        </div>

        {/* Redeem Card */}
        <form onSubmit={handleRedeemGift} className="border border-gray-100 rounded-3xl p-6 space-y-4 bg-white shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#686B78]">Redeem Voucher Code</h4>
          <p className="text-xs text-[#686B78] font-medium leading-relaxed">
            Enter a promotion code or gift coupon code to credit your wallet instantly.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. GIFT500" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#1C1C1C] outline-none focus:border-primary/20" 
            />
            <button 
              type="submit"
              className="bg-[#1C1C1C] hover:bg-black text-white font-black text-xs uppercase px-5 py-2 rounded-xl flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight size={12} /> Claim
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};

export default WalletTab;
