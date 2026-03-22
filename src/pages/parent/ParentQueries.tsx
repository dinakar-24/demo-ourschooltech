import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { HelpCircle, Plus, Loader2, Clock, CheckCircle2, CircleDot, Send } from 'lucide-react';
import { useSupportQueryList, useQueryResponses, useSubmitQuery, useRespondToQuery, SupportQuery } from '@/hooks/useSupportQueries';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const statusIcons: Record<string, React.ReactNode> = {
  open: <CircleDot className="w-3 h-3 text-primary" />,
  in_progress: <Clock className="w-3 h-3 text-warning" />,
  resolved: <CheckCircle2 className="w-3 h-3 text-success" />,
  closed: <CheckCircle2 className="w-3 h-3 text-muted-foreground" />,
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
};

export default function ParentQueries() {
  const { user } = useAuth();
  const { data: queries, isLoading } = useSupportQueryList(false);
  const submitQuery = useSubmitQuery();
  const respondToQuery = useRespondToQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<SupportQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });

  const { data: responses } = useQueryResponses(selected?.id);

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return;
    await submitQuery.mutateAsync(form);
    setIsOpen(false);
    setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
  };

  const handleRespond = async () => {
    if (!selected || !responseText.trim()) return;
    await respondToQuery.mutateAsync({ queryId: selected.id, response: responseText });
    setResponseText('');
  };

  const newQueryForm = (
    <div className="space-y-5 px-4 pb-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Subject</Label>
        <Input placeholder="Brief subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="h-11 text-base" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea placeholder="Describe your query..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="min-h-[120px] text-base" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="fees">Fees</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="academics">Academics</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={submitQuery.isPending || !form.subject || !form.description}>
        {submitQuery.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Query
      </Button>
    </div>
  );

  const detailContent = selected && (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{selected.ticket_number}</Badge>
        <Badge className={`text-xs capitalize ${priorityColors[selected.priority]}`}>{selected.priority}</Badge>
        <span className="flex items-center gap-1 text-xs capitalize">{statusIcons[selected.status]} {selected.status.replace('_', ' ')}</span>
      </div>
      <p className="text-sm leading-relaxed">{selected.description}</p>
      <p className="text-xs text-muted-foreground">{format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a')}</p>

      {responses && responses.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold">Responses</p>
          {responses.map(r => (
            <div key={r.id} className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm">{r.response}</p>
              <p className="text-xs text-muted-foreground mt-2">{r.responder_name} · {format(new Date(r.created_at), 'dd MMM yyyy')}</p>
            </div>
          ))}
        </div>
      )}

      {selected.status !== 'closed' && selected.status !== 'resolved' && (
        <div className="flex gap-2">
          <Textarea placeholder="Add a reply..." value={responseText} onChange={e => setResponseText(e.target.value)} className="min-h-[50px] text-base flex-1" />
          <Button size="icon" className="shrink-0 self-end h-10 w-10" onClick={handleRespond} disabled={respondToQuery.isPending || !responseText.trim()}>
            {respondToQuery.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <MobileLayout title="My Queries" showBack>
      <div className="p-4 space-y-3">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button className="w-full h-11"><Plus className="w-4 h-4 mr-2" /> Raise a Query</Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>New Query</DrawerTitle>
            </DrawerHeader>
            <div data-vaul-no-drag className="overflow-y-auto flex-1 min-h-0">
              {newQueryForm}
            </div>
          </DrawerContent>
        </Drawer>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : queries?.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <HelpCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No queries raised yet</p>
          </div>
        ) : (
          queries?.map(q => (
            <Card key={q.id} className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { setSelected(q); setResponseText(''); }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{q.subject}</span>
                  <Badge variant="outline" className="text-[10px]">{q.ticket_number}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs capitalize">{statusIcons[q.status]} {q.status.replace('_', ' ')}</span>
                  <Badge className={`text-[10px] capitalize ${priorityColors[q.priority]}`}>{q.priority}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{q.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(q.created_at), 'dd MMM yyyy')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onOpenChange={() => setSelected(null)}>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-left">{selected?.subject}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            {detailContent}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
}
