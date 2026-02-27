import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Trash2, Video } from 'lucide-react';
import { GalleryItem } from '@/hooks/useGallery';

interface ImageViewerProps {
  items: GalleryItem[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

export function ImageViewer({ items, initialIndex, open, onOpenChange, onDelete }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  const current = items[index];
  if (!current) return null;

  const prev = () => setIndex(i => (i > 0 ? i - 1 : items.length - 1));
  const next = () => setIndex(i => (i < items.length - 1 ? i + 1 : 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 sm:max-w-4xl overflow-hidden [&>button]:hidden">
        <div className="relative flex flex-col h-[90vh] sm:h-[85vh]">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white/80 text-sm font-medium">
              {index + 1} / {items.length}
            </span>
            <div className="flex items-center gap-2">
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-white/10"
                  onClick={() => {
                    onDelete(current.id);
                    if (items.length <= 1) {
                      onOpenChange(false);
                    } else {
                      setIndex(i => Math.min(i, items.length - 2));
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Media */}
          <div className="flex-1 flex items-center justify-center p-4 pt-14">
            {current.file_type === 'video' ? (
              <video
                key={current.id}
                src={current.file_url}
                className="max-w-full max-h-full rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                key={current.id}
                src={current.file_url}
                alt={current.caption || ''}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>

          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={prev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={next}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Caption */}
          {current.caption && (
            <div className="p-3 text-center text-white/70 text-sm bg-gradient-to-t from-black/60 to-transparent">
              {current.caption}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
