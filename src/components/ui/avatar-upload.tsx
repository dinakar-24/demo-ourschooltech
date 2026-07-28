import { useRef, useState } from 'react';
import { Camera, X, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  folder?: string;
  className?: string;
}

const sizes = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

export function AvatarUpload({ value, onChange, fallback, size = 'md', folder = 'users', className }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar, uploading } = useAvatarUpload();
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || value;
  const initials = fallback?.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const url = await uploadAvatar(file, folder);
    if (url) {
      onChange(url);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    } else {
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) await deleteAvatar(value);
    onChange(null);
    setPreview(null);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-primary/50 transition-colors",
          sizes[size]
        )}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            {initials ? (
              <span className="text-lg font-bold text-muted-foreground">{initials}</span>
            ) : (
              <User className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Remove button */}
        {displayUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {uploading ? 'Uploading…' : displayUrl ? 'Change photo' : 'Add photo'}
      </button>
    </div>
  );
}
