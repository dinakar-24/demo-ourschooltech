import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Teacher {
  id: string;
  full_name: string;
}

interface TeacherComboboxProps {
  teachers: Teacher[];
  value: string | null;
  onValueChange: (value: string | null) => void;
}

export function TeacherCombobox({ teachers, value, onValueChange }: TeacherComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedTeacher = teachers.find((t) => t.id === value);
  const filtered = search
    ? teachers.filter((t) => t.full_name.toLowerCase().includes(search.toLowerCase()))
    : teachers;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 text-xs w-full sm:w-auto sm:min-w-[160px] justify-between font-normal"
        >
          <span className="truncate">
            {selectedTeacher ? selectedTeacher.full_name : 'Not assigned'}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 z-50 bg-popover" align="start">
        <div className="flex items-center border-b px-2">
          <Search className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 focus-visible:ring-0 text-xs placeholder:text-xs"
          />
        </div>
        <ScrollArea className="max-h-[200px]">
          <div className="p-1">
            <button
              className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground',
                !value && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                onValueChange(null);
                setOpen(false);
                setSearch('');
              }}
            >
              <Check className={cn('mr-1.5 h-3 w-3', !value ? 'opacity-100' : 'opacity-0')} />
              Not assigned
            </button>
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No teachers found</p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground',
                    value === t.id && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => {
                    onValueChange(t.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check className={cn('mr-1.5 h-3 w-3', value === t.id ? 'opacity-100' : 'opacity-0')} />
                  {t.full_name}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
