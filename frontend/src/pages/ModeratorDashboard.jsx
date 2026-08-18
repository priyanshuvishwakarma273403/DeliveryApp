import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Trash2, Search, Sliders, 
  Terminal, Eye, Network, ImageIcon, Compass, CloudRain, Building, 
  XCircle, UserMinus, ShieldAlert, Sparkles, RefreshCw, Lock
} from 'lucide-react';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const FLAGGED_REVIEWS = [
  { id: 'REV-901', customer: 'Rohan Deshmukh', rating: 1, comment: 'This restaurant is a scam! The paneer was completely stale. Don\'t buy from here, they steal money!', flags: 'Slander/Defamation', status: 'FLAGGED' },
  { id: 'REV-902', customer: 'Simran Singh', rating: 5, comment: 'Great discount coupons available on my profile, check out link: bit.ly/spam-deals', flags: 'Spam/Promo links', status: 'FLAGGED' }
];

const FLAGGED_IMAGES = [
  { id: 'IMG-301', dishName: 'Truffle Garlic Bread', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', reason: 'Potential Duplicate Image', confidence: '92% confident' },
  { id: 'IMG-302', dishName: 'Classic Pepperoni Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300', reason: 'Blur / Out of Focus', confidence: '84% confident' }
];

const FLAGGED_USERS = [
  { id: 'USR-801', name: 'Kabir Kapoor', email: 'kabir@spam.com', flags: 4, reason: 'Frequent refunds triggered (3 in last 24 hrs)', status: 'ACTIVE' },
  { id: 'USR-802', name: 'Nisha Sen', email: 'nisha@fraud.com', flags: 2, reason: 'Multiple credit card mismatch in single session', status: 'ACTIVE' }
];

const ModeratorDashboard = () => {
  const [reviews, setReviews] = useState(FLAGGED_REVIEWS);
  const [images, setImages] = useState(FLAGGED_IMAGES);
  const [users, setUsers] = useState(FLAGGED_USERS);
  const [activeTab, setActiveTab] = useState('reviews');

  const handleReviewAction = (revId, action) => {
    setReviews(reviews.filter(r => r.id !== revId));
    if (action === 'APPROVE') {
      toast.success('Review approved & reinstated in public feeds.');
    } else {
      toast.success('Review deleted & audit trail logged.');
    }
  };

  const handleImageAction = (imgId, action) => {
    setImages(images.filter(img => img.id !== imgId));
    if (action === 'APPROVE') {
      toast.success('Dish image marked verified.');
    } else {
      toast.error('Dish image rejected & merchant notified.');
    }
  };

  const handleUserAction = (userId, action) => {
    if (action === 'BAN') {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'BANNED' } : u));
      toast.error('User deactivated & credentials frozen.');
    } else {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Fraud flags cleared for user.');
    }
  };

  const overrideMerchantStatus = () => {
    toast.success('Emergency toggle executed. Noida Sector 18 delivery pipeline suspended.');
  };

  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-72 bg-[#0E1325] text-white p-6 shrink-0 flex flex-col justify-between border-r border-[#1B2342]">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-rose-600 rounded-xl flex items-center justify-center font-black shadow-lg text-white">
              MD
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">FoodIQ Moderator</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Compliance & Safety</p>
            </div>
          </div>

          <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-rose-500 font-black uppercase">
              <span>Security Level</span>
              <ShieldAlert size={14} className="animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white">L3 Compliance Officer</p>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'reviews', label: 'Flagged Reviews', icon: ShieldCheck, badge: reviews.length },
              { id: 'images', label: 'Dish Image Audits', icon: ImageIcon, badge: images.length },
              { id: 'users', label: 'Fraud Detection', icon: UserMinus, badge: users.filter(u => u.status === 'ACTIVE').length },
              { id: 'outlets', label: 'Merchant Controls', icon: Building }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === item.id 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white font-black text-[9px] h-5 px-1.5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Moderator Shell v2.0</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1B2342]">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-500" /> Compliance Cockpit & Auditing
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Authorized: Safety Desk Node 02 • Global Platform Moderation</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => toast.success('Compliance indices rebuilt successfully.')}
              className="bg-[#0E1325] px-3.5 py-2 border border-[#1B2342] rounded-xl hover:bg-[#1B2342] text-xs font-black text-slate-300 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw size={14} /> Rebuild Registry
            </button>
          </div>
        </header>

        {/* Tab contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Flagged Reviews */}
            {activeTab === 'reviews' && (
              <div className="bg-[#0E1325] p-6 rounded-3xl border border-[#1B2342] space-y-6 shadow-xl">
                <h3 className="text-sm font-black uppercase text-white">Reported Review Submissions</h3>
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-[#090D1A] border border-[#1B2342] rounded-2xl space-y-3 font-bold text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-black text-white">{rev.customer}</span>
                          <span className="text-yellow-500 ml-2">★ {rev.rating}</span>
                        </div>
                        <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                          Flag: {rev.flags}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-semibold italic">"{rev.comment}"</p>
                      
                      <div className="pt-2 flex gap-2 justify-end border-t border-[#1B2342]">
                        <button onClick={() => handleReviewAction(rev.id, 'APPROVE')} className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg">Keep Public</button>
                        <button onClick={() => handleReviewAction(rev.id, 'DELETE')} className="py-1.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-lg">Purge & Delete</button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-slate-500 text-xs font-bold text-center py-6">All reported reviews have been audited.</p>
                  )}
                </div>
              </div>
            )}

            {/* AI Image Audits */}
            {activeTab === 'images' && (
              <div className="bg-[#0E1325] p-6 rounded-3xl border border-[#1B2342] space-y-6 shadow-xl">
                <h3 className="text-sm font-black uppercase text-white font-sans">AI Flagged Merchant Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {images.map((img) => (
                    <div key={img.id} className="p-4 bg-[#090D1A] border border-[#1B2342] rounded-2xl flex gap-4 font-bold text-xs">
                      <img src={img.url} alt={img.dishName} className="h-20 w-20 rounded-xl object-cover border border-[#1B2342]" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-white font-black">{img.dishName}</h4>
                          <p className="text-[10px] text-rose-400 font-bold uppercase">{img.reason} • ({img.confidence})</p>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button onClick={() => handleImageAction(img.id, 'APPROVE')} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg">Approve</button>
                          <button onClick={() => handleImageAction(img.id, 'DELETE')} className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-550 text-white font-black text-[10px] rounded-lg">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <p className="col-span-2 text-slate-500 text-xs font-bold text-center py-6">Image audit queue clear.</p>
                  )}
                </div>
              </div>
            )}

            {/* Fraud Detection / Suspicious Accounts */}
            {activeTab === 'users' && (
              <div className="bg-[#0E1325] p-6 rounded-3xl border border-[#1B2342] space-y-6 shadow-xl">
                <h3 className="text-sm font-black uppercase text-white">Suspicious Account Directory</h3>
                <div className="divide-y divide-[#1B2342]">
                  {users.map((u) => (
                    <div key={u.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 font-bold text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-black">{u.name}</p>
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 rounded font-black">{u.flags} Flags</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{u.email} • {u.reason}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                          u.status === 'BANNED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>{u.status}</span>
                        {u.status === 'ACTIVE' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUserAction(u.id, 'BAN')} className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase">Deactivate</button>
                            <button onClick={() => handleUserAction(u.id, 'CLEAR')} className="py-1 px-3 bg-[#090D1A] border border-[#1B2342] text-slate-400 hover:text-white rounded-lg text-[9px] font-black uppercase">Dismiss</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merchant Controls */}
            {activeTab === 'outlets' && (
              <div className="bg-[#0E1325] p-6 rounded-3xl border border-[#1B2342] space-y-6 shadow-xl max-w-xl">
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-1.5">
                  <Building size={16} className="text-rose-500" /> Platform Outlet Overrides
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  Execute instant safety blocks on merchant branches reporting suspicious activity or unhygienic conditions. This bypasses restaurant owner settings.
                </p>
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <div>
                      <p className="text-white font-black">Noida Sector 18 Outlet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Reported: 3 customers complaining about food sickness</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black text-[9px]">ONLINE</span>
                  </div>
                  <button 
                    onClick={overrideMerchantStatus}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-550 text-white font-black text-[10px] rounded-lg uppercase tracking-wider"
                  >
                    Suspend Outlet Operations
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ModeratorDashboard;
