import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hours, minutes] = value.split(':').map(Number);
  const [period, setPeriod] = React.useState(hours >= 12 ? 'PM' : 'AM');

  const displayHour = hours % 12 || 12;
  const displayTime = `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;

  const setTime = (h: number, m: number, p: string) => {
    let hour24 = h % 12;
    if (p === 'PM') hour24 += 12;
    if (hour24 === 24) hour24 = 12;
    onChange(`${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const handleHourClick = (h: number) => {
    setTime(h, minutes, period);
  };

  const handleMinuteClick = (m: number) => {
    setTime(displayHour, m, period);
  };

  const handlePeriodToggle = (p: string) => {
    setPeriod(p);
    setTime(displayHour, minutes, p);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal gap-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="h-4 w-4 text-muted-foreground" />
          {displayTime}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 pointer-events-auto" align="start">
        <div className="space-y-3">
          {/* AM/PM Toggle */}
          <div className="flex gap-1 justify-center">
            <Button
              variant={period === 'AM' ? 'default' : 'outline'}
              size="sm"
              className="w-16 text-xs"
              onClick={() => handlePeriodToggle('AM')}
            >
              AM
            </Button>
            <Button
              variant={period === 'PM' ? 'default' : 'outline'}
              size="sm"
              className="w-16 text-xs"
              onClick={() => handlePeriodToggle('PM')}
            >
              PM
            </Button>
          </div>

          <div className="flex gap-3">
            {/* Hours */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground text-center">Hour</p>
              <div className="grid grid-cols-3 gap-1">
                {hourOptions.map((h) => (
                  <Button
                    key={h}
                    variant={displayHour === h ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9 h-9 p-0 text-xs"
                    onClick={() => handleHourClick(h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-border" />

            {/* Minutes */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground text-center">Min</p>
              <div className="grid grid-cols-3 gap-1">
                {minuteOptions.map((m) => (
                  <Button
                    key={m}
                    variant={minutes === m ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9 h-9 p-0 text-xs"
                    onClick={() => handleMinuteClick(m)}
                  >
                    {String(m).padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
