import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentProfile, useStudentResults } from '@/hooks/useStudentData';
import { 
  Award, 
  FileText,
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function StudentResults() {
  const { t } = useTranslation();
  const { data: student } = useStudentProfile();
  const { data: results, isLoading } = useStudentResults(student?.id);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  const getGrade = (marks: number, max: number) => {
    const pct = (marks / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const examGroups = results?.reduce((acc, r) => {
    const examName = r.exam?.name || 'Unknown Exam';
    if (!acc[examName]) {
      acc[examName] = { name: examName, date: r.exam?.exam_date, subjects: [], totalMarks: 0, totalMax: 0 };
    }
    const max = r.exam?.max_marks || 100;
    acc[examName].subjects.push({ name: r.exam?.subject || 'Unknown', marks: r.marks_obtained, total: max, grade: r.grade || getGrade(r.marks_obtained, max) });
    acc[examName].totalMarks += r.marks_obtained;
    acc[examName].totalMax += max;
    return acc;
  }, {} as Record<string, { name: string; date: string | undefined; subjects: Array<{ name: string; marks: number; total: number; grade: string }>; totalMarks: number; totalMax: number }>) || {};

  const examList = Object.values(examGroups);
  const latestExam = examList[0];
  const latestPercentage = latestExam ? Math.round((latestExam.totalMarks / latestExam.totalMax) * 100 * 10) / 10 : 0;
  const latestGrade = latestExam ? getGrade(latestExam.totalMarks, latestExam.totalMax) : '-';

  return (
    <MobileLayout title={t('resultsPage.title')} showBack>
      <div className="p-4 space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </>
        ) : !results?.length ? (
          <Card className="p-10 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">{t('resultsPage.noResults')}</h3>
            <p className="text-sm text-muted-foreground">{t('resultsPage.resultsWillAppear')}</p>
          </Card>
        ) : (
          <>
            {latestExam && (
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
                <CardContent className="p-5">
                  <p className="text-primary-foreground/70 text-sm">{latestExam.name}</p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-4xl font-bold">{latestPercentage}%</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-white/20 text-white">
                          {t('resultsPage.grade')}: {latestGrade}
                        </Badge>
                        {latestExam.date && (
                          <span className="text-sm text-primary-foreground/70">
                            {format(new Date(latestExam.date), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <Award className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {latestExam && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t('resultsPage.subjectWiseMarks')}
                </h3>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {latestExam.subjects.map((subject, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{subject.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                              {subject.marks}/{subject.total}
                            </span>
                            <Badge variant="outline" className={getGradeColor(subject.grade)}>
                              {subject.grade}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={(subject.marks / subject.total) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {examList.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t('resultsPage.previousExams')}
                </h3>
                <div className="space-y-2">
                  {examList.slice(1).map((exam, i) => {
                    const pct = Math.round((exam.totalMarks / exam.totalMax) * 100 * 10) / 10;
                    const grade = getGrade(exam.totalMarks, exam.totalMax);
                    return (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{exam.name}</p>
                              {exam.date && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(exam.date), 'dd MMM yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{pct}%</p>
                            <Badge variant="outline" className={getGradeColor(grade)}>
                              {grade}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
