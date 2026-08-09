-- ============================================================
-- LEKÒL PAM — TEST JOURNEY SEED
-- LP-CODE-001 Validation
-- ============================================================

-- 1. Create the School
INSERT INTO public.schools (id, name, code, language, currency, timezone)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'Institution Test Lekòl Pam',
    'LPM-TEST',
    'fr',
    'HTG',
    'America/Port-au-Prince'
) ON CONFLICT (code) DO NOTHING;

-- 2. Create the Academic Year 2026-2027
INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, status)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    '2026–2027',
    '2026-09-01',
    '2027-06-30',
    'active'
) ON CONFLICT (school_id, name) DO NOTHING;

-- 3. Configure 5 Steps (academic_periods)
INSERT INTO public.academic_periods (id, academic_year_id, name, sequence, status)
VALUES
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e003', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002', 'Étape 1', 1, 'active'),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e004', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002', 'Étape 2', 2, 'draft'),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e005', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002', 'Étape 3', 3, 'draft'),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e006', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002', 'Étape 4', 4, 'draft'),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e007', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002', 'Étape 5', 5, 'draft')
ON CONFLICT (academic_year_id, sequence) DO NOTHING;

-- 4. Create Academic Levels (Kindergarten, 7e AF, 8e AF)
INSERT INTO public.academic_levels (id, school_id, name, code, sequence)
VALUES
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e008', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001', 'Kindergarten', 'MAT', 1),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e009', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001', '7e AF', 'F7', 2),
('a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e010', 'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001', '8e AF', 'F8', 3)
ON CONFLICT (school_id, name) DO NOTHING;

-- 5. Create Academic Program (Classical)
INSERT INTO public.academic_programs (id, school_id, name, description)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e011',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'Classical',
    'Programme d''éducation classique standard'
) ON CONFLICT (school_id, name) DO NOTHING;

-- 6. Create Class (7e AF A)
INSERT INTO public.classes (id, school_id, academic_year_id, academic_level_id, program_id, name, capacity)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e012',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e009',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e011',
    '7e AF A',
    35
);

-- 7. Create Subject (Mathématiques)
INSERT INTO public.subjects (id, school_id, name, code)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e013',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'Mathématiques',
    'MATH-07'
) ON CONFLICT (school_id, name) DO NOTHING;

-- 8. Assign Subject to Class with coefficient
INSERT INTO public.class_subjects (class_id, subject_id, coefficient)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e012',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e013',
    1.50
) ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 9. Create Teacher Profile (Marie)
INSERT INTO public.profiles (id, school_id, first_name, last_name, phone, is_active)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e014',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'Marie',
    'Desir',
    '+509 3838-4949',
    true
);

-- 10. Assign Marie to teach Math in 7e AF A
INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e014',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e012',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e013'
) ON CONFLICT (teacher_id, class_id, subject_id) DO NOTHING;

-- 11. Create Guardian (Jean Jean)
INSERT INTO public.guardians (id, school_id, first_name, last_name, relationship, phone, email, address)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e015',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'Jean',
    'Jean',
    'Père',
    '+509 3737-1212',
    'jeanjean@example.com',
    '12, Rue de la Paix, Pétion-Ville, Haïti'
);

-- 12. Create Student (Sara Jean)
INSERT INTO public.students (id, school_id, student_number, first_name, last_name, date_of_birth, gender, status)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e016',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'SARA-001',
    'Sara',
    'Jean',
    '2014-05-15',
    'F',
    'active'
) ON CONFLICT (school_id, student_number) DO NOTHING;

-- 13. Create Student-Guardian Relationship
INSERT INTO public.student_guardians (student_id, guardian_id, is_primary, can_view_academic, can_view_finance)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e016',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e015',
    true,
    true,
    true
) ON CONFLICT (student_id, guardian_id) DO NOTHING;

-- 14. Enroll Sara Jean in 7e AF A
INSERT INTO public.enrollments (id, student_id, academic_year_id, class_id, status)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e017',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e016',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e002',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e012',
    'active'
) ON CONFLICT (student_id, academic_year_id) DO NOTHING;

-- 15. Enter Grade: 16/20 for Étape 1 in Math (entered by Marie)
INSERT INTO public.grades (enrollment_id, academic_period_id, subject_id, score, max_score, comment, entered_by)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e017',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e003',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e013',
    16.00,
    20.00,
    'Excellent travail de premier cycle d''étape.',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e014'
);

-- 16. Mark Attendance: Sara marked 'present' for today
INSERT INTO public.attendance (enrollment_id, attendance_date, status, note, recorded_by)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e017',
    CURRENT_DATE,
    'present',
    'Arrivée à l''heure',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e014'
) ON CONFLICT (enrollment_id, attendance_date) DO NOTHING;

-- 17. Record Payment: 2000 HTG paid by Guardian via MonCash
INSERT INTO public.payments (school_id, student_id, guardian_id, amount, currency, payment_method, reference, recorded_by)
VALUES (
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e001',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e016',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e015',
    2000.00,
    'HTG',
    'moncash',
    'MNC-REF-2026-009843',
    'a0e0a0e0-b0b0-c0c0-d0d0-e0e0e0e0e014'
);
