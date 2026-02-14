import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CreditCard, ClipboardList, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

interface PendingData {
  pendingFees: number;
  pendingExams: number;
}

export function PendingTasks() {
  const schoolId = useEffectiveSchoolId();
  const [data, setData] = useState<PendingData>({ pendingFees: 0, pendingExams: 0 });

  useEffect(() => {
    if (schoolId) fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    const { data: count } = await supabase
      .rpc('get_pending_fee_student_count', { _school_id: schoolId! });
    
    setData({
      pendingFees: count || 0,
      pendingExams: 0,
    });
  };

  const pendingTasks = [
    { 
      title: 'Pending Fee Collections',
      count: `${data.pendingFees} students`,
      href: '/admin/fees',
      icon: CreditCard,
      priority: 'high',
      show: data.pendingFees > 0
    },
    { 
      title: 'Mark Today\'s Attendance',
      count: 'Classes pending',
      href: '/admin/attendance',
      icon: ClipboardList,
      priority: 'medium',
      show: true
    },
  ].filter(t => t.show);

  if (pendingTasks.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Pending Actions</h3>
        <span className="text-xs text-muted-foreground">{pendingTasks.length} items</span>
      </div>
      <div className="space-y-2">
        {pendingTasks.map((task) => (
          <Link 
            key={task.title} 
            to={task.href}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className={`w-2 h-2 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' : 
              task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
            <task.icon className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.count}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
