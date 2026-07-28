import { Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: 'exam' | 'meeting' | 'holiday' | 'event';
}

const events: Event[] = [
  {
    id: '1',
    title: 'Parent-Teacher Meeting',
    date: '25 Jan',
    time: '10:00 AM',
    location: 'Main Hall',
    type: 'meeting',
  },
  {
    id: '2',
    title: 'Republic Day Celebration',
    date: '26 Jan',
    time: '8:00 AM',
    location: 'Ground',
    type: 'event',
  },
  {
    id: '3',
    title: 'Class 10 Pre-Board Exam',
    date: '28 Jan',
    time: '9:00 AM',
    type: 'exam',
  },
  {
    id: '4',
    title: 'Science Exhibition',
    date: '30 Jan',
    time: '11:00 AM',
    location: 'Science Lab',
    type: 'event',
  },
];

const typeStyles = {
  exam: 'border-l-destructive bg-destructive-muted/30',
  meeting: 'border-l-info bg-info-muted/30',
  holiday: 'border-l-success bg-success-muted/30',
  event: 'border-l-accent bg-accent-muted/30',
};

export function UpcomingEvents() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Upcoming Events</h3>
        <button className="text-sm text-primary hover:underline">View calendar</button>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div 
            key={event.id}
            className={cn(
              "p-3 rounded-lg border-l-4 transition-all hover:shadow-sm",
              typeStyles[event.type]
            )}
          >
            <h4 className="font-medium text-sm text-foreground">{event.title}</h4>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {event.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.time}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
