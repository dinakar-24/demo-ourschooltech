import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import { MessageSquare, Star, Plus, Loader2 } from 'lucide-react';
import { useFeedbackList, useFeedbackResponses, useSubmitFeedback, Feedback } from '@/hooks/useFeedback';
import { format } from 'date-fns';

export default function ParentFeedback() {
  const { data: feedbacks, isLoading } = useFeedbackList(false);
  const submitFeedback = useSubmitFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFb, setSelectedFb] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const { data: responses } = useFeedbackResponses(selectedFb?.id);

  const handleSubmit = async () => {
    if (!rating || !message.trim()) return;
    await submitFeedback.mutateAsync({ rating, message, is_anonymous: false });
    setIsOpen(false);
    setRating(0);
    setMessage('');
  };

  const renderStars = (value: number, interactive = false) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-7 h-7 cursor-pointer transition-colors ${i <= value ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
          onClick={interactive ? () => setRating(i) : undefined}
        />
      ))}
    </div>
  );

  const submitForm = (
    <div className="space-y-5 px-4 pb-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rating</Label>
        {renderStars(rating, true)}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Your Feedback</Label>
        <Textarea
          placeholder="Share your thoughts..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="min-h-[120px] text-base"
        />
      </div>
      <Button
        className="w-full h-12 text-base"
        onClick={handleSubmit}
        disabled={submitFeedback.isPending || !rating || !message.trim()}
      >
        {submitFeedback.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit
      </Button>
    </div>
  );

  const detailContent = selectedFb && (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-5 h-5 ${i <= selectedFb.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{selectedFb.message}</p>
      <p className="text-xs text-muted-foreground">{format(new Date(selectedFb.created_at), 'dd MMM yyyy, hh:mm a')}</p>

      {responses && responses.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold">Admin Response</p>
          {responses.map(r => (
            <div key={r.id} className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm">{r.response}</p>
              <p className="text-xs text-muted-foreground mt-2">{format(new Date(r.created_at), 'dd MMM yyyy')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MobileLayout title="Feedback" showBack>
      <div className="p-4 space-y-3">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button className="w-full h-11"><Plus className="w-4 h-4 mr-2" /> Submit Feedback</Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Submit Feedback</DrawerTitle>
            </DrawerHeader>
            <div data-vaul-no-drag className="overflow-y-auto flex-1 min-h-0">
              {submitForm}
            </div>
          </DrawerContent>
        </Drawer>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : feedbacks?.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No feedback submitted yet</p>
          </div>
        ) : (
          feedbacks?.map(fb => (
            <Card key={fb.id} className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setSelectedFb(fb)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= fb.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm line-clamp-2">{fb.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(fb.created_at), 'dd MMM yyyy')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selectedFb} onOpenChange={() => setSelectedFb(null)}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Feedback Details</DrawerTitle>
          </DrawerHeader>
          <div data-vaul-no-drag className="overflow-y-auto flex-1 min-h-0">
            {detailContent}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
}
