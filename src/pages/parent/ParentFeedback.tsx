import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare, Star, Plus, Loader2, EyeOff, User } from 'lucide-react';
import { useFeedbackList, useFeedbackResponses, useSubmitFeedback, Feedback } from '@/hooks/useFeedback';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  reviewed: 'bg-primary/10 text-primary',
  resolved: 'bg-success/10 text-success',
};

export default function ParentFeedback() {
  const { data: feedbacks, isLoading } = useFeedbackList(false);
  const submitFeedback = useSubmitFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFb, setSelectedFb] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: responses } = useFeedbackResponses(selectedFb?.id);

  const handleSubmit = async () => {
    if (!rating || !message.trim()) return;
    await submitFeedback.mutateAsync({ rating, message, is_anonymous: isAnonymous });
    setIsOpen(false);
    setRating(0);
    setMessage('');
    setIsAnonymous(false);
  };

  const renderStars = (value: number, interactive = false) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-5 h-5 cursor-pointer transition-colors ${i <= value ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
          onClick={interactive ? () => setRating(i) : undefined}
        />
      ))}
    </div>
  );

  return (
    <MobileLayout title="Feedback" showBack>
      <div className="p-4 space-y-3">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Submit Feedback</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Feedback</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rating</Label>
                {renderStars(rating, true)}
              </div>
              <div className="space-y-2">
                <Label>Your Feedback</Label>
                <Textarea placeholder="Share your thoughts..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[100px]" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label className="text-sm">Submit anonymously</Label>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitFeedback.isPending || !rating || !message.trim()}>
                {submitFeedback.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : feedbacks?.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No feedback submitted yet</p>
          </div>
        ) : (
          feedbacks?.map(fb => (
            <Card key={fb.id} className="cursor-pointer" onClick={() => setSelectedFb(fb)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= fb.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <Badge className={`text-[10px] ${statusColors[fb.status]}`}>{fb.status}</Badge>
                </div>
                <p className="text-sm line-clamp-2">{fb.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(fb.created_at), 'dd MMM yyyy')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail view */}
      <Dialog open={!!selectedFb} onOpenChange={() => setSelectedFb(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Feedback Details</DialogTitle></DialogHeader>
          {selectedFb && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= selectedFb.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <Badge className={`text-[10px] ${statusColors[selectedFb.status]}`}>{selectedFb.status}</Badge>
              </div>
              <p className="text-sm">{selectedFb.message}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(selectedFb.created_at), 'dd MMM yyyy, hh:mm a')}</p>

              {responses && responses.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Admin Response</p>
                  {responses.map(r => (
                    <div key={r.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{r.response}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.created_at), 'dd MMM yyyy')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
