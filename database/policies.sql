-- Lekòl Pam - Row Level Security (RLS) Policies
-- Version: MVP v0.1 Foundations
-- Author: Jules, CTO & Product Architect

-- Enable RLS on all operational core tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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
-- 1. SCHOOLS POLICIES
-- ==========================================

CREATE POLICY school_super_admin_all ON schools
    FOR ALL
    USING (auth.get_user_role() = 'super_admin');

CREATE POLICY school_tenant_select ON schools
    FOR SELECT
    USING (id = auth.get_user_school_id());

-- ==========================================
-- 2. ROLES POLICIES
-- ==========================================

CREATE POLICY role_isolation_all ON roles
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'super_admin'));

CREATE POLICY role_isolation_select ON roles
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 3. USERS POLICIES
-- ==========================================

CREATE POLICY user_isolation_all ON users
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'super_admin'));

CREATE POLICY user_isolation_select ON users
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 4. ACADEMIC YEARS POLICIES
-- ==========================================

CREATE POLICY academic_years_isolation_all ON academic_years
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY academic_years_isolation_select ON academic_years
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 5. ACADEMIC PERIODS POLICIES
-- ==========================================

CREATE POLICY academic_periods_isolation_all ON academic_periods
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY academic_periods_isolation_select ON academic_periods
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 6. ACADEMIC LEVELS POLICIES
-- ==========================================

CREATE POLICY academic_levels_isolation_all ON academic_levels
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY academic_levels_isolation_select ON academic_levels
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 7. CLASSES POLICIES
-- ==========================================

CREATE POLICY classes_isolation_all ON classes
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY classes_isolation_select ON classes
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 8. SUBJECTS POLICIES
-- ==========================================

CREATE POLICY subjects_isolation_all ON subjects
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY subjects_isolation_select ON subjects
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 9. GUARDIANS POLICIES
-- ==========================================

CREATE POLICY guardians_isolation_all ON guardians
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY guardians_isolation_select ON guardians
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 10. STUDENTS POLICIES
-- ==========================================

CREATE POLICY students_isolation_all ON students
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY students_isolation_select ON students
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 11. ENROLLMENTS POLICIES
-- ==========================================

CREATE POLICY enrollments_isolation_all ON enrollments
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY enrollments_isolation_select ON enrollments
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 12. GRADES POLICIES
-- ==========================================

CREATE POLICY grades_isolation_write ON grades
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'teacher', 'super_admin'));

CREATE POLICY grades_isolation_select ON grades
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 13. ATTENDANCE POLICIES
-- ==========================================

CREATE POLICY attendance_isolation_write ON attendance
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'teacher', 'super_admin'));

CREATE POLICY attendance_isolation_select ON attendance
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 14. PAYMENTS POLICIES
-- ==========================================

CREATE POLICY payments_isolation_write ON payments
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY payments_isolation_select ON payments
    FOR SELECT
    USING (school_id = auth.get_user_school_id());

-- ==========================================
-- 15. NOTIFICATIONS POLICIES
-- ==========================================

CREATE POLICY notifications_isolation_write ON notifications
    FOR ALL
    USING (school_id = auth.get_user_school_id() AND auth.get_user_role() IN ('school_admin', 'secretary', 'super_admin'));

CREATE POLICY notifications_isolation_select ON notifications
    FOR SELECT
    USING (school_id = auth.get_user_school_id());
