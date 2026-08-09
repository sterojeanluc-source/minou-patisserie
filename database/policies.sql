-- Lekòl Pam - Row Level Security (RLS) Policies
-- Version: MVP v0.1 Foundations - Master Aligned
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

-- ==========================================
-- HELPER FUNCTIONS FOR RLS MULTI-TENANCY
-- ==========================================

-- Extract the active school_id from JWT metadata (custom claim in Supabase Auth JWT)
CREATE OR REPLACE FUNCTION auth.get_user_school_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'school_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- Extract the user's role from JWT metadata
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role', '')::TEXT;
$$ LANGUAGE sql STABLE;

-- ==========================================
-- RLS POLICIES FOR SECURE MULTI-TENANCY
-- ==========================================

-- 1. SCHOOLS
CREATE POLICY school_super_admin ON public.schools
    FOR ALL USING (auth.get_user_role() = 'super_admin');

CREATE POLICY school_tenant_select ON public.schools
    FOR SELECT USING (id = auth.get_user_school_id());

-- 2. PROFILES
CREATE POLICY profiles_isolation ON public.profiles
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 3. ROLES
CREATE POLICY roles_isolation ON public.roles
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 4. USER ROLES
CREATE POLICY user_roles_isolation ON public.user_roles
    FOR ALL USING (
        user_id IN (SELECT id FROM public.profiles WHERE school_id = auth.get_user_school_id())
    );

-- 5. ACADEMIC YEARS
CREATE POLICY academic_years_isolation ON public.academic_years
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 6. ACADEMIC PERIODS
CREATE POLICY academic_periods_isolation ON public.academic_periods
    FOR ALL USING (
        academic_year_id IN (SELECT id FROM public.academic_years WHERE school_id = auth.get_user_school_id())
    );

-- 7. ACADEMIC LEVELS
CREATE POLICY academic_levels_isolation ON public.academic_levels
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 8. ACADEMIC PROGRAMS
CREATE POLICY academic_programs_isolation ON public.academic_programs
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 9. CLASSES
CREATE POLICY classes_isolation ON public.classes
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 10. SUBJECTS
CREATE POLICY subjects_isolation ON public.subjects
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 11. CLASS SUBJECTS
CREATE POLICY class_subjects_isolation ON public.class_subjects
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE school_id = auth.get_user_school_id())
    );

-- 12. STUDENTS
CREATE POLICY students_isolation ON public.students
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 13. GUARDIANS
CREATE POLICY guardians_isolation ON public.guardians
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 14. STUDENT GUARDIANS
CREATE POLICY student_guardians_isolation ON public.student_guardians
    FOR ALL USING (
        student_id IN (SELECT id FROM public.students WHERE school_id = auth.get_user_school_id())
    );

-- 15. ENROLLMENTS
CREATE POLICY enrollments_isolation ON public.enrollments
    FOR ALL USING (
        student_id IN (SELECT id FROM public.students WHERE school_id = auth.get_user_school_id())
    );

-- 16. TEACHER ASSIGNMENTS
CREATE POLICY teacher_assignments_isolation ON public.teacher_assignments
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE school_id = auth.get_user_school_id())
    );

-- 17. GRADES
CREATE POLICY grades_isolation ON public.grades
    FOR ALL USING (
        enrollment_id IN (
            SELECT id FROM public.enrollments WHERE student_id IN (
                SELECT id FROM public.students WHERE school_id = auth.get_user_school_id()
            )
        )
    );

-- 18. ATTENDANCE
CREATE POLICY attendance_isolation ON public.attendance
    FOR ALL USING (
        enrollment_id IN (
            SELECT id FROM public.enrollments WHERE student_id IN (
                SELECT id FROM public.students WHERE school_id = auth.get_user_school_id()
            )
        )
    );

-- 19. PAYMENTS
CREATE POLICY payments_isolation ON public.payments
    FOR ALL USING (school_id = auth.get_user_school_id());

-- 20. NOTIFICATIONS
CREATE POLICY notifications_isolation ON public.notifications
    FOR ALL USING (school_id = auth.get_user_school_id());
