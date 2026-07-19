import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Settings, 
  Trash2, 
  Bookmark, 
  BookmarkCheck, 
  Archive, 
  Inbox, 
  CheckSquare, 
  Check, 
  Volume2, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Share2, 
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';
import { useAuthStore } from '../store/authStore';

const Notifications = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, PINNED, ARCHIVED
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Preference Settings
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    marketingEnabled: true,
    orderUpdatesEnabled: true,
    paymentAlertsEnabled: true,
    offersEnabled: true,
    securityAlertsEnabled: true,
    newsletterEnabled: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/notifications/inbox`, {
        params: {
          tab: activeTab,
          page: page,
          limit: 10
        }
      });
      if (response.data?.success) {
        setNotifications(response.data.data.content || []);
        setTotalPages(response.data.data.totalPages || 1);
        
        // If viewing unread, trigger header notification badge reset
        if (activeTab === 'ALL' || activeTab === 'UNREAD') {
          window.dispatchEvent(new CustomEvent('notifications-read'));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load preferences
  const fetchPreferences = async () => {
    try {
      const response = await apiClient.get(`/notifications/preferences`);
      if (response.data?.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, page]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Update preferences
  const handleSavePreferences = async (updatedPrefs) => {
    setSavingPrefs(true);
    try {
      const response = await apiClient.put(`/notifications/preferences`, updatedPrefs);
      if (response.data?.success) {
        setPreferences(response.data.data);
        toast.success('Notification preferences updated successfully');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Inbox Action Handlers
  const handleInboxAction = async (id, action) => {
    try {
      const response = await apiClient.put(`/notifications/inbox/${id}/${action}`);
      if (response.data?.success) {
        // Refresh local list
        setNotifications(prev => prev.map(n => {
          if (n.id === id) {
            if (action === 'READ') return { ...n, read: true };
            if (action === 'UNREAD') return { ...n, read: false };
            if (action === 'PIN') return { ...n, pinned: true };
            if (action === 'UNPIN') return { ...n, pinned: false };
            if (action === 'ARCHIVE') return { ...n, archived: true };
            if (action === 'UNARCHIVE') return { ...n, archived: false };
            if (action === 'DELETE') return { ...n, deleted: true };
          }
          return n;
        }).filter(n => {
          if (action === 'DELETE') return false;
          if (activeTab === 'UNREAD' && action === 'READ') return false;
          if (activeTab === 'PINNED' && action === 'UNPIN') return false;
          if (activeTab === 'ARCHIVED' && action === 'UNARCHIVE') return false;
          return true;
        }));
        
        toast.success(`Notification marked as ${action.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error mutating notification status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => apiClient.put(`/notifications/inbox/${n.id}/READ`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notifications-read'));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(query) ||
      n.body?.toLowerCase().includes(query) ||
      n.event?.toLowerCase().includes(query)
    );
  });

  const getPriorityColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return 'border-l-4 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10';
      case 'WARNING':
        return 'border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-950/10';
      case 'ERROR':
      case 'CRITICAL':
      case 'EMERGENCY':
        return 'border-l-4 border-rose-500 bg-rose-50/40 dark:bg-rose-950/10';
      case 'INFORMATION':
      default:
        return 'border-l-4 border-blue-500 bg-blue-50/40 dark:bg-blue-950/10';
    }
  };

  const getIcon = (event) => {
    if (event?.includes('ORDER')) return '🍔';
    if (event?.includes('PAYMENT')) return '💳';
    if (event?.includes('LOGIN') || event?.includes('SECURITY')) return '🔐';
    if (event?.includes('COUPON') || event?.includes('REWARD')) return '🎁';
    if (event?.includes('INVENTORY')) return '⚠️';
    return '🔔';
  };

  return (
    <div className="w-full min-h-[90vh] bg-gray-50 dark:bg-[#0B0F19] text-[#1C1C1C] dark:text-white pb-16 pt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} /> FoodIQ Delivery Core
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Notification Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep track of orders, payment receipts, and security alerts</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-500 transition-all font-bold text-sm shadow-sm"
            >
              <Settings size={18} className={showSettings ? 'animate-spin' : ''} />
              {showSettings ? 'View Inbox' : 'Preferences'}
            </button>
            
            {!showSettings && notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-bold text-sm shadow-md shadow-orange-500/20"
              >
                <CheckSquare size={18} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {showSettings ? (
          /* Preferences Panel */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto"
          >
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Settings className="text-orange-500" /> Communication Preferences
            </h2>
            
            <div className="space-y-8">
              {/* Channel Toggles */}
              <div>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider mb-4">Supported Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'pushEnabled', label: 'Push Notifications', desc: 'Real-time alerts on your device', icon: Smartphone },
                    { key: 'emailEnabled', label: 'Email Messages', desc: 'Order receipts and newsletters', icon: Mail },
                    { key: 'smsEnabled', label: 'SMS Texts', desc: 'Fast transactional updates', icon: MessageSquare },
                    { key: 'whatsappEnabled', label: 'WhatsApp', desc: 'Receive bills & order details on WhatsApp', icon: Share2 }
                  ].map(channel => {
                    const Icon = channel.icon;
                    return (
                      <div key={channel.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                        <div className="flex gap-3">
                          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{channel.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{channel.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences[channel.key]}
                            onChange={(e) => {
                              const updated = { ...preferences, [channel.key]: e.target.checked };
                              setPreferences(updated);
                              handleSavePreferences(updated);
                            }}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event / Content Category Toggles */}
              <div>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider mb-4">Notification Types</h3>
                <div className="space-y-4">
                  {[
                    { key: 'orderUpdatesEnabled', label: 'Order & Kitchen Updates', desc: 'Get updates on order confirmations, chef preparations, and delivery partner tracking' },
                    { key: 'paymentAlertsEnabled', label: 'Payment & Wallet Alerts', desc: 'Instant confirmations on credits, payment failures, or processing refunds' },
                    { key: 'securityAlertsEnabled', label: 'Security & Login Alerts', desc: 'Critical security reports, passcode revisions, and suspicious connection notifications' },
                    { key: 'offersEnabled', label: 'Exclusive Offers & Campaigns', desc: 'Never miss out on coupons, reward points, weekend flash sales, and festival discounts' },
                    { key: 'marketingEnabled', label: 'Marketing Announcements', desc: 'Platform feature updates, announcements, and restaurant recommendations' },
                    { key: 'newsletterEnabled', label: 'Newsletter Subscriptions', desc: 'Weekly food journals, chef recipes, and culinary trend stories' }
                  ].map(type => (
                    <div key={type.key} className="flex items-start justify-between p-4 bg-gray-50/50 dark:bg-gray-850/20 rounded-2xl border border-gray-100/50 dark:border-gray-800/20">
                      <div className="max-w-[80%]">
                        <p className="text-sm font-bold">{type.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={preferences[type.key]}
                          onChange={(e) => {
                            const updated = { ...preferences, [type.key]: e.target.checked };
                            setPreferences(updated);
                            handleSavePreferences(updated);
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-150 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 rounded-xl transition-all font-bold text-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        ) : (
          /* Inbox Section */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Tabs Filter */}
            <div className="lg:col-span-1 space-y-2">
              {[
                { id: 'ALL', label: 'All Notifications', icon: Inbox },
                { id: 'UNREAD', label: 'Unread Only', icon: Bell },
                { id: 'PINNED', label: 'Pinned Alerts', icon: Bookmark },
                { id: 'ARCHIVED', label: 'Archived Logs', icon: Archive }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setPage(1); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
              
              {/* Quick Info Box */}
              <div className="bg-orange-500/5 dark:bg-orange-500/5 border border-orange-500/10 p-5 rounded-3xl mt-6 hidden lg:block">
                <h4 className="text-xs font-black uppercase text-orange-500 tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp size={12} /> Auto Retry system
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Our system auto-retries failed SMS and email dispatches using exponential delays up to 3 times before pushing them to the Dead Letter Queue.
                </p>
              </div>
            </div>

            {/* Notifications List Container */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Search Bar filter */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search notifications by title, order ID, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                />
              </div>

              {loading ? (
                /* Skeleton Loader */
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="h-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 animate-pulse flex items-center p-5 gap-4">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                /* Empty State */
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    📪
                  </div>
                  <h3 className="text-lg font-black">No notifications found</h3>
                  <p className="text-sm text-gray-400 mt-1">There are no notification logs matching your active filters.</p>
                </div>
              ) : (
                /* Active Notifications list */
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredNotifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-850 p-5 shadow-sm transition-all duration-300 relative flex flex-col md:flex-row gap-4 ${
                          !notif.read ? 'ring-1 ring-orange-500/20' : ''
                        } ${getPriorityColor(notif.type)}`}
                      >
                        {/* Type Icon Badge */}
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                          {getIcon(notif.event)}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className={`text-base font-bold ${!notif.read ? 'text-gray-900 dark:text-white font-black' : 'text-gray-600 dark:text-gray-300'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                              {notif.channel}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              notif.type === 'ERROR' || notif.type === 'CRITICAL' 
                                ? 'bg-red-500/10 text-red-500' 
                                : notif.type === 'WARNING' 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {notif.type}
                            </span>
                          </div>
                          <p className="text-sm text-[#4E4E4E] dark:text-gray-300 leading-relaxed font-medium">
                            {notif.body}
                          </p>
                          
                          {/* Metadata footer */}
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {new Date(notif.timestamp).toLocaleString()}
                            </span>
                            {notif.deliveryTimeMs > 0 && (
                              <span>Latency: {notif.deliveryTimeMs}ms</span>
                            )}
                            {notif.retryCount > 0 && (
                              <span className="text-amber-500">Retries: {notif.retryCount}/{notif.maxRetries}</span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Action Controls */}
                        <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:pl-4">
                          
                          {/* Toggle Read */}
                          <button
                            onClick={() => handleInboxAction(notif.id, notif.read ? 'UNREAD' : 'READ')}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-orange-500"
                            title={notif.read ? 'Mark Unread' : 'Mark Read'}
                          >
                            <Check size={18} className={notif.read ? 'text-orange-500 stroke-[3]' : ''} />
                          </button>

                          {/* Toggle Pin */}
                          <button
                            onClick={() => handleInboxAction(notif.id, notif.pinned ? 'UNPIN' : 'PIN')}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-orange-500"
                            title={notif.pinned ? 'Unpin Notification' : 'Pin Notification'}
                          >
                            {notif.pinned ? (
                              <BookmarkCheck size={18} className="text-orange-500 fill-orange-500" />
                            ) : (
                              <Bookmark size={18} />
                            )}
                          </button>

                          {/* Toggle Archive */}
                          <button
                            onClick={() => handleInboxAction(notif.id, notif.archived ? 'UNARCHIVE' : 'ARCHIVE')}
                            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-orange-500"
                            title={notif.archived ? 'Send to Inbox' : 'Send to Archive'}
                          >
                            <Archive size={18} className={notif.archived ? 'text-orange-500' : ''} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleInboxAction(notif.id, 'DELETE')}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl disabled:opacity-50 text-sm font-bold"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl disabled:opacity-50 text-sm font-bold"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
