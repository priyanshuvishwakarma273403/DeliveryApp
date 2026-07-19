import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, MapPin, Globe, Users, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign,
  ShoppingBag, Star, AlertTriangle, ShieldCheck, Plus, Edit2, Trash2, Copy, Search, 
  SlidersHorizontal, Check, RefreshCw, FileText, Calendar, Sparkles, Download, 
  Trash, ArrowRightLeft, UserCheck, ShieldAlert, BadgePercent, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

const MOCK_BRANCHES = [
  {
    id: "BR-301",
    name: "La Piazza - South Extension",
    code: "LP-DEL-01",
    manager: "Aarti Sinha",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    currency: "INR",
    timezone: "IST",
    status: "OPEN",
    revenue: 1250000,
    orders: 4120,
    waste: 2.1,
    rating: 4.8,
    lat: 28.5684,
    lng: 77.2201,
    radius: 7, // km
    license: "FSSAI-12349876",
    staffCount: 16
  },
  {
    id: "BR-302",
    name: "La Piazza - Indiranagar",
    code: "LP-BLR-02",
    manager: "Karan Johar",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    currency: "INR",
    timezone: "IST",
    status: "OPEN",
    revenue: 1480000,
    orders: 4900,
    waste: 1.5,
    rating: 4.9,
    lat: 12.9716,
    lng: 77.5946,
    radius: 8,
    license: "FSSAI-12349877",
    staffCount: 22
  },
  {
    id: "BR-303",
    name: "La Piazza - Hazratganj",
    code: "LP-LKO-03",
    manager: "Siddharth Nath",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    currency: "INR",
    timezone: "IST",
    status: "BUSY",
    revenue: 840000,
    orders: 2950,
    waste: 3.8,
    rating: 4.3,
    lat: 26.8467,
    lng: 80.9462,
    radius: 6,
    license: "FSSAI-12349878",
    staffCount: 12
  },
  {
    id: "BR-304",
    name: "La Piazza - Sector 62",
    code: "LP-NOI-04",
    manager: "Megha Gupta",
    city: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    currency: "INR",
    timezone: "IST",
    status: "MAINTENANCE",
    revenue: 520000,
    orders: 1820,
    waste: 4.2,
    rating: 4.1,
    lat: 28.6273,
    lng: 77.3727,
    radius: 6,
    license: "FSSAI-12349879",
    staffCount: 8
  }
];

const MOCK_INVENTORY_ITEMS = [
  { code: "INV-101", name: "Premium Buffalo Mozzarella", category: "Dairy", totalStock: "120 kg" },
  { code: "INV-102", name: "San Marzano Tomato Paste", category: "Sauces", totalStock: "85 cans" },
  { code: "INV-103", name: "Truffle Oil Infusions", category: "Gourmet", totalStock: "24 Litres" }
];

const MultiBranchPortal = () => {
  const [activeTab, setActiveTab] = useState('headoffice');
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [inventoryItems, setInventoryItems] = useState(MOCK_INVENTORY_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchesToCompare, setSelectedBranchesToCompare] = useState(["BR-301", "BR-302"]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Form states
  const [branchForm, setBranchForm] = useState({
    id: '', name: '', code: '', manager: '', city: '', state: '', country: 'India',
    currency: 'INR', timezone: 'IST', status: 'OPEN', revenue: 0, orders: 0,
    waste: 0, rating: 5.0, lat: 28.6, lng: 77.2, radius: 5, license: '', staffCount: 5
  });

  // Transfer simulation states
  const [transferType, setTransferType] = useState('inventory'); // inventory, staff
  const [transferDetails, setTransferDetails] = useState({
    source: 'BR-301', target: 'BR-303', item: 'INV-101', qty: '10 kg', staffName: 'Chef Giovanni'
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "2026-07-19 14:05", type: "BRANCH_UPDATE", details: "Branch Hazratganj status toggled to Busy" },
    { timestamp: "2026-07-19 11:30", type: "INVENTORY_TRANSFER", details: "Transferred 15kg Buffalo Mozzarella from South Ext to Hazratganj" },
    { timestamp: "2026-07-19 09:15", type: "STAFF_TRANSFER", details: "Reassigned Manager Aarti Sinha from Hazratganj to South Ext" }
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = branches.length;
    const totalRev = branches.reduce((acc, b) => acc + b.revenue, 0);
    const avgRating = branches.reduce((acc, b) => acc + b.rating, 0) / total;
    
    // Sort branches
    const sortedByRev = [...branches].sort((a, b) => b.revenue - a.revenue);
    const best = sortedByRev[0]?.name || "N/A";
    const worst = sortedByRev[sortedByRev.length - 1]?.name || "N/A";

    return { total, totalRev, avgRating, best, worst };
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [branches, searchQuery]);

  // Branch CRUD actions
  const handleOpenAddModal = (branch = null) => {
    if (branch) {
      setBranchForm({ ...branch });
      setSelectedBranch(branch);
    } else {
      setBranchForm({
        id: `BR-${Math.floor(300 + Math.random() * 699)}`,
        name: '', code: `LP-${Math.floor(100 + Math.random() * 899)}`, manager: '',
        city: '', state: '', country: 'India', currency: 'INR', timezone: 'IST',
        status: 'OPEN', revenue: 0, orders: 0, waste: 0.0, rating: 5.0,
        lat: 28.5, lng: 77.3, radius: 6, license: '', staffCount: 10
      });
      setSelectedBranch(null);
    }
    setShowAddModal(true);
  };

  const handleSaveBranch = () => {
    if (!branchForm.name || !branchForm.city || !branchForm.manager) {
      toast.error('All profile fields are required.');
      return;
    }
    // Geolocation validations
    if (isNaN(branchForm.lat) || isNaN(branchForm.lng)) {
      toast.error('Invalid coordinates. Please verify Latitude & Longitude.');
      return;
    }

    if (selectedBranch) {
      setBranches(branches.map(b => b.id === selectedBranch.id ? branchForm : b));
      setAuditLogs([{
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        type: "BRANCH_UPDATE",
        details: `Updated details for branch: ${branchForm.name}`
      }, ...auditLogs]);
      toast.success('Branch details updated!');
    } else {
      setBranches([...branches, branchForm]);
      setAuditLogs([{
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        type: "BRANCH_CREATE",
        details: `Registered new branch: ${branchForm.name} in ${branchForm.city}`
      }, ...auditLogs]);
      toast.success('New branch registered!');
    }
    setShowAddModal(false);
  };

  const handleDeleteBranch = (id) => {
    setBranches(branches.filter(b => b.id !== id));
    setAuditLogs([{
      timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
      type: "BRANCH_DELETE",
      details: `Deleted branch with ID: ${id}`
    }, ...auditLogs]);
    toast.success('Branch deleted.');
  };

  const handleCloneBranch = (branch) => {
    const cloned = {
      ...branch,
      id: `BR-${Math.floor(300 + Math.random() * 699)}`,
      name: `${branch.name} (Copy)`,
      code: `${branch.code}-CLONE`,
      revenue: 0,
      orders: 0
    };
    setBranches([...branches, cloned]);
    toast.success(`Cloned configuration parameters to ${cloned.name}`);
  };

  const handleToggleStatus = (id, newStatus) => {
    setBranches(branches.map(b => b.id === id ? { ...b, status: newStatus } : b));
    toast.success(`Branch status updated to ${newStatus}`);
  };

  // Transfer simulation
  const handlePerformTransfer = () => {
    if (transferDetails.source === transferDetails.target) {
      toast.error('Source and Target branches cannot be identical.');
      return;
    }
    
    const sourceName = branches.find(b => b.id === transferDetails.source)?.name || 'Source';
    const targetName = branches.find(b => b.id === transferDetails.target)?.name || 'Target';

    let detailsText = '';
    if (transferType === 'inventory') {
      const itemName = inventoryItems.find(i => i.code === transferDetails.item)?.name || 'Item';
      detailsText = `Transferred ${transferDetails.qty} of ${itemName} from ${sourceName} to ${targetName}`;
      toast.success(`Inventory transfer request approved! Dispatching logistics.`);
    } else {
      detailsText = `Transferred Employee "${transferDetails.staffName}" from ${sourceName} to ${targetName}`;
      toast.success(`Staff shift & contract relocated successfully.`);
    }

    setAuditLogs([{
      timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
      type: transferType === 'inventory' ? 'INVENTORY_TRANSFER' : 'STAFF_TRANSFER',
      details: detailsText
    }, ...auditLogs]);
  };

  // Compare branches selections
  const handleCompareSelect = (id) => {
    if (selectedBranchesToCompare.includes(id)) {
      if (selectedBranchesToCompare.length <= 1) {
        toast.error('Select at least one branch for comparative analysis.');
        return;
      }
      setSelectedBranchesToCompare(selectedBranchesToCompare.filter(x => x !== id));
    } else {
      setSelectedBranchesToCompare([...selectedBranchesToCompare, id]);
    }
  };

  // comparative data calculations
  const comparativeChartData = useMemo(() => {
    return branches
      .filter(b => selectedBranchesToCompare.includes(b.id))
      .map(b => ({
        name: b.name.split(' - ')[1] || b.city,
        revenue: b.revenue / 1000, // in k
        orders: b.orders,
        waste: b.waste,
        rating: b.rating
      }));
  }, [branches, selectedBranchesToCompare]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* ── Left Sidebar Control Center ── */}
      <div className="w-full md:w-64 bg-[#111827] text-white shrink-0 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">
            MB
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">FoodIQ</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Multi-Branch System</p>
          </div>
        </div>

        {/* Sidebar Roster Navigation */}
        <nav className="flex-1 space-y-1">
          {[
            { id: 'headoffice', label: 'Head Office Control', icon: Building },
            { id: 'comparison', label: 'Branch Comparison', icon: SlidersHorizontal },
            { id: 'transfers', label: 'Node Transfers', icon: ArrowRightLeft },
            { id: 'audit', label: 'System Audit Logs', icon: ShieldAlert }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-black">FoodIQ Global Engine</p>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 space-y-8">
        
        {/* Header telemetry and global summaries */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#1C1C1C] capitalize">Multi-Branch Platform</h2>
            <p className="text-text-secondary text-xs font-medium mt-1">Centralized intelligence & independent regional operational nodes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> FSSAI Verified Nodes
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            
            {/* ── TAB 1: HEAD OFFICE DASHBOARD ── */}
            {activeTab === 'headoffice' && (
              <div className="space-y-8">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Total Branches</span>
                    <p className="text-2xl font-black text-[#1c1c1c]">{stats.total}</p>
                    <p className="text-[10px] text-green-500 font-bold">100% active nodes</p>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2 lg:col-span-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Combined Net Revenue</span>
                    <p className="text-2xl font-black text-primary">₹{(stats.totalRev / 100000).toFixed(2)} Lakhs</p>
                    <p className="text-[10px] text-gray-400 font-bold">Consolidated this quarter</p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Top Node</span>
                    <p className="text-sm font-black text-[#1c1c1c] truncate">{stats.best.split(' - ')[1] || stats.best}</p>
                    <p className="text-[10px] text-green-500 font-bold">Highest monthly yield</p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Lowest Yield Node</span>
                    <p className="text-sm font-black text-rose-600 truncate">{stats.worst.split(' - ')[1] || stats.worst}</p>
                    <p className="text-[10px] text-rose-500 font-bold">Requires audit support</p>
                  </div>
                </div>

                {/* Filters, Search & Branch Register triggers */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search branch name, code, manager..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(branches, null, 2));
                        const dlAnchor = document.createElement('a');
                        dlAnchor.setAttribute("href", dataStr);
                        dlAnchor.setAttribute("download", "foodiq_branch_data.json");
                        document.body.appendChild(dlAnchor);
                        dlAnchor.click();
                        dlAnchor.remove();
                        toast.success('Branch database exported to JSON!');
                      }}
                      className="px-4 py-2.5 bg-white border rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download size={14} /> Export JSON
                    </button>
                    <button onClick={() => handleOpenAddModal()} className="px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl flex items-center gap-1">
                      <Plus size={14} /> Register Branch
                    </button>
                  </div>
                </div>

                {/* Branches Roster Listing Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black uppercase tracking-wider">
                          <th className="p-4">Branch Details / Code</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Manager Name</th>
                          <th className="p-4">Gross Revenue</th>
                          <th className="p-4">FSSAI / License</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-bold">
                        {filteredBranches.map(branch => (
                          <tr key={branch.id} className="hover:bg-gray-50/50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gray-55/10 text-primary border flex items-center justify-center font-black">
                                <Building size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-[#1c1c1c]">{branch.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold">{branch.code} • ID: {branch.id}</p>
                              </div>
                            </td>
                            <td className="p-4 text-text-secondary">{branch.city}, {branch.state}</td>
                            <td className="p-4 text-text-secondary">{branch.manager}</td>
                            <td className="p-4 text-primary">₹{branch.revenue.toLocaleString()}</td>
                            <td className="p-4 text-[10px] text-gray-400">{branch.license || 'Missing License'}</td>
                            <td className="p-4">
                              <select 
                                value={branch.status} 
                                onChange={(e) => handleToggleStatus(branch.id, e.target.value)}
                                className={`p-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                  branch.status === 'OPEN' ? 'bg-green-50 text-green-600 border border-green-200' :
                                  branch.status === 'BUSY' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                  'bg-red-50 text-red-600 border border-red-200'
                                }`}
                              >
                                <option value="OPEN">Open</option>
                                <option value="BUSY">Busy</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-1">
                              <button onClick={() => handleOpenAddModal(branch)} className="p-1.5 text-gray-400 hover:text-[#1c1c1c]"><Edit2 size={12} /></button>
                              <button onClick={() => handleCloneBranch(branch)} className="p-1.5 text-gray-400 hover:text-primary" title="Clone Config"><Copy size={12} /></button>
                              <button onClick={() => handleDeleteBranch(branch.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: BRANCH COMPARISON (CHARTS) ── */}
            {activeTab === 'comparison' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Select Branches for Comparative Analysis</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {branches.map(b => {
                      const isSelected = selectedBranchesToCompare.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleCompareSelect(b.id)}
                          className={`py-2 px-4 rounded-xl border-2 text-xs font-bold transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 text-primary font-black shadow-sm' 
                              : 'border-gray-100 hover:border-gray-250 text-text-secondary'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {b.name.split(' - ')[1] || b.city}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Revenue Comparison (₹ in Thousands) */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Branch Gross Revenue Comparison (₹ k)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#FC8019" radius={[8, 8, 0, 0]}>
                            {comparativeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FC8019' : '#111827'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Waste & Expiry Matrix */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Branch Food Waste Ratio (%)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="waste" stroke="#EF4444" strokeWidth={3} fill="#FEF2F2" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: NODE TRANSFERS (LOGISTICS) ── */}
            {activeTab === 'transfers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Form: Initiate Transfer */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Initiate Cross-Branch Transfer</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {['inventory', 'staff'].map(type => (
                        <button
                          key={type}
                          onClick={() => setTransferType(type)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            transferType === type ? 'bg-[#111827] text-white' : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Source Node</label>
                      <select 
                        value={transferDetails.source}
                        onChange={(e) => setTransferDetails({ ...transferDetails, source: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Target Node</label>
                      <select 
                        value={transferDetails.target}
                        onChange={(e) => setTransferDetails({ ...transferDetails, target: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {transferType === 'inventory' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase font-black">Select Raw Ingredient</label>
                          <select 
                            value={transferDetails.item}
                            onChange={(e) => setTransferDetails({ ...transferDetails, item: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                          >
                            {inventoryItems.map(item => (
                              <option key={item.code} value={item.code}>{item.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase font-black">Quantity to Transfer</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 15 kg"
                            value={transferDetails.qty}
                            onChange={(e) => setTransferDetails({ ...transferDetails, qty: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase font-black">Employee / Staff Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Chef Giovanni"
                          value={transferDetails.staffName}
                          onChange={(e) => setTransferDetails({ ...transferDetails, staffName: e.target.value })}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    )}

                    <Button onClick={handlePerformTransfer} className="w-full py-3.5 mt-3 rounded-xl font-black text-xs uppercase">
                      Confirm Dispatch
                    </Button>
                  </div>
                </div>

                {/* Right Panel: Transfer Audit Logs */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Dispatched Logistics Activity</h3>
                  <div className="space-y-3 font-bold text-xs">
                    {auditLogs.filter(l => l.type.includes('TRANSFER')).map((log, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded text-[8px] font-black mr-2 uppercase">{log.type}</span>
                          <span className="text-[#1c1c1c]">{log.details}</span>
                        </div>
                        <span className="text-[9px] text-gray-450 shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: SYSTEM AUDIT LOGS ── */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-[#1C1C1C]">Head Office Audit Trail</h3>
                  <button 
                    onClick={() => {
                      toast.success('Roster Audit Trail sheets exported to Excel!');
                    }}
                    className="px-4 py-2 bg-gray-50 border rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={12} className="text-green-600" /> Export Excel
                  </button>
                </div>
                <div className="space-y-3 font-bold text-xs">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[8px] font-black mr-2 uppercase">{log.type}</span>
                        <span className="text-[#1c1c1c]">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-gray-450 shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BRANCH REGISTER / EDIT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full relative z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-black text-[#1C1C1C]">{selectedBranch ? 'Edit Branch details' : 'Register New Branch'}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Branch ID</label>
                <input type="text" disabled value={branchForm.id} className="w-full p-3 bg-gray-100 border border-transparent rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Branch Name</label>
                <input 
                  type="text" 
                  value={branchForm.name} 
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. La Piazza - Lucknow Hazratganj"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Branch Manager Name</label>
                <input 
                  type="text" 
                  value={branchForm.manager} 
                  onChange={(e) => setBranchForm({ ...branchForm, manager: e.target.value })}
                  placeholder="e.g. Aarti Sinha"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">FSSAI License ID</label>
                <input 
                  type="text" 
                  value={branchForm.license} 
                  onChange={(e) => setBranchForm({ ...branchForm, license: e.target.value })}
                  placeholder="e.g. FSSAI-12349876"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">City</label>
                <input 
                  type="text" 
                  value={branchForm.city} 
                  onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                  placeholder="e.g. New Delhi"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">State</label>
                <input 
                  type="text" 
                  value={branchForm.state} 
                  onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                  placeholder="e.g. Delhi"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Latitude Coordinate</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={branchForm.lat} 
                  onChange={(e) => setBranchForm({ ...branchForm, lat: Number(e.target.value) })}
                  placeholder="28.5684"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Longitude Coordinate</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={branchForm.lng} 
                  onChange={(e) => setBranchForm({ ...branchForm, lng: Number(e.target.value) })}
                  placeholder="77.2201"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Delivery Radius (km)</label>
                <input 
                  type="number" 
                  value={branchForm.radius} 
                  onChange={(e) => setBranchForm({ ...branchForm, radius: Number(e.target.value) })}
                  placeholder="7"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Staff / Employee Count</label>
                <input 
                  type="number" 
                  value={branchForm.staffCount} 
                  onChange={(e) => setBranchForm({ ...branchForm, staffCount: Number(e.target.value) })}
                  placeholder="15"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setShowAddModal(false)} variant="outline" className="px-6 py-2 rounded-xl text-xs font-black">Cancel</Button>
              <Button onClick={handleSaveBranch} className="px-8 py-2 rounded-xl text-xs font-black">Save Branch</Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default MultiBranchPortal;
