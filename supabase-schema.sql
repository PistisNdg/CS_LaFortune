-- ============================================
-- CSF Présence - Schéma de base de données Supabase
-- PostgreSQL
-- ============================================

-- Activer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Énumérations (Enums)
-- ============================================

DROP TYPE IF EXISTS role_enum CASCADE;
CREATE TYPE role_enum AS ENUM ('DIRECTION', 'ENSEIGNANT', 'PARENT', 'SURVEILLANT');

DROP TYPE IF EXISTS niveau_enum CASCADE;
CREATE TYPE niveau_enum AS ENUM ('MATERNELLE', 'PRIMAIRE', 'SECONDAIRE');

DROP TYPE IF EXISTS statut_eleve_enum CASCADE;
CREATE TYPE statut_eleve_enum AS ENUM ('ACTIF', 'SUSPENDU', 'SORTI');

DROP TYPE IF EXISTS lien_parent_enum CASCADE;
CREATE TYPE lien_parent_enum AS ENUM ('PERE', 'MERE', 'TUTEUR', 'AUTRE');

DROP TYPE IF EXISTS canal_notification_enum CASCADE;
CREATE TYPE canal_notification_enum AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'AUCUN');

DROP TYPE IF EXISTS type_jour_enum CASCADE;
CREATE TYPE type_jour_enum AS ENUM ('COURS', 'FERIE', 'VACANCES', 'EXAMEN');

DROP TYPE IF EXISTS statut_presence_enum CASCADE;
CREATE TYPE statut_presence_enum AS ENUM ('PRESENT', 'RETARD', 'ABSENT', 'ABSENT_JUSTIFIE', 'EXCLU');

DROP TYPE IF EXISTS source_presence_enum CASCADE;
CREATE TYPE source_presence_enum AS ENUM ('SCAN', 'MANUEL', 'IMPORT');

DROP TYPE IF EXISTS resultat_scan_enum CASCADE;
CREATE TYPE resultat_scan_enum AS ENUM ('SUCCES', 'ELEVE_INCONNU', 'QR_INVALIDE', 'ERREUR_SYSTEME');

DROP TYPE IF EXISTS statut_justificatif_enum CASCADE;
CREATE TYPE statut_justificatif_enum AS ENUM ('EN_ATTENTE', 'ACCEPTE', 'REFUSE');

DROP TYPE IF EXISTS statut_notification_enum CASCADE;
CREATE TYPE statut_notification_enum AS ENUM ('EN_ATTENTE', 'ENVOYE', 'ECHOUE', 'LU');

-- ============================================
-- Tables
-- ============================================

-- Années Scolaires
DROP TABLE IF EXISTS annees_scolaires CASCADE;
CREATE TABLE annees_scolaires (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    libelle TEXT UNIQUE NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    est_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enseignants (sans dépendances)
DROP TABLE IF EXISTS enseignants CASCADE;
CREATE TABLE enseignants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nom TEXT NOT NULL,
    postnom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone_e164 TEXT,
    email TEXT UNIQUE,
    matiere_principale TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Parents (sans dépendances)
DROP TABLE IF EXISTS parents CASCADE;
CREATE TABLE parents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nom TEXT NOT NULL,
    postnom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    lien lien_parent_enum NOT NULL,
    telephone_e164 TEXT,
    whatsapp_e164 TEXT,
    email TEXT UNIQUE,
    canal_prefere canal_notification_enum DEFAULT 'AUCUN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Utilisateurs (sans dépendances)
DROP TABLE IF EXISTS utilisateurs CASCADE;
CREATE TABLE utilisateurs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role role_enum NOT NULL,
    lie_a_id TEXT,
    actif BOOLEAN DEFAULT true,
    derniere_connexion_utc TIMESTAMP,
    force_changement_mdp BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes (dépend de annees_scolaires et enseignants)
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    annee_id TEXT NOT NULL,
    niveau niveau_enum NOT NULL,
    nom TEXT NOT NULL,
    section TEXT,
    titulaire_ens_id TEXT,
    effectif_max INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (annee_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    FOREIGN KEY (titulaire_ens_id) REFERENCES enseignants(id) ON DELETE SET NULL,
    UNIQUE(annee_id, nom)
);

-- Élèves (dépend de classes)
DROP TABLE IF EXISTS eleves CASCADE;
CREATE TABLE eleves (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    matricule TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    postnom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F')),
    date_naissance TIMESTAMP NOT NULL,
    classe_id TEXT NOT NULL,
    statut statut_eleve_enum DEFAULT 'ACTIF',
    date_inscription TIMESTAMP DEFAULT NOW(),
    qr_public_id TEXT UNIQUE NOT NULL,
    photo_ref TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Liens Parent-Élève (dépend de parents et eleves)
DROP TABLE IF EXISTS liens_parent_eleve CASCADE;
CREATE TABLE liens_parent_eleve (
    parent_id TEXT NOT NULL,
    eleve_id TEXT NOT NULL,
    est_contact_principal BOOLEAN DEFAULT false,
    PRIMARY KEY (parent_id, eleve_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE
);

-- Affectations Enseignant-Classe (dépend de enseignants, classes, annees_scolaires)
DROP TABLE IF EXISTS affectations CASCADE;
CREATE TABLE affectations (
    enseignant_id TEXT NOT NULL,
    classe_id TEXT NOT NULL,
    annee_id TEXT NOT NULL,
    PRIMARY KEY (enseignant_id, classe_id, annee_id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
    FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (annee_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE
);

-- Calendrier Scolaire
DROP TABLE IF EXISTS calendrier CASCADE;
CREATE TABLE calendrier (
    date TIMESTAMP PRIMARY KEY,
    type type_jour_enum NOT NULL,
    libelle TEXT,
    annee_id TEXT NOT NULL,
    FOREIGN KEY (annee_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE
);

-- Règles Horaires
DROP TABLE IF EXISTS regles_horaires CASCADE;
CREATE TABLE regles_horaires (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    niveau niveau_enum NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('MATIN', 'APRES_MIDI')),
    heure_debut TEXT NOT NULL, -- Format "HH:MM"
    heure_limite TEXT NOT NULL, -- Format "HH:MM"
    heure_tolerance TEXT NOT NULL, -- Format "HH:MM"
    est_actif BOOLEAN DEFAULT true,
    annee_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (annee_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE
);

-- Scans QR (sans dépendances sur presences)
DROP TABLE IF EXISTS scans CASCADE;
CREATE TABLE scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    horodatage_utc TIMESTAMP DEFAULT NOW(),
    horodatage_local TIMESTAMP DEFAULT NOW(),
    eleve_id TEXT,
    appareil_id TEXT,
    user_id TEXT,
    resultat resultat_scan_enum NOT NULL,
    synchronise_apres_hors_ligne BOOLEAN DEFAULT false,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE SET NULL
);

-- Présences (dépend de eleves, classes, annees_scolaires, scans)
DROP TABLE IF EXISTS presences CASCADE;
CREATE TABLE presences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date TIMESTAMP NOT NULL,
    eleve_id TEXT NOT NULL,
    classe_id TEXT NOT NULL,
    annee_id TEXT NOT NULL,
    statut statut_presence_enum NOT NULL,
    heure_arrivee_locale TEXT,
    minutes_retard INTEGER,
    source source_presence_enum DEFAULT 'SCAN',
    scan_id TEXT,
    saisi_par_user_id TEXT,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (annee_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL,
    UNIQUE(eleve_id, date)
);

-- Justificatifs d'Absence (dépend de eleves, parents)
DROP TABLE IF EXISTS justificatifs CASCADE;
CREATE TABLE justificatifs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    eleve_id TEXT NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    motif TEXT NOT NULL,
    statut statut_justificatif_enum DEFAULT 'EN_ATTENTE',
    depose_par_parent_id TEXT,
    traite_par_user_id TEXT,
    commentaire TEXT,
    piece_jointe_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (depose_par_parent_id) REFERENCES parents(id) ON DELETE SET NULL
);

-- Notifications (dépend de parents, eleves)
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id TEXT NOT NULL,
    eleve_id TEXT NOT NULL,
    type TEXT NOT NULL,
    canal canal_notification_enum NOT NULL,
    statut statut_notification_enum DEFAULT 'EN_ATTENTE',
    horodatage_utc TIMESTAMP DEFAULT NOW(),
    erreur TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE
);

-- Journal d'Audit (sans dépendances)
DROP TABLE IF EXISTS journal_audit CASCADE;
CREATE TABLE journal_audit (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    horodatage_utc TIMESTAMP DEFAULT NOW(),
    user_id TEXT,
    action TEXT NOT NULL,
    entite TEXT NOT NULL,
    entite_id TEXT,
    ip_hash TEXT,
    details_json JSONB
);

-- Paramètres (sans dépendances)
DROP TABLE IF EXISTS parametres CASCADE;
CREATE TABLE parametres (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cle TEXT UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes pour optimiser les performances
-- ============================================

-- Indexes sur les champs fréquemment recherchés
CREATE INDEX IF NOT EXISTS idx_eleves_classe_id ON eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule);
CREATE INDEX IF NOT EXISTS idx_eleves_qr_public_id ON eleves(qr_public_id);
CREATE INDEX IF NOT EXISTS idx_eleves_statut ON eleves(statut);

CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
CREATE INDEX IF NOT EXISTS idx_presences_eleve_id ON presences(eleve_id);
CREATE INDEX IF NOT EXISTS idx_presences_classe_id ON presences(classe_id);
CREATE INDEX IF NOT EXISTS idx_presences_statut ON presences(statut);

CREATE INDEX IF NOT EXISTS idx_scans_horodatage_utc ON scans(horodatage_utc);
CREATE INDEX IF NOT EXISTS idx_scans_eleve_id ON scans(eleve_id);
CREATE INDEX IF NOT EXISTS idx_scans_resultat ON scans(resultat);

CREATE INDEX IF NOT EXISTS idx_calendrier_date ON calendrier(date);
CREATE INDEX IF NOT EXISTS idx_calendrier_type ON calendrier(type);

CREATE INDEX IF NOT EXISTS idx_notifications_parent_id ON notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_statut ON notifications(statut);

CREATE INDEX IF NOT EXISTS idx_journal_audit_horodatage_utc ON journal_audit(horodatage_utc);
CREATE INDEX IF NOT EXISTS idx_journal_audit_user_id ON journal_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_audit_action ON journal_audit(action);

-- ============================================
-- Trigger pour updated_at automatique
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables avec updated_at
CREATE TRIGGER update_annees_scolaires_updated_at BEFORE UPDATE ON annees_scolaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eleves_updated_at BEFORE UPDATE ON eleves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enseignants_updated_at BEFORE UPDATE ON enseignants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_utilisateurs_updated_at BEFORE UPDATE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regles_horaires_updated_at BEFORE UPDATE ON regles_horaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_justificatifs_updated_at BEFORE UPDATE ON justificatifs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at BEFORE UPDATE ON parametres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Données initiales (optionnel)
-- ============================================

-- Insérer l'année scolaire 2026-2027
INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active)
VALUES ('2026-2027', '2026-09-01', '2027-07-31', true);

-- Insérer des paramètres par défaut
INSERT INTO parametres (cle, valeur, description) VALUES
    ('ecole_nom', 'CSF La Fortune', 'Nom de l''école'),
    ('ecole_adresse', 'Kinshasa, RD Congo', 'Adresse de l''école'),
    ('ecole_telephone', '+243999123456', 'Numéro de téléphone de l''école'),
    ('retard_minutes_seuil', '30', 'Seuil de retard en minutes'),
    ('notification_retard_active', 'true', 'Activer les notifications de retard'),
    ('notification_absence_active', 'true', 'Activer les notifications d''absence');

-- ============================================
-- Utilisateurs de démonstration
-- ============================================

-- Créer les utilisateurs dans Supabase Auth
-- Note: Ces utilisateurs doivent être créés via le Dashboard Supabase ou via l'API Admin
-- Voici les commandes SQL pour créer les utilisateurs (nécessite l'accès admin)

-- Direction
INSERT INTO utilisateurs (email, password_hash, role, actif)
VALUES ('direction@lafortune.cd', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qYqYqYqYq', 'DIRECTION', true)
ON CONFLICT (email) DO UPDATE SET role = 'DIRECTION';

-- Enseignant
INSERT INTO utilisateurs (email, password_hash, role, actif)
VALUES ('marie.kabongo@lafortune.cd', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qYqYqYqYq', 'ENSEIGNANT', true)
ON CONFLICT (email) DO UPDATE SET role = 'ENSEIGNANT';

-- Parent
INSERT INTO utilisateurs (email, password_hash, role, actif)
VALUES ('pierre.mbuyi@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qYqYqYqYq', 'PARENT', true)
ON CONFLICT (email) DO UPDATE SET role = 'PARENT';

-- Utilisateur Direction
INSERT INTO utilisateurs (email, password_hash, role, actif)
VALUES ('direction@lafortune.cd', '$2b$12$yMBk./Z.JGYDoVGX4mRV8e4y0aMsu8z5EaVgffu3MsUe8szrP74RO', 'DIRECTION', true);

-- Utilisateur Enseignant
INSERT INTO utilisateurs (email, password_hash, role, lie_a_id, actif)
VALUES ('marie.kabongo@lafortune.cd', '$2b$12$yA3f1YHpkEmbQNgAaty3f.fngp6GMLv5CoyLYqpAXgYNKA/Sz20IW', 'ENSEIGNANT', NULL, true);

-- Utilisateur Parent
INSERT INTO utilisateurs (email, password_hash, role, lie_a_id, actif)
VALUES ('pierre.mbuyi@example.com', '$2b$12$2tWAvZMl0IemYAgiyDC6ruCcv6Jl/3ee0CPdmNBQu5WSeGFickfNS', 'PARENT', NULL, true);
