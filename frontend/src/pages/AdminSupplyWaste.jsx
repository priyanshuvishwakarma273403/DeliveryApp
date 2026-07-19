import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Leaf, ShoppingBag, AlertTriangle, ShieldAlert, 
  TrendingDown, RefreshCw, BarChart3, Truck, PackageCheck, 
  Trash2, Sparkles, CheckCircle2, ChevronRight, Zap, Layers, 
  Database, Navigation, ShieldCheck, Box, User, ArrowRight,
  ClipboardList, Plus, FileText, Download, ShieldAlert as WarningIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

// ── MOCK DATA FOR ENTERPRISE INVENTORY ──
const INITIAL_INGREDIENTS = [
  { 
    id: "SKU-CHE-92", 
    name: "Mozzarella Cheese", 
    category: "Dairy", 
    stock: 120, 
    minStock: 200, 
    maxStock: 800,
    cost: 450, 
    shelf: "Aisle 3", rack: "Rack B", bin: "Bin 12",
    batchId: "BAT-9082", mfgDate: "2026-07-10", expiryDate: "2026-07-28",
    lotStrategy: "FEFO", warehouse: "Cold Storage Room 1", supplier: "Amul Food Solutions",
    status: "LOW_STOCK"
  },
  { 
    id: "SKU-PAN-12", 
    name: "Fresh Malai Paneer", 
    category: "Dairy", 
    stock: 18, 
    minStock: 15, 
    maxStock: 50,
    cost: 320, 
    shelf: "Aisle 3", rack: "Rack C", bin: "Bin 04",
    batchId: "BAT-9111", mfgDate: "2026-07-17", expiryDate: "2026-07-21",
    lotStrategy: "FEFO", warehouse: "Cold Storage Room 1", supplier: "Nanak Dairies Ltd",
    status: "NEAR_EXPIRY"
  },
  { 
    id: "SKU-RIC-09", 
    name: "Basmati Rice (Classic)", 
    category: "Grains", 
    stock: 1200, 
    minStock: 500, 
    maxStock: 3000,
    cost: 85, 
    shelf: "Aisle 1", rack: "Rack A", bin: "Bin 44",
    batchId: "BAT-8902", mfgDate: "2026-05-10", expiryDate: "2027-05-10",
    lotStrategy: "FIFO", warehouse: "Dry Warehouse A", supplier: "Metro Wholesale Noida",
    status: "HEALTHY"
  },
  { 
    id: "SKU-CHK-33", 
    name: "Fresh Chicken Breast", 
    category: "Poultry", 
    stock: 5, 
    minStock: 40, 
    maxStock: 150,
    cost: 220, 
    shelf: "Freezer Zone 1", rack: "Rack A", bin: "Bin 01",
    batchId: "BAT-9218", mfgDate: "2026-07-18", expiryDate: "2026-07-20",
    lotStrategy: "FEFO", warehouse: "Main Deep Freezer", supplier: "Venky's Farms",
    status: "CRITICAL_SHORTAGE"
  }
];

const INITIAL_PURCHASE_ORDERS = [
  { id: "PO-2026-901", vendor: "Amul Food Solutions", value: 36000, items: "80kg Cheese", status: "submitted", date: "2026-07-19" },
  { id: "PO-2026-902", vendor: "Venky's Farms", value: 8800, items: "40kg Chicken", status: "manager_approval", date: "2026-07-19" },
  { id: "PO-2026-903", vendor: "Metro Wholesale Noida", value: 17000, items: "200kg Basmati Rice", status: "draft", date: "2026-07-18" }
];

const INITIAL_TRANSFERS = [
  { id: "TR-801", source: "Dry Warehouse A", dest: "Sector 62 Branch", items: "100kg Basmati Rice", status: "IN_TRANSIT", transitEta: "1.5 hours" },
  { id: "TR-802", source: "Main Deep Freezer", dest: "Lucknow Branch", items: "25kg Chicken Breast", status: "COMPLETED", transitEta: "Delivered" }
];

const MOCK_WASTAGE = [
  { id: "WST-101", ingredient: "Paneer", qty: "3.5 kg", reason: "Expired Food", cost: 1120, employee: "Chef Rohit", date: "2026-07-18" },
  { id: "WST-102", ingredient: "Mozzarella Cheese", qty: "1.2 kg", reason: "Cooking Waste", cost: 540, employee: "Chef Anita", date: "2026-07-19" }
];

const MOCK_SUPPLIERS = [
  { name: "Amul Food Solutions", rating: 4.8, gst: "24AMULFS9012F1Z", balance: 45000, pendingOrders: 1 },
  { name: "Venky's Farms", rating: 4.2, gst: "27VENKYS1102A1Z", balance: 8800, pendingOrders: 1 },
  { name: "Nanak Dairies Ltd", rating: 4.6, gst: "09NANAK2290E1Z", balance: 0, pendingOrders: 0 }
];

const CONSUMPTION_FORECAST = [
  { day: 'Mon', consumption: 450, forecast: 460 },
  { day: 'Tue', consumption: 480, forecast: 490 },
  { day: 'Wed', consumption: 520, forecast: 510 },
  { day: 'Thu', consumption: 490, forecast: 550 },
  { day: 'Fri', consumption: 680, forecast: 710 },
  { day: 'Sat', consumption: 920, forecast: 950 },
  { day: 'Sun', consumption: 850, forecast: 900 }
];

const AdminSupplyWaste = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, po, transfers, wastage, analytics, suppliers
  const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);
  const [pos, setPos] = useState(INITIAL_PURCHASE_ORDERS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [wastages, setWastages] = useState(MOCK_WASTAGE);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-recall logic simulation
  const handleRecallBatch = (batchId, ingredientName) => {
    toast.error(`BATCH RECALL PROTOCOL DEPLOYED: Recalling batch ${batchId} of ${ingredientName} due to supplier safety flag!`);
    setIngredients(prev => prev.map(ing => ing.batchId === batchId ? { ...ing, status: 'RECALLED_BLOCK' } : ing));
  };

  const handleAdvancePo = (id, currentStatus) => {
    const statusFlow = {
      "draft": "submitted",
      "submitted": "manager_approval",
      "manager_approval": "finance_approval",
      "finance_approval": "ordered",
      "ordered": "received",
      "received": "closed"
    };
    const nextStatus = statusFlow[currentStatus];
    if (nextStatus) {
      setPos(prev => prev.map(po => po.id === id ? { ...po, status: nextStatus } : po));
      toast.success(`Purchase Order ${id} advanced to: ${nextStatus.toUpperCase()}`);
    }
  };

  const handleInitiatePO = (name, cost, supplierName) => {
    const newId = `PO-2026-${Date.now().toString().slice(-3)}`;
    const newPO = {
      id: newId,
      vendor: supplierName,
      value: cost * 50,
      items: `50 units of ${name}`,
      status: "draft",
      date: new Date().toISOString().split('T')[0]
    };
    setPos(prev => [...prev, newPO]);
    toast.success(`Draft Purchase Order ${newId} created for ${name}`);
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-150 pb-16 font-sans">
      
      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-transparent border-b border-gray-800/60 py-6 px-4 md:px-12">
        <div className="absolute top-0 right-1/4 w-[450px] h-[130px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="h-12 w-12 bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-gray-300 hover:text-emerald-400 transition-all duration-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Leaf size={10} />
                  Enterprise Inventory Matrix
                </span>
                <span className="text-gray-500 text-xs font-bold">FEFO & Auto-Picking Path Locked</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Supply Chain & <span className="text-emerald-500 font-light">Inventory Console</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                Manage multiple warehouses, shelf bin structures, batches recalls, LIFO/FEFO lots, and PO pipelines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTIONS NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap gap-2.5 bg-[#0F1524] p-2 rounded-2.5xl border border-gray-850 mb-8">
          {[
            { id: 'inventory', label: 'Ingredient Stock', icon: Box },
            { id: 'po', label: 'Purchase Orders', icon: Truck },
            { id: 'transfers', label: 'Stock Transfers', icon: Navigation },
            { id: 'wastage', label: 'Waste Logs', icon: Trash2 },
            { id: 'suppliers', label: 'Suppliers Performance', icon: User },
            { id: 'analytics', label: 'Forecasting Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT AREA ── */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: INGREDIENTS STOCK (Smart Shelf / FEFO lot details) */}
          {activeTab === 'inventory' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white">Ingredient Batch Inventory</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Smart Pick Path displays Bin locations following FEFO rules</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => toast.success('Initiating barcode scan...')} variant="outline" className="px-4 py-2 text-xs font-black">
                      Scan Barcode
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">SKU & Ingredient</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Current Stock</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Smart Shelf Pick Path</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Batch & Expiry Date</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Lot Strat</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Warehouse Node</th>
                        <th className="pb-3 font-black uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {ingredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-white">
                            <p className="font-bold">{ing.name}</p>
                            <p className="text-[10px] text-cyan-400 font-black mt-0.5">{ing.id}</p>
                          </td>
                          <td className="py-4">
                            <span className={ing.stock <= ing.minStock ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                              {ing.stock} units
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Min: {ing.minStock}</span>
                          </td>
                          <td className="py-4 text-gray-300">
                            <span className="bg-gray-800/60 border border-gray-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                              {ing.shelf} ➔ {ing.rack} ➔ {ing.bin}
                            </span>
                          </td>
                          <td className="py-4 text-white">
                            <p>Batch: {ing.batchId}</p>
                            <p className="text-[10px] text-amber-500 font-bold mt-0.5">Expires: {ing.expiryDate}</p>
                          </td>
                          <td className="py-4 text-gray-400">{ing.lotStrategy}</td>
                          <td className="py-4 text-gray-300">{ing.warehouse}</td>
                          <td className="py-4 text-right space-x-2">
                            <button 
                              onClick={() => handleRecallBatch(ing.batchId, ing.name)}
                              className="text-red-500 hover:underline"
                            >
                              Recall Batch
                            </button>
                            <button 
                              onClick={() => handleInitiatePO(ing.name, ing.cost, ing.supplier)}
                              className="text-emerald-400 hover:underline"
                            >
                              Reorder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PURCHASE ORDERS WORKFLOW */}
          {activeTab === 'po' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-base font-black uppercase tracking-wider text-white">Purchase Orders Approval Pipeline</h3>
                
                <div className="space-y-3 font-bold text-xs">
                  {pos.map(po => (
                    <div key={po.id} className="p-4 bg-[#070A13] border border-gray-850 rounded-2.5xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-sm">{po.id}</span>
                          <span className="text-gray-400">Date: {po.date}</span>
                        </div>
                        <p className="text-gray-300 mt-1">Vendor: {po.vendor} • Value: <span className="text-primary">₹{po.value}</span></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Line items: {po.items}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="px-2.5 py-1 rounded bg-gray-800 text-gray-300 text-[10px] uppercase font-black tracking-wider border border-gray-700">
                          {po.status}
                        </span>
                        {po.status !== 'closed' && (
                          <Button 
                            onClick={() => handleAdvancePo(po.id, po.status)}
                            className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black rounded-lg uppercase tracking-wider"
                          >
                            Advance State
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: STOCK TRANSFERS */}
          {activeTab === 'transfers' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-base font-black uppercase tracking-wider text-white">Stock Transfers (Warehouse ➔ Branch)</h3>
                
                <div className="space-y-3 font-bold text-xs">
                  {transfers.map(tr => (
                    <div key={tr.id} className="p-4 bg-[#070A13] border border-gray-850 rounded-2.5xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-black">{tr.id}</span>
                          <span className="text-gray-300 font-bold">{tr.items}</span>
                        </div>
                        <p className="text-gray-400 mt-1">Route: {tr.source} ➔ {tr.dest}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="px-2.5 py-1 rounded bg-[#FC8019]/10 text-[#FC8019] text-[10px] uppercase font-black border border-[#FC8019]/20">
                          {tr.status}
                        </span>
                        <p className="text-xs text-gray-450">{tr.transitEta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: WASTAGE LOGS */}
          {activeTab === 'wastage' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-base font-black uppercase tracking-wider text-white">Portion Spoilage & Wastage Roster</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 text-xs">
                        <th className="pb-3 font-black uppercase tracking-widest">ID</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Ingredient</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Quantity</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Wastage Reason</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Loss (INR)</th>
                        <th className="pb-3 font-black uppercase tracking-widest">Log Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs font-bold">
                      {wastages.map(w => (
                        <tr key={w.id} className="hover:bg-white/5 transition-colors text-gray-300">
                          <td className="py-4 text-cyan-400">{w.id}</td>
                          <td className="py-4 text-white">{w.ingredient}</td>
                          <td className="py-4">{w.qty}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20">{w.reason}</span>
                          </td>
                          <td className="py-4 text-primary">₹{w.cost}</td>
                          <td className="py-4">{w.employee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: SUPPLIERS PERFORMANCE */}
          {activeTab === 'suppliers' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] rounded-3xl border border-gray-850 p-6 space-y-6">
                <h3 className="text-base font-black uppercase tracking-wider text-white">Vendor Performance Telemetry</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold">
                  {MOCK_SUPPLIERS.map((sup, idx) => (
                    <div key={idx} className="p-5 bg-[#070A13] border border-gray-850 rounded-2.5xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-white text-sm font-black">{sup.name}</h4>
                        <span className="text-amber-500">★ {sup.rating}</span>
                      </div>
                      <p className="text-gray-400">GST: {sup.gst}</p>
                      <p className="text-gray-300">Pending Orders: {sup.pendingOrders}</p>
                      <p className="text-emerald-400 font-black">Outstanding Balance: ₹{sup.balance}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: FORECASTING ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="bg-[#0F1524] p-6 md:p-8 rounded-[2.5rem] border border-gray-850 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Consumption & Shortage Projection</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CONSUMPTION_FORECAST} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="day" stroke="#4B5563" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis stroke="#4B5563" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F1524', borderColor: '#1F2937' }} />
                      <Area type="monotone" dataKey="consumption" stroke="#10B981" strokeWidth={3} fill="#10B981" fillOpacity={0.05} />
                      <Area type="monotone" dataKey="forecast" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.05} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};

export default AdminSupplyWaste;
