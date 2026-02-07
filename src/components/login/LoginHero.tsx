import { School } from 'lucide-react';

export function LoginHero() {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[hsl(200,80%,25%)] min-h-[340px] lg:min-h-0 lg:h-full flex flex-col items-center justify-center px-6 py-12">
      {/* Animated abstract shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large circle top-right */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-[6px] border-white/10 animate-login-float" />
        {/* Medium circle bottom-left */}
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border-[5px] border-white/10 animate-login-float-delay" />
        {/* Small filled circle */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-accent/30 animate-login-pulse" />
        {/* Rounded pill top-left */}
        <div className="absolute top-12 -left-8 w-40 h-14 rounded-full bg-white/5 rotate-[30deg] animate-login-drift" />
        {/* Rounded pill right */}
        <div className="absolute top-1/3 -right-12 w-52 h-16 rounded-full bg-white/5 -rotate-[20deg] animate-login-drift-delay" />
        {/* Dot grid pattern */}
        <div className="absolute bottom-1/4 left-1/4 grid grid-cols-4 gap-3 opacity-20">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
          ))}
        </div>
        {/* Accent ring */}
        <div className="absolute bottom-20 right-12 w-24 h-24 rounded-full border-4 border-accent/20 animate-login-spin-slow" />
        {/* Small decorative leaf-like shapes */}
        <svg className="absolute bottom-8 left-6 w-20 h-20 text-white/10 animate-login-sway" viewBox="0 0 80 80" fill="currentColor">
          <path d="M20 60 C20 30, 40 10, 60 20 C40 20, 30 40, 20 60Z" />
        </svg>
        <svg className="absolute top-8 right-20 w-16 h-16 text-white/10 animate-login-sway-delay" viewBox="0 0 80 80" fill="currentColor">
          <path d="M60 60 C60 30, 40 10, 20 20 C40 20, 50 40, 60 60Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 animate-login-enter">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/20 animate-login-bounce-in">
          <School className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            Our School Tech
          </h1>
          <p className="text-white/70 text-sm lg:text-base font-medium max-w-xs">
            Smart School Management for Modern Education
          </p>
        </div>

        {/* Welcome badge */}
        <div className="animate-login-pop-in">
          <div className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-accent/30">
            <span className="text-lg">❤️</span>
            WELCOME
          </div>
        </div>

        {/* Features pills */}
        <div className="flex flex-wrap justify-center gap-2 animate-login-stagger">
          {['Attendance', 'Fees', 'Results', 'Homework'].map((f, i) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10 backdrop-blur-sm"
              style={{ animationDelay: `${0.6 + i * 0.1}s` }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
