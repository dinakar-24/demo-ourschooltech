import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Brain, Loader2, RefreshCw, TrendingUp, CalendarX, IndianRupee, BellRing } from 'lucide-react';
import { useAiInsights, type PredictionType } from '@/hooks/useAiInsights';

const TABS: { value: PredictionType; label: string; icon: any }[] = [
  { value: 'fee_default', label: 'Fee risk', icon: IndianRupee },
  { value: 'attendance', label: 'Attendance risk', icon: CalendarX },
  { value: 'performance', label: 'Performance risk', icon: TrendingUp },
];

const BAND_STYLE: Record<string, string> = {
  high: 'bg-destructive/15 text-destructive',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-success/15 text-success',
};

export default function AiInsightsPage() {
  const [type, setType] = useState<PredictionType>('fee_default');
  const { predictions, isLoading, lastComputedAt, usage, runPredictions, notifyParent } = useAiInsights(type);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const counts = {
    high: predictions.filter(p => p.risk_band === 'high').length,
    medium: predictions.filter(p => p.risk_band === 'medium').length,
    low: predictions.filter(p => p.risk_band === 'low').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Insights</h1>
              <p className="text-sm text-muted-foreground">
                {lastComputedAt
                  ? `Last scored ${new Date(lastComputedAt).toLocaleString('en-IN')}`
                  : 'Risk scoring has not run yet for this school.'}
                {' · Runs automatically every night'}
              </p>
            </div>
          </div>
          <Button onClick={() => runPredictions.mutate()} disabled={runPredictions.isPending}>
            {runPredictions.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {runPredictions.isPending ? 'Scoring…' : 'Run analysis'}
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-3">
          {(['high', 'medium', 'low'] as const).map(b => (
            <Card key={b}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{b} risk</p>
                <p className="text-2xl font-semibold mt-1">{counts[b]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={type} onValueChange={v => setType(v as PredictionType)}>
          <TabsList className="w-full grid grid-cols-3">
            {TABS.map(t => <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && predictions.length === 0 && (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
              No risk records yet. Run the analysis to score students.
            </CardContent></Card>
          )}
          {predictions.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{p.student?.full_name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">
                      Class {p.student?.class_name || '—'}{p.student?.section ? ` - ${p.student.section}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className={BAND_STYLE[p.risk_band]}>{p.risk_band} · {p.risk_score}</Badge>
                </div>
                <Progress value={p.risk_score} className="h-1.5" />
                {!!p.reasons?.length && (
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                    {p.reasons.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
                {p.recommendation && (
                  <p className="text-xs bg-muted/50 rounded-md p-2"><span className="font-medium">Suggested action: </span>{p.recommendation}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!p.student?.parent_user_id || (notifyParent.isPending && notifyingId === p.id)}
                    onClick={() => {
                      setNotifyingId(p.id);
                      notifyParent.mutate(p, { onSettled: () => setNotifyingId(null) });
                    }}
                  >
                    {notifyParent.isPending && notifyingId === p.id
                      ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      : <BellRing className="h-3.5 w-3.5 mr-2" />}
                    {p.prediction_type === 'fee_default' ? 'Send fee reminder' : 'Notify parent'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usage && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">AI usage (last 30 days)</CardTitle></CardHeader>
            <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-sm">
              <div><p className="text-muted-foreground text-xs">Calls</p><p className="font-semibold">{usage.total_calls}</p></div>
              <div><p className="text-muted-foreground text-xs">Tokens in</p><p className="font-semibold">{usage.total_tokens_in}</p></div>
              <div><p className="text-muted-foreground text-xs">Tokens out</p><p className="font-semibold">{usage.total_tokens_out}</p></div>
              <div><p className="text-muted-foreground text-xs">Est. cost</p><p className="font-semibold">₹{Number(usage.estimated_cost || 0).toFixed(2)}</p></div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
