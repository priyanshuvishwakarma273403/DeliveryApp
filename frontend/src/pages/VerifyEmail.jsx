import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, expired, invalid
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();
  const addSecurityLog = useAuthStore(state => state.addSecurityLog);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        // Simulate API call for token verification
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (token === 'expired') {
          setStatus('expired');
          addSecurityLog({
            email: email || 'unknown@example.com',
            action: 'EMAIL_VERIFICATION_EXPIRED',
            status: 'FAILED',
            details: 'Email verification token expired'
          });
        } else {
          setStatus('success');
          addSecurityLog({
            email: email || 'unknown@example.com',
            action: 'EMAIL_VERIFIED',
            status: 'SUCCESS',
            details: `Email verified successfully: ${email}`
          });
          toast.success('Email verified successfully!');
        }
      } catch (err) {
        setStatus('invalid');
      }
    };

    performVerification();
  }, [token, email]);

  const handleResend = async () => {
    setStatus('verifying');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('verifying');
      toast.success('Verification link resent to your email!');
      setStatus('expired'); // Stay in expired state but note the resend
    } catch {
      toast.error('Resend failed.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-white relative z-10 text-center"
      >
        {status === 'verifying' && (
          <div className="py-8">
            <RefreshCw className="mx-auto text-primary animate-spin mb-6" size={40} />
            <h1 className="text-2xl font-black text-text-primary mb-2">Verifying your email</h1>
            <p className="text-text-secondary text-sm">Please wait while we validate your secure security token...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl font-black text-text-primary mb-2">Verification Success</h1>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Your email <strong className="text-text-primary font-bold">{email || 'your account'}</strong> has been verified. 
              Your profile is now activated and ready.
            </p>
            <div className="p-4 bg-gray-50/80 rounded-2xl text-[11px] font-bold text-text-secondary flex items-center justify-center gap-1.5 border border-gray-100 mb-8">
              <Sparkles size={12} className="text-primary animate-pulse" />
              Secure session validated successfully.
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full py-4 text-sm font-black rounded-xl flex items-center justify-center gap-2"
            >
              Go to Sign In <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {status === 'expired' && (
          <div>
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 border border-rose-100">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-2">Verification Expired</h1>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Sorry! The verification link has expired. Secure tokens are only valid for 15 minutes to prevent session hijacking.
            </p>
            <Button
              onClick={handleResend}
              className="w-full py-4 text-sm font-black rounded-xl mb-4"
            >
              Resend Verification Email
            </Button>
            <Link to="/login" className="text-xs font-black uppercase tracking-wider text-text-secondary hover:text-primary transition-colors">
              Back to Login
            </Link>
          </div>
        )}

        {status === 'invalid' && (
          <div>
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 border border-rose-100">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-2">Invalid Token</h1>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              This verification link is invalid, altered, or has already been used. Please request a new token.
            </p>
            <Link to="/login" className="inline-block w-full py-4 bg-primary text-white font-black text-sm rounded-xl mb-4 shadow-sm">
              Request New Link
            </Link>
            <Link to="/" className="text-xs font-black uppercase tracking-wider text-text-secondary hover:text-primary transition-colors block">
              Back to Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
