import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare, Star, Send, Loader2, User, EyeOff,
} from 'lucide-react';
import {
  useFeedbackList, useFeedbackResponses, useRespondToFeedback, useUpdateFeedbackStatus,
  Feedback,
} from '@/hooks/useFeedback';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  reviewed: 'bg-primary/10 text-primary',
  resolved: 'bg-success/10 text-success',
};

export default function FeedbackPage() {
  const { data: feedbacks, isLoading } = useFeedbackList(true);
  const respondMutation = useRespondToFeedback();
  const updateStatus = useUpdateFeedbackStatus();
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: responses, isLoading: responsesLoading } = useFeedbackResponses(selected?.id);

  const filtered = feedbacks?.filter(f => statusFilter === 'all' || f.status === statusFilter) || [];

  const handleRespond = async () => {
    if (!selected || !responseText.trim()) return;
    await respondMutation.mutateAsync({ feedbackId: selected.id, response: responseText });
    setResponseText('');
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <AdminLayout title="Feedback">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: feedbacks?.length || 0 },
            { label: 'Pending', value: feedbacks?.filter(f => f.status === 'pending').length || 0 },
            { label: 'Reviewed', value: feedbacks?.filter(f => f.status === 'reviewed').length || 0 },
            { label: 'Avg Rating', value: feedbacks?.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12 inline-block" /> : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No feedback yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(fb => (
                  <div key={fb.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelected(fb); setResponseText(''); }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {fb.is_anonymous ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{fb.is_anonymous ? 'Anonymous' : fb.submitter_name || 'Unknown'}</span>
                            {fb.submitter_role && !fb.is_anonymous && (
                              <Badge variant="outline" className="text-[10px] capitalize">{fb.submitter_role}</Badge>
                            )}
                            <Badge className={`text-[10px] ${statusColors[fb.status] || ''}`}>{fb.status}</Badge>
                          </div>
                          {renderStars(fb.rating)}
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{fb.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(fb.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Feedback Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selected.is_anonymous ? 'Anonymous' : selected.submitter_name}</span>
                {renderStars(selected.rating)}
              </div>
              <p className="text-sm">{selected.message}</p>

              <div className="flex gap-2">
                {['pending', 'reviewed', 'resolved'].map(s => (
                  <Button
                    key={s}
                    variant={selected.status === s ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize text-xs"
                    onClick={() => updateStatus.mutateAsync({ id: selected.id, status: s }).then(() => setSelected({ ...selected, status: s }))}
                  >
                    {s}
                  </Button>
                ))}
              </div>

              {/* Responses */}
              <div className="border-t pt-3 space-y-3">
                <p className="text-sm font-medium">Responses</p>
                {responsesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : responses?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No responses yet</p>
                ) : (
                  responses?.map(r => (
                    <div key={r.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{r.response}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button size="icon" className="shrink-0 self-end" onClick={handleRespond} disabled={respondMutation.isPending || !responseText.trim()}>
                  {respondMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
