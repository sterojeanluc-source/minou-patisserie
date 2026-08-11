-- ============================================================
-- LEKÒL PAM — DATABASE FOUNDATION
-- LP-CODE-001
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SCHOOLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT NOT NULL,
    code TEXT UNIQUE,
    logo_url TEXT,

    address TEXT,
    phone TEXT,
    email TEXT,

    language TEXT DEFAULT 'fr',
    currency TEXT DEFAULT 'HTG',
    timezone TEXT DEFAULT 'America/Port-au-Prince',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    phone TEXT,
    avatar_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, name)
);


-- ============================================================
-- 4. USER ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, role_id)
);


-- ============================================================
-- 5. ACADEMIC YEARS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'closed', 'archived')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, name)
);


-- ============================================================
-- 6. ACADEMIC PERIODS
-- Supports 3 trimesters, 5 steps, or custom periods
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academic_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    academic_year_id UUID NOT NULL
        REFERENCES public.academic_years(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,
    sequence INTEGER NOT NULL,

    start_date DATE,
    end_date DATE,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'closed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (academic_year_id, sequence)
);


-- ============================================================
-- 7. ACADEMIC LEVELS
-- Kindergarten, 1st AF, 7th AF, NS I, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academic_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    code TEXT,

    sequence INTEGER,

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, name)
);


-- ============================================================
-- 8. PROGRAMS
-- Classical, Technical, Sciences, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academic_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, name)
);


-- ============================================================
-- 9. CLASSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    academic_year_id UUID NOT NULL
        REFERENCES public.academic_years(id)
        ON DELETE CASCADE,

    academic_level_id UUID NOT NULL
        REFERENCES public.academic_levels(id),

    program_id UUID REFERENCES public.academic_programs(id),

    name TEXT NOT NULL,

    capacity INTEGER,

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 10. SUBJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    code TEXT,

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, name)
);


-- ============================================================
-- 11. CLASS SUBJECTS
-- Which subjects belong to which class
-- ============================================================

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,

    coefficient NUMERIC(6,2) DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (class_id, subject_id)
);


-- ============================================================
-- 12. STUDENTS
-- Permanent student identity
-- ============================================================

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    student_number TEXT NOT NULL,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    date_of_birth DATE,

    photo_url TEXT,

    gender TEXT,

    address TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'applicant',
                'active',
                'on_leave',
                'transferred',
                'withdrawn',
                'graduated',
                'alumni',
                'inactive'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id, student_number)
);


-- ============================================================
-- 13. GUARDIANS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    relationship TEXT, -- Legacy fallback, relationship is better defined on student_guardians join table

    phone TEXT,
    email TEXT,

    address TEXT,
    occupation TEXT, -- Professional occupation of guardian

    preferred_language TEXT DEFAULT 'fr',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 14. STUDENT GUARDIANS
-- Many-to-many relationship
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID DEFAULT uuid_generate_v4(), -- Add standard unique identifier

    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,

    guardian_id UUID NOT NULL
        REFERENCES public.guardians(id)
        ON DELETE CASCADE,

    relationship TEXT, -- Relationship to student, ex: 'Mère', 'Père', 'Tuteur'
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_financial_responsible BOOLEAN NOT NULL DEFAULT false,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT false,

    can_view_academic BOOLEAN NOT NULL DEFAULT true,
    can_view_finance BOOLEAN NOT NULL DEFAULT true,
    can_receive_notifications BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (student_id, guardian_id)
);


-- ============================================================
-- 15. ENROLLMENTS
-- Student's yearly school registration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,

    academic_year_id UUID NOT NULL
        REFERENCES public.academic_years(id)
        ON DELETE CASCADE,

    class_id UUID NOT NULL
        REFERENCES public.classes(id),

    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'pending',
                'active',
                'promoted',
                'repeated',
                'conditional',
                'withdrawn',
                'transferred',
                'graduated'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (student_id, academic_year_id)
);


-- ============================================================
-- 16. TEACHER ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    teacher_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    class_id UUID NOT NULL
        REFERENCES public.classes(id)
        ON DELETE CASCADE,

    subject_id UUID
        REFERENCES public.subjects(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (teacher_id, class_id, subject_id)
);


-- ============================================================
-- 17. GRADES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    enrollment_id UUID NOT NULL
        REFERENCES public.enrollments(id)
        ON DELETE CASCADE,

    academic_period_id UUID NOT NULL
        REFERENCES public.academic_periods(id)
        ON DELETE CASCADE,

    subject_id UUID NOT NULL
        REFERENCES public.subjects(id),

    score NUMERIC(6,2),

    max_score NUMERIC(6,2) NOT NULL DEFAULT 20,

    comment TEXT,

    entered_by UUID
        REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 18. ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    enrollment_id UUID NOT NULL
        REFERENCES public.enrollments(id)
        ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    status TEXT NOT NULL
        CHECK (
            status IN (
                'present',
                'absent',
                'late',
                'excused'
            )
        ),

    note TEXT,

    recorded_by UUID
        REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (enrollment_id, attendance_date)
);


-- ============================================================
-- 19. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.students(id),

    guardian_id UUID
        REFERENCES public.guardians(id),

    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

    currency TEXT NOT NULL DEFAULT 'HTG',

    payment_method TEXT NOT NULL
        CHECK (
            payment_method IN (
                'cash',
                'moncash',
                'bank',
                'card',
                'other'
            )
        ),

    reference TEXT,

    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),

    recorded_by UUID
        REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,

    recipient_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,
    message TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'general',

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 21. SCHOOL SETTINGS (LP-CODE-003)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,

    -- GENERAL
    default_language TEXT NOT NULL DEFAULT 'fr',
    timezone TEXT NOT NULL DEFAULT 'America/Port-au-Prince',
    currency TEXT NOT NULL DEFAULT 'HTG',

    -- ACADEMIC STRUCTURE
    period_structure TEXT NOT NULL DEFAULT 'custom'
        CHECK (
            period_structure IN (
                'trimester',
                'semester',
                'quarter',
                'custom'
            )
        ),

    period_count INTEGER NOT NULL DEFAULT 3
        CHECK (period_count > 0 AND period_count <= 12),

    -- GRADING
    grading_scale NUMERIC(6,2) NOT NULL DEFAULT 20
        CHECK (grading_scale > 0),

    passing_grade NUMERIC(6,2) NOT NULL DEFAULT 10
        CHECK (passing_grade >= 0),

    ranking_enabled BOOLEAN NOT NULL DEFAULT true,
    coefficient_enabled BOOLEAN NOT NULL DEFAULT true,

    -- STUDENT FEATURES
    attendance_enabled BOOLEAN NOT NULL DEFAULT true,
    behavior_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
    student_documents_enabled BOOLEAN NOT NULL DEFAULT true,

    -- PARENT FEATURES
    parent_bulletin_access BOOLEAN NOT NULL DEFAULT true,
    parent_attendance_access BOOLEAN NOT NULL DEFAULT true,
    parent_grades_access BOOLEAN NOT NULL DEFAULT true,
    parent_finance_access BOOLEAN NOT NULL DEFAULT true,

    -- KINDERGARTEN
    kindergarten_enabled BOOLEAN NOT NULL DEFAULT true,
    kindergarten_narrative_reports BOOLEAN NOT NULL DEFAULT true,
    kindergarten_pickup_security BOOLEAN NOT NULL DEFAULT true,

    -- FINANCE
    payments_enabled BOOLEAN NOT NULL DEFAULT true,
    online_payments_enabled BOOLEAN NOT NULL DEFAULT true,
    payment_receipts_enabled BOOLEAN NOT NULL DEFAULT true,

    -- COMMUNICATION
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    email_enabled BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (school_id)
);


-- ============================================================
-- 22. GRADING MODES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.grading_modes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    mode TEXT NOT NULL
        CHECK (
            mode IN (
                'numeric',
                'narrative',
                'mixed'
            )
        ),

    scale NUMERIC(6,2),
    passing_grade NUMERIC(6,2),
    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (school_id, name)
);


-- ============================================================
-- 23. GRADING LABELS (Appréciations Kindergarten & Niveaux)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.grading_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    grading_mode_id UUID NOT NULL
        REFERENCES public.grading_modes(id)
        ON DELETE CASCADE,

    label TEXT NOT NULL,
    code TEXT NOT NULL,
    sequence INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (grading_mode_id, code)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_school
ON public.profiles(school_id);

CREATE INDEX IF NOT EXISTS idx_students_school
ON public.students(school_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student
ON public.enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_year
ON public.enrollments(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_classes_school
ON public.classes(school_id);

CREATE INDEX IF NOT EXISTS idx_grades_enrollment
ON public.grades(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment
ON public.attendance(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_payments_student
ON public.payments(student_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
ON public.notifications(recipient_id);

CREATE INDEX IF NOT EXISTS idx_settings_school
ON public.school_settings(school_id);

CREATE INDEX IF NOT EXISTS idx_grading_modes_school
ON public.grading_modes(school_id);

-- UNIQUE PARTIAL INDEXES FOR STUDENT-GUARDIAN CONSTRAINTS (LP-CODE-009)
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_guardian_per_student
ON public.student_guardians(student_id)
WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS one_financial_guardian_per_student
ON public.student_guardians(student_id)
WHERE is_financial_responsible = true;


-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$;


CREATE OR REPLACE TRIGGER schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


CREATE OR REPLACE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


CREATE OR REPLACE TRIGGER students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


CREATE OR REPLACE TRIGGER grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


CREATE OR REPLACE TRIGGER settings_updated_at
BEFORE UPDATE ON public.school_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
