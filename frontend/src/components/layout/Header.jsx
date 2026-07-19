import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  LogOut,
  ChevronDown,
  Mic,
  Home,
  UtensilsCrossed,
  ClipboardList,
  UserCircle,
  ShoppingBag,
  Crown,
  Coins,
  ChevronRight,
  Utensils,
  Ticket,
  Swords,
  Calendar,
  Globe,
  Sun,
  Moon,
  Star
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { useWalletStore } from '../../store/walletStore';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../context/LanguageContext';
import WalletBadge from '../wallet/WalletBadge';
import Button from '../common/Button';
import LocationModal from './LocationModal';
import { cn } from '../../utils/cn';
import apiClient from '../../api/axios';


const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { user, logout, isAuthenticated } = useAuthStore();
  const { items, toggleDrawer } = useCartStore();
  const { currentLocation } = useLocationStore();
  const wallet = useWalletStore();
  const coins = wallet?.coins ?? 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      navigate(`/restaurants?search=${transcript}`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setShowResults(false);
    setIsLangDropdownOpen(false);
  }, [location.pathname]);

  // Autocomplete logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const response = await apiClient.get(`/search/autocomplete?q=${searchQuery}`);
          setSearchResults(response.data);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('#profile-dropdown')) setIsProfileOpen(false);
    };
    if (isProfileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileOpen]);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('#lang-dropdown')) setIsLangDropdownOpen(false);
    };
    if (isLangDropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isLangDropdownOpen]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const bottomNavItems = [
    { icon: Home, label: t('home'), to: '/' },
    { icon: Utensils, label: t('dining'), to: '/dining' },
    { icon: ShoppingBag, label: t('cart'), to: '/cart', badge: cartItemCount },
    { icon: ClipboardList, label: t('myOrders'), to: isAuthenticated ? '/orders' : '/login' },
    { icon: UserCircle, label: t('myProfile'), to: isAuthenticated ? '/profile' : '/login' },
  ];


  return (
    <>
      {/* Main Header */}
      <header className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        isScrolled 
          ? 'bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 shadow-sm' 
          : 'bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800'
      )}>
        <div className="container mx-auto px-4 md:px-6 flex items-center gap-2 md:gap-4 h-16 md:h-[72px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
              <span className="text-white font-black text-lg md:text-xl tracking-tighter">F</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-primary hidden sm:block tracking-tight">FoodIQ</span>
          </Link>

          {/* Location Selector */}
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/45 transition-all group max-w-[180px]"
          >
            <MapPin className="text-primary shrink-0" size={18} strokeWidth={2.5} />
            <div className="text-left overflow-hidden">
              <p className="text-[11px] text-[#686B78] dark:text-gray-400 font-medium leading-none mb-0.5">{t('deliveringTo')}</p>
              <p className="text-sm font-bold text-[#1C1C1C] dark:text-white truncate">{currentLocation?.name || t('selectLocation')}</p>
            </div>
            <ChevronDown size={16} className="text-[#686B78] group-hover:text-primary transition-colors shrink-0 ml-1" />
          </button>

          <div className="hidden lg:flex items-center gap-0.5 bg-gray-50 dark:bg-gray-800/30 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shrink-0">
            {[
              { label: t('home'), icon: ShoppingBag, path: '/', color: 'text-primary' },
              { label: t('dining'), icon: Utensils, path: '/dining', color: 'text-blue-600' },
              { label: t('events'), icon: Ticket, path: '/events', color: 'text-purple-600' },
              { label: t('battleArena'), icon: Swords, path: '/battle', color: 'text-orange-600' },
              { label: t('partyPlanner'), icon: Calendar, path: '/celebration-planner', color: 'text-rose-600' },
            ].map((nav) => (
              <Link 
                key={nav.path} 
                to={nav.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 font-bold text-xs whitespace-nowrap",
                  location.pathname === nav.path 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-[#1C1C1C] dark:text-white" 
                    : "text-gray-400 hover:text-[#1C1C1C] dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/30"
                )}
              >
                <nav.icon size={14} className={location.pathname === nav.path ? nav.color : 'text-gray-400'} />
                {nav.label}
              </Link>
            ))}
          </div>


          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686B78] group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="w-full bg-[#F5F5F6] dark:bg-gray-800 border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary/5 rounded-xl pl-11 pr-12 py-3 text-sm outline-none transition-all text-[#1C1C1C] dark:text-white font-medium placeholder:text-[#9093A4] placeholder:font-normal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/restaurants?search=${searchQuery}`);
                    setShowResults(false);
                  }
                }}
              />
              <button 
                onClick={handleVoiceSearch}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                  isListening 
                    ? "text-primary animate-pulse bg-primary/10" 
                    : "text-[#686B78] hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Mic size={18} />
              </button>

              {/* Autocomplete Results */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[60]"
                  >
                    <div className="py-2">
                      {searchResults.map((res) => (
                        <button
                          key={res.id}
                          onClick={() => {
                            navigate(`/restaurant/${res.id}`);
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors text-left"
                        >
                          <Search size={14} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-[#1C1C1C] dark:text-white">{res.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{res.cuisineType} • {res.city}</p>
                          </div>
                          {res.rating && (
                            <div className="ml-auto flex items-center gap-1 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded text-[10px] font-black text-green-600 dark:text-green-400">
                              {res.rating} <Star size={8} fill="currentColor" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">


            {/* Language Selector Dropdown */}
            <div className="relative" id="lang-dropdown">
              <button 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#1C1C1C] dark:text-gray-300 flex items-center gap-1"
                title={t('language')}
              >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{language}</span>
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-850 overflow-hidden z-50 py-1">
                  <button 
                    onClick={() => { changeLanguage('en'); setIsLangDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-850", language === 'en' ? 'text-primary' : 'text-text-secondary dark:text-gray-400')}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => { changeLanguage('hi'); setIsLangDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-855", language === 'hi' ? 'text-primary' : 'text-text-secondary dark:text-gray-400')}
                  >
                    हिन्दी
                  </button>
                  <button 
                    onClick={() => { changeLanguage('es'); setIsLangDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-855", language === 'es' ? 'text-primary' : 'text-text-secondary dark:text-gray-400')}
                  >
                    Español
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && <WalletBadge />}

            {/* Cart */}
            <button 
              onClick={() => toggleDrawer(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors group"
            >
              <div className="relative">
                <ShoppingBag size={22} className="text-[#1C1C1C] dark:text-gray-300 group-hover:text-primary transition-colors" strokeWidth={2} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-[#1C1C1C] dark:text-gray-300 group-hover:text-primary transition-colors">{t('cart')}</span>
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative" id="profile-dropdown">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-bold text-[#1C1C1C] dark:text-white leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-[#686B78] dark:text-gray-400 leading-tight capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown size={14} className={cn("text-[#686B78] dark:text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#F0F0F0] dark:border-gray-800 overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-4 bg-gray-50/80 dark:bg-gray-800/40 border-b border-[#F0F0F0] dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-black">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-[#1C1C1C] dark:text-white">{user?.name}</p>
                            {user?.isPremium && (
                              <span className="bg-yellow-400 text-[10px] font-black px-1.5 py-0.5 rounded text-yellow-900 uppercase tracking-wider flex items-center gap-0.5">
                                <Crown size={8} /> Gold
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#686B78] dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Gold / Coins */}
                    {isAuthenticated && (
                      <Link to="/gold" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-[#F0F0F0] dark:border-gray-800 group">
                        <div className="flex items-center gap-2.5">
                          <Crown size={18} className="text-yellow-500" />
                          <span className="text-sm font-bold text-[#1C1C1C] dark:text-gray-300 group-hover:text-primary transition-colors font-medium">
                            {user?.isPremium ? t('goldManage') : t('goldJoin')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                          <Coins size={14} /> {coins}
                        </div>
                      </Link>
                    )}

                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1C] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors font-medium">
                        <UserCircle size={18} className="text-[#686B78]" /> {t('myProfile')}
                        <ChevronRight size={14} className="text-[#686B78] ml-auto" />
                      </Link>
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1C] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors font-medium">
                        <ShoppingCart size={18} className="text-[#686B78]" /> {t('myOrders')}
                        <ChevronRight size={14} className="text-[#686B78] ml-auto" />
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1C] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors font-medium">
                            <User size={18} className="text-[#686B78]" /> {t('adminPanel')}
                            <ChevronRight size={14} className="text-[#686B78] ml-auto" />
                          </Link>
                          <Link to="/admin/blogs" className="flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1C] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors font-medium">
                            <ClipboardList size={18} className="text-[#686B78]" /> Manage Blogs
                            <ChevronRight size={14} className="text-[#686B78] ml-auto" />
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-[#F0F0F0] dark:border-gray-800">
                      <button 
                        onClick={() => { logout(); navigate('/'); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left transition-colors font-bold"
                      >
                        <LogOut size={18} /> {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="px-5 py-2.5 text-sm font-bold text-[#1C1C1C] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">{t('login')}</button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-sm shadow-primary/20">{t('signUp')}</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right icons */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
            {/* Theme Toggle for Mobile */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#1C1C1C] dark:text-gray-300"
            >
              {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
            </button>

            {/* Language dropdown for Mobile */}
            <div className="relative" id="lang-dropdown-mobile">
              <button 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-2 rounded-xl text-[#1C1C1C] dark:text-gray-300 flex items-center gap-0.5"
              >
                <Globe size={18} />
                <span className="text-[10px] font-black uppercase">{language}</span>
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-28 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 py-1">
                  {['en', 'hi', 'es'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => { changeLanguage(lang); setIsLangDropdownOpen(false); }}
                      className={cn("w-full text-left px-3 py-1.5 text-xs font-bold uppercase", language === lang ? 'text-primary' : 'text-text-secondary dark:text-gray-400')}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'Español'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => toggleDrawer(true)} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={22} className="text-[#1C1C1C] dark:text-gray-300" strokeWidth={2} />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black h-4.5 w-4.5 min-w-[18px] rounded-full flex items-center justify-center border-2 border-white text-[9px] px-0.5">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#1C1C1C] dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9093A4]" size={16} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className="w-full bg-[#F5F5F6] dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none text-[#1C1C1C] dark:text-white font-medium placeholder:text-[#9093A4] placeholder:font-normal border border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-gray-900 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate(`/restaurants?search=${e.target.value}`);
                }
              }}
            />
          </div>
        </div>

        {/* Mobile Slide Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-[#F0F0F0] dark:border-gray-800 shadow-lg">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Link to="/restaurants" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 text-sm font-bold text-[#1C1C1C] dark:text-white border border-[#E8E8E8] dark:border-gray-800 rounded-xl hover:border-primary hover:text-primary transition-colors">{t('restaurants')}</button>
                </Link>
                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 text-sm font-bold text-[#1C1C1C] dark:text-white border border-[#E8E8E8] dark:border-gray-800 rounded-xl hover:border-primary hover:text-primary transition-colors">{t('cart')} ({cartItemCount})</button>
                </Link>
              </div>
              {isAuthenticated ? (
                <div className="border-t border-[#F0F0F0] dark:border-gray-800 pt-3 space-y-2">
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center text-white font-black text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1C] dark:text-white">{user?.name}</p>
                      <p className="text-xs text-[#686B78] dark:text-gray-450">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full py-2.5 text-sm font-bold text-[#1C1C1C] dark:text-white border border-[#E8E8E8] dark:border-gray-800 rounded-xl hover:border-primary hover:text-primary transition-colors">{t('myOrders')}</button>
                    </Link>
                    <button 
                      className="w-full py-2.5 text-sm font-bold text-red-500 border border-red-100 dark:border-red-950/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 border-t border-[#F0F0F0] dark:border-gray-800 pt-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 text-sm font-bold text-[#1C1C1C] dark:text-white border border-[#E8E8E8] dark:border-gray-800 rounded-xl hover:border-primary hover:text-primary transition-colors">{t('login')}</button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">{t('signUp')}</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-[#F0F0F0] dark:border-gray-850 z-[100] safe-pb shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around py-2.5 px-2">
          {bottomNavItems.map((item, i) => {
            const active = isActive(item.to);
            return (
              <Link 
                key={i} 
                to={item.to} 
                className={cn(
                  "flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 relative min-w-[64px]",
                  active ? "text-primary bg-primary/5 dark:bg-primary/10" : "text-[#9093A4]"
                )}
              >
                <div className="relative">
                  <item.icon 
                    size={24} 
                    strokeWidth={active ? 3 : 2} 
                    className={cn("transition-transform duration-300", active && "scale-110")}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-tight font-bold tracking-tight", 
                  active ? "text-primary" : "text-[#9093A4]"
                )}>
                  {item.label}
                </span>
                {active && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full shadow-[0_2px_8px_rgba(252,128,25,0.4)]" 
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </>


  );
};

export default Header;
