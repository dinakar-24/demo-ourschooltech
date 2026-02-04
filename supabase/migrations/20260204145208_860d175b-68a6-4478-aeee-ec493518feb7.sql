
-- Phase 1: Database Schema Additions for School ERP SaaS

-- 1. Create academic_years table (needed first as it's referenced by other tables)
CREATE TABLE public.academic_years (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(school_id, name)
);

-- 2. Create classes table
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(school_id, name)
);

-- 3. Create sections table
CREATE TABLE public.sections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(class_id, name)
);

-- 4. Create homework table
CREATE TABLE public.homework (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    razorpay_account_id TEXT,
    plan_type TEXT NOT NULL DEFAULT 'yearly',
    student_count INTEGER NOT NULL DEFAULT 0,
    price_per_student INTEGER NOT NULL DEFAULT 250,
    total_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'trial')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create subscription_payments table
CREATE TABLE public.subscription_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create fee_structures table
CREATE TABLE public.fee_structures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create student_fee_overrides table
CREATE TABLE public.student_fee_overrides (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    override_amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('concession', 'scholarship', 'extra', 'waiver')),
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create student_promotions table
CREATE TABLE public.student_promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    from_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    to_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    from_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    from_section TEXT,
    to_section TEXT,
    action TEXT NOT NULL CHECK (action IN ('promoted', 'detained', 'graduated', 'deactivated', 'transferred')),
    promoted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Add new columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS razorpay_account_id TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'expired', 'trial', 'pending')),
ADD COLUMN IF NOT EXISTS student_limit INTEGER DEFAULT 500;

-- 11. Add new columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'transferred', 'deactivated')),
ADD COLUMN IF NOT EXISTS roll_number INTEGER;

-- Enable RLS on all new tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_years
CREATE POLICY "Users can view academic years in their school" ON public.academic_years
    FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage academic years" ON public.academic_years
    FOR ALL USING (
        school_id = get_user_school_id(auth.uid()) 
        AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
    );

-- RLS Policies for classes
CREATE POLICY "Users can view classes in their school" ON public.classes
    FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage classes" ON public.classes
    FOR ALL USING (
        school_id = get_user_school_id(auth.uid()) 
        AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
    );

-- RLS Policies for sections
CREATE POLICY "Users can view sections in their school" ON public.sections
    FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage sections" ON public.sections
    FOR ALL USING (
        school_id = get_user_school_id(auth.uid()) 
        AND (has_role(auth.uid(), 'school_admin') OR has_role(auth.uid(), 'super_admin'))
    );

-- RLS Policies for homework
CREATE POLICY "Users can view homework in their school" ON public.homework
    FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Teachers can manage homework" ON public.homework
    FOR ALL USING (
        school_id = get_user_school_id(auth.uid()) 
        AND (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'school_admin'))
    );

-- RLS Policies for subscriptions
CREATE POLICY "Super admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can view own subscription" ON public.subscriptions
    FOR SELECT USING (
        school_id = get_user_school_id(auth.uid()) 
        AND has_role(auth.uid(), 'school_admin')
    );

-- RLS Policies for subscription_payments
CREATE POLICY "Super admins can manage all payments" ON public.subscription_payments
    FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can view own payments" ON public.subscription_payments
    FOR SELECT USING (
        school_id = get_user_school_id(auth.uid()) 
        AND has_role(auth.uid(), 'school_admin')
    );

-- RLS Policies for fee_structures
CREATE POLICY "Users can view fee structures in their school" ON public.fee_structures
    FOR SELECT USING (school_id = get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage fee structures" ON public.fee_structures
    FOR ALL USING (
        school_id = get_user_school_id(auth.uid()) 
        AND has_role(auth.uid(), 'school_admin')
    );

-- RLS Policies for student_fee_overrides
CREATE POLICY "Admins can manage fee overrides" ON public.student_fee_overrides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = student_id 
            AND s.school_id = get_user_school_id(auth.uid())
        )
        AND has_role(auth.uid(), 'school_admin')
    );

CREATE POLICY "Parents can view own child fee overrides" ON public.student_fee_overrides
    FOR SELECT USING (
        has_role(auth.uid(), 'parent') 
        AND student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.profiles p ON s.parent_email = p.email
            WHERE p.id = auth.uid()
        )
    );

-- RLS Policies for student_promotions
CREATE POLICY "Admins can manage promotions" ON public.student_promotions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = student_id 
            AND s.school_id = get_user_school_id(auth.uid())
        )
        AND has_role(auth.uid(), 'school_admin')
    );

CREATE POLICY "Users can view promotions in their school" ON public.student_promotions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = student_id 
            AND s.school_id = get_user_school_id(auth.uid())
        )
    );

-- Create triggers for updated_at columns
CREATE TRIGGER update_academic_years_updated_at
    BEFORE UPDATE ON public.academic_years
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_sections_class_id ON public.sections(class_id);
CREATE INDEX idx_sections_school_id ON public.sections(school_id);
CREATE INDEX idx_homework_school_id ON public.homework(school_id);
CREATE INDEX idx_homework_class_id ON public.homework(class_id);
CREATE INDEX idx_homework_due_date ON public.homework(due_date);
CREATE INDEX idx_subscriptions_school_id ON public.subscriptions(school_id);
CREATE INDEX idx_subscription_payments_school_id ON public.subscription_payments(school_id);
CREATE INDEX idx_fee_structures_school_id ON public.fee_structures(school_id);
CREATE INDEX idx_fee_structures_academic_year_id ON public.fee_structures(academic_year_id);
CREATE INDEX idx_student_fee_overrides_student_id ON public.student_fee_overrides(student_id);
CREATE INDEX idx_student_promotions_student_id ON public.student_promotions(student_id);
CREATE INDEX idx_students_academic_year_id ON public.students(academic_year_id);
CREATE INDEX idx_students_status ON public.students(status);
