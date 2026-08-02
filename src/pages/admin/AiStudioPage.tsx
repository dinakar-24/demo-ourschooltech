import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Sparkles, Loader2, Copy, Check, Trash2, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAiStudio, GENERATION_LABELS, type AiGeneration, type GenerationType } from '@/hooks/useAiStudio';
import { toast } from 'sonner';

const TYPES = Object.keys(GENERATION_LABELS) as GenerationType[];

interface FieldDef { name: string; label: string; type?: 'text' | 'textarea' | 'date' | 'number'; placeholder?: string }

const FIELDS: Record<GenerationType, FieldDef[]> = {
  homework: [
    { name: 'class_name', label: 'Class', placeholder: 'e.g. 7' },
    { name: 'section', label: 'Section', placeholder: 'A' },
    { name: 'subject', label: 'Subject', placeholder: 'Science' },
    { name: 'topic', label: 'Topic', placeholder: 'Photosynthesis' },
    { name: 'question_count', label: 'Questions', type: 'number', placeholder: '8' },
    { name: 'due_date', label: 'Due date', type: 'date' },
    { name: 'instructions', label: 'Extra instructions', type: 'textarea' },
  ],
  circular: [
    { name: 'topic', label: 'Topic', placeholder: 'Annual Day' },
    { name: 'audience', label: 'Audience', placeholder: 'Parents' },
    { name: 'event_date', label: 'Date / deadline', type: 'date' },
    { name: 'key_points', label: 'Key points', type: 'textarea' },
  ],
  notice: [
    { name: 'topic', label: 'Topic', placeholder: 'Holiday announcement' },
    { name: 'audience', label: 'Audience', placeholder: 'All students' },
    { name: 'event_date', label: 'Date', type: 'date' },
    { name: 'key_points', label: 'Key points', type: 'textarea' },
  ],
  report_card_remarks: [
    { name: 'class_name', label: 'Class', placeholder: '9' },
    { name: 'subject', label: 'Subject', placeholder: 'Overall' },
    { name: 'topic', label: 'Student summary', type: 'textarea', placeholder: 'Strengths, weaknesses, marks' },
  ],
  timetable: [
    { name: 'class_name', label: 'Class', placeholder: '6' },
    { name: 'section', label: 'Section', placeholder: 'B' },
    { name: 'instructions', label: 'Constraints', type: 'textarea', placeholder: 'Teacher load, lunch break, periods per subject' },
  ],
  lesson_plan: [
    { name: 'class_name', label: 'Class', placeholder: '8' },
    { name: 'subject', label: 'Subject', placeholder: 'Maths' },
    { name: 'topic', label: 'Topic', placeholder: 'Linear equations' },
    { name: 'instructions', label: 'Extra instructions', type: 'textarea' },
  ],
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-success/15 text-success',
  published: 'bg-primary/15 text-primary',
  discarded: 'bg-destructive/15 text-destructive',
};

export default function AiStudioPage() {
  const isMobile = useIsMobile();
  const [type, setType] = useState<GenerationType>('homework');
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<AiGeneration | null>(null);
  const [copied, setCopied] = useState(false);

  const { generations, isLoading, generate, setStatus, remove } = useAiStudio('all');
  const fields = useMemo(() => FIELDS[type], [type]);

  const handleGenerate = async () => {
    const res = await generate.mutateAsync({ generationType: type, params: values });
    if (res) setPreview(res);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('Could not copy'); }
  };

  const previewBody = preview && (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => copy(preview.content)}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy
        </Button>
        <Button size="sm" onClick={() => { setStatus.mutate({ id: preview.id, status: 'approved' }); setPreview({ ...preview, status: 'approved' }); }}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setStatus.mutate({ id: preview.id, status: 'discarded' }); setPreview(null); }}>
          Discard
        </Button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{preview.content}</ReactMarkdown>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Studio</h1>
            <p className="text-sm text-muted-foreground">Generate homework, circulars, notices and plans — review before publishing.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => { setType(v as GenerationType); setValues({}); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{GENERATION_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(f => (
                  <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
                    <Label>{f.label}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea
                        value={values[f.name] ?? ''}
                        placeholder={f.placeholder}
                        onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={values[f.name] ?? ''}
                        placeholder={f.placeholder}
                        onWheel={e => (e.target as HTMLInputElement).blur()}
                        onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                        className={f.type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={handleGenerate} disabled={generate.isPending}>
                {generate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generate.isPending ? 'Generating…' : 'Generate draft'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent drafts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!isLoading && generations.length === 0 && (
                <p className="text-sm text-muted-foreground">No drafts yet. Generate your first one.</p>
              )}
              {generations.map(g => (
                <div key={g.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button className="text-left flex-1" onClick={() => setPreview(g)}>
                      <p className="text-sm font-medium line-clamp-2">{g.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {GENERATION_LABELS[g.generation_type] || g.generation_type} · {new Date(g.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(g.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Badge className={STATUS_STYLE[g.status] || ''} variant="secondary">{g.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {isMobile ? (
        <Drawer open={!!preview} onOpenChange={o => !o && setPreview(null)}>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader><DrawerTitle className="text-left">{preview?.title}</DrawerTitle></DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8">{previewBody}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />{preview?.title}</DialogTitle></DialogHeader>
            {previewBody}
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
