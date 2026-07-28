-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'parent', 'student');

-- Create schools table
CREATE TABLE public.schools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    logo TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    employee_id TEXT,
    class_name TEXT,
    section TEXT,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admission_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    section TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (school_id, admission_number)
);

-- Create teachers table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    subjects TEXT[],
    classes TEXT[],
    qualification TEXT,
    joining_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (school_id, employee_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, date)
);

-- Create fees table
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_date DATE NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create results table
CREATE TABLE public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (exam_id, student_id)
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_roles app_role[],
    target_classes TEXT[],
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies for schools
CREATE POLICY "Schools are viewable by authenticated users"
ON public.schools FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Schools can be managed by super_admin"
ON public.schools FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view profiles in their school"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'school_admin') 
  AND school_id = public.get_user_school_id(auth.uid())
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their school"
ON public.user_roles FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin')
);

-- RLS Policies for students (school-scoped)
CREATE POLICY "Users can view students in their school"
ON public.students FOR SELECT
TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage students"
ON public.students FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- RLS Policies for teachers (school-scoped)
CREATE POLICY "Users can view teachers in their school"
ON public.teachers FOR SELECT
TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Admins can manage teachers"
ON public.teachers FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- RLS Policies for attendance
CREATE POLICY "Teachers can manage attendance in their school"
ON public.attendance FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'school_admin'))
);

CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Parents can view child attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'parent')
  AND student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.parent_email = p.email 
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for fees
CREATE POLICY "Admins can manage fees"
ON public.fees FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND public.has_role(auth.uid(), 'school_admin')
);

CREATE POLICY "Students can view own fees"
ON public.fees FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Parents can view child fees"
ON public.fees FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'parent')
  AND student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.parent_email = p.email 
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for exams
CREATE POLICY "Users can view exams in their school"
ON public.exams FOR SELECT
TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Admins and teachers can manage exams"
ON public.exams FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- RLS Policies for results
CREATE POLICY "Teachers can manage results"
ON public.results FOR ALL
TO authenticated
USING (
  exam_id IN (SELECT id FROM public.exams WHERE school_id = public.get_user_school_id(auth.uid()))
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'school_admin'))
);

CREATE POLICY "Students can view own results"
ON public.results FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Parents can view child results"
ON public.results FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'parent')
  AND student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.parent_email = p.email 
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for announcements
CREATE POLICY "Users can view announcements in their school"
ON public.announcements FOR SELECT
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND is_active = true
);

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (
  school_id = public.get_user_school_id(auth.uid())
  AND public.has_role(auth.uid(), 'school_admin')
);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();