import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';
import AiChat from './components/common/AiChat';
import SocialProof from './components/common/SocialProof';
import CartDrawer from './components/cart/CartDrawer';
import { Spinner } from './components/common/Loader'; 
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/common/ScrollToTop';
import { useEffect } from 'react';
import { WebSocketProvider } from './providers/WebSocketProvider';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminRestaurants = lazy(() => import('./pages/AdminRestaurants'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSales = lazy(() => import('./pages/AdminSales'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));


const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const DeliveryPartnerCTA = lazy(() => import('./pages/DeliveryPartnerCTA'));
const FoodIQGold = lazy(() => import('./pages/FoodIQGold'));
const Profile = lazy(() => import('./pages/Profile'));
const Blogs = lazy(() => import('./pages/Blogs'));
const AdminBlogs = lazy(() => import('./pages/AdminBlogs'));
const AdminDigitalTwin = lazy(() => import('./pages/AdminDigitalTwin'));
const AdminCopilot = lazy(() => import('./pages/AdminCopilot'));
const AdminOpsCenter = lazy(() => import('./pages/AdminOpsCenter'));
const AdminSupplyWaste = lazy(() => import('./pages/AdminSupplyWaste'));
const AdminCustomerIntelligence = lazy(() => import('./pages/AdminCustomerIntelligence'));
const AdminSimulations = lazy(() => import('./pages/AdminSimulations'));
const AdminKitchenVision = lazy(() => import('./pages/AdminKitchenVision'));
const AdminBusinessForecast = lazy(() => import('./pages/AdminBusinessForecast'));
const AdminKnowledgeGraph = lazy(() => import('./pages/AdminKnowledgeGraph'));
const AdminExperiments = lazy(() => import('./pages/AdminExperiments'));
const AdminGlobalIntelligence = lazy(() => import('./pages/AdminGlobalIntelligence'));
const AdminImageVerification = lazy(() => import('./pages/AdminImageVerification'));
const AdminPlateDesigner = lazy(() => import('./pages/AdminPlateDesigner'));
const AdminDeliveryRisk = lazy(() => import('./pages/AdminDeliveryRisk'));
const RestaurantBattle = lazy(() => import('./pages/RestaurantBattle'));
const CelebrationPlanner = lazy(() => import('./pages/CelebrationPlanner'));
const FoodieFeed = lazy(() => import('./pages/FoodieFeed'));
const DiningOut = lazy(() => import('./pages/DiningOut'));
const LiveEvents = lazy(() => import('./pages/DiningOut')); // Using DiningOut as placeholder for now

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles.length > 0 && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PageLoader = () => (
  <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
    <Spinner size={48} />
    <p className="text-gray-500 font-bold animate-pulse">Loading awesome food...</p>
  </div>
);

function App() {
  useEffect(() => {
    // Handle Chunk Load Errors (dynamic import failures when files change on deploy)
    const handleError = (e) => {
      if (e.message?.includes('Failed to fetch dynamically imported module') || 
          e.message?.includes('Importing a module script failed')) {
        console.warn('Chunk load error detected, reloading page...');
        window.location.reload();
      }
    };
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/restaurants" element={<Restaurants />} />
                  <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/delivery" element={<DeliveryPartnerCTA />} />
                  <Route path="/gold" element={<FoodIQGold />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/battle" element={<RestaurantBattle />} />
                  <Route path="/celebration-planner" element={<CelebrationPlanner />} />
                  <Route path="/checkout" element={<ProtectedRoute roles={['CUSTOMER']}><Checkout /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute roles={['CUSTOMER']}><Orders /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute roles={['CUSTOMER']}><OrderDetail /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute roles={['CUSTOMER']}><Profile /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/restaurants" element={<ProtectedRoute roles={['ADMIN']}><AdminRestaurants /></ProtectedRoute>} />
                  <Route path="/admin/restaurants/:id/twin" element={<ProtectedRoute roles={['ADMIN']}><AdminDigitalTwin /></ProtectedRoute>} />
                  <Route path="/admin/copilot" element={<ProtectedRoute roles={['ADMIN']}><AdminCopilot /></ProtectedRoute>} />
                  <Route path="/admin/ops" element={<ProtectedRoute roles={['ADMIN']}><AdminOpsCenter /></ProtectedRoute>} />
                  <Route path="/admin/supply-waste" element={<ProtectedRoute roles={['ADMIN']}><AdminSupplyWaste /></ProtectedRoute>} />
                  <Route path="/admin/customer-intel" element={<ProtectedRoute roles={['ADMIN']}><AdminCustomerIntelligence /></ProtectedRoute>} />
                  <Route path="/admin/simulations" element={<ProtectedRoute roles={['ADMIN']}><AdminSimulations /></ProtectedRoute>} />
                  <Route path="/admin/kitchen-vision" element={<ProtectedRoute roles={['ADMIN']}><AdminKitchenVision /></ProtectedRoute>} />
                  <Route path="/admin/business-forecast" element={<ProtectedRoute roles={['ADMIN']}><AdminBusinessForecast /></ProtectedRoute>} />
                  <Route path="/admin/knowledge-graph" element={<ProtectedRoute roles={['ADMIN']}><AdminKnowledgeGraph /></ProtectedRoute>} />
                  <Route path="/admin/experiments" element={<ProtectedRoute roles={['ADMIN']}><AdminExperiments /></ProtectedRoute>} />
                  <Route path="/admin/global-intel" element={<ProtectedRoute roles={['ADMIN']}><AdminGlobalIntelligence /></ProtectedRoute>} />
                  <Route path="/admin/image-verification" element={<ProtectedRoute roles={['ADMIN']}><AdminImageVerification /></ProtectedRoute>} />
                  <Route path="/admin/plate-designer" element={<ProtectedRoute roles={['ADMIN']}><AdminPlateDesigner /></ProtectedRoute>} />
                  <Route path="/admin/delivery-risk" element={<ProtectedRoute roles={['ADMIN']}><AdminDeliveryRisk /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/blogs" element={<ProtectedRoute roles={['ADMIN']}><AdminBlogs /></ProtectedRoute>} />
                  <Route path="/admin/sales" element={<ProtectedRoute roles={['ADMIN']}><AdminSales /></ProtectedRoute>} />


                  <Route path="/delivery/dashboard" element={<ProtectedRoute roles={['DELIVERY_PARTNER']}><DeliveryDashboard /></ProtectedRoute>} />
                  <Route path="/feed" element={<ProtectedRoute roles={['CUSTOMER']}><FoodieFeed /></ProtectedRoute>} />
                  <Route path="/dining" element={<DiningOut />} />
                  <Route path="/events" element={<LiveEvents />} />
                  <Route path="*" element={<NotFound />} />

                </Route>
              </Routes>
            </Suspense>
            <AiChat />
            <SocialProof />

            <CartDrawer />
            <Toaster position="bottom-right" />
          </BrowserRouter>
        </WebSocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
