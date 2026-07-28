
-- Transport Routes
CREATE TABLE public.transport_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  route_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  capacity INTEGER DEFAULT 40,
  start_location TEXT,
  end_location TEXT,
  stops JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student Transport Mapping
CREATE TABLE public.student_transport (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  pickup_stop TEXT,
  drop_stop TEXT,
  boarding_type TEXT DEFAULT 'both' CHECK (boarding_type IN ('pickup', 'drop', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, route_id)
);

-- Indexes
CREATE INDEX idx_transport_routes_school ON public.transport_routes(school_id);
CREATE INDEX idx_student_transport_route ON public.student_transport(route_id);
CREATE INDEX idx_student_transport_student ON public.student_transport(student_id);
CREATE INDEX idx_student_transport_school ON public.student_transport(school_id);

-- RLS for transport_routes
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view transport routes"
ON public.transport_routes FOR SELECT
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can manage transport routes"
ON public.transport_routes FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can update transport routes"
ON public.transport_routes FOR UPDATE
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can delete transport routes"
ON public.transport_routes FOR DELETE
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

-- RLS for student_transport
ALTER TABLE public.student_transport ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view student transport"
ON public.student_transport FOR SELECT
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can manage student transport"
ON public.student_transport FOR INSERT
WITH CHECK (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can update student transport"
ON public.student_transport FOR UPDATE
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

CREATE POLICY "Admins can delete student transport"
ON public.student_transport FOR DELETE
USING (
  school_id IN (
    SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('school_admin', 'super_admin'))
  )
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
);

-- Timestamp trigger
CREATE TRIGGER update_transport_routes_updated_at
BEFORE UPDATE ON public.transport_routes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_transport_updated_at
BEFORE UPDATE ON public.student_transport
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
