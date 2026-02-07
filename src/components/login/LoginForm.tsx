import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-login-slide-up">
      {error && (
        <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/30 text-destructive-foreground text-sm flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0 text-white text-xs font-bold">!</div>
          <span className="text-white/90">{error}</span>
        </div>
      )}
      
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-11 h-12 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground shadow-sm"
          autoFocus
        />
      </div>
      
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-11 pr-11 h-12 rounded-xl bg-white border-0 text-foreground placeholder:text-muted-foreground shadow-sm"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="rounded border-white/30 w-4 h-4 accent-accent" />
        <span className="text-white/70 text-sm">Remember Me</span>
      </label>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-full bg-sidebar text-white font-bold text-base shadow-xl hover:opacity-90 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Login
          </>
        )}
      </Button>

      <div className="text-center">
        <button type="button" className="text-white/60 hover:text-white text-sm transition-colors">
          🔒 Forgot password?
        </button>
      </div>
    </form>
  );
}
