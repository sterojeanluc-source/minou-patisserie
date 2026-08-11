# DOMAIN MODEL - LEKÒL PAM

Ce document constitue la spécification officielle du **Domain Model** pour le projet **Lekòl Pam**, un ERP scolaire SaaS multi-tenant conçu pour le marché haïtien et international. Inspiré des principes du **Domain-Driven Design (DDD)**, ce modèle métier définit de manière stricte et pragmatique nos entités, agrégats, Value Objects, Domain Events, invariants et règles métier critiques afin de guider le développement de la phase **BUILD**.

---

## 1. PRINCIPES DE DESIGN & CONTEXT MAP

### 1.1 Le Multi-Tenant Strict (Isolation par `school_id`)
Chaque entité métier (à l'exception de l'entité globale `School`) appartient impérativement à une école et contient l'attribut `school_id` (UUID).
- **Règle d'Isolation d'Agrégat :** Aucun chargement ou modification ne peut s'effectuer sans validation de la correspondance entre le `school_id` du contexte de l'utilisateur connecté et celui de la cible.
- **Sécurité RLS (Row Level Security) :** Ce cloisonnement est doublé côté base de données PostgreSQL par des politiques RLS automatiques.

### 1.2 Suppressions Logiques (Soft Delete)
Pour des raisons de traçabilité, de conformité légale et d'historique, **aucune suppression physique** n'est tolérée sur les entités opérationnelles.
- Chaque entité implémente : `deleted_at`, `deleted_by`, `delete_reason`.
- Les entités supprimées logiquement sont automatiquement exclues des requêtes standards d'agrégation et de calcul de moyennes/statistiques.

---

## 2. BOUNDED CONTEXTS & AGGREGATE ROOTS

```
                                    +--------------------------------+
                                    |     School Management (SaaS)   |
                                    |        (Aggregate Root)        |
                                    +---------------+----------------+
                                                    |
         +------------------------------------------+------------------------------------------+
         |                                          |                                          |
+--------v--------+                        +--------v--------+                        +--------v--------+
|  User & Access  |                        |  Student & Fam  |                        |    Academics    |
| (Aggregate Root)|                        | (Aggregate Root)|                        | (Aggregate Root)|
+-----------------+                        +-----------------+                        +-----------------+
         |                                          |                                          |
         +------------------------------------------+------------------------------------------+
                                                    |
                                           +--------v--------+
                                           |     Finances    |
                                           | (Aggregate Root)|
                                           +-----------------+
```

---

## 3. AGRÉGAT 1 : SCHOOL MANAGEMENT (SAAS)

### 3.1 Racine de l'Agrégat : `School`
Cette entité globale représente l'établissement scolaire enregistré sur la plateforme SaaS.

#### Responsabilités :
- Encapsuler l'identité légale de l'école.
- Gérer l'état de l'abonnement SaaS (Starter, Standard, Premium) et restreindre les fonctionnalités associées.
- Configurer les paramètres globaux (Fuseau horaire, devise principale, cycle scolaire, logo, etc.).

#### Attributs :
- `id` (UUID - Clé Primaire globale)
- `nom_ecole` (String)
- `subdomain` (Value Object: `Subdomain`)
- `statut_abonnement` (Enum: `Active`, `Suspended`, `Trial`)
- `type_cycle` (Enum: `Fondamental`, `Secondaire`, `Mixte`)
- `branding` (Value Object: `BrandingSettings`)

#### Invariants de l'Agrégat :
- Le sous-domaine (`subdomain`) doit être unique sur l'ensemble de la plateforme SaaS et suivre un format strict (minuscules, sans caractères spéciaux ni espaces).
- Si le statut de l'abonnement est `Suspended`, l'accès de tous les utilisateurs (`users`) rattachés à cette école est bloqué au niveau du middleware, à l'exception de l'affichage de la page de facturation / recouvrement.

---

## 4. AGRÉGAT 2 : USER & ACCESS MANAGEMENT

### 4.1 Racine de l'Agrégat : `User`
Représente un compte utilisateur de la plateforme (Directeurs, secrétaires, enseignants).

#### Responsabilités :
- Porter l'identité d'accès et d'authentification.
- Assigner les rôles et permissions restrictifs.

#### Attributs :
- `id` (UUID)
- `school_id` (UUID - Lié à `School.id`)
- `email` (String - Unique par école)
- `telephone` (Value Object: `PhoneNumber`)
- `role_id` (UUID - Lié à `Role.id`)
- `status` (Enum: `Active`, `Inactive`)

#### Invariants & Règles Métier :
- L'adresse email doit être unique au sein de la même école (`school_id`).
- Un utilisateur ne peut exécuter une action système que si son `Role` contient la `Permission` requise (Validation systématique par RBAC - Role-Based Access Control).

---

## 5. AGRÉGAT 3 : STUDENT & FAMILY PORTAL

### 5.1 Racine de l'Agrégat : `Student`
L'entité centrale de l'ERP. Toute action académique ou financière gravite autour de l'élève.

#### Responsabilités :
- Stocker les attributs démographiques de l'élève.
- Assurer le lien obligatoire avec le tuteur / responsable financier (Famille).
- Générer et détenir le matricule officiel de l'école.

#### Attributs :
- `id` (UUID)
- `school_id` (UUID)
- `matricule` (Value Object: `Matricule`)
- `nie_menfp` (Value Object: `NIE` - Numéro d'Identification Unique MENFP)
- `nom` (String)
- `prenom` (String)
- `sexe` (Enum: `M`, `F`)
- `date_naissance` (Date)
- `classe_id` (UUID)
- `serie_ns4` (Enum - Optionnel pour NS4: `SVT`, `SMP`, `SES`, `LLC`)
- `parent_id` (UUID - Lié à `Parent.id`)

#### Invariants & Règles Métier :
- **NIE (Numéro d'Identification Unique) :** Doit suivre le format requis par le MENFP (Ministère de l'Éducation Nationale et de la Formation Professionnelle d'Haïti) s'il est fourni.
- **Série NS4 :** La série d'enseignement secondaire (`serie_ns4`) est obligatoire uniquement et exclusivement si la classe assignée est "NS4" (Nouveau Secondaire 4).
- **Matricule :** Généré automatiquement lors de l'onboarding selon le format `LPM-{YY}-{RAND4}`.

### 5.2 Entité : `Parent` (Tuteur)
Représente le responsable légal et financier de l'élève.

#### Responsabilités :
- Servir de point d'entrée pour la messagerie parent.
- Garantir le règlement financier des frais de scolarité (Responsable Financier).

#### Attributs :
- `id` (UUID)
- `school_id` (UUID)
- `nom` (String)
- `prenom` (String)
- `telephone_principal` (Value Object: `PhoneNumber`)
- `adresse` (String)

#### Invariants de Famille :
- Un parent peut être associé à plusieurs élèves (Fratrie). Le dossier parent permet de basculer entre les fiches des élèves rattachés sans reconnexion.

---

## 6. AGRÉGAT 4 : ACADEMICS (CADRE ACADÉMIQUE)

### 6.1 Racine de l'Agrégat : `AcademicYear`
Définit l'année académique active de l'établissement (ex: 2023-2024).

#### Responsabilités :
- Segmenter les sessions et inscriptions.
- Déterminer les périodes d'évaluations (Trimestres).

---

### 6.2 Entité : `Grade` (Note)
Représente l'évaluation chiffrée d'un élève dans une matière donnée pour une période définie.

#### Responsabilités :
- Valider la note entrée par l'enseignant.
- Exécuter la règle de cycle pour le calcul de moyenne.

#### Attributs :
- `id` (UUID)
- `school_id` (UUID)
- `eleve_id` (UUID - Lié à `Student.id`)
- `matiere_id` (UUID)
- `periode` (Integer: 1, 2, 3 pour les trimestres)
- `coefficient` (Integer - Par défaut 1)
- `note` (Decimal)

#### Invariants de Note (Cycle-Aware Strict Validation) :
- **Cycle Fondamental (Maternelle à 9ème AF) :** La note doit être obligatoirement comprise entre **0.00 et 10.00**.
- **Cycle Secondaire (NS1 à NS4) :** La note doit être obligatoirement comprise entre **0.00 et 100.00**.
- **Moyenne Générale :** Le calcul de la moyenne générale d'un trimestre applique la formule de la moyenne pondérée :
  $$\text{Moyenne} = \frac{\sum (\text{Note} \times \text{Coefficient})}{\sum \text{Coefficient}}$$

---

## 7. AGRÉGAT 5 : FINANCES (PAIEMENTS & RECOUVREMENT)

### 7.1 Racine de l'Agrégat : `Payment`
Représente un encaissement de frais de scolarité effectué par l'école ou payé par le parent.

#### Responsabilités :
- Enregistrer le flux financier entrant.
- Générer un reçu infalsifiable et traçable.
- Déduire automatiquement la dette (`solde_du`) de l'élève associé.

#### Attributs :
- `id` (UUID)
- `school_id` (UUID)
- `eleve_id` (UUID)
- `montant_paye` (Decimal)
- `methode_paiement` (Enum: `MonCash`, `NatCash`, `Cash`, `Cheque`)
- `date_paiement` (Timestamp)
- `reference_transaction` (String - Obligatoire pour MonCash/NatCash)

#### Invariants Financiers & Blocage de Bulletin :
- **Règle de Blocage Financier :** Si le `solde_du` de l'élève (somme des frais d'inscription et de scolarité de l'année en cours moins la somme des paiements validés) est supérieur à **1 000.00 HTG**, l'accès au téléchargement du bulletin scolaire PDF ainsi qu'à la vue détaillée des notes sur le portail parent est **immédiatement bloqué/verrouillé**.

---

## 8. VALUE OBJECTS (VO)

Les Value Objects sont des objets immutables définis uniquement par leurs attributs. Ils encapsulent la logique de validation de leurs valeurs.

### 8.1 `PhoneNumber`
- **Règles de validation :** Doit suivre le format international ou local d'Haïti (+509 ou numéro à 8 chiffres pour Digicel/Natcom).
- **Comportement :** Immutable. Toute modification génère une nouvelle instance.

### 8.2 `Matricule`
- **Format :** `LPM-{YY}-{RAND4}` (ex: `LPM-24-9843`).
- **Garantie :** Unique par école.

### 8.3 `NIE` (Numéro d'Identification Unique MENFP)
- **Format :** Chaîne de 10 chiffres formatée selon les exigences du ministère.

### 8.4 `Subdomain`
- **Format :** Lettres minuscules, chiffres, pas de caractères spéciaux (regex: `^[a-z0-9-]+$`).

---

## 9. DOMAIN EVENTS (ÉVÉNEMENTS MÉTIER)

Ces événements asynchrones se déclenchent lors de changements d'état critiques du système pour notifier d'autres agrégats ou services tiers (SMS, WhatsApp).

| Événement | Source (Agrégat) | Conséquence |
|---|---|---|
| `StudentEnrolled` | `Student` | Génère la fiche financière initiale (`solde_du`) et crée les accès parents si inexistants. |
| `PaymentReceived` | `Payment` | Met à jour le solde tuteur, génère le reçu PDF, et envoie un SMS de confirmation automatique. Si le solde passe sous la barre des 1 000 HTG, déverrouille le bulletin. |
| `GradeSubmitted` | `Grade` | Recalcule automatiquement la moyenne générale de l'élève et son palmarès (rang) pour le trimestre actif. |
| `AttendanceMarked` | `Academic` | Si l'élève est marqué `Absent` ou `En Retard`, déclenche une notification SMS/WhatsApp immédiate au numéro du parent tuteur. |
| `IncidentReported` | `Student` | Ajoute l'incident à la timeline parent et envoie une alerte de discipline. |

---

## 10. CRITICAL BUSINESS SERVICES (SERVICES MÉTIER)

Certaines opérations complexes ne peuvent être attribuées à une seule entité. Elles sont gérées par des services de domaine sans état (Stateless).

### 10.1 `PalmaresCalculator` (Service Académique)
- **Rôle :** Calculer le classement (rang) de chaque élève au sein de sa classe pour un trimestre spécifique.
- **Algorithme :**
  1. Récupère tous les élèves d'une même classe dans une école donnée.
  2. Récupère toutes les notes validées pour ces élèves et le trimestre demandé.
  3. Calcule la moyenne générale pondérée de chaque élève.
  4. Trie les élèves par ordre décroissant de moyenne générale.
  5. Attribue les rangs (ex: 1er, 2ème, etc.). Gère les ex-æquos de manière juste.

### 10.2 `MonCashPaymentService` (Service Financier)
- **Rôle :** Coordonner les transactions de paiement en ligne avec la passerelle API MonCash de la Sogebank.
- **Règles :** Valide la signature de transaction, applique les commissions SaaS configurées, débloque l'accès au bulletin si le solde devient inférieur ou égal à 1 000 HTG, et émet l'événement `PaymentReceived`.

---

## 11. INVARIANTS DU SYSTEME (RÉSUMÉ DES RÈGLES CRITIQUES)

1.  **Isolation Multi-Tenant :** Aucune opération d'écriture ou de lecture ne doit omettre l'attribut `school_id`.
2.  **Validation de Note par Cycle :** 0-10 (Fondamental), 0-100 (Secondaire). Pas d'exception.
3.  **Matricule Unique :** Pas d'élèves doublons au sein d'un même établissement scolaire.
4.  **Cadenas Financier :** Dette > 1 000 HTG = Bulletin bloqué et flouté sur tous les portails parents.
5.  **Soft Delete :** Aucune suppression physique de données élèves, enseignants, notes ou transactions n'est autorisée.
