-- Lekòl Pam - Row Level Security (RLS) Policies
-- Version: MVP v0.1 Foundations - Master Aligned Aligns (LP-CODE-004)
-- Author: Jules, CTO & Product Architect

-- Enable RLS on all operational core tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_labels ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTIONS FOR RLS MULTI-TENANCY & ROLES
-- ==========================================

-- Extract school_id for the logged-in user profile
CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Verify if the logged-in user profile holds a specific role name
CREATE OR REPLACE FUNCTION public.current_user_has_role(
    required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        from public.user_roles ur
        join public.roles r
            on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = required_role
    );
$$;

-- Quick check for director privilege level
CREATE OR REPLACE FUNCTION public.is_school_director()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.current_user_has_role('DIRECTOR');
$$;

-- ==========================================
-- RLS POLICIES FOR SECURE MULTI-TENANCY (LP-CODE-004)
-- ==========================================

-- 1. SCHOOLS
CREATE POLICY "School super admin all" ON public.schools
    FOR ALL USING (public.current_user_has_role('super_admin'));

CREATE POLICY "Users can view their school" ON public.schools
    FOR SELECT TO authenticated USING (id = public.current_user_school_id());

-- 2. PROFILES
CREATE POLICY "Users can view profiles in their school" ON public.profiles
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "School admin insert update delete profiles" ON public.profiles
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN'))
    );

-- 3. ROLES
CREATE POLICY "Roles isolation" ON public.roles
    FOR ALL USING (school_id = public.current_user_school_id());

-- 4. USER ROLES
CREATE POLICY "User roles isolation" ON public.user_roles
    FOR ALL USING (
        user_id IN (SELECT id FROM public.profiles WHERE school_id = public.current_user_school_id())
    );

-- 5. ACADEMIC YEARS
CREATE POLICY "School users can view academic years" ON public.academic_years
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized staff edit academic years" ON public.academic_years
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN') OR public.current_user_has_role('SECRETARY'))
    );

-- 6. ACADEMIC PERIODS
CREATE POLICY "Periods isolation" ON public.academic_periods
    FOR ALL USING (
        academic_year_id IN (SELECT id FROM public.academic_years WHERE school_id = public.current_user_school_id())
    );

-- 7. ACADEMIC LEVELS
CREATE POLICY "Academic levels isolation" ON public.academic_levels
    FOR ALL USING (school_id = public.current_user_school_id());

-- 8. ACADEMIC PROGRAMS
CREATE POLICY "Academic programs isolation" ON public.academic_programs
    FOR ALL USING (school_id = public.current_user_school_id());

-- 9. CLASSES
CREATE POLICY "School users can view classes" ON public.classes
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized staff edit classes" ON public.classes
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN') OR public.current_user_has_role('SECRETARY'))
    );

-- 10. SUBJECTS
CREATE POLICY "School users can view subjects" ON public.subjects
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized staff edit subjects" ON public.subjects
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN'))
    );

-- 11. CLASS SUBJECTS
CREATE POLICY "Class subjects isolation" ON public.class_subjects
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE school_id = public.current_user_school_id())
    );

-- 12. STUDENTS
CREATE POLICY "School users can view students" ON public.students
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized staff can create students" ON public.students
    FOR INSERT TO authenticated WITH CHECK (
        school_id = public.current_user_school_id()
        AND (
            public.current_user_has_role('DIRECTOR')
            OR public.current_user_has_role('ADMIN')
            OR public.current_user_has_role('SECRETARY')
        )
    );

CREATE POLICY "Authorized staff can update students" ON public.students
    FOR UPDATE TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (
            public.current_user_has_role('DIRECTOR')
            OR public.current_user_has_role('ADMIN')
            OR public.current_user_has_role('SECRETARY')
        )
    ) WITH CHECK (school_id = public.current_user_school_id());

-- 13. GUARDIANS
CREATE POLICY "School users can view guardians" ON public.guardians
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized staff edit guardians" ON public.guardians
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN') OR public.current_user_has_role('SECRETARY'))
    );

-- 14. STUDENT GUARDIANS
CREATE POLICY "Student guardians isolation" ON public.student_guardians
    FOR ALL USING (
        student_id IN (SELECT id FROM public.students WHERE school_id = public.current_user_school_id())
    );

-- 15. ENROLLMENTS
CREATE POLICY "School users can view enrollments" ON public.enrollments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id AND s.school_id = public.current_user_school_id()
        )
    );

CREATE POLICY "Authorized staff edit enrollments" ON public.enrollments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id AND s.school_id = public.current_user_school_id()
        )
    );

-- 16. TEACHER ASSIGNMENTS
CREATE POLICY "Teacher assignments isolation" ON public.teacher_assignments
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE school_id = public.current_user_school_id())
    );

-- 17. GRADES
CREATE POLICY "School users can view grades" ON public.grades
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 from public.enrollments e
            join public.students s on s.id = e.student_id
            where e.id = grades.enrollment_id AND s.school_id = public.current_user_school_id()
        )
    );

CREATE POLICY "Authorized teachers can write grades" ON public.grades
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 from public.enrollments e
            join public.students s on s.id = e.student_id
            where e.id = grades.enrollment_id AND s.school_id = public.current_user_school_id()
        )
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('TEACHER') OR public.current_user_has_role('ADMIN'))
    );

-- 18. ATTENDANCE
CREATE POLICY "School users can view attendance" ON public.attendance
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 from public.enrollments e
            join public.students s on s.id = e.student_id
            where e.id = attendance.enrollment_id AND s.school_id = public.current_user_school_id()
        )
    );

CREATE POLICY "Authorized teachers can write attendance" ON public.attendance
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 from public.enrollments e
            join public.students s on s.id = e.student_id
            where e.id = attendance.enrollment_id AND s.school_id = public.current_user_school_id()
        )
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('TEACHER') OR public.current_user_has_role('ADMIN'))
    );

-- 19. PAYMENTS
CREATE POLICY "School users can view payments" ON public.payments
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Authorized accountants can write payments" ON public.payments
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ACCOUNTANT') OR public.current_user_has_role('SECRETARY'))
    );

-- 20. NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (recipient_id = auth.uid());

CREATE POLICY "Authorized staff write notifications" ON public.notifications
    FOR ALL TO authenticated USING (
        school_id = public.current_user_school_id()
        AND (public.current_user_has_role('DIRECTOR') OR public.current_user_has_role('ADMIN') OR public.current_user_has_role('SECRETARY'))
    );

-- 21. SCHOOL SETTINGS
CREATE POLICY "School users can view settings" ON public.school_settings
    FOR SELECT TO authenticated USING (school_id = public.current_user_school_id());

CREATE POLICY "Directors can update settings" ON public.school_settings
    FOR UPDATE TO authenticated USING (
        school_id = public.current_user_school_id()
        AND public.current_user_has_role('DIRECTOR')
    ) WITH CHECK (school_id = public.current_user_school_id());

-- 22. GRADING MODES
CREATE POLICY "Grading modes isolation" ON public.grading_modes
    FOR ALL USING (school_id = public.current_user_school_id());

-- 23. GRADING LABELS
CREATE POLICY "Grading labels isolation" ON public.grading_labels
    FOR ALL USING (
        grading_mode_id IN (SELECT id FROM public.grading_modes WHERE school_id = public.current_user_school_id())
    );
