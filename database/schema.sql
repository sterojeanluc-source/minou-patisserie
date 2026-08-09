-- Lekòl Pam - Database Schema (PostgreSQL for Supabase)
-- Version: MVP v0.1 Foundations
-- Author: Jules, CTO & Product Architect

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. SCHOOLS (Multi-Tenant Tenants)
-- ==========================================
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_ecole VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    statut_abonnement VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'trial'
    type_cycle VARCHAR(50) NOT NULL DEFAULT 'Mixte', -- 'Fondamental', 'Secondaire', 'Mixte'
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    delete_reason TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 2. ROLES (RBAC Permissions)
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL, -- 'super_admin', 'school_admin', 'teacher', 'secretary', 'parent'
    permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 3. USERS (Platform Staff and Accounts)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    auth_user_id UUID UNIQUE, -- Connects with Supabase auth.users
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    delete_reason TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    CONSTRAINT unique_school_email UNIQUE (school_id, email)
);

-- ==========================================
-- 4. ACADEMIC YEARS
-- ==========================================
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    label VARCHAR(100) NOT NULL, -- ex: '2025-2026'
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 5. ACADEMIC PERIODS (Configurable: 3 Trimestres, 5 Étapes, Custom)
-- ==========================================
CREATE TABLE IF NOT EXISTS academic_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE NOT NULL,
    label VARCHAR(100) NOT NULL, -- ex: '1er Trimestre', 'Étape 1'
    type_periode VARCHAR(50) NOT NULL DEFAULT 'Trimestre', -- 'Trimestre', 'Etape', 'Custom'
    numero_ordre INT NOT NULL,
    poids DECIMAL(5,2) DEFAULT 1.00 NOT NULL, -- Poids ou coefficient de la période dans la moyenne annuelle
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_verrouille BOOLEAN DEFAULT false NOT NULL, -- Verrouillage de la saisie des notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 6. ACADEMIC LEVELS (Niveaux d'études)
-- ==========================================
CREATE TABLE IF NOT EXISTS academic_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    nom VARCHAR(100) NOT NULL, -- ex: 'Maternelle', 'Fondamental 1-6', 'Fondamental 7-9', 'Secondaire'
    code VARCHAR(50), -- ex: 'MAT', 'F1', 'F2', 'SEC'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 7. CLASSES
-- ==========================================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    level_id UUID REFERENCES academic_levels(id) ON DELETE CASCADE NOT NULL,
    nom VARCHAR(100) NOT NULL, -- ex: '7ème AF A', 'NS4'
    capacite_max INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 8. SUBJECTS (Matières)
-- ==========================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    nom VARCHAR(255) NOT NULL, -- ex: 'Mathématiques', 'Physique'
    code VARCHAR(50),
    coefficient_defaut INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 9. GUARDIANS (Parents / Responsables)
-- ==========================================
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone_principal VARCHAR(50) NOT NULL,
    telephone_secondaire VARCHAR(50),
    email VARCHAR(255),
    relation VARCHAR(100) DEFAULT 'Mère', -- 'Père', 'Mère', 'Tuteur', etc.
    adresse TEXT,
    responsable_financier BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    delete_reason TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 10. STUDENTS (Élèves)
-- ==========================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    matricule VARCHAR(100) UNIQUE NOT NULL,
    nie_menfp VARCHAR(100), -- Numéro d'Identification Unique MENFP
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe CHAR(1) CHECK (sexe IN ('M', 'F')) NOT NULL,
    date_naissance DATE NOT NULL,
    adresse TEXT,
    photo_url TEXT,
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    solde_du DECIMAL(12,2) DEFAULT 0.00 NOT NULL, -- Reste à payer pour l'année scolaire en cours
    serie_ns4 VARCHAR(50), -- Optionnel pour NS4: 'SVT', 'SMP', 'SES', 'LLC'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    delete_reason TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 11. ENROLLMENTS (Inscriptions Annuelles des Élèves)
-- ==========================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE NOT NULL,
    date_inscription DATE DEFAULT CURRENT_DATE NOT NULL,
    type_inscription VARCHAR(50) DEFAULT 'Nouveau' NOT NULL, -- 'Nouveau', 'Re-inscription'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    CONSTRAINT unique_student_year UNIQUE (student_id, year_id)
);

-- ==========================================
-- 12. GRADES (Notes)
-- ==========================================
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    period_id UUID REFERENCES academic_periods(id) ON DELETE CASCADE NOT NULL,
    note DECIMAL(5,2) NOT NULL, -- Cycle validation checked in domain (0-10 or 0-100)
    coefficient INT DEFAULT 1 NOT NULL,
    appreciation TEXT,
    saisi_par UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 13. ATTENDANCE (Présences)
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    statut VARCHAR(50) NOT NULL, -- 'Présent', 'Absent', 'En Retard'
    remarque TEXT,
    marque_par UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    CONSTRAINT unique_student_attendance_date UNIQUE (student_id, date)
);

-- ==========================================
-- 14. PAYMENTS (Paiements et Recouvrements)
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    montant_paye DECIMAL(12,2) NOT NULL,
    methode_paiement VARCHAR(50) NOT NULL, -- 'MonCash', 'NatCash', 'Cash', 'Cheque'
    reference_transaction VARCHAR(255), -- ID Transaction MonCash ou Natcom
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recu_par UUID REFERENCES users(id),
    recu_numero VARCHAR(100) NOT NULL, -- Numéro de reçu incrémental unique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- 15. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    destinataire_type VARCHAR(50) NOT NULL, -- 'Parent', 'User', 'Student'
    destinataire_id UUID NOT NULL, -- ID générique (Parent.id, User.id, etc.)
    canal VARCHAR(50) NOT NULL, -- 'WhatsApp', 'SMS', 'Internal'
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    statut_envoi VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Sent', 'Failed'
    date_envoi TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

-- ==========================================
-- AUTOMATIC UPDATED_AT TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('CREATE TRIGGER trigger_update_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t);
    END LOOP;
END;
$$;
