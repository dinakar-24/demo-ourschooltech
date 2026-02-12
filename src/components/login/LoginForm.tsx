import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
  resetKey?: string | null;
}

export function LoginForm({ onSubmit, loading, error, resetKey }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset fields when role changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
  }, [resetKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-sm flex items-center gap-2 overflow-hidden"
          >
            <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
            <span className="text-white/90">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm focus-visible:ring-2 focus-visible:ring-white/30"
          autoFocus
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-11 pr-11 h-13 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground/50 shadow-sm focus-visible:ring-2 focus-visible:ring-white/30"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" className="rounded border-white/30 w-4 h-4 accent-white" />
        <span className="text-white/60 text-sm">Remember Me</span>
      </label>

      <motion.button
        type="submit"
        disabled={loading}
        className="w-full h-13 rounded-full bg-[hsl(230,40%,18%)] text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Login
          </>
        )}
      </motion.button>

      <div className="text-center pt-1">
        <button type="button" className="text-white/40 hover:text-white/70 text-sm transition-colors">
          🔒 Forgot password?
        </button>
      </div>
    </motion.form>
  );
}
