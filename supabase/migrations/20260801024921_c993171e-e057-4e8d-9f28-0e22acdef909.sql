-- ============================================================
-- Phase 1: OurSchool AI Suite foundation
-- ============================================================

-- ---------- ai_generations ----------
CREATE TABLE public.ai_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  generation_type text NOT NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  class_name text,
  section text,
  subject text,
  status text NOT NULL DEFAULT 'draft',
  model text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage own school AI generations"
ON public.ai_generations FOR ALL TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'school_admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
)
WITH CHECK (
  school_id = public.get_user_school_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'school_admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
);

CREATE POLICY "Super admins manage all AI generations"
ON public.ai_generations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ai_generations_school_type ON public.ai_generations (school_id, generation_type, created_at DESC);
CREATE INDEX idx_ai_generations_status ON public.ai_generations (school_id, status);

CREATE TRIGGER update_ai_generations_updated_at
BEFORE UPDATE ON public.ai_generations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---------- ai_predictions ----------
CREATE TABLE public.ai_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  prediction_type text NOT NULL,
  risk_score numeric NOT NULL DEFAULT 0,
  risk_band text NOT NULL DEFAULT 'low',
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendation text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_id, prediction_type)
);

GRANT SELECT ON public.ai_predictions TO authenticated;
GRANT ALL ON public.ai_predictions TO service_role;

ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own school predictions"
ON public.ai_predictions FOR SELECT TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'school_admin')
    OR public.has_role(auth.uid(), 'teacher')
  )
);

CREATE POLICY "Super admins view all predictions"
ON public.ai_predictions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Parents view own children predictions"
ON public.ai_predictions FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.parent_user_id = auth.uid()
  )
);

CREATE POLICY "Students view own predictions"
ON public.ai_predictions FOR SELECT TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

CREATE INDEX idx_ai_predictions_school_type ON public.ai_predictions (school_id, prediction_type, risk_score DESC);
CREATE INDEX idx_ai_predictions_student ON public.ai_predictions (student_id);

CREATE TRIGGER update_ai_predictions_updated_at
BEFORE UPDATE ON public.ai_predictions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---------- ai_usage_ledger ----------
CREATE TABLE public.ai_usage_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  model text NOT NULL,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_usage_ledger TO authenticated;
GRANT ALL ON public.ai_usage_ledger TO service_role;

ALTER TABLE public.ai_usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins view own school AI usage"
ON public.ai_usage_ledger FOR SELECT TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND public.has_role(auth.uid(), 'school_admin')
);

CREATE POLICY "Super admins view all AI usage"
ON public.ai_usage_ledger FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_ai_usage_school_date ON public.ai_usage_ledger (school_id, created_at DESC);


-- ---------- usage summary RPC ----------
CREATE OR REPLACE FUNCTION public.get_ai_usage_summary(_school_id uuid, _days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result json;
  _since timestamptz := now() - make_interval(days => GREATEST(_days, 1));
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'super_admin')
    OR (_school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'))
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'total_calls', COALESCE(COUNT(*), 0),
    'total_tokens_in', COALESCE(SUM(tokens_in), 0),
    'total_tokens_out', COALESCE(SUM(tokens_out), 0),
    'estimated_cost', COALESCE(SUM(estimated_cost), 0),
    'by_feature', COALESCE((
      SELECT json_agg(f) FROM (
        SELECT feature, COUNT(*) AS calls, SUM(tokens_in + tokens_out) AS tokens
        FROM public.ai_usage_ledger
        WHERE school_id = _school_id AND created_at >= _since
        GROUP BY feature ORDER BY calls DESC
      ) f
    ), '[]'::json)
  )
  INTO _result
  FROM public.ai_usage_ledger
  WHERE school_id = _school_id AND created_at >= _since;

  RETURN _result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ai_usage_summary(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_summary(uuid, integer) TO authenticated;