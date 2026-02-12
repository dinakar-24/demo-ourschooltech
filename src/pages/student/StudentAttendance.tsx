import { MobileLayout } from '@/components/layout/MobileLayout';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';

const mockAttendance = {
  overall: 94.5,
  history: [
    { date: '2024-01-20', status: 'present' as const },
    { date: '2024-01-19', status: 'present' as const },
    { date: '2024-01-18', status: 'absent' as const },
    { date: '2024-01-17', status: 'present' as const },
    { date: '2024-01-16', status: 'late' as const },
    { date: '2024-01-15', status: 'present' as const },
    { date: '2024-01-14', status: 'present' as const },
    { date: '2024-01-13', status: 'present' as const },
    { date: '2024-01-12', status: 'present' as const },
    { date: '2024-01-11', status: 'present' as const },
    { date: '2024-01-10', status: 'present' as const },
    { date: '2024-01-09', status: 'present' as const },
    { date: '2024-01-08', status: 'late' as const },
    { date: '2024-01-07', status: 'present' as const },
    { date: '2024-01-06', status: 'present' as const },
    { date: '2024-01-05', status: 'present' as const },
    { date: '2024-01-04', status: 'present' as const },
    { date: '2024-01-03', status: 'absent' as const },
    { date: '2024-01-02', status: 'present' as const },
    { date: '2026-02-12', status: 'present' as const },
    { date: '2026-02-11', status: 'present' as const },
    { date: '2026-02-10', status: 'absent' as const },
    { date: '2026-02-09', status: 'present' as const },
    { date: '2026-02-08', status: 'present' as const },
    { date: '2026-02-07', status: 'late' as const },
    { date: '2026-02-06', status: 'present' as const },
    { date: '2026-02-05', status: 'present' as const },
    { date: '2026-02-04', status: 'present' as const },
    { date: '2026-02-03', status: 'present' as const },
  ],
};

export default function StudentAttendance() {
  return (
    <MobileLayout title="My Attendance" showBack>
      <div className="p-4">
        <AttendanceCalendar
          records={mockAttendance.history}
          overallPercentage={mockAttendance.overall}
          label="Overall Attendance"
        />
      </div>
    </MobileLayout>
  );
}
