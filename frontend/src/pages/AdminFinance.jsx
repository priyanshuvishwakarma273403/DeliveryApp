import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  ArrowUpRight, 
  Percent, 
  AlertOctagon, 
  ShieldAlert, 
  FileSpreadsheet, 
  Download, 
  UserCheck, 
  Undo2, 
  CreditCard,
  Layers,
  Search,
  CheckCircle,
  Truck,
  Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

const AdminFinance = () => {
  const [activeSubTab, setActiveSubTab] = useState('ANALYTICS'); // ANALYTICS, SETTLEMENTS, PAYOUTS, REFUNDS, FRAUD
  const [analytics, setAnalytics] = useState({
    revenue: 458900.5,
    successRate: '96.4%',
    failureRate: '2.4%',
    refundRate: '1.2%',
    transactionCount: 1420,
    averageValue: 323.1
  });
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 'TXN10294', orderId: 'ORD-8821', customerId: 'John Doe', restaurantId: 'Burger Club', amount: 450.0, paymentMethod: 'UPI', status: 'COMPLETED', timestamp: '2026-07-19T10:45:00' },
    { id: 'TXN10295', orderId: 'ORD-8822', customerId: 'Sara Khan', restaurantId: 'Pizza Palace', amount: 890.0, paymentMethod: 'CREDIT_CARD', status: 'COMPLETED', timestamp: '2026-07-19T11:10:00' },
    { id: 'TXN10296', orderId: 'ORD-8823', customerId: 'Mike Ross', restaurantId: 'Sushi House', amount: 1200.0, paymentMethod: 'WALLET', status: 'COMPLETED', timestamp: '2026-07-19T11:32:00' },
    { id: 'TXN10297', orderId: 'ORD-8824', customerId: 'Emma Watson', restaurantId: 'Cafe Day', amount: 180.0, paymentMethod: 'COD', status: 'COMPLETED', timestamp: '2026-07-19T12:01:00' },
    { id: 'TXN10298', orderId: 'ORD-8825', customerId: 'Bruce Wayne', restaurantId: 'Steak House', amount: 2400.0, paymentMethod: 'STRIPE', status: 'COMPLETED', timestamp: '2026-07-19T12:15:00' }
  ]);

  const [settlementForm, setSettlementForm] = useState({
    restaurantId: '65f8c85c2b3f1a001d2c3b4a',
    startDate: '2026-07-01T00:00',
    endDate: '2026-07-19T23:59'
  });
  const [settlements, setSettlements] = useState([]);
  
  const [payoutForm, setPayoutForm] = useState({
    driverId: 'DRV-902',
    startDate: '2026-07-01T00:00',
    endDate: '2026-07-19T23:59'
  });
  const [payouts, setPayouts] = useState([]);

  const [refundForm, setRefundForm] = useState({
    transactionId: '',
    amount: '',
    channel: 'WALLET', // WALLET, ORIGINAL_SOURCE
    reason: ''
  });
  const [refunds, setRefunds] = useState([]);

  // Fraud Detection velocity logs
  const [fraudLogs, setFraudLogs] = useState([
    { id: 'F101', customerId: 'User_9921', reason: 'High velocity transaction attempt: 6 requests in 3 minutes', status: 'BLOCKED', time: '2026-07-19T12:04:12' },
    { id: 'F102', customerId: 'User_4420', reason: 'Abnormal refund pattern: 3 consecutive order cancellations', status: 'UNDER_REVIEW', time: '2026-07-19T13:45:00' },
    { id: 'F103', customerId: 'User_8119', reason: 'Signature mismatches during checksum handshake', status: 'WARNING', time: '2026-07-19T14:10:00' }
  ]);

  const fetchFinanceAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/finance/analytics');
      if (response.data?.success) {
        setAnalytics(response.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceAnalytics();
  }, []);

  const handleTriggerSettlement = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/finance/settle', null, {
        params: {
          restaurantId: settlementForm.restaurantId,
          start: settlementForm.startDate + ':00',
          end: settlementForm.endDate + ':00'
        }
      });
      if (response.data?.success) {
        toast.success('Settlement processed successfully & Transferred to restaurant!');
        setSettlements(prev => [response.data.data, ...prev]);
      }
    } catch (e) {
      toast.error('Failed to process settlement');
    }
  };

  const handleTriggerPayout = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/finance/payout', null, {
        params: {
          driverId: payoutForm.driverId,
          start: payoutForm.startDate + ':00',
          end: payoutForm.endDate + ':00'
        }
      });
      if (response.data?.success) {
        toast.success('Driver payout processed successfully!');
        setPayouts(prev => [response.data.data, ...prev]);
      }
    } catch (e) {
      toast.error('Failed to process driver payout');
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundForm.transactionId || !refundForm.amount) {
      toast.error('Transaction ID and refund amount are required');
      return;
    }
    try {
      const response = await apiClient.post('/finance/refund', null, {
        params: {
          transactionId: refundForm.transactionId,
          amount: parseFloat(refundForm.amount),
          channel: refundForm.channel,
          reason: refundForm.reason
        }
      });
      if (response.data?.success) {
        toast.success('Refund triggered successfully!');
        setRefunds(prev => [response.data.data, ...prev]);
        setRefundForm({ transactionId: '', amount: '', channel: 'WALLET', reason: '' });
      }
    } catch (e) {
      toast.error('Refund processing failed');
    }
  };

  const exportReport = (format) => {
    toast.success(`Exporting Financial Telemetry as ${format}...`);
  };

  return (
    <div className="w-full min-h-[90vh] bg-gray-50 dark:bg-[#0B0F19] text-[#1C1C1C] dark:text-white pb-16 pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                Fintech Engine
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Financial & Settlements Hub</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track dynamic revenues, trigger instant settlements, configure commissions, and prevent fraud.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFinanceAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all font-bold text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Sync Financials
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-1.5 rounded-2xl mb-8 overflow-x-auto">
          {[
            { id: 'ANALYTICS', label: 'Revenue Overview', icon: DollarSign },
            { id: 'SETTLEMENTS', label: 'Restaurant Settlements', icon: Utensils },
            { id: 'PAYOUTS', label: 'Driver Payouts', icon: Truck },
            { id: 'REFUNDS', label: 'Refund Controller', icon: Undo2 },
            { id: 'FRAUD', label: 'Shield Anti-Fraud', icon: ShieldAlert }
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

        {/* Analytics Tab */}
        {activeSubTab === 'ANALYTICS' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Gross Revenue', value: `₹${analytics.revenue.toLocaleString()}`, desc: 'Aggregated food orders', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Gateway success rate', value: analytics.successRate, desc: 'Razorpay + Stripe response', icon: CheckCircle, color: 'text-blue-500 bg-blue-500/10' },
                { title: 'Refund Rate', value: analytics.refundRate, desc: 'Includes wallet fallbacks', icon: Undo2, color: 'text-amber-500 bg-amber-500/10' },
                { title: 'Transaction Size', value: `₹${analytics.averageValue}`, desc: 'Average ticket size', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">{card.title}</p>
                      <h3 className="text-2xl font-black">{card.value}</h3>
                      <p className="text-[11px] text-gray-550 dark:text-gray-400 mt-1 font-medium">{card.desc}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${card.color}`}>
                      <Icon size={24} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Export tools */}
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileSpreadsheet className="text-primary" /> Download Financial Ledgers
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Export tax breakdowns, refunds ledger and weekly settlement invoices in preferred standard formats.</p>
              </div>
              <div className="flex gap-2">
                {['CSV', 'Excel', 'PDF'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => exportReport(fmt)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <Download size={13} />
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4">Live Transaction Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-black uppercase text-gray-400 tracking-wider">
                      <th className="py-3 px-4">Txn ID</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-all">
                        <td className="py-4 px-4 font-mono font-bold text-xs">{t.id}</td>
                        <td className="py-4 px-4 font-mono text-xs">{t.orderId}</td>
                        <td className="py-4 px-4 font-bold">{t.customerId}</td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-medium">{t.restaurantId}</td>
                        <td className="py-4 px-4"><span className="bg-gray-100 dark:bg-gray-800 text-[10px] font-black px-2 py-0.5 rounded">{t.paymentMethod}</span></td>
                        <td className="py-4 px-4 font-black">₹{t.amount}</td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settlements Tab */}
        {activeSubTab === 'SETTLEMENTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm col-span-1">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <Layers className="text-primary" /> Trigger Settlement
              </h3>
              <form onSubmit={handleTriggerSettlement} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Restaurant ID</label>
                  <input
                    type="text"
                    placeholder="MongoDB ID Reference"
                    value={settlementForm.restaurantId}
                    onChange={(e) => setSettlementForm({ ...settlementForm, restaurantId: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Period Start</label>
                  <input
                    type="datetime-local"
                    value={settlementForm.startDate}
                    onChange={(e) => setSettlementForm({ ...settlementForm, startDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Period End</label>
                  <input
                    type="datetime-local"
                    value={settlementForm.endDate}
                    onChange={(e) => setSettlementForm({ ...settlementForm, endDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-xl text-[10px] text-gray-450 leading-relaxed font-bold uppercase">
                  ⚡ Auto-calculates earnings,Platform Commission (15%), Taxes (5%), Delivery Charges, adjustments and handles bank transfer instantly.
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  Execute Settlement
                </button>
              </form>
            </div>

            <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4">Settlement Ledger</h3>
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">
                  No settlements triggered in this session. Run a settlement on the left panel.
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((set, idx) => (
                    <div key={idx} className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-primary">{set.invoiceNumber}</span>
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase">{set.status}</span>
                        </div>
                        <p className="text-xs text-gray-450 font-bold">Restaurant: {set.restaurantId}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Period: {new Date(set.periodStart).toLocaleString()} - {new Date(set.periodEnd).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">Net Payout</p>
                        <h4 className="text-lg font-black text-emerald-500 mt-0.5">₹{set.finalSettlementAmount.toFixed(2)}</h4>
                        <span className="text-[10px] text-gray-400">Commission: ₹{set.platformCommission.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Driver Payouts Tab */}
        {activeSubTab === 'PAYOUTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm col-span-1">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <Truck className="text-primary" /> Trigger Driver Payout
              </h3>
              <form onSubmit={handleTriggerPayout} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Driver ID</label>
                  <input
                    type="text"
                    value={payoutForm.driverId}
                    onChange={(e) => setPayoutForm({ ...payoutForm, driverId: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Period Start</label>
                  <input
                    type="datetime-local"
                    value={payoutForm.startDate}
                    onChange={(e) => setPayoutForm({ ...payoutForm, startDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Period End</label>
                  <input
                    type="datetime-local"
                    value={payoutForm.endDate}
                    onChange={(e) => setPayoutForm({ ...payoutForm, endDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  Execute Payout
                </button>
              </form>
            </div>

            <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4">Payout Ledger</h3>
              {payouts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">
                  No payouts triggered in this session. Run a payout on the left panel.
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((pay, idx) => (
                    <div key={idx} className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-primary">Txn: {pay.transactionId}</span>
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase">{pay.status}</span>
                        </div>
                        <p className="text-xs text-gray-450 font-bold">Driver ID: {pay.driverId}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
                          <span>Base: ₹{pay.baseDeliveryFee}</span>
                          <span>Tips: ₹{pay.customerTips}</span>
                          <span>Rain Bonus: ₹{pay.rainIncentive}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">Net Payout</p>
                        <h4 className="text-lg font-black text-emerald-500 mt-0.5">₹{pay.totalPayoutAmount.toFixed(2)}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refunds Tab */}
        {activeSubTab === 'REFUNDS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm col-span-1">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <Undo2 className="text-primary" /> Trigger Refund
              </h3>
              <form onSubmit={handleRefund} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="Enter completed Txn ID"
                    value={refundForm.transactionId}
                    onChange={(e) => setRefundForm({ ...refundForm, transactionId: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Full or partial amount"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Refund Path</label>
                  <select
                    value={refundForm.channel}
                    onChange={(e) => setRefundForm({ ...refundForm, channel: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="WALLET">FoodIQ Wallet (Instant)</option>
                    <option value="ORIGINAL_SOURCE">Original Gateway Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Reason for Refund</label>
                  <input
                    type="text"
                    placeholder="e.g. Items spoiled / Missing food"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Undo2 size={14} />
                  Issue Refund
                </button>
              </form>
            </div>

            <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4">Recent Refunds Log</h3>
              {refunds.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">
                  No refunds triggered in this session.
                </div>
              ) : (
                <div className="space-y-4">
                  {refunds.map((ref, idx) => (
                    <div key={idx} className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-primary">ID: {ref.id}</span>
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-black uppercase">{ref.status}</span>
                        </div>
                        <p className="text-xs text-gray-450 font-bold">Reason: {ref.refundReason}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Processed: {ref.processedBy} via {ref.channel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">Refunded Amount</p>
                        <h4 className="text-lg font-black text-rose-500 mt-0.5">-₹{ref.amount}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fraud Tab */}
        {activeSubTab === 'FRAUD' && (
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-6 rounded-3xl flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-red-700 dark:text-red-400">Shield Active Analytics Shield</h3>
                <p className="text-xs text-red-650 dark:text-red-450 mt-1 font-medium leading-relaxed">
                  FoodIQ Shield automatically filters high-velocity checkout orders, duplicate requests sharing the same idempotency key, chargeback velocity, and abnormal cancellation patterns.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black mb-4 flex items-center gap-2">
                <ShieldAlert className="text-red-500 animate-pulse" /> Flagged Security Activity
              </h3>
              <div className="space-y-3">
                {fraudLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-850/50 border border-gray-150 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-red-500">{log.id}</span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-black uppercase">{log.status}</span>
                      </div>
                      <p className="text-xs font-bold text-[#333] dark:text-gray-300">{log.reason}</p>
                      <p className="text-[10px] text-gray-400 mt-1">UserId: {log.customerId} | Time: {new Date(log.time).toLocaleTimeString()}</p>
                    </div>
                    <button className="px-4 py-2 border border-gray-250 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all">
                      Review User
                    </button>
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

export default AdminFinance;
