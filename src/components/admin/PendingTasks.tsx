import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, CreditCard, ClipboardList, FileText } from 'lucide-react';

const pendingTasks = [
  { 
    title: 'Pending Fee Collections',
    count: '23 students',
    href: '/admin/fees',
    icon: CreditCard,
    priority: 'high'
  },
  { 
    title: 'Attendance Not Marked',
    count: '3 classes today',
    href: '/admin/attendance',
    icon: ClipboardList,
    priority: 'medium'
  },
  { 
    title: 'Exam Results Pending',
    count: 'Class 10-A, 10-B',
    href: '/admin/exams',
    icon: FileText,
    priority: 'low'
  },
];

export function PendingTasks() {
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
