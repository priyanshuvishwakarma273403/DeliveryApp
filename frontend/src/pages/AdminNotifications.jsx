import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Users, 
  Megaphone, 
  TrendingUp, 
  FileText, 
  Layout, 
  AlertTriangle,
  Mail,
  Smartphone,
  MessageSquare,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

const AdminNotifications = () => {
  const [activeSubTab, setActiveSubTab] = useState('ANALYTICS'); // ANALYTICS, BROADCAST, CAMPAIGNS, TEMPLATES
  const [analytics, setAnalytics] = useState({
    sentCount: 124500,
    deliveredCount: 123900,
    readRate: '82.5%',
    clickRate: '38.0%',
    openRate: '94.8%',
    failureRate: '0.8%',
    conversionRate: '10.6%',
    mostEffectiveChannel: 'PUSH',
    mostEffectiveTime: '19:00 - 21:00'
  });
  
  const [loadingStats, setLoadingStats] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    targetSegment: 'ALL', // ALL, CUSTOMERS, DRIVERS, RESTAURANTS
    city: '',
    title: '',
    body: '',
    channel: 'PUSH'
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Campaign state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'COUPON', // COUPON, FESTIVAL, WEEKEND, FLASH_SALE
    title: '',
    body: '',
    targetSegment: 'CUSTOMERS',
    city: '',
    channel: 'PUSH',
    scheduledTime: ''
  });
  const [schedulingCampaign, setSchedulingCampaign] = useState(false);

  // Template state
  const [newTemplate, setNewTemplate] = useState({
    event: '',
    titleTemplate: '',
    bodyTemplate: '',
    language: 'en',
    active: true
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await apiClient.get('/notifications/analytics');
      if (response.data?.success) {
        setAnalytics(response.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await apiClient.get('/notifications/campaigns');
      if (response.data?.success) {
        setCampaigns(response.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/notifications/templates');
      if (response.data?.success) {
        setTemplates(response.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
    fetchTemplates();
  }, [activeSubTab]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) {
      toast.error('Title and body are required for broadcast');
      return;
    }
    setSendingBroadcast(true);
    try {
      const response = await apiClient.post('/notifications/broadcast', broadcastForm);
      if (response.data?.success) {
        toast.success('Broadcast triggered successfully across user segment!');
        setBroadcastForm({
          targetSegment: 'ALL',
          city: '',
          title: '',
          body: '',
          channel: 'PUSH'
        });
      }
    } catch (error) {
      toast.error('Failed to submit broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.title || !campaignForm.body) {
      toast.error('Please enter all required campaign details');
      return;
    }
    setSchedulingCampaign(true);
    try {
      const response = await apiClient.post('/notifications/campaign', campaignForm);
      if (response.data?.success) {
        toast.success('Campaign scheduled successfully');
        setCampaigns(prev => [response.data.data, ...prev]);
        setCampaignForm({
          name: '',
          type: 'COUPON',
          title: '',
          body: '',
          targetSegment: 'CUSTOMERS',
          city: '',
          channel: 'PUSH',
          scheduledTime: ''
        });
      }
    } catch (error) {
      toast.error('Failed to schedule campaign');
    } finally {
      setSchedulingCampaign(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.event || !newTemplate.titleTemplate || !newTemplate.bodyTemplate) {
      toast.error('Event identifier and text templates are required');
      return;
    }
    setCreatingTemplate(true);
    try {
      const response = await apiClient.post('/notifications/templates', newTemplate);
      if (response.data?.success) {
        toast.success('Template configured successfully');
        setTemplates(prev => [response.data.data, ...prev]);
        setNewTemplate({
          event: '',
          titleTemplate: '',
          bodyTemplate: '',
          language: 'en',
          active: true
        });
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  return (
    <div className="w-full min-h-[90vh] bg-gray-50 dark:bg-[#0B0F19] text-[#1C1C1C] dark:text-white pb-16 pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                Admin Control Room
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Enterprise Notification Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Launch marketing campaigns, trigger live broadcasts, and analyze transport metrics.</p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-bold text-sm"
          >
            <RefreshCw size={16} className={loadingStats ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 rounded-2xl mb-8 overflow-x-auto">
          {[
            { id: 'ANALYTICS', label: 'Delivery Analytics', icon: TrendingUp },
            { id: 'BROADCAST', label: 'Broadcast Center', icon: Megaphone },
            { id: 'CAMPAIGNS', label: 'Campaign Manager', icon: Sparkles },
            { id: 'TEMPLATES', label: 'Template Engine', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeSubTab === tab.id
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-gray-500 dark:text-gray-450 hover:text-[#1C1C1C] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tabs Display */}
        {activeSubTab === 'ANALYTICS' && (
          /* Live KPI Cards */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Sent (24h)', value: analytics.sentCount, desc: 'Processed communications', icon: Send, color: 'text-blue-500 bg-blue-500/10' },
                { title: 'Delivered Messages', value: analytics.deliveredCount, desc: 'Successful gateway handshakes', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Open Rate', value: analytics.openRate, desc: 'Push / Email open analytics', icon: Users, color: 'text-purple-500 bg-purple-500/10' },
                { title: 'Failure Rate', value: analytics.failureRate, desc: 'Bounced or missing addresses', icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">{card.title}</p>
                      <h3 className="text-2xl font-black">{card.value}</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-450 mt-1 font-medium">{card.desc}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${card.color}`}>
                      <Icon size={24} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Additional analytics details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm col-span-2">
                <h3 className="text-base font-black mb-4 flex items-center gap-2">
                  <TrendingUp className="text-primary" /> Channel Conversion Funnel
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mt-6">
                  {[
                    { label: 'Read rate', val: analytics.readRate },
                    { label: 'Click rate', val: analytics.clickRate },
                    { label: 'Open rate', val: analytics.openRate },
                    { label: 'Conversion rate', val: analytics.conversionRate }
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-850/40 rounded-2xl border border-gray-100 dark:border-gray-800/40">
                      <p className="text-sm font-bold text-gray-400">{stat.label}</p>
                      <h4 className="text-xl font-black text-primary mt-1">{stat.val}</h4>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-black mb-4">Traffic Optimization</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-850/40 rounded-2xl">
                    <div>
                      <p className="text-xs text-gray-400">Most Effective Channel</p>
                      <p className="text-sm font-black text-emerald-500 mt-0.5">{analytics.mostEffectiveChannel}</p>
                    </div>
                    <span className="text-lg">📱</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-850/40 rounded-2xl">
                    <div>
                      <p className="text-xs text-gray-400">Most Effective Time</p>
                      <p className="text-sm font-black text-emerald-500 mt-0.5">{analytics.mostEffectiveTime}</p>
                    </div>
                    <span className="text-lg">⏰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'BROADCAST' && (
          /* Broadcast Portal Form */
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Megaphone className="text-primary animate-pulse" /> Launch Real-Time Broadcast
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Target Segment</label>
                  <select
                    value={broadcastForm.targetSegment}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetSegment: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-750 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="ALL">All Users</option>
                    <option value="CUSTOMER">Customers Only</option>
                    <option value="DELIVERY_PARTNER">Delivery Drivers Only</option>
                    <option value="RESTAURANT_OWNER">Restaurant Owners Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">City Filter (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Noida, Delhi, Mumbai"
                    value={broadcastForm.city}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, city: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-750 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Communication Channel</label>
                <div className="flex gap-4">
                  {['PUSH', 'EMAIL', 'SMS'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setBroadcastForm({ ...broadcastForm, channel: ch })}
                      className={`flex-1 py-3 border rounded-2xl font-bold text-sm transition-all ${
                        broadcastForm.channel === ch
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 hover:bg-gray-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Broadcast Title</label>
                <input
                  type="text"
                  placeholder="Enter notification title header"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-750 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Message Body Content</label>
                <textarea
                  rows="4"
                  placeholder="Compose your segment notification broadcast..."
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-750 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-4 py-3 text-sm outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  {sendingBroadcast ? 'Sending Broadcast...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeSubTab === 'CAMPAIGNS' && (
          /* Campaign manager panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Campaign form */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4 flex items-center gap-1">
                <Plus className="text-primary" /> Setup Campaign
              </h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Weekend Flash"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Campaign Type</label>
                    <select
                      value={campaignForm.type}
                      onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="COUPON">Coupon Event</option>
                      <option value="FESTIVAL">Festival Special</option>
                      <option value="WEEKEND">Weekend Bonanza</option>
                      <option value="FLASH_SALE">Flash Sale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Channel</label>
                    <select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="PUSH">Push Notifications</option>
                      <option value="EMAIL">Email Campaigns</option>
                      <option value="SMS">SMS Marketing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Segment</label>
                    <select
                      value={campaignForm.targetSegment}
                      onChange={(e) => setCampaignForm({ ...campaignForm, targetSegment: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="CUSTOMERS">Customers</option>
                      <option value="RESTAURANTS">Restaurants</option>
                      <option value="DRIVERS">Drivers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Schedule Time</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.scheduledTime}
                      onChange={(e) => setCampaignForm({ ...campaignForm, scheduledTime: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Title Template</label>
                  <input
                    type="text"
                    placeholder="Diwali Blast: Get 50% Off!"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Body Template</label>
                  <textarea
                    rows="3"
                    placeholder="Enter message details..."
                    value={campaignForm.body}
                    onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={schedulingCampaign}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {schedulingCampaign ? 'Scheduling...' : 'Launch Campaign'}
                </button>
              </form>
            </div>

            {/* Campaigns list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-black">Active Campaigns</h3>
              
              {campaigns.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center text-gray-400 text-sm font-medium">
                  No active campaigns configured. Create one on the left panel!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            camp.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {camp.status}
                          </span>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">
                            {camp.type}
                          </span>
                        </div>
                        <h4 className="text-base font-bold">{camp.name}</h4>
                        <p className="text-xs text-gray-400 mt-1 font-bold">Subject: {camp.title}</p>
                        <p className="text-xs text-[#4F4F4F] dark:text-gray-300 mt-1 leading-relaxed line-clamp-2">{camp.body}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {camp.scheduledTime ? new Date(camp.scheduledTime).toLocaleString() : 'Immediate'}
                        </span>
                        <span>Sent: {camp.sentCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'TEMPLATES' && (
          /* Template Engine editor */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Template form */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4 flex items-center gap-1">
                <Plus className="text-primary" /> Seed Template
              </h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Event Code</label>
                  <input
                    type="text"
                    placeholder="e.g. REFUND_INITIATED"
                    value={newTemplate.event}
                    onChange={(e) => setNewTemplate({ ...newTemplate, event: e.target.value.toUpperCase() })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Language</label>
                    <select
                      value={newTemplate.language}
                      onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="hi">Hindi (hi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Status</label>
                    <select
                      value={newTemplate.active ? 'true' : 'false'}
                      onChange={(e) => setNewTemplate({ ...newTemplate, active: e.target.value === 'true' })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Title Pattern</label>
                  <input
                    type="text"
                    placeholder="Order #{{orderId}} Refund Status"
                    value={newTemplate.titleTemplate}
                    onChange={(e) => setNewTemplate({ ...newTemplate, titleTemplate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Body Pattern</label>
                  <textarea
                    rows="3"
                    placeholder="Dear {{customerName}}, your refund of ₹{{amount}} has been triggered."
                    value={newTemplate.bodyTemplate}
                    onChange={(e) => setNewTemplate({ ...newTemplate, bodyTemplate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  ></textarea>
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl text-[10px] text-gray-400 leading-relaxed font-medium">
                  💡 Placeholders like <span className="font-bold text-primary">&#123;&#123;customerName&#125;&#125;</span>, <span className="font-bold text-primary">&#123;&#123;orderId&#125;&#125;</span>, and <span className="font-bold text-primary">&#123;&#123;otp&#125;&#125;</span> are automatically replaced during dispatch.
                </div>

                <button
                  type="submit"
                  disabled={creatingTemplate}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FileText size={14} />
                  {creatingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </form>
            </div>

            {/* Templates list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-base font-black">Configured Event Templates</h3>
              
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 p-5 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black font-mono text-primary">{tpl.event}</h4>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">
                          Lang: {tpl.language}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          tpl.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tpl.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400">Subject: {tpl.titleTemplate}</p>
                    <p className="text-xs text-[#4F4F4F] dark:text-gray-300 mt-1 leading-relaxed">{tpl.bodyTemplate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminNotifications;
