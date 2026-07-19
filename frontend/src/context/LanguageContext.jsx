import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    heroTitle: "Crave the",
    heroSubtitle: "Best Food",
    heroDesc: "Discover 10,000+ dishes from top-rated kitchens. Freshness delivered in 30 mins.",
    searchPlaceholder: "Search for restaurants, cuisines or a dish...",
    findFood: "Find Food",
    selectLocation: "Select Location",
    deliveringTo: "Delivering to",
    goldJoin: "Join FoodIQ Gold",
    goldManage: "Manage Gold",
    myProfile: "My Profile",
    myOrders: "My Orders",
    login: "Login",
    signUp: "Sign Up",
    logout: "Logout",
    cart: "Cart",
    home: "Home",
    dining: "Dining",
    events: "Events",
    battleArena: "Battle Arena",
    partyPlanner: "Party Planner",
    restaurants: "Restaurants",
    adminPanel: "Admin Panel",
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    whyChoose: "Why Choose FoodIQ?",
    whyChooseSub: "India's most trusted food delivery platform",
    fastDelivery: "Lightning Fast",
    fastDeliveryDesc: "Average delivery in just 25-35 minutes, guaranteed fresh.",
    safeHygienic: "Safe & Hygienic",
    safeHygienicDesc: "Every restaurant is quality-checked and hygiene-verified.",
    choices: "10,000+ Choices",
    choicesDesc: "From local street food to fine dining, we have the largest variety in India."
  },
  hi: {
    heroTitle: "स्वादिष्ट भोजन",
    heroSubtitle: "की लालसा",
    heroDesc: "शीर्ष रेटेड रसोइयों से 10,000+ व्यंजनों की खोज करें। 30 मिनट में ताज़ा डिलीवरी।",
    searchPlaceholder: "रेस्तरां, व्यंजन या पकवान खोजें...",
    findFood: "भोजन खोजें",
    selectLocation: "स्थान चुनें",
    deliveringTo: "यहाँ डिलीवर हो रहा है",
    goldJoin: "FoodIQ गोल्ड में शामिल हों",
    goldManage: "गोल्ड प्रबंधित करें",
    myProfile: "मेरी प्रोफ़ाइल",
    myOrders: "मेरे ऑर्डर",
    login: "लॉगिन",
    signUp: "साइन अप",
    logout: "लॉगआउट",
    cart: "कार्ट",
    home: "होम",
    dining: "डाइनिंग",
    events: "इवेंट्स",
    battleArena: "बैटल एरीना",
    partyPlanner: "पार्टी प्लानर",
    restaurants: "रेस्तरां",
    adminPanel: "एडमिन पैनल",
    language: "भाषा",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    whyChoose: "FoodIQ क्यों चुनें?",
    whyChooseSub: "भारत का सबसे भरोसेमंद भोजन वितरण मंच",
    fastDelivery: "बिजली जैसी तेज़",
    fastDeliveryDesc: "औसत डिलीवरी केवल 25-35 मिनट में, ताज़गी की गारंटी।",
    safeHygienic: "सुरक्षित और स्वच्छ",
    safeHygienicDesc: "हर रेस्तरां की गुणवत्ता की जांच और स्वच्छता की पुष्टि की जाती है।",
    choices: "10,000+ विकल्प",
    choicesDesc: "स्थानीय स्ट्रीट फूड से लेकर बढ़िया डाइनिंग तक, हमारे पास भारत में सबसे बड़ी विविधता है।"
  },
  es: {
    heroTitle: "Antojo de la",
    heroSubtitle: "Mejor Comida",
    heroDesc: "Descubre más de 10,000 platos de cocinas de primera categoría. Frescura entregada en 30 min.",
    searchPlaceholder: "Busca restaurantes, cocinas o un plato...",
    findFood: "Buscar Comida",
    selectLocation: "Seleccionar Ubicación",
    deliveringTo: "Entregando en",
    goldJoin: "Únete a FoodIQ Gold",
    goldManage: "Administrar Gold",
    myProfile: "Mi Perfil",
    myOrders: "Mis Pedidos",
    login: "Iniciar sesión",
    signUp: "Registrarse",
    logout: "Cerrar sesión",
    cart: "Carrito",
    home: "Inicio",
    dining: "Comedor",
    events: "Eventos",
    battleArena: "Arena de Batalla",
    partyPlanner: "Planificador de Fiestas",
    restaurants: "Restaurantes",
    adminPanel: "Panel de Admin",
    language: "Idioma",
    darkMode: "Modo Oscuro",
    lightMode: "Modo Claro",
    whyChoose: "¿Por qué elegir FoodIQ?",
    whyChooseSub: "La plataforma de entrega de comida más confiable de la India",
    fastDelivery: "Rápido como el Rayo",
    fastDeliveryDesc: "Entrega promedio en solo 25-35 minutos, frescura garantizada.",
    safeHygienic: "Seguro e Higiénico",
    safeHygienicDesc: "Cada restaurante está verificado en calidad e higiene.",
    choices: "Más de 10,000 Opciones",
    choicesDesc: "Desde comida callejera local hasta cenas elegantes, tenemos la mayor variedad en la India."
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('foodiq_lang') || 'en';
  });

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('foodiq_lang', lang);
    }
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
