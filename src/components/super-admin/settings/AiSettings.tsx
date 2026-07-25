import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'flash', label: 'Fast · Gemini Flash' },
  { value: 'pro', label: 'Deep · Gemini Pro' },
];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'concise', label: 'Concise' },
  { value: 'playful', label: 'Playful' },
];

const ROLE_OPTIONS = ['parent', 'student', 'teacher', 'school_admin'];

interface AiConfig {
  enabled: boolean;
  model: string;
  tone: string;
  custom_instructions: string;
  allowed_roles: string[];
}

const DEFAULT_CONFIG: AiConfig = {
  enabled: true,
  model: 'auto',
  tone: 'friendly',
  custom_instructions: '',
  allowed_roles: [...ROLE_OPTIONS],
};

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  ai_settings: AiConfig | null;
}

export function AiSettings() {
  const { getSetting, updateSetting } = useSystemSettings();
  const globalDefaults = getSetting<AiConfig>('ai_defaults', DEFAULT_CONFIG);
  const [defaults, setDefaults] = useState<AiConfig>(globalDefaults);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiConfig>(DEFAULT_CONFIG);
  const [savingSchool, setSavingSchool] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { setDefaults(globalDefaults); }, [globalDefaults.enabled, globalDefaults.model, globalDefaults.tone, globalDefaults.custom_instructions, globalDefaults.allowed_roles?.join(',')]);

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['super-admin-schools-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code, ai_settings')
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as SchoolRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [schools, search]);

  const selected = schools.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDraft({ ...DEFAULT_CONFIG, ...defaults, ...(selected.ai_settings || {}) });
    }
  }, [selectedId]);

  const saveDefaults = async () => {
    setSavingDefaults(true);
    try {
      await updateSetting.mutateAsync({ key: 'ai_defaults', value: defaults });
    } finally {
      setSavingDefaults(false);
    }
  };

  const saveSchool = async () => {
    if (!selected) return;
    setSavingSchool(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ ai_settings: draft as any })
        .eq('id', selected.id);
      if (error) throw error;
      toast.success(`AI settings updated for ${selected.name}`);
      qc.invalidateQueries({ queryKey: ['super-admin-schools-ai'] });
      qc.invalidateQueries({ queryKey: ['school-ai-settings'] });
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingSchool(false);
    }
  };

  const toggleRole = (role: string, setter: (c: AiConfig) => void, current: AiConfig) => {
    const next = current.allowed_roles.includes(role)
      ? current.allowed_roles.filter((r) => r !== role)
      : [...current.allowed_roles, role];
    setter({ ...current, allowed_roles: next });
  };

  return (
    <div className="space-y-5">
      {/* Global defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            OurSchool AI — Global Defaults
          </CardTitle>
          <CardDescription className="text-xs">
            Applied to any school that hasn't customised its own AI settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConfigEditor value={defaults} onChange={setDefaults} onToggleRole={(r) => toggleRole(r, setDefaults, defaults)} />
          <Button size="sm" onClick={saveDefaults} disabled={savingDefaults}>
            {savingDefaults ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Per-school */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-School AI Settings</CardTitle>
          <CardDescription className="text-xs">Override the defaults for a specific school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schools…" className="pl-9" />
          </div>

          <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
            {isLoading && <div className="p-3 text-sm text-muted-foreground">Loading schools…</div>}
            {!isLoading && filtered.length === 0 && <div className="p-3 text-sm text-muted-foreground">No schools found.</div>}
            {filtered.map((s) => {
              const cfg = s.ai_settings;
              const on = cfg?.enabled ?? defaults.enabled;
              const isSel = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-accent ${isSel ? 'bg-accent' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.code}</div>
                  </div>
                  <Badge variant={on ? 'default' : 'secondary'}>{on ? 'AI On' : 'AI Off'}</Badge>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-sm">
                Editing: <span className="font-semibold">{selected.name}</span>
              </div>
              <ConfigEditor value={draft} onChange={setDraft} onToggleRole={(r) => toggleRole(r, setDraft, draft)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveSchool} disabled={savingSchool}>
                  {savingSchool ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save for {selected.name}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft({ ...DEFAULT_CONFIG, ...defaults })}
                >
                  Reset to defaults
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigEditor({
  value,
  onChange,
  onToggleRole,
}: {
  value: AiConfig;
  onChange: (c: AiConfig) => void;
  onToggleRole: (role: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label className="text-sm font-medium">Enable OurSchool AI</Label>
          <p className="text-xs text-muted-foreground">Shows the floating AI button inside the app.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Model</Label>
          <Select value={value.model} onValueChange={(v) => onChange({ ...value, model: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MODEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Response tone</Label>
          <Select value={value.tone} onValueChange={(v) => onChange({ ...value, tone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TONE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Custom instructions</Label>
        <Textarea
          rows={3}
          value={value.custom_instructions}
          onChange={(e) => onChange({ ...value, custom_instructions: e.target.value })}
          placeholder="e.g. Always mention our school motto. Reply in Hindi by default."
        />
        <p className="text-[11px] text-muted-foreground">Prepended to the AI's system prompt for this school.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Available to roles</Label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => {
            const on = value.allowed_roles.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => onToggleRole(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'}`}
              >
                {r.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}