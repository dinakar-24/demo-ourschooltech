import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Calendar, ArrowLeft, Video } from 'lucide-react';
import { useGalleryAlbums, useGalleryItems, GalleryAlbum } from '@/hooks/useGallery';
import { format } from 'date-fns';

export default function ParentGallery() {
  const { data: albums, isLoading } = useGalleryAlbums(true);
  const [selected, setSelected] = useState<GalleryAlbum | null>(null);
  const { data: items, isLoading: itemsLoading } = useGalleryItems(selected?.id);

  if (selected) {
    return (
      <MobileLayout title={selected.title} showBack>
        <div className="p-4 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {itemsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No photos in this album</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items?.map(item => (
                <div key={item.id} className="relative rounded-lg overflow-hidden border border-border">
                  {item.file_type === 'video' ? (
                    <video src={item.file_url} className="w-full aspect-square object-cover" controls />
                  ) : (
                    <img src={item.file_url} alt={item.caption || ''} className="w-full aspect-square object-cover" />
                  )}
                  {item.file_type === 'video' && (
                    <Badge className="absolute top-1 left-1 bg-black/60 text-white text-[9px]">
                      <Video className="w-3 h-3 mr-0.5" /> Video
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Gallery" showBack>
      <div className="p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
        ) : albums?.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Image className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold">No Albums</h3>
            <p className="text-sm text-muted-foreground">No photo albums available yet</p>
          </div>
        ) : (
          albums?.map(album => (
            <Card key={album.id} className="overflow-hidden cursor-pointer" onClick={() => setSelected(album)}>
              <div className="h-32 bg-muted">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm">{album.title}</h4>
                {album.event_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" /> {format(new Date(album.event_date), 'dd MMM yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
