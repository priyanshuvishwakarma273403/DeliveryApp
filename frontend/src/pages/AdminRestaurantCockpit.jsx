import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, QrCode, BookOpen, Layers, Settings, AlertTriangle, 
  Plus, Trash2, ShieldCheck, DollarSign, Clock, Play, FileSpreadsheet
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { toast } from 'react-hot-toast';

const mockBranches = [
  { id: 'BR-101', city: 'Delhi (South Ext)', menuSize: 42, activeStaff: 12, sales: 48000, timing: '08:00 AM - 11:30 PM' },
  { id: 'BR-102', city: 'Lucknow (Hazratganj)', menuSize: 36, activeStaff: 8, sales: 32000, timing: '09:00 AM - 10:00 PM' },
  { id: 'BR-103', city: 'Noida (Sector 62)', menuSize: 50, activeStaff: 16, sales: 64000, timing: '24 Hours (Midnight Active)' }
];

const mockInventory = [
  { name: 'Fresh Paneer', qty: '8.5 kg', limit: '10 kg', status: 'LOW' },
  { name: 'Mozzarella Cheese', qty: '24.0 kg', limit: '15 kg', status: 'OK' },
  { name: 'Roma Tomatoes', qty: '4.2 kg', limit: '12 kg', status: 'LOW' },
  { name: 'Tandoori Chicken', qty: '18.0 kg', limit: '10 kg', status: 'OK' },
  { name: 'Olive Oil', qty: '5.0 L', limit: '8 L', status: 'LOW' }
];

const mockRecipes = [
  { name: 'Paneer Butter Masala', ingredients: 'Paneer (200g), Butter (30g), Gravy base (150g)', time: '14 mins', cost: 120, calories: '480 kcal' },
  { name: 'Margherita Pizza', ingredients: 'Dough (180g), Cheese (100g), Tomato sauce (80g)', time: '8 mins', cost: 95, calories: '620 kcal' }
];

const mockKitchenOrders = [
  { id: '#501', dish: 'Paneer Butter Masala + Naan', status: 'COOKING', timeElapsed: '8m' },
  { id: '#502', dish: 'Double Cheese Margherita Pizza', status: 'PREPARING', timeElapsed: '3m' },
  { id: '#503', dish: 'Tandoori Chicken Wings', status: 'QUEUED', timeElapsed: '1m' }
];

const AdminRestaurantCockpit = () => {
  const [activeTab, setActiveTab] = useState('branches'); // branches, inventory, recipes, qr, kitchen, zones
  const [branches, setBranches] = useState(mockBranches);
  const [inventory, setInventory] = useState(mockInventory);
  const [recipes, setRecipes] = useState(mockRecipes);
  const [kitchenOrders, setKitchenOrders] = useState(mockKitchenOrders);

  // Forms
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchTiming, setNewBranchTiming] = useState('09:00 AM - 11:00 PM');
  
  // Tax / Delivery parameters
  const [taxCgst, setTaxCgst] = useState(9); // 9%
  const [taxSgst, setTaxSgst] = useState(9); // 9%
  const [deliveryBase, setDeliveryBase] = useState(40);
  const [deliverySurge, setDeliverySurge] = useState(1.5);

  const handleAddBranch = (e) => {
    e.preventDefault();
    if (!newBranchCity.trim()) return;
    const newBr = {
      id: `BR-${Math.floor(Math.random() * 900) + 100}`,
      city: newBranchCity,
      menuSize: 30,
      activeStaff: 5,
      sales: 0,
      timing: newBranchTiming
    };
    setBranches([...branches, newBr]);
    setNewBranchCity('');
    toast.success('New branch registered successfully!');
  };

  const handlePrintQR = () => {
    toast.success('QR Menu generated! Preparing print PDF layout...', { icon: '🖨️' });
  };

  const handleAdvanceOrderStatus = (id) => {
    setKitchenOrders(prev => prev.map(order => {
      if (order.id === id) {
        const nextStatus = order.status === 'QUEUED' ? 'PREPARING' : order.status === 'PREPARING' ? 'COOKING' : 'READY';
        return { ...order, status: nextStatus };
      }
      return order;
    }).filter(order => order.status !== 'READY'));
    toast.success(`Order ${id} progress updated!`);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white p-6 md:p-10 font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Enterprise Vendor Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            <Building className="text-cyan-400" size={36} />
            Restaurant Cockpit
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Manage your multi-branch configurations, inventory alerts, recipes, dynamic delivery charges, and live kitchen dispatch screens.
          </p>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex flex-wrap gap-2 mb-8 bg-[#0F172A] p-2 rounded-2xl border border-gray-850">
        {[
          { id: 'branches', label: 'Multi-Branch Control', icon: Building },
          { id: 'inventory', label: 'Inventory & Alerts', icon: Settings },
          { id: 'recipes', label: 'Recipe Book', icon: BookOpen },
          { id: 'qr', label: 'QR Menu generator', icon: QrCode },
          { id: 'kitchen', label: 'Live Kitchen TV', icon: Play },
          { id: 'zones', label: 'Delivery Zones & Taxes', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-cyan-500 text-black font-black' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── tab panels ── */}
      <div className="bg-[#0F172A] rounded-[2.5rem] border border-gray-800 p-6 md:p-8 min-h-[480px]">
        
        {/* BRANCHES TAB */}
        {activeTab === 'branches' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Branch list */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Active Branches</h3>
                <div className="grid grid-cols-1 gap-3">
                  {branches.map((br) => (
                    <div key={br.id} className="bg-[#090D16] border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-cyan-400">{br.id}</span>
                          <span className="text-xs text-gray-400 font-bold">• {br.timing}</span>
                        </div>
                        <h4 className="text-lg font-black mt-1">{br.city}</h4>
                        <p className="text-[10px] text-gray-500 font-bold mt-1">Menu Items: {br.menuSize} • Active Kitchen Staff: {br.activeStaff}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 font-black uppercase">Today's Sales</p>
                        <p className="text-lg font-black text-emerald-400">₹{br.sales}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add branch */}
              <form onSubmit={handleAddBranch} className="lg:col-span-4 bg-[#090D16] border border-gray-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Register New Branch</h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Branch City / Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Kanpur (Swaroop Nagar)"
                    value={newBranchCity} 
                    onChange={(e) => setNewBranchCity(e.target.value)}
                    className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Operating Timings</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 08:00 AM - 12:00 AM"
                    value={newBranchTiming} 
                    onChange={(e) => setNewBranchTiming(e.target.value)}
                    className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                  />
                </div>

                <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-450 text-black font-black text-xs uppercase py-3.5 rounded-xl">
                  Register Branch
                </Button>
              </form>

            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Ingredients Stock Manager</h3>
              <span className="text-xs font-black text-rose-500 flex items-center gap-1.5">
                <AlertTriangle size={14} /> 3 Ingredients Low on Stock
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {inventory.map((item, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border transition-all ${
                  item.status === 'LOW' 
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-450' 
                    : 'border-gray-800 bg-[#090D16] text-white'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-sm">{item.name}</h4>
                    <Badge variant={item.status === 'LOW' ? 'error' : 'success'} className="text-[8px] font-black uppercase">
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold mt-2">
                    <span className="text-gray-500">Current Qty</span>
                    <span>{item.qty}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold mt-1">
                    <span className="text-gray-500">Warning Threshold</span>
                    <span>{item.limit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Recipe Book & Cost Control</h3>
            <div className="grid grid-cols-1 gap-4">
              {recipes.map((recipe, idx) => (
                <div key={idx} className="bg-[#090D16] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h4 className="font-black text-sm text-cyan-400">{recipe.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">Prep target: {recipe.time} • Calories: {recipe.calories}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest">Ingredients Allocation</p>
                    <p className="text-xs text-gray-300 font-bold mt-1">{recipe.ingredients}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-550 font-black uppercase tracking-widest">Raw Ingredient Cost</p>
                    <p className="text-sm font-black text-white mt-1">₹{recipe.cost} per portion</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR GENERATOR TAB */}
        {activeTab === 'qr' && (
          <div className="max-w-md mx-auto text-center space-y-6 py-8">
            <div className="bg-[#090D16] border border-gray-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
              <QrCode size={160} className="text-cyan-400" />
              <h3 className="text-lg font-black mt-6">Smart QR Menu Tag</h3>
              <p className="text-xs text-gray-550 font-bold mt-2 max-w-xs leading-relaxed">
                Scan this tag at dinner tables. Customers can browse digitised menu pricing, build orders, and checkout without waiting.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handlePrintQR} className="flex-1 bg-cyan-500 hover:bg-cyan-450 text-black font-black text-xs uppercase py-3.5 rounded-xl">
                Print Table QR Flyers
              </Button>
            </div>
          </div>
        )}

        {/* LIVE KITCHEN TV SCREEN */}
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Kitchen Load Monitor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Queued */}
              <div className="bg-[#090D16] border border-gray-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2">Queued ({kitchenOrders.filter(o => o.status === 'QUEUED').length})</h4>
                {kitchenOrders.filter(o => o.status === 'QUEUED').map((order) => (
                  <div key={order.id} className="p-3 bg-[#0F172A] border border-gray-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{order.dish}</p>
                      <span className="text-[9px] text-gray-500 font-bold">Ticket: {order.id}</span>
                    </div>
                    <button onClick={() => handleAdvanceOrderStatus(order.id)} className="h-7 w-7 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center transition-all">
                      ➔
                    </button>
                  </div>
                ))}
              </div>

              {/* Preparing */}
              <div className="bg-[#090D16] border border-gray-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 border-b border-gray-800 pb-2">Preparing ({kitchenOrders.filter(o => o.status === 'PREPARING').length})</h4>
                {kitchenOrders.filter(o => o.status === 'PREPARING').map((order) => (
                  <div key={order.id} className="p-3 bg-[#0F172A] border border-gray-850 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{order.dish}</p>
                      <span className="text-[9px] text-amber-400 font-bold">Elapsed: {order.timeElapsed}</span>
                    </div>
                    <button onClick={() => handleAdvanceOrderStatus(order.id)} className="h-7 w-7 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center transition-all">
                      ➔
                    </button>
                  </div>
                ))}
              </div>

              {/* Cooking */}
              <div className="bg-[#090D16] border border-gray-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 border-b border-gray-800 pb-2">Cooking ({kitchenOrders.filter(o => o.status === 'COOKING').length})</h4>
                {kitchenOrders.filter(o => o.status === 'COOKING').map((order) => (
                  <div key={order.id} className="p-3 bg-[#0F172A] border border-gray-855 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{order.dish}</p>
                      <span className="text-[9px] text-rose-400 font-bold">Fire time: {order.timeElapsed}</span>
                    </div>
                    <button onClick={() => handleAdvanceOrderStatus(order.id)} className="h-7 w-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center transition-all">
                      ✓
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ZONES AND TAXES TAB */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#686B78] mb-4">Tax Coefficients & Delivery Zones</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Delivery charges */}
              <div className="bg-[#090D16] border border-gray-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Dynamic Delivery Pricing</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Base delivery charge (within 5 km)</label>
                    <input 
                      type="number" 
                      value={deliveryBase}
                      onChange={(e) => setDeliveryBase(Number(e.target.value))}
                      className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Dynamic peak multiplier (Night/Surge hours)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={deliverySurge}
                      onChange={(e) => setDeliverySurge(Number(e.target.value))}
                      className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                    />
                  </div>
                </div>
              </div>

              {/* SGST / CGST config */}
              <div className="bg-[#090D16] border border-gray-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Tax Matrix Rules</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">CGST Coefficient (%)</label>
                    <input 
                      type="number" 
                      value={taxCgst}
                      onChange={(e) => setTaxCgst(Number(e.target.value))}
                      className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">SGST Coefficient (%)</label>
                    <input 
                      type="number" 
                      value={taxSgst}
                      onChange={(e) => setTaxSgst(Number(e.target.value))}
                      className="w-full bg-[#090D16] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-cyan-500" 
                    />
                  </div>
                </div>
              </div>

            </div>

            <Button 
              onClick={() => toast.success('Tax rules & delivery matrix settings saved globally!')}
              className="w-full bg-cyan-500 hover:bg-cyan-450 text-black font-black text-xs uppercase py-3.5 rounded-xl mt-6"
            >
              Save Configuration Settings
            </Button>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminRestaurantCockpit;
