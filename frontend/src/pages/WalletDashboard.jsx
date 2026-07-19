import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Gift, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Ticket, 
  Crown, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';
import { useAuthStore } from '../store/authStore';

const WalletDashboard = () => {
  const { user, setUser } = useAuthStore();
  const [balance, setBalance] = useState(0.0);
  const [isGold, setIsGold] = useState(false);
  const [history, setHistory] = useState([
    { id: '1', amount: 50.0, type: 'CREDIT', source: 'CASHBACK', description: 'Welcome Bonus credited!', timestamp: '2026-07-19T08:00:00' }
  ]);
  const [loading, setLoading] = useState(false);

  // Gift Card State
  const [giftCardAmount, setGiftCardAmount] = useState('');
  const [purchasedCardCode, setPurchasedCardCode] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [purchasingCard, setPurchasingCard] = useState(false);
  const [redeemingCard, setRedeemingCard] = useState(false);

  // Subscription State
  const [subscribing, setSubscribing] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/wallets/user/${user?.id}`);
      if (res.data?.success) {
        setBalance(res.data.data.balance || 0.0);
        setIsGold(res.data.data.goldMember || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      const res = await apiClient.get('/wallet-transactions', {
        params: { userId: user?.id }
      }); // simulated ledger backend check or local state fallback
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (e) {
      // Keep static initial ledger if API is not fully wireable
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWallet();
      fetchLedgers();
    }
  }, [user]);

  const handlePurchaseGiftCard = async (e) => {
    e.preventDefault();
    if (!giftCardAmount || parseFloat(giftCardAmount) <= 0) {
      toast.error('Please enter a valid gift card amount');
      return;
    }
    setPurchasingCard(true);
    try {
      const res = await apiClient.post('/finance/giftcards/purchase', null, {
        params: { purchaserId: user?.id, amount: parseFloat(giftCardAmount) }
      });
      if (res.data?.success) {
        setPurchasedCardCode(res.data.data.code);
        toast.success('Gift Card purchased successfully!');
        fetchWallet();
      }
    } catch (e) {
      toast.error('Failed to purchase Gift Card');
    } finally {
      setPurchasingCard(false);
    }
  };

  const handleRedeemGiftCard = async (e) => {
    e.preventDefault();
    if (!redeemCode) {
      toast.error('Please enter a Gift Card code');
      return;
    }
    setRedeemingCard(true);
    try {
      const res = await apiClient.post('/finance/giftcards/redeem', null, {
        params: { code: redeemCode, receiverId: user?.id }
      });
      if (res.data?.success) {
        toast.success(`Redeemed ₹${res.data.data.initialAmount} successfully! Balance added.`);
        setRedeemCode('');
        fetchWallet();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid or expired Gift Card code');
    } finally {
      setRedeemingCard(false);
    }
  };

  const handleSubscribeGold = async () => {
    setSubscribing(true);
    try {
      const res = await apiClient.post('/finance/subscriptions', null, {
        params: {
          userId: user?.id,
          planType: 'GOLD',
          billingCycle: 'MONTHLY',
          price: 199.0
        }
      });
      if (res.data?.success) {
        toast.success('Welcome to FoodIQ Gold membership! 🎉');
        setIsGold(true);
        fetchWallet();
      }
    } catch (e) {
      toast.error('Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="w-full min-h-[90vh] bg-gray-50 dark:bg-[#0B0F19] text-[#1C1C1C] dark:text-white pb-16 pt-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Coins className="text-yellow-500" /> Digital Wallet & Rewards
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage FoodIQ coins, purchase gift cards, track cashback, and unlock Gold perks.</p>
          </div>
          <button
            onClick={() => { fetchWallet(); fetchLedgers(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-bold text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Wallet
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Wallet Status */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Coins size={140} />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-black uppercase opacity-80 tracking-wider">FoodIQ Coin Balance</p>
                  <h2 className="text-4xl font-black mt-1">₹{balance.toFixed(2)}</h2>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Active Wallet
                </span>
              </div>
              <div className="pt-4 border-t border-white/20 flex justify-between text-xs font-bold opacity-90">
                <span>1 Coin = ₹1.00</span>
                <span>Idempotent Secure Ledger</span>
              </div>
            </div>

            {/* Gold Membership Status Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${isGold ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-150 dark:bg-gray-800 text-gray-400'}`}>
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">FoodIQ Gold Membership</h3>
                  <p className="text-xs text-gray-400">{isGold ? 'VIP perks activated' : 'Unlock exclusive restaurant benefits'}</p>
                </div>
              </div>

              {isGold ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs leading-relaxed text-amber-700 dark:text-amber-400 font-medium">
                  ✨ Gold status active! Enjoy free delivery on order values above ₹199 and special restaurant cashback multipliers.
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    Get free delivery on every order, direct access to executive support, and standard 5% flat cashback rules on all orders.
                  </p>
                  <button
                    onClick={handleSubscribeGold}
                    disabled={subscribing}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Crown size={14} />
                    {subscribing ? 'Subscribing...' : 'Upgrade for ₹199/Month'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center: Gift Card creation and redemption */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Purchase Gift Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-black mb-4 flex items-center gap-2">
                  <Gift className="text-primary" /> Purchase Gift Card
                </h3>
                <form onSubmit={handlePurchaseGiftCard} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500, 1000, 5000"
                      value={giftCardAmount}
                      onChange={(e) => setGiftCardAmount(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={purchasingCard}
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm"
                  >
                    {purchasingCard ? 'Purchasing...' : 'Generate Gift Voucher'}
                  </button>
                </form>

                <AnimatePresence>
                  {purchasedCardCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl"
                    >
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-wider">Gift Coupon Code</p>
                      <h4 className="text-lg font-mono font-black text-[#1C1C1C] dark:text-white mt-1 select-all">{purchasedCardCode}</h4>
                      <p className="text-[10px] text-gray-450 mt-1">Copy and share this code with anyone to redeem instantly!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Redeem Gift Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-black mb-4 flex items-center gap-2">
                  <Ticket className="text-primary" /> Redeem Voucher / Credits
                </h3>
                <form onSubmit={handleRedeemGiftCard} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Voucher Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. FIQ-XXXXXX"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={redeemingCard}
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm"
                  >
                    {redeemingCard ? 'Validating...' : 'Claim Voucher Balance'}
                  </button>
                </form>
              </div>

            </div>

            {/* Wallet Ledger History list */}
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4">Wallet Transactions Ledger</h3>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-gray-50 dark:bg-gray-850/30 border border-gray-150 dark:border-gray-850 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${item.type === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.type === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C1C1C] dark:text-gray-200">{item.description}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(item.timestamp).toLocaleString()} | Source: {item.source}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${item.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.type === 'CREDIT' ? '+' : '-'}₹{item.amount.toFixed(2)}
                    </span>
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

export default WalletDashboard;
