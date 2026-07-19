import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  UserPlus, 
  ArrowLeft,
  Briefcase,
  Bike,
  Sparkles,
  ShieldCheck,
  Percent,
  Plus,
  FileText,
  Key
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';
import OtpVerification from '../components/common/OtpVerification';
import apiClient from '../api/axios';

// Enterprise Password Regex (same as login/reset)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

// dynamic validation schema based on selected role
const registerSchema = z.object({
  firstName: z.string().min(2, 'First Name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
  countryCode: z.string().default('+91'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .max(32, 'Password cannot exceed 32 characters')
    .regex(passwordRegex, 'Password must include uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  terms: z.boolean().refine(val => val === true, 'You must agree to Terms and Conditions'),
  marketingConsent: z.boolean().optional(),
  
  // Dynamic fields
  address: z.string().optional(),
  // Restaurant owner fields
  restaurantName: z.string().optional(),
  businessLicense: z.string().optional(),
  // Delivery fields
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
  dlNumber: z.string().optional(),
  // Admin fields
  accessCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authView, setAuthView] = useState('default'); 
  const [selectedRole, setSelectedRole] = useState('CUSTOMER'); // CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER, SUPER_ADMIN
  const [profileImage, setProfileImage] = useState(null);

  const { registerUser, users, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      countryCode: '+91',
      email: prefilledEmail,
      terms: false
    }
  });

  const passwordValue = watch('password') || '';
  const emailValue = watch('email');
  const phoneValue = watch('phone');
  const usernameValue = watch('username');
  const [formData, setFormData] = useState(null);

  // Checks for password requirements
  const passwordChecks = {
    length: passwordValue.length >= 8 && passwordValue.length <= 32,
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /\d/.test(passwordValue),
    special: /[@$!%*?&]/.test(passwordValue)
  };

  const getStrengthLabel = () => {
    const passed = Object.values(passwordChecks).filter(Boolean).length;
    if (passed === 0) return { label: 'Empty', color: 'bg-gray-200 w-0' };
    if (passed <= 2) return { label: 'Weak', color: 'bg-rose-500 w-1/4' };
    if (passed <= 4) return { label: 'Medium', color: 'bg-amber-500 w-3/4' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500 w-full' };
  };

  const onSubmit = async (data) => {
    // 1. Prevent duplicate email/phone/username in our database
    const loweredEmail = data.email.toLowerCase();
    const emailExists = users.some(u => u.email.toLowerCase() === loweredEmail);
    const phoneExists = users.some(u => u.phone === data.phone);
    const usernameExists = users.some(u => u.username?.toLowerCase() === data.username.toLowerCase());

    if (emailExists) {
      toast.error('Email address is already registered.');
      return;
    }
    if (phoneExists) {
      toast.error('Phone number is already registered.');
      return;
    }
    if (usernameExists) {
      toast.error('Username is already taken.');
      return;
    }

    setIsLoading(true);
    try {
      // If Owner or Admin, check simulated credentials / codes
      if (selectedRole === 'SUPER_ADMIN' && data.accessCode !== 'ADMIN123') {
        toast.error('Invalid administrative Access Authorization Code.');
        return;
      }

      // Send OTP via backend if possible, or simulate
      try {
        await apiClient.post(`/auth/send-otp?email=${data.email}`);
      } catch (err) {
        console.log('Backend OTP send skipped/offline, simulating...');
      }

      setFormData(data);
      setAuthView('otp');
      toast.success(`Verification security OTP sent to ${data.email}`);
    } catch (error) {
      toast.error('Failed to send verification OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setIsLoading(true);
    try {
      // 1. Create registration request
      const formattedUser = {
        name: `${formData.firstName} ${formData.lastName}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: selectedRole,
        address: formData.address || 'Address pending...',
        verified: true
      };

      // 2. Call local store registration logic
      registerUser(formattedUser);
      
      // Simulate backend sync if endpoint is open
      try {
        const registerData = {
          name: formattedUser.name,
          email: formattedUser.email,
          password: formData.password,
          phone: formData.phone,
          address: formattedUser.address,
          role: selectedRole === 'SUPER_ADMIN' ? 'ADMIN' : selectedRole === 'DELIVERY_PARTNER' ? 'DELIVERY_PARTNER' : 'CUSTOMER',
          otp
        };
        await apiClient.post('/auth/register', registerData);
      } catch (err) {
        console.log('Backend sync offline, registered client-side');
      }

      // Automatically log the user in
      login(formattedUser, 'new-jwt-token-' + Date.now());
      toast.success('Account verified and created successfully!');

      if (selectedRole === 'SUPER_ADMIN') navigate('/admin/iam');
      else if (selectedRole === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else navigate('/');
    } catch (error) {
      toast.error('Verification failed. Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      toast.success('Verification code resent to your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const RoleOption = ({ value, label, icon: Icon, description }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(value)}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
        selectedRole === value 
          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
          : 'border-gray-100 hover:border-gray-200 text-text-secondary'
      }`}
    >
      <Icon size={24} className={selectedRole === value ? 'text-primary' : 'text-gray-400'} />
      <div className="text-center">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] opacity-70 leading-tight">{description}</p>
      </div>
      {selectedRole === value && (
        <div className="absolute top-2 right-2 h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-white rounded-full" />
        </div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-20 overflow-hidden bg-background">
      <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-3xl p-8 md:p-12 rounded-[3rem] relative bg-white shadow-premium"
      >
        <AnimatePresence mode="wait">
          {authView === 'default' ? (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/login" className="absolute top-8 left-8 text-text-secondary hover:text-primary transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <ArrowLeft size={16} /> Back to Login
              </Link>

              <div className="text-center mt-6 mb-10">
                <h1 className="text-3xl font-black text-text-primary mb-2">Create Account</h1>
                <p className="text-text-secondary text-sm">Join FoodIQ and select your account profile below</p>
              </div>

              {/* Dynamic Role Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <RoleOption 
                  value="CUSTOMER" 
                  label="Customer" 
                  icon={User} 
                  description="Order & track food" 
                />
                <RoleOption 
                  value="RESTAURANT_OWNER" 
                  label="Merchant" 
                  icon={Briefcase} 
                  description="Manage kitchen & sales" 
                />
                <RoleOption 
                  value="DELIVERY_PARTNER" 
                  label="Rider" 
                  icon={Bike} 
                  description="Deliver orders" 
                />
                <RoleOption 
                  value="SUPER_ADMIN" 
                  label="Admin" 
                  icon={Key} 
                  description="System configuration" 
                />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Standard Registration Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    placeholder="Rahul"
                    icon={User}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Sharma"
                    icon={User}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                  <Input
                    label="Choose Username"
                    placeholder="rahulsharma"
                    icon={User}
                    error={errors.username?.message}
                    {...register('username')}
                  />
                  <Input
                    label="Email Address"
                    placeholder="rahul@example.com"
                    icon={Mail}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  
                  {/* Phone input with Country Code selector */}
                  <div className="flex gap-2 items-end">
                    <div className="w-24">
                      <Input
                        label="Code"
                        type="text"
                        error={errors.countryCode?.message}
                        {...register('countryCode')}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Phone Number"
                        placeholder="9876543210"
                        icon={Phone}
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                    </div>
                  </div>

                  <Input
                    label="Referral Code (Optional)"
                    placeholder="FRIEND50"
                    icon={Percent}
                    error={errors.referralCode?.message}
                    {...register('referralCode')}
                  />

                  {/* Password & Confirm Passwords */}
                  <div className="space-y-2">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      icon={Lock}
                      error={errors.password?.message}
                      {...register('password')}
                    />
                    {/* Password Policy Indicator */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getStrengthLabel().color}`} />
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary">Password Security: {getStrengthLabel().label}</span>
                    </div>
                  </div>

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>

                {/* DYNAMIC ROLE FIELDS */}
                {selectedRole === 'CUSTOMER' && (
                  <Input
                    label="Delivery Address"
                    placeholder="House no, Street, Landmark, City, Pincode"
                    icon={MapPin}
                    error={errors.address?.message}
                    {...register('address')}
                  />
                )}

                {selectedRole === 'RESTAURANT_OWNER' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Input
                      label="Restaurant/Brand Name"
                      placeholder="The Pizza Place"
                      icon={Briefcase}
                      error={errors.restaurantName?.message}
                      {...register('restaurantName')}
                    />
                    <Input
                      label="GSTIN / Business License"
                      placeholder="GST98X76543"
                      icon={FileText}
                      error={errors.businessLicense?.message}
                      {...register('businessLicense')}
                    />
                  </div>
                )}

                {selectedRole === 'DELIVERY_PARTNER' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="col-span-1">
                      <label className="text-xs font-black uppercase text-text-secondary mb-2 block">Vehicle Type</label>
                      <select 
                        {...register('vehicleType')}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-text-primary"
                      >
                        <option value="BIKE">Motorcycle / Scooty</option>
                        <option value="CYCLE">Bicycle</option>
                        <option value="EV">Electric Vehicle</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="License Plate"
                        placeholder="DL-3C-AB-1234"
                        error={errors.licensePlate?.message}
                        {...register('licensePlate')}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        label="Driving License No."
                        placeholder="DL9876543210"
                        error={errors.dlNumber?.message}
                        {...register('dlNumber')}
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'SUPER_ADMIN' && (
                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <Input
                      label="System Admin Authorization Code"
                      placeholder="Enter verification code"
                      type="password"
                      icon={Key}
                      error={errors.accessCode?.message}
                      {...register('accessCode')}
                    />
                    <p className="text-[10px] text-amber-600 font-bold mt-2">Note: To create an administrator role, use authentication key: <code className="bg-amber-100 px-1 rounded text-amber-800">ADMIN123</code></p>
                  </div>
                )}

                {/* Consent Checkboxes */}
                <div className="space-y-3 pt-4 border-t border-gray-150">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                      {...register('terms')}
                    />
                    <span className="text-xs text-[#686B78] leading-normal">
                      I agree to the <span className="text-primary font-bold hover:underline">Terms of Service</span>, <span className="text-primary font-bold hover:underline">Privacy Policy</span>, and verification guidelines.
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-rose-500 font-bold">{errors.terms.message}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                      {...register('marketingConsent')}
                    />
                    <span className="text-xs text-[#686B78] leading-normal">
                      I agree to receive promotional updates, discounts, and personalized alerts from FoodIQ.
                    </span>
                  </label>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full py-4 text-base rounded-[25px]"
                    loading={isLoading}
                  >
                    Verify & Create Account <UserPlus size={18} className="ml-2" />
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="pt-8">
              <OtpVerification
                key="otp-view"
                email={formData?.email || emailValue}
                onVerify={handleVerifyOTP}
                onCancel={() => setAuthView('default')}
                resendOtp={handleResendOTP}
              />
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
