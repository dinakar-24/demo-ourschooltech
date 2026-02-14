import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

export default function StudentSubjects() {
  const { user } = useAuth();
  const subjects = user?.subjects || [];

  return (
    <MobileLayout title="My Subjects" showBack>
      <div className="p-4 space-y-4">
        {subjects.length > 0 ? (
          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.className} - {user?.section}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No subjects assigned yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your subjects will appear here once assigned by your school.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
