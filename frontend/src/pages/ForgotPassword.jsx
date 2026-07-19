import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const addSecurityLog = useAuthStore(state => state.addSecurityLog);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call for forgot password
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Log event
      addSecurityLog({
        email: data.email,
        action: 'PASSWORD_RESET_REQUEST',
        status: 'SUCCESS',
        details: `Password reset link requested for email: ${data.email}`
      });

      setEmailSent(data.email);
      setIsSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-white relative z-10"
      >
        <Link to="/login" className="absolute top-8 left-8 text-text-secondary hover:text-primary transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <AnimatePresence mode="wait">
          {!isSent ? (
            <motion.div
              key="request-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="text-center mt-8 mb-8">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <KeyRound size={24} />
                </div>
                <h1 className="text-3xl font-black text-text-primary mb-2">Forgot Password?</h1>
                <p className="text-text-secondary text-sm">No worries! Enter your email address and we'll send you a secure recovery link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Email Address"
                  placeholder="your@email.com"
                  icon={Mail}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  className="w-full py-4 text-sm font-black rounded-xl"
                  loading={isLoading}
                >
                  Send Recovery Link
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success-state"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-center mt-8"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-text-primary mb-2">Recovery Email Sent</h2>
              <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                We've sent a secure reset link to <strong className="text-text-primary font-bold">{emailSent}</strong>. 
                Please check your inbox (and spam folder) to complete your password update.
              </p>
              <div className="p-4 bg-gray-50/80 rounded-2xl text-[11px] font-bold text-text-secondary flex items-center justify-center gap-1.5 border border-gray-100">
                <Sparkles size={12} className="text-primary animate-pulse" />
                Token expires in 15 minutes.
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-text-secondary">
                  Didn't receive the email?{' '}
                  <button 
                    type="button" 
                    onClick={() => onSubmit({ email: emailSent })}
                    disabled={isLoading}
                    className="text-primary font-bold hover:underline"
                  >
                    Resend link
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
