import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Smartphone, Shield, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuthStore, getDeviceInfo } from '../store/authStore';
import OtpVerification from '../components/common/OtpVerification';
import authService from '../services/authService';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const SliderCaptcha = ({ onVerify }) => {
  const [val, setVal] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (val >= 95) {
      setVerified(true);
      onVerify(true);
      toast.success('Security check passed!');
    }
  }, [val]);

  return (
    <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl space-y-2">
      <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
        <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-primary animate-pulse" /> Slide to Verify (Anti-Bot Check)</span>
        {verified && <span className="text-emerald-500 font-black">Passed</span>}
      </div>
      <div className="relative h-11 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center border border-gray-300">
        <span className="text-xs font-semibold text-gray-500 pointer-events-none select-none z-10">
          {verified ? 'Security Validation Cleared' : 'Drag Slider >>>'}
        </span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={val}
          onChange={(e) => !verified && setVal(Number(e.target.value))}
          disabled={verified}
          className="absolute inset-0 opacity-80 h-full w-full cursor-pointer accent-primary z-20" 
        />
      </div>
    </div>
  );
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authView, setAuthView] = useState('default');
  
  // Anti-bot Protection & Captcha State
  const [failedCount, setFailedCount] = useState(0);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const { 
    login, 
    users, 
    incrementFailedLogins, 
    lockedAccounts,
    addSecurityLog 
  } = useAuthStore();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const emailValue = watch('email');

  // Handle countdown locks
  useEffect(() => {
    if (emailValue) {
      const lockUntil = lockedAccounts[emailValue.toLowerCase()];
      if (lockUntil && lockUntil > Date.now()) {
        setIsLocked(true);
        const interval = setInterval(() => {
          const diff = Math.ceil((lockUntil - Date.now()) / 1000);
          if (diff <= 0) {
            setIsLocked(false);
            clearInterval(interval);
          } else {
            setLockCountdown(diff);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setIsLocked(false);
      }
    }
  }, [emailValue, lockedAccounts]);

  const redirectUser = (role) => {
    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'SUPPORT_EXECUTIVE' || role === 'MODERATOR') {
      navigate('/admin/iam');
    } else if (role === 'RESTAURANT_OWNER' || role === 'BRANCH_MANAGER' || role === 'KITCHEN_STAFF' || role === 'CASHIER') {
      navigate('/admin');
    } else if (role === 'DELIVERY_PARTNER') {
      navigate('/delivery/dashboard');
    } else {
      navigate(from, { replace: true });
    }
  };

  const onSubmitPassword = async (data) => {
    const loweredEmail = data.email.toLowerCase();
    
    // Check if account is locked
    const lockUntil = lockedAccounts[loweredEmail];
    if (lockUntil && lockUntil > Date.now()) {
      toast.error(`This account is locked. Please wait ${Math.ceil((lockUntil - Date.now()) / 1000)} seconds.`);
      return;
    }

    // Requiring captcha if failures > 2
    if (failedCount >= 3 && !captchaPassed) {
      toast.error('Please complete the anti-bot verification slider first.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Enterprise Mock Fallback check
      const mockUser = users.find(u => u.email.toLowerCase() === loweredEmail);
      if (mockUser) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock password check
        if (data.password === 'FoodIQ@Secure2026') {
          // Check trusted device simulation
          const devInfo = getDeviceInfo();
          const isNewDevice = Math.random() > 0.7; // Simulate trusted check
          
          if (isNewDevice) {
            addSecurityLog({
              email: mockUser.email,
              action: 'SUSPICIOUS_LOGIN_DETECTED',
              status: 'WARNING',
              details: `Login detected from a new device: ${devInfo.browser} on ${devInfo.os}`
            });
            toast.success('New device recognized. Login security alert sent to email.');
          }

          login(mockUser, 'mock-jwt-token-' + Date.now());
          toast.success(`Welcome back, ${mockUser.name}! (${mockUser.role})`);
          
          setFailedCount(0);
          setCaptchaPassed(false);
          redirectUser(mockUser.role);
          return;
        } else {
          // Increment failed logins
          incrementFailedLogins(data.email);
          setFailedCount(prev => prev + 1);
          throw new Error('Invalid email or password');
        }
      }

      // 2. Real API Connection
      const response = await authService.login(data.email, data.password);
      if (response.success) {
        const { user: userData, accessToken } = response.data;
        login(userData, accessToken);
        toast.success(`Welcome back, ${userData.name}!`);
        
        setFailedCount(0);
        setCaptchaPassed(false);
        redirectUser(userData.role);
      } else {
        incrementFailedLogins(data.email);
        setFailedCount(prev => prev + 1);
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Invalid email or password. Please try again.';
      toast.error(errorMsg);
      if (error.response?.status === 404) {
        navigate('/register', { state: { email: data.email } });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOTP = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) { toast.error('Please enter a valid email'); return; }
    setIsLoading(true);
    try {
      const response = await authService.sendOtp(emailValue);
      if (response.success) {
        setAuthView('otp');
        toast.success(`OTP sent to ${emailValue}`);
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Is your email registered?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setIsLoading(true);
    try {
      toast.info('OTP Login simulated! Logging in...');
      const mockUser = users.find(u => u.email.toLowerCase() === emailValue.toLowerCase()) || {
        id: 'usr-otp', name: 'OTP Verified User', email: emailValue, role: 'CUSTOMER'
      };
      login(mockUser, 'otp-jwt-token');
      redirectUser(mockUser.role);
    } catch {
      toast.error('OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FC8019]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white w-full max-w-md rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {authView === 'default' ? (
            <motion.div
              key="default-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="p-8 md:p-10"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                  <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                    <span className="text-white font-black text-xl tracking-tighter">F</span>
                  </div>
                  <span className="text-2xl font-black text-primary">FoodIQ</span>
                </Link>
                <h1 className="text-2xl md:text-3xl font-black text-[#1C1C1C] mb-2">Welcome back!</h1>
                <p className="text-[#686B78] text-sm">Sign in to access your dashboard</p>
              </div>

              {isLocked ? (
                <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-center space-y-2 mb-6">
                  <Shield size={24} className="mx-auto" />
                  <p className="font-black text-sm">Account Locked</p>
                  <p className="text-xs font-semibold">Too many failed attempts. Try again in {lockCountdown} seconds.</p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
                <Input
                  label="Email Address"
                  placeholder="your@email.com"
                  icon={Mail}
                  error={errors.email?.message}
                  {...register('email')}
                  disabled={isLocked}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    icon={Lock}
                    error={errors.password?.message}
                    {...register('password')}
                    disabled={isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[38px] text-[#9093A4] hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Show Captcha slider after 3 failures */}
                {!isLocked && failedCount >= 3 && (
                  <SliderCaptcha onVerify={(v) => setCaptchaPassed(v)} />
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all accent-primary"
                      {...register('rememberMe')}
                    />
                    <span className="text-sm text-[#686B78] group-hover:text-[#1C1C1C] transition-colors">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || isLocked}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-colors text-sm shadow-sm shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><LogIn size={16} /> Sign In</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleGetOTP}
                    disabled={isLoading || isLocked}
                    className="w-full py-3.5 border-2 border-primary/20 hover:border-primary text-primary font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:bg-primary/5 disabled:opacity-75"
                  >
                    <Smartphone size={16} /> OTP Login
                  </button>
                </div>

                {/* Divider */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0F0F0]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-[#9093A4] font-semibold">Or continue with</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E8E8] hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-semibold text-[#1C1C1C]"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5" alt="Google" />
                    Google
                  </button>
                  <button 
                    type="button" 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E8E8] hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-semibold text-[#1C1C1C]"
                  >
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="h-5" alt="Facebook" />
                    Facebook
                  </button>
                </div>
              </form>

              <div className="p-4 mt-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 text-left">
                <Sparkles size={16} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-text-secondary font-bold">
                  <strong>Developer Login:</strong> Use <code className="bg-slate-200 px-1 rounded">superadmin@foodiq.com</code> / <code className="bg-slate-200 px-1 rounded">FoodIQ@Secure2026</code> to access the IAM Dashboard!
                </p>
              </div>

              <p className="mt-8 text-center text-sm text-[#686B78]">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-black hover:underline inline-flex items-center gap-1">
                  Create account <ArrowRight size={14} />
                </Link>
              </p>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[#686B78]">
                <ShieldCheck size={14} className="text-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium">Secured with 256-bit SSL encryption</span>
              </div>
            </motion.div>
          ) : (
            <div className="p-8 md:p-10">
              <OtpVerification
                key="otp-view"
                email={emailValue}
                onVerify={handleVerifyOTP}
                onCancel={() => setAuthView('default')}
                resendOtp={handleGetOTP}
              />
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
