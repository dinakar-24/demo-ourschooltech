import { MobileLayout } from '@/components/layout/MobileLayout';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { useParentChild } from '@/hooks/useParentData';
import { useStudentAttendanceHistory } from '@/hooks/useStudentAttendanceHistory';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentAttendance() {
  const { data: child, isLoading: loadingChild } = useParentChild();
  const { data: attendance, isLoading: loadingAttendance } = useStudentAttendanceHistory(child?.id);

  const isLoading = loadingChild || loadingAttendance;

  return (
    <MobileLayout title="Attendance" showBack>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : (
          <AttendanceCalendar
            records={attendance?.records || []}
            overallPercentage={attendance?.percentage || 0}
            label={`${child?.full_name || 'Child'}'s Attendance`}
          />
        )}
      </div>
    </MobileLayout>
  );
}
