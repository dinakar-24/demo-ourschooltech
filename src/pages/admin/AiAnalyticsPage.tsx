import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Loader2, Send, RefreshCw, Sparkles } from 'lucide-react';
import { useAiAnalytics, type AnalyticsAnswer, type InsightCard } from '@/hooks/useAiAnalytics';

const STARTERS = [
  'How much fee is still pending this month?',
  'Which class has the weakest attendance in the last 7 days?',
  'How many students are at high risk of fee default?',
  'Show the overall school attendance percentage this month.',
];

const TOOL_LABELS: Record<string, string> = {
  get_attendance_summary: 'Attendance',
  get_fee_status: 'Fees',
  get_exam_results: 'Results',
  get_homework: 'Homework',
  get_timetable: 'Timetable',
  get_school_overview: 'School overview',
  get_risk_list: 'Risk lists',
};

export default function AiAnalyticsPage() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<AnalyticsAnswer[]>([]);
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const { ask, insights } = useAiAnalytics();

  const submit = async (text: string) => {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setQuestion('');
    const res = await ask.mutateAsync(q).catch(() => null);
    if (res) setHistory((prev) => [res, ...prev]);
  };

  const refreshInsights = async () => {
    const res = await insights.mutateAsync().catch(() => null);
    if (res) {
      setCards(res.cards ?? []);
      setGeneratedAt(res.generated_at ?? new Date().toISOString());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LineChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Analytics</h1>
            <p className="text-sm text-muted-foreground">Ask anything about your school. Answers come from live data.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How many students in Class 8 have pending fees above 10,000?"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit(question);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      disabled={ask.isPending}
                      className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button className="w-full sm:w-auto" onClick={() => submit(question)} disabled={ask.isPending || !question.trim()}>
                  {ask.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {ask.isPending ? 'Analysing…' : 'Ask'}
                </Button>
              </CardContent>
            </Card>

            {history.length === 0 && !ask.isPending && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Your answers will appear here.
                </CardContent>
              </Card>
            )}

            {history.map((h) => (
              <Card key={h.at}>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">{h.question}</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{h.answer}</ReactMarkdown>
                  </div>
                  {!!h.tools.length && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {h.tools.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {TOOL_LABELS[t] || t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Weekly insights
                </CardTitle>
                <Button size="sm" variant="outline" onClick={refreshInsights} disabled={insights.isPending}>
                  {insights.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(generatedAt).toLocaleString('en-IN')}
                  </p>
                )}
                {!cards.length && !insights.isPending && (
                  <p className="text-sm text-muted-foreground">
                    Generate a set of insight cards covering collection, attendance and student risk.
                  </p>
                )}
                {insights.isPending && <p className="text-sm text-muted-foreground">Building insights…</p>}
                {cards.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{c.answer}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}