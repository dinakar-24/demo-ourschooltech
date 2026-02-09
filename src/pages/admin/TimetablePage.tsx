import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, BookOpen } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useIsMobile } from '@/hooks/use-mobile';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
  { label: 'Period 1', time: '8:00 - 8:45' },
  { label: 'Period 2', time: '8:45 - 9:30' },
  { label: 'Period 3', time: '9:30 - 10:15' },
  { label: 'Break', time: '10:15 - 10:30' },
  { label: 'Period 4', time: '10:30 - 11:15' },
  { label: 'Period 5', time: '11:15 - 12:00' },
  { label: 'Period 6', time: '12:00 - 12:45' },
  { label: 'Lunch', time: '12:45 - 1:30' },
  { label: 'Period 7', time: '1:30 - 2:15' },
  { label: 'Period 8', time: '2:15 - 3:00' },
];

export default function TimetablePage() {
  const isMobile = useIsMobile();
  const { data: classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');

  const classNames = classes?.map(c => c.name) || [];
  const selectedClassData = classes?.find(c => c.name === selectedClass);
  const sections = selectedClassData?.sections.map(s => s.name) || ['A'];

  return (
    <AdminLayout title="Timetable">
      <div className="space-y-6 animate-fade-up">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('A'); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classNames.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(s => (
                <SelectItem key={s} value={s}>Section {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedClass ? (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
            <p className="text-muted-foreground">
              Choose a class and section above to view or manage the timetable.
            </p>
          </Card>
        ) : (
          <>
            {/* Timetable Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {selectedClass} - Section {selectedSection}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Timetable management is being set up. Below is the period structure for this class.
                </p>

                {isMobile ? (
                  /* Mobile: Day-wise cards */
                  <div className="space-y-4">
                    {DAYS.map(day => (
                      <div key={day} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2">
                          <p className="font-medium text-sm">{day}</p>
                        </div>
                        <div className="divide-y">
                          {PERIODS.map((period) => (
                            <div key={period.label} className="flex items-center justify-between px-4 py-2.5">
                              <div>
                                <p className="text-sm font-medium">{period.label}</p>
                                <p className="text-xs text-muted-foreground">{period.time}</p>
                              </div>
                              {period.label === 'Break' || period.label === 'Lunch' ? (
                                <Badge variant="outline" className="text-xs">{period.label}</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Not assigned</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop: Table grid */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-muted-foreground w-[140px]">Period</th>
                          {DAYS.map(day => (
                            <th key={day} className="text-center p-3 font-medium text-muted-foreground">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((period) => (
                          <tr key={period.label} className={`border-b ${
                            period.label === 'Break' || period.label === 'Lunch' 
                              ? 'bg-muted/30' 
                              : 'hover:bg-muted/20'
                          }`}>
                            <td className="p-3">
                              <p className="font-medium">{period.label}</p>
                              <p className="text-xs text-muted-foreground">{period.time}</p>
                            </td>
                            {DAYS.map(day => (
                              <td key={day} className="p-3 text-center">
                                {period.label === 'Break' || period.label === 'Lunch' ? (
                                  <span className="text-xs text-muted-foreground italic">{period.label}</span>
                                ) : (
                                  <div className="p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground cursor-pointer hover:bg-primary/10 transition-colors">
                                    Not assigned
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
