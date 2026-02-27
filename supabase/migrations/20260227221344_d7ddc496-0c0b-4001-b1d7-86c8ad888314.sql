-- Fix: Restrict online class meeting credentials to relevant participants
DROP POLICY IF EXISTS "Users can view online classes in their school" ON public.online_classes;

CREATE POLICY "Restricted access to online classes"
ON public.online_classes FOR SELECT
USING (
  school_id = get_user_school_id(auth.uid())
  AND (
    -- Admins and super admins see all
    has_role(auth.uid(), 'school_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    -- Teachers see their own classes
    OR teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
    -- Students see classes matching their class/section
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.school_id = online_classes.school_id
        AND s.class_name = online_classes.class_name
        AND (online_classes.section IS NULL OR s.section = online_classes.section)
    )
    -- Parents see classes for their children
    OR EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.profiles p ON s.parent_email = p.email
      WHERE p.id = auth.uid()
        AND s.school_id = online_classes.school_id
        AND s.class_name = online_classes.class_name
        AND (online_classes.section IS NULL OR s.section = online_classes.section)
    )
  )
);