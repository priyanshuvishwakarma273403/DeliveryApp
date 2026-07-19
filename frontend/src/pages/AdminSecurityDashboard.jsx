import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Lock, 
  Key, 
  Terminal, 
  Globe, 
  Smartphone, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert,
  Search,
  Sliders,
  Cpu,
  Package,
  ShoppingBag,
  TrendingUp,
  Leaf,
  Eye,
  Globe as GlobeIcon,
  FlaskConical,
  Network,
  Image as ImageIcon,
  Compass,
  CloudRain,
  Building,
  Home as HomeIcon,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuthStore, ROLE_PERMISSIONS } from '../store/authStore';
import { toast } from 'react-hot-toast';

const AdminSecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState('users'); // users, logs, sessions, rbac
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState('ALL');
  
  const { 
    users, 
    securityLogs, 
    sessions,
    lockedAccounts,
    failedLogins,
    adminUpdateUserRole,
    adminToggleUserStatus,
    adminDeleteUser,
    terminateSession,
    unlockAccount
  } = useAuthStore();

  // 1. Calculate Live security metrics
  const totalLogins = securityLogs.filter(l => l.action === 'LOGIN_SUCCESS').length;
  const totalFailed = securityLogs.filter(l => l.action === 'LOGIN_FAILURE').length;
  const lockedCount = Object.keys(lockedAccounts).length;
  const activeSessionsCount = sessions.length || 3; // Fallback simulation

  // 2. Filter users
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Filter security logs
  const filteredLogs = securityLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.status === logFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 h-auto lg:h-screen bg-white border-r border-gray-100 p-8 lg:sticky lg:top-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-primary p-1.5 rounded-lg">
              <span className="text-white font-black text-xl tracking-tighter">F</span>
            </div>
            <span className="text-xl font-black text-primary">FoodIQAdmin</span>
          </div>

          <nav className="space-y-4">
            <Link to="/admin" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link to="/admin/restaurants" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
              <Package size={20} /> Restaurants
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
              <ShoppingBag size={20} /> Manage Orders
            </Link>
            <Link to="/admin/iam" className="flex items-center gap-4 text-primary font-black bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <ShieldCheck size={20} /> IAM Security
            </Link>
            <Link to="/admin/copilot" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Cpu size={20} /> AI Copilot
            </Link>
            <Link to="/admin/ops" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <Activity size={20} /> AI Mission Control
            </Link>
            <Link to="/admin/supply-waste" className="flex items-center gap-4 text-emerald-600 font-black hover:text-emerald-500 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 transition-all">
              <Leaf size={20} /> Supply & Waste Intel
            </Link>
            <Link to="/admin/customer-intel" className="flex items-center gap-4 text-indigo-600 font-black hover:text-indigo-500 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 transition-all">
              <Users size={20} /> Customer Intel
            </Link>
            <Link to="/admin/simulations" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <Sliders size={20} /> AI Simulations
            </Link>
            <Link to="/admin/kitchen-vision" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Eye size={20} /> Kitchen Vision
            </Link>
            <Link to="/admin/business-forecast" className="flex items-center gap-4 text-violet-600 font-black hover:text-violet-500 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 transition-all">
              <TrendingUp size={20} /> Business Forecast
            </Link>
            <Link to="/admin/knowledge-graph" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Network size={20} /> Knowledge Graph
            </Link>
            <Link to="/admin/experiments" className="flex items-center gap-4 text-purple-600 font-black hover:text-purple-500 bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10 transition-all">
              <FlaskConical size={20} /> AI Experiments
            </Link>
            <Link to="/admin/global-intel" className="flex items-center gap-4 text-emerald-600 font-black hover:text-emerald-500 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 transition-all">
              <Globe size={20} /> Global Intel
            </Link>
            <Link to="/admin/image-verification" className="flex items-center gap-4 text-amber-600 font-black hover:text-amber-500 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 transition-all">
              <ImageIcon size={20} /> AI Image Audit
            </Link>
            <Link to="/admin/plate-designer" className="flex items-center gap-4 text-cyan-600 font-black hover:text-cyan-500 bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10 transition-all">
              <Compass size={20} /> AI Plate Designer
            </Link>
            <Link to="/admin/delivery-risk" className="flex items-center gap-4 text-rose-600 font-black hover:text-rose-500 bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 transition-all">
              <CloudRain size={20} /> AI Delivery Risk
            </Link>
            <Link to="/admin/restaurant-cockpit" className="flex items-center gap-4 text-teal-600 font-black hover:text-teal-500 bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10 transition-all">
              <Building size={20} /> Restaurant Cockpit
            </Link>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Link to="/" className="flex items-center gap-4 text-text-secondary font-bold hover:text-primary p-4 rounded-2xl transition-all">
                <HomeIcon size={20} /> Back to Home
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 lg:p-12 overflow-hidden">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-text-primary flex items-center gap-3">
                <ShieldCheck className="text-primary" size={32} /> IAM & Security Cockpit
              </h1>
              <p className="text-text-secondary font-medium mt-1">Enterprise Identity & Security Auditing Control Panel</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  toast.success('Security registry synced successfully');
                }}
                className="bg-white p-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-text-secondary flex items-center gap-2 text-xs font-bold"
              >
                <RefreshCw size={14} /> Sync Registry
              </button>
            </div>
          </header>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-primary">{totalLogins}</h3>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Successful Logins</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-primary">{totalFailed}</h3>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Failed Logins</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-primary">{lockedCount}</h3>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Locked Accounts</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-primary">{activeSessionsCount}</h3>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active Sessions</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-4">
            {['users', 'logs', 'sessions', 'rbac'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'rbac' ? 'RBAC Permission Matrix' : `${tab} Management`}
              </button>
            ))}
          </div>

          {/* Dynamic Content */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-premium p-8 lg:p-10">
            
            {/* ── TAB 1: USERS MANAGEMENT ── */}
            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h3 className="text-lg font-black text-text-primary">Identity Directory</h3>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 w-full md:w-80">
                    <Search size={14} className="text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search directory..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-semibold w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                        <th className="pb-4">Name / ID</th>
                        <th className="pb-4">Email</th>
                        <th className="pb-4">Phone</th>
                        <th className="pb-4">Active Role</th>
                        <th className="pb-4">Security Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isLocked = lockedAccounts[u.email?.toLowerCase()] > Date.now();
                        const isFailed = (failedLogins[u.email?.toLowerCase()] || 0) > 0;
                        return (
                          <tr key={u.id} className="border-b border-gray-50 last:border-none group">
                            <td className="py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center text-xs">
                                  {u.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-text-primary">{u.name}</p>
                                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{u.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 align-middle text-sm font-semibold text-text-secondary">{u.email}</td>
                            <td className="py-4 align-middle text-sm font-semibold text-text-secondary">{u.phone || 'N/A'}</td>
                            <td className="py-4 align-middle">
                              <select 
                                value={u.role}
                                onChange={(e) => {
                                  adminUpdateUserRole(u.id, e.target.value);
                                  toast.success(`Role updated to ${e.target.value}`);
                                }}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-text-primary focus:outline-none"
                              >
                                <option value="SUPER_ADMIN">Super Admin</option>
                                <option value="PLATFORM_ADMIN">Platform Admin</option>
                                <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                                <option value="BRANCH_MANAGER">Branch Manager</option>
                                <option value="KITCHEN_STAFF">Kitchen Staff</option>
                                <option value="CASHIER">Cashier</option>
                                <option value="DELIVERY_PARTNER">Delivery Partner</option>
                                <option value="SUPPORT_EXECUTIVE">Support Executive</option>
                                <option value="MODERATOR">Moderator</option>
                                <option value="CUSTOMER">Customer</option>
                              </select>
                            </td>
                            <td className="py-4 align-middle">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant={u.active ? 'success' : 'error'}>
                                  {u.active ? 'Active' : 'Suspended'}
                                </Badge>
                                {isLocked && (
                                  <Badge variant="error" className="flex items-center gap-1">
                                    <Lock size={10} /> Locked
                                  </Badge>
                                )}
                                {!isLocked && isFailed && (
                                  <Badge variant="warning">
                                    {failedLogins[u.email?.toLowerCase()]} Failures
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 align-middle text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isLocked && (
                                  <button
                                    onClick={() => {
                                      unlockAccount(u.email);
                                      toast.success('Account unlocked');
                                    }}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                    title="Unlock Account"
                                  >
                                    <Key size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    adminToggleUserStatus(u.id);
                                    toast.success(u.active ? 'User suspended' : 'User activated');
                                  }}
                                  className={`p-2 rounded-xl transition-all ${
                                    u.active 
                                      ? 'text-rose-600 hover:bg-rose-50' 
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={u.active ? 'Suspend User' : 'Activate User'}
                                >
                                  {u.active ? <Lock size={14} /> : <CheckCircle size={14} />}
                                </button>
                                <button
                                  onClick={() => {
                                    adminDeleteUser(u.id);
                                    toast.success('User deleted successfully');
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 2: SECURITY LOGS (READ-ONLY AUDIT TRAIL) ── */}
            {activeTab === 'logs' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-black text-text-primary">System Audit Log</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Immutable records of all critical authentication events</p>
                  </div>
                  <div className="flex gap-2">
                    {['ALL', 'SUCCESS', 'FAILED', 'WARNING'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setLogFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          logFilter === status 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white border-gray-200 text-text-secondary hover:bg-gray-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                        <th className="pb-4">Timestamp</th>
                        <th className="pb-4">Entity</th>
                        <th className="pb-4">Security Action</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Device & OS</th>
                        <th className="pb-4">Location (IP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-50 last:border-none">
                          <td className="py-4 align-middle text-xs font-semibold text-text-secondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 align-middle">
                            <div>
                              <p className="text-sm font-black text-text-primary">{log.username || 'System'}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">{log.email || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="py-4 align-middle">
                            <span className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                              <Terminal size={12} className="text-primary" />
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 align-middle">
                            <Badge variant={
                              log.status === 'SUCCESS' ? 'success' : 
                              log.status === 'WARNING' ? 'warning' : 'error'
                            }>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-4 align-middle">
                            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                              <Smartphone size={12} className="text-gray-400" />
                              {log.device} ({log.browser} on {log.os})
                            </div>
                          </td>
                          <td className="py-4 align-middle">
                            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                              <Globe size={12} className="text-gray-400" />
                              {log.location} ({log.ip})
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-gray-500 font-bold">
                            No audit log records found matching this status filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 3: ACTIVE SESSIONS ── */}
            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg font-black text-text-primary mb-2">Live Session Manager</h3>
                <p className="text-xs text-text-secondary mb-8">View and revoke active authentication contexts and tokens in real-time</p>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Active session items */}
                  {sessions.length > 0 ? (
                    sessions.map((sess) => (
                      <div key={sess.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between h-48 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              Active Context
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {sess.id}
                            </span>
                          </div>
                          <p className="text-sm font-black text-text-primary mb-1">
                            {sess.browser} on {sess.os} ({sess.device})
                          </p>
                          <p className="text-xs text-text-secondary font-bold">
                            IP: {sess.ip} • {sess.location}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-150">
                          <span className="text-[10px] font-semibold text-gray-400">
                            Logged: {new Date(sess.loginTime).toLocaleTimeString()}
                          </span>
                          <button
                            onClick={() => {
                              terminateSession(sess.id);
                              toast.success('Session revoked successfully');
                            }}
                            className="text-xs font-black uppercase text-rose-600 hover:underline"
                          >
                            Revoke Token
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Default fallback simulations
                    [1, 2, 3].map((i) => (
                      <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between h-48 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              Active Context
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              sess-sim-{i}
                            </span>
                          </div>
                          <p className="text-sm font-black text-text-primary mb-1">
                            Chrome on macOS (Desktop)
                          </p>
                          <p className="text-xs text-text-secondary font-bold">
                            IP: 192.168.1.1{i} • Delhi, India
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-150">
                          <span className="text-[10px] font-semibold text-gray-400">
                            Logged: 15:00:38
                          </span>
                          <button
                            onClick={() => {
                              toast.success('Simulated token revoked');
                            }}
                            className="text-xs font-black uppercase text-rose-600 hover:underline"
                          >
                            Revoke Token
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: RBAC PERMISSION MATRIX ── */}
            {activeTab === 'rbac' && (
              <div>
                <h3 className="text-lg font-black text-text-primary mb-2">Role-Based Access Control Map</h3>
                <p className="text-xs text-text-secondary mb-8">Granular permission rules, authorization limits, and permission scopes for all 10 user types</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="pb-4 w-48">Scope / Policy Permission</th>
                        {Object.keys(ROLE_PERMISSIONS).map(role => (
                          <th key={role} className="pb-4 text-center px-2 text-[8px] max-w-[80px] break-words">
                            {role.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Pull unique list of permissions */}
                      {ROLE_PERMISSIONS.SUPER_ADMIN.map((perm) => (
                        <tr key={perm} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 font-black text-xs text-text-primary align-middle">
                            {perm.replace('_', ' ')}
                          </td>
                          {Object.keys(ROLE_PERMISSIONS).map((role) => {
                            const hasPermission = ROLE_PERMISSIONS[role].includes(perm);
                            return (
                              <td key={`${role}-${perm}`} className="py-3 text-center align-middle">
                                <div className="flex justify-center">
                                  {hasPermission ? (
                                    <div className="h-5 w-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                                      <CheckCircle size={12} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center border border-gray-100">
                                      <AlertTriangle size={12} />
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSecurityDashboard;
