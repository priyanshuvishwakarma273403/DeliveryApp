import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

// Complex Enterprise Password Policy:
// - Min 8, Max 32 chars
// - Uppercase, Lowercase, Number, Special Character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .max(32, 'Password cannot exceed 32 characters')
    .regex(passwordRegex, 'Password must include uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'demo-token';
  const navigate = useNavigate();

  const addSecurityLog = useAuthStore(state => state.addSecurityLog);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch('password') || '';

  // Password Policy requirements validation checkers
  const checks = {
    length: passwordValue.length >= 8 && passwordValue.length <= 32,
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /\d/.test(passwordValue),
    special: /[@$!%*?&]/.test(passwordValue)
  };

  const getStrengthLabel = () => {
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed === 0) return { label: 'Empty', color: 'bg-gray-200 w-0' };
    if (passed <= 2) return { label: 'Weak', color: 'bg-rose-500 w-1/4' };
    if (passed <= 4) return { label: 'Medium', color: 'bg-amber-500 w-3/4' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500 w-full' };
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Log event
      addSecurityLog({
        action: 'PASSWORD_RESET',
        status: 'SUCCESS',
        details: `Password reset successfully using token: ${token}`
      });

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error('Failed to reset password. Token might be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const RequirementItem = ({ checked, text }) => (
    <div className="flex items-center gap-2 text-xs font-bold transition-all">
      {checked ? (
        <div className="h-4 w-4 bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center scale-100">
          <Check size={10} strokeWidth={3} />
        </div>
      ) : (
        <div className="h-4 w-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center">
          <X size={10} strokeWidth={3} />
        </div>
      )}
      <span className={checked ? 'text-emerald-600' : 'text-text-secondary opacity-80'}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-white relative z-10"
      >
        {!isSuccess ? (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Lock size={24} />
              </div>
              <h1 className="text-3xl font-black text-text-primary mb-2">Reset Password</h1>
              <p className="text-text-secondary text-sm">Create a strong, secure new password for your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-[#9093A4] hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-secondary">Password Strength:</span>
                  <span className="text-[#1C1C1C]">{getStrengthLabel().label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${getStrengthLabel().color}`} />
                </div>
                
                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                  <RequirementItem checked={checks.length} text="8 to 32 characters" />
                  <RequirementItem checked={checks.upper} text="Uppercase letter" />
                  <RequirementItem checked={checks.lower} text="Lowercase letter" />
                  <RequirementItem checked={checks.number} text="Number digit" />
                  <RequirementItem checked={checks.special} text="Special symbol" />
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

              <Button
                type="submit"
                className="w-full py-4 text-sm font-black rounded-xl"
                loading={isLoading}
              >
                Reset Password
              </Button>
            </form>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-2">Password Reset Successful</h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Your password has been changed. For security reasons, you will be redirected to the sign-in page to log in with your new password.
            </p>
            <div className="flex justify-center items-center gap-2 text-xs font-bold text-text-secondary">
              <Sparkles size={12} className="text-primary animate-pulse" />
              Redirecting to login...
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
