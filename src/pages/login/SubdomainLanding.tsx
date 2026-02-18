import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Shield, GraduationCap, Users, BookOpen } from 'lucide-react';

const roles = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'School management & operations',
    icon: Shield,
    gradient: 'from-red-500 to-orange-500',
    hoverGradient: 'hover:from-red-600 hover:to-orange-600',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    description: 'Classes, attendance & homework',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
  },
  {
    key: 'parent',
    label: 'Parent',
    description: 'Fees, results & announcements',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'hover:from-emerald-600 hover:to-teal-600',
  },
  {
    key: 'student',
    label: 'Student',
    description: 'Timetable, homework & results',
    icon: BookOpen,
    gradient: 'from-amber-500 to-orange-500',
    hoverGradient: 'hover:from-amber-600 hover:to-orange-600',
  },
];

export default function SubdomainLanding() {
  const { tenant } = useTenant();
  const navigate = useNavigate();

  if (!tenant) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* School branding */}
      <div className="text-center mb-10">
        {tenant.logo ? (
          <img
            src={tenant.logo}
            alt={tenant.name}
            className="w-20 h-20 mx-auto rounded-2xl object-contain mb-4 shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl font-bold text-primary">
              {tenant.name.charAt(0)}
            </span>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{tenant.name}</h1>
        <p className="text-gray-500 mt-2">Select your portal to continue</p>
      </div>

      {/* Role buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => navigate(`/${role.key}`)}
            className={`bg-gradient-to-br ${role.gradient} ${role.hoverGradient} text-white rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
          >
            <role.icon className="w-8 h-8" />
            <div>
              <p className="font-semibold text-lg">{role.label}</p>
              <p className="text-xs text-white/80 mt-0.5">{role.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
