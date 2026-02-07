import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import indiaFlag from '@/assets/india-flag.png';

interface IndianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export function IndianPhoneInput({ value, onChange, placeholder = "9876543210", className, id, required }: IndianPhoneInputProps) {
  // Strip +91 prefix if present for display
  const displayValue = value.startsWith('+91') ? value.slice(3).trim() : value;

  const handleChange = (raw: string) => {
    // Only allow digits, max 10
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };

  return (
    <div className={cn("flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <div className="flex items-center gap-1.5 pl-3 pr-2 border-r border-input shrink-0">
        <img src={indiaFlag} alt="IN" className="w-5 h-3.5 rounded-[2px] object-cover" />
        <span className="text-sm font-medium text-foreground">+91</span>
      </div>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={10}
        minLength={10}
        pattern="[0-9]{10}"
        title="Phone number must be exactly 10 digits"
        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 pl-3"
      />
    </div>
  );
}
