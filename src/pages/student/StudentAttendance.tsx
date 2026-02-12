import { MobileLayout } from '@/components/layout/MobileLayout';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useStudentAttendanceHistory } from '@/hooks/useStudentAttendanceHistory';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentAttendance() {
  const { data: profile, isLoading: loadingProfile } = useStudentProfile();
  const { data: attendance, isLoading: loadingAttendance } = useStudentAttendanceHistory(profile?.id);

  const isLoading = loadingProfile || loadingAttendance;

  return (
    <MobileLayout title="My Attendance" showBack>
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
            label="Overall Attendance"
          />
        )}
      </div>
    </MobileLayout>
  );
}
