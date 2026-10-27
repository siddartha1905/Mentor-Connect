# MENTOR CONNECT — TECHNICAL HANDOVER & ARCHITECTURE REPORT
**Document Reference:** `MC-DOC-TH-2026-10-27`  
**Effective Date:** 27 October 2026  
**Status:** Certified Project Checkpoint & Freeze  
**Author:** J. Siddhartha Varma, Assistant Professor, CSE (Data Science)  

---

## TABLE OF CONTENTS
1. [Project Identity & Mission](#1-project-identity--mission)
2. [Technology Stack & Architectural Rationale](#2-technology-stack--architectural-rationale)
3. [System Architecture & Data Flows](#3-system-architecture--data-flows)
4. [Repository Structure & Organization](#4-repository-structure--organization)
5. [Local Development & Environment Setup](#5-local-development--environment-setup)
6. [GitHub Workflows & Checkpoint Strategy](#6-github-workflows--checkpoint-strategy)
7. [Cloudflare Pages Hosting & SPA Infrastructure](#7-cloudflare-pages-hosting--spa-infrastructure)
8. [Supabase Project Configuration & Backend Services](#8-supabase-project-configuration--backend-services)
9. [Database Schema, Table Inventory & Migration History](#9-database-schema-table-inventory--migration-history)
10. [Authentication, Authorization & Row-Level Security](#10-authentication-authorization--row-level-security)
11. [Student Onboarding Lifecycle & Test Pilot Status](#11-student-onboarding-lifecycle--test-pilot-status)
12. [Edge Function: `invite-student` Specification](#12-edge-function-invite-student-specification)
13. [Completed Modules & Verification Matrix](#13-completed-modules--verification-matrix)
14. [Development Roadmap & Reconciliation](#14-development-roadmap--reconciliation)
15. [Known Limitations & Operational Risks](#15-known-limitations--operational-risks)
16. [Restoration Procedures on Fresh Hardware](#16-restoration-procedures-on-fresh-hardware)
17. [Development Resumption Protocols](#17-development-resumption-protocols)
18. [Official Project References & Resources](#18-official-project-references--resources)
19. [Final Git Checkpoint & Deployment Identifiers](#19-final-git-checkpoint--deployment-identifiers)

---

## 1. PROJECT IDENTITY & MISSION

### 1.1 Official Identity
- **Project Name:** Mentor Connect
- **Sole Creator, Lead & Faculty Administrator:**  
  **J. Siddhartha Varma**  
  *Assistant Professor, Department of Computer Science & Engineering (Data Science)*  
  *(Important: "Siddhartha" is spelled with an 'h'. Technical account identifiers such as the GitHub username `siddartha1905` remain unchanged).*

### 1.2 Purpose & Scope
Mentor Connect is an independent, faculty-initiated mentoring platform specifically architected for a focused cohort of approximately **35–40 invited second-year CSE (Data Science) undergraduate mentees**.

> [!IMPORTANT]
> **Organizational Scope Notice:**  
> Mentor Connect is an independent faculty mentoring initiative. It is **NOT** an officially endorsed institutional portal, nor is it a college-wide student management system (ERP). It does not interface automatically with university examination boards, nor does it replace official attendance management software. Its design prioritizes authentic mentor-student dialogue, structured profile records, longitudinal guidance, and transparent progress reviews.

---

## 2. TECHNOLOGY STACK & ARCHITECTURAL RATIONALE

| Layer | Technology | Version | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.3.1` | Declarative component UI model with rich ecosystem for forms, navigation, and state. |
| **Language** | TypeScript | `~5.6.2` | Strong end-to-end typing for database entities, API payloads, and component props. |
| **Build & Dev Tool** | Vite | `^8.3.5` | Fast HMR in local development, rapid Rollup-based tree-shaking and asset bundling. |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first CSS providing a responsive, modern palette, sleek dark/light aesthetics, and compact CSS bundles (`85.8 kB`). |
| **Routing** | React Router DOM | `^7.1.5` | Client-side routing with code-splitting (`React.lazy`), role guards, and SPA deep-link support. |
| **Database** | Supabase PostgreSQL | `15.x` | Relational schema with ACID compliance, JSONB document flexibility, and PostgreSQL trigger logic. |
| **Security / Auth** | Supabase Auth + GoTrue | `^2.39.8` | JWT-based session management, secure invitation tokens, and cryptographic password hashing. |
| **Access Control** | PostgreSQL RLS | Native | Zero-trust row-level policies directly on database tables; unauthorized access blocked at database level. |
| **Object Storage** | Supabase Storage | Native | Private object storage bucket (`profile-photos`) with folder-isolated RLS policies (`auth.uid()`). |
| **Serverless Compute** | Supabase Edge Functions | Deno `1.168+` | Privileged backend functions executing in secure Deno sandbox (`invite-student`) with service-role privileges. |
| **Email Gateway** | Brevo Custom SMTP | Hosted | Custom SMTP relay configured in Supabase Auth settings for transactional invitation and recovery emails. |
| **Frontend Hosting** | Cloudflare Pages | Global Edge | Global CDN distribution, instant Git-triggered deployments, automated TLS, and edge caching. |
| **Application Type** | PWA (Progressive Web App) | Vite PWA `^0.20.0` | Offline shell caching, manifest support, home screen installation on student mobile devices. |
| **Testing Suite** | Vitest + Testing Library | `^2.1.8` | High-speed unit and component testing, DOM structure assertions, and database security audit suites. |

---

## 3. SYSTEM ARCHITECTURE & DATA FLOWS

### 3.1 High-Level Architectural Diagram
```
                     +---------------------------------------+
                     |           Cloudflare Pages            |
                     |       (mentorconnect.pages.dev)       |
                     +-------------------+-------------------+
                                         |
                       Static Assets / SPA Routing / PWA
                                         |
                                         v
                     +---------------------------------------+
                     |           Student / Admin             |
                     |           Browser Client              |
                     +---------+-------------------+---------+
                               |                   |
                     Supabase  |                   | Privileged Edge Call
                     PostgREST |                   | (Admin JWT Required)
                     (Auth JWT)|                   v
                               |     +-------------------------------+
                               |     |    Supabase Edge Function     |
                               |     |       (`invite-student`)      |
                               |     +---------------+---------------+
                               |                     |
                               |                     | GoTrue Admin API
                               v                     v
                     +-----------------------------------------------+
                     |          Supabase Managed Backend             |
                     |  - PostgreSQL 15 Database (RLS Enforced)      |
                     |  - Supabase Auth (GoTrue Service)             |
                     |  - Private Storage (`profile-photos`)         |
                     |  - Database Triggers (Deadlines / Linking)    |
                     +-----------------------+-----------------------+
                                             |
                                             | Transactional SMTP
                                             v
                             +-------------------------------+
                             |    Brevo Custom SMTP Relay    |
                             |   (Student Invitation Mail)   |
                             +-------------------------------+
```

### 3.2 Data Flows
1. **Unauthenticated Public Access:**
   - Landing Page (`/`) delivers institutional branding, faculty profile, and routing links.
   - Student Login (`/login/student`) and Admin Login (`/login/admin`) authenticate via `supabase.auth.signInWithPassword()`.
2. **Authenticated Student Journey:**
   - Client resolves role via `public.user_roles` (`get_my_role()`).
   - Profile Sections B through G read and write directly to table records (`student_personal_details`, `student_family_details`, etc.) subject to `check_student_profile_deadline()` triggers.
   - Profile photograph uploads compress client-side to `< 500 KB` and store in `profile-photos/<auth.uid()>/photo.jpg`.
3. **Faculty Administrator Journey:**
   - Verified via `public.is_admin()` (`SECURITY DEFINER` check against `public.user_roles`).
   - Direct full access to student roster, Mentor 360° analytics, deadline configuration, announcement editor, and invitation logs.
4. **Student Invitation Pipeline:**
   - Administrator triggers invitation from Student Management.
   - Edge Function `invite-student` authenticates caller's admin token, verifies student roll number and email match in `public.students`, claims atomic lock in `public.student_invitations`, dispatches via `auth.admin.inviteUserByEmail()`, and logs results.

---

## 4. REPOSITORY STRUCTURE & ORGANIZATION

```
Mentor-Connect/
├── .env.example                               # Public environment template (safe placeholders)
├── .env.local                                 # Local development environment (git-ignored)
├── .gitignore                                 # Git exclusion rules
├── .oxlintrc.json                             # Linter configuration
├── README.md                                  # High-level project summary
├── index.html                                 # HTML entry point with PWA metadata
├── package.json                               # Dependencies and build scripts
├── package-lock.json                          # Exact dependency lockfile
├── tsconfig.json                              # TypeScript project configuration
├── tsconfig.app.json                          # TypeScript app compilation options
├── tsconfig.node.json                         # TypeScript node/vite tool options
├── vite.config.ts                             # Vite configuration and PWA manifest plugins
├── public/                                    # Static assets copied directly to dist/
│   ├── _headers                               # Cloudflare Pages security & cache headers
│   ├── _redirects                             # Cloudflare Pages SPA fallback (/* /index.html 200)
│   ├── apple-touch-icon.png                   # Apple home-screen icon
│   ├── favicon.svg                            # Browser favicon
│   ├── manifest.webmanifest                   # PWA web manifest
│   ├── registerSW.js                          # Service worker registration helper
│   └── icons/                                 # PWA icons (192x192, 512x512)
├── docs/                                      # Authoritative documentation repository
│   ├── MENTOR_CONNECT_TECHNICAL_HANDOVER.md   # This document
│   ├── MENTOR_CONNECT_OPERATIONS_RUNBOOK.md   # Operational guide for running the portal
│   ├── MENTOR_CONNECT_AI_CONTINUATION_CONTEXT.md # AI assistant continuity context
│   ├── STAGE_1_ARCHITECTURE.md                # Stage 1 UI/UX design foundation report
│   └── STAGE_2_ARCHITECTURE.md                # Stage 2 database & security report
├── src/                                       # Application source code
│   ├── main.tsx                               # Application bootstrapper & React DOM mount
│   ├── index.css                              # Tailwind base, utilities, and custom styles
│   ├── app/                                   # Application core infrastructure
│   │   ├── layouts/                           # StudentLayout, AdminLayout
│   │   ├── providers/                         # AuthContext (session & role management)
│   │   └── router/                            # React Router tree & ProtectedRoute guards
│   ├── components/                            # Reusable UI components
│   │   ├── shared/                            # DemoNotice, Logo, AnnouncementContent
│   │   └── ui/                                # Dialog, Tabs, Card primitives
│   ├── features/                              # Domain-specific modules
│   │   ├── academics/                         # AcademicManagement (preserved)
│   │   ├── admin/                             # AdminDashboard, StudentList, DeadlineManagement,
│   │   │                                      # DevelopmentRoadmap, AdminSettings, GrowthActivities
│   │   ├── approvals/                         # ApprovalCentre (administrative review)
│   │   ├── attendance/                        # AttendanceManagement (preserved)
│   │   ├── authentication/                    # StudentLogin, AdminLogin, ResetPassword
│   │   ├── automation/                        # AutomatedMentor (preserved)
│   │   ├── communication/                     # AdminCommunication (announcement editor)
│   │   ├── landing/                           # Minimal LandingPage & thoughtsData
│   │   ├── mentor360/                         # Mentor360View (student 360-degree console)
│   │   ├── mentoring/                         # MentoringWorkflow (preserved)
│   │   ├── reports/                           # ReportsManagement (preserved)
│   │   ├── student/                           # StudentHome, StudentProfileView, StudentJourney,
│   │   │                                      # StudentDirectory, StudentCalendar, StudentMessages,
│   │   │                                      # StudentDocuments, StudentSurveys, StudentMore
│   │   └── surveys/                           # SurveyManagement (preserved)
│   ├── services/                              # PostgREST & backend API abstraction services
│   │   ├── announcementService.ts             # Announcements publication & archiving
│   │   ├── approvalService.ts                 # Profile submission approvals & RPC reviews
│   │   ├── deadlineService.ts                 # System settings & student edit overrides
│   │   ├── importService.ts                   # CSV roster parser & database insert
│   │   ├── roadmapService.ts                  # Persistent development roadmap & local fallback
│   │   ├── storageService.ts                  # Client-side photo canvas compression & upload
│   │   └── studentService.ts                  # Student profile data access & directory queries
│   ├── types/                                 # Global TypeScript interface definitions
│   └── lib/
│       ├── supabase.ts                        # Lazy Supabase client initialization
│       └── utils.ts                           # Tailwind class merging utilities
├── supabase/                                  # Database migrations, seed data, and Edge Functions
│   ├── config.toml                            # Supabase CLI project configuration
│   ├── seed.sql                               # Local test seed dataset (7 fictional students)
│   ├── functions/
│   │   └── invite-student/
│   │       └── index.ts                       # Server-side student invitation Edge Function
│   ├── migrations/                            # Chronological SQL migrations
│   │   ├── 20261025000000_stage2_consolidated_master.sql
│   │   ├── 20261025080000_student_privacy_directory_hardening.sql
│   │   ├── 20261025090000_fix_auth_linking_trigger_permissions.sql
│   │   ├── 20261025100000_reconcile_and_harden_auth_linking.sql
│   │   ├── 20261025110000_simplify_profile_and_add_skills_achievements.sql
│   │   ├── 20261025120000_update_profile_deadline_nov3.sql
│   │   ├── 20261025130000_create_announcements_table.sql
│   │   ├── 20261025140000_profile_deadline_management_and_roadmap.sql
│   │   ├── 20261025150000_import_development_roadmap_catalog.sql
│   │   ├── 20261025160000_student_invitations_log.sql
│   │   └── archive/                           # Superseded earlier migration drafts
│   └── tests/
│       └── database_security_audit.sql        # SQL test suite for RLS and function permissions
└── tests/                                     # Automated test suites (17 files, 177 tests)
    ├── admin_dashboard_cleanup_and_mentor_contact.test.tsx
    ├── announcement_formatting_and_editor.test.tsx
    ├── components.test.tsx
    ├── development_roadmap_supabase_persistence.test.tsx
    ├── landing_page_enhancements.test.tsx
    ├── mentor360_real_student_data_integration.test.tsx
    ├── privacy_isolation.test.ts
    ├── public_admin_registration_security.test.tsx
    ├── registration_approval_workflow.test.ts
    ├── security.test.ts
    ├── smoke.test.tsx
    ├── storage_api_security.test.ts
    ├── student_authenticated_onboarding.test.tsx
    ├── student_invitation_safety_review.test.tsx
    ├── student_management_real_onboarding.test.tsx
    ├── student_portal_simplification.test.tsx
    └── student_profile_direct_save_and_sections_fg.test.tsx
```

---

## 5. LOCAL DEVELOPMENT & ENVIRONMENT SETUP

### 5.1 System Prerequisites
- **Node.js:** `v20.x` or `v22.x` LTS recommended
- **npm:** `v10.x` or higher
- **Git:** `2.40+`

### 5.2 Safe Environment Variable Configuration
The client reads environment variables via Vite's `import.meta.env`. Real credentials must **never** be committed to version control.

`.env.example` template:
```bash
# Mentor Connect — Environment Template
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_ENV=development
```

### 5.3 Essential Local Commands
- **Install dependencies:** `npm install`
- **Run local dev server:** `npm run dev` (starts on `http://localhost:5173`)
- **Execute test suites:** `npx vitest run` (executes 17 test suites, 177 tests)
- **Run TypeScript compilation & production build:** `npm run build` (`tsc -b && vite build`)

---

## 6. GITHUB WORKFLOWS & CHECKPOINT STRATEGY

### 6.1 Repository Details
- **Remote URL:** `https://github.com/siddartha1905/Mentor-Connect`
- **Primary Branch:** `main`
- **Checkpoint Tag:** `mentor-connect-pre-onboarding-2026-10-27`

### 6.2 Commit Philosophy
All commits follow conventional standards:
- `feat(...)`: Functional enhancements and capabilities.
- `fix(...)`: Bug fixes and security remediations.
- `test(...)`: Unit, integration, and security test suites.
- `docs(...)`: Architectural, operational, and context documentation.

---

## 7. CLOUDFLARE PAGES HOSTING & SPA INFRASTRUCTURE

### 7.1 Deployment Profile
- **Cloudflare Project Name:** `mentorconnect`
- **Production URL:** `https://mentorconnect.pages.dev/`
- **Connected Repository:** `siddartha1905/Mentor-Connect`
- **Production Branch:** `main`
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`

### 7.2 Historical Project Clarification
An earlier experimental deployment on Cloudflare Pages received an automatically generated project URL. When the official project was provisioned, it was assigned the clean production project name `mentorconnect` (`mentorconnect.pages.dev`). **All official documentation, authentication redirect settings, and Edge Function validations treat `https://mentorconnect.pages.dev` as the authoritative production host.**

### 7.3 SPA Routing & Deep Link Handling
Cloudflare Pages serves client-side SPAs using the `public/_redirects` rule:
```
/*    /index.html   200
```
When Vite compiles the project, this file is copied to `dist/_redirects`, ensuring routes like `/login/student`, `/login/admin`, `/login/reset-password`, `/student/profile`, and `/admin/mentor360` return HTTP 200 rather than HTTP 404 on direct browser reloads.

### 7.4 Security Headers (`public/_headers`)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/sw.js
  Cache-Control: no-cache

/manifest.webmanifest
  Content-Type: application/manifest+json
```

---

## 8. SUPABASE PROJECT CONFIGURATION & BACKEND SERVICES

- **Supabase Project Reference:** `mttocnlnmmtaugzthfih`
- **Dashboard URL:** `https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih`
- **API Endpoint:** `https://mttocnlnmmtaugzthfih.supabase.co`

### 8.1 Supabase Authentication Configuration
1. **Site URL:** `https://mentorconnect.pages.dev`
2. **Approved Redirect URLs:**
   - `https://mentorconnect.pages.dev/login/reset-password`
   - `http://localhost:5173/login/reset-password` (for local development)
3. **Public Self-Registration:** Disabled for administrator accounts. Public sign-up without prior roster inclusion is rejected by database triggers.
4. **Email Delivery Gateway:** Brevo custom SMTP relay configured in Supabase Auth to route invitation and password setup emails reliably.

### 8.2 Supabase Storage Configuration
- **Bucket ID:** `profile-photos`
- **Public Visibility:** `false` (Private bucket)
- **File Size Limit:** `1 MB` (`1048576 bytes`)
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`
- **Folder RLS Policy:** Authenticated students can INSERT/UPDATE only in their own folder `profile-photos/<auth.uid()>/*`. Administrators possess full SELECT/UPDATE access.

---

## 9. DATABASE SCHEMA, TABLE INVENTORY & MIGRATION HISTORY

### 9.1 Authoritative Table Catalog

| Table Name | Primary Key | Foreign Keys / Relationships | Purpose & Security Scope |
| :--- | :--- | :--- | :--- |
| **`user_roles`** | `id (UUID)` | `user_id -> auth.users(id)` (UNIQUE) | Assigns role (`admin`, `student`, `parent`). RLS: Read own role, Admin manages all. |
| **`students`** | `id (UUID)` | `user_id -> auth.users(id)`, `mentor_id -> auth.users(id)` | Master student roster record. RLS: Read own record, Admin full access. |
| **`student_personal_details`** | `id (UUID)` | `student_id -> students(id)` (UNIQUE) | Section B: DOB, gender, blood group, contact, addresses, transport mode. |
| **`student_family_details`** | `id (UUID)` | `student_id -> students(id)` (UNIQUE) | Section D: Parents' names, occupations, phone numbers, annual income. |
| **`student_education_details`** | `id (UUID)` | `student_id -> students(id)` (UNIQUE) | Section E: 10th & 12th / Diploma percentages, schools, EAMCET rank. |
| **`student_academic_history`** | `id (UUID)` | `student_id -> students(id)` (UNIQUE per semester) | Longitudinal SGPA, CGPA, credits, and backlog records. |
| **`student_skills_goals`** | `id (UUID)` | `student_id -> students(id)` (UNIQUE) | Section F: Technical skills with proficiencies, soft skills, hobbies, goals (JSONB). |
| **`student_achievements`** | `id (UUID)` | `student_id -> students(id)` | Section G: Individual certifications, workshops, trainings, and projects. |
| **`subjects`** | `id (UUID)` | None | Academic subjects list (CS2101, CS2102, DS2101, etc.). |
| **`student_subject_marks`** | `id (UUID)` | `student_id -> students(id)`, `subject_id -> subjects(id)` | Semester assessments (WT1-4, Mid1-2, attendance). |
| **`system_settings`** | `key (TEXT)` | None | Global key-value store (`profile_edit_deadline`, `is_enabled`). |
| **`student_edit_overrides`** | `id (UUID)` | `student_id -> students(id)`, `granted_by -> auth.users(id)` | Individual student deadline extensions granted by mentor. |
| **`profile_submissions`** | `id (UUID)` | `student_id -> students(id)`, `reviewed_by -> auth.users(id)` | Historical auditable profile modification queue and approval logs. |
| **`student_directory`** | `student_id (UUID)` | `student_id -> students(id)` (UNIQUE) | Sanitized directory table containing only peer-opted-in contacts. |
| **`announcements`** | `id (UUID)` | `author_id -> auth.users(id)` | Faculty announcements with Markdown content, categories, and status. |
| **`development_roadmap`** | `id (UUID)` | None | Persistent catalog of completed, pending, deferred, and removed features. |
| **`student_invitations`** | `id (UUID)` | `student_id -> students(id)`, `invited_by -> auth.users(id)` | Audit trail of email invitations, attempt timestamps, cooldowns, and history. |

### 9.2 SQL Migrations Catalog

| # | Migration File | Date / Version | Status | Chronological Purpose |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `20261025000000_stage2_consolidated_master.sql` | 2026-10-25 | **Applied Remotely** | Authoritative foundation schema, roles, students, sections B-E, subjects, marks, RLS, storage bucket, approval RPC. |
| 2 | `20261025080000_student_privacy_directory_hardening.sql` | 2026-10-25 | **Applied Remotely** | Tightened student record access, created sanitized `student_directory` table and sync triggers. |
| 3 | `20261025090000_fix_auth_linking_trigger_permissions.sql` | 2026-10-25 | **Applied Remotely** | Granted `SECURITY DEFINER` and internal permissions for the account linking trigger. |
| 4 | `20261025100000_reconcile_and_harden_auth_linking.sql` | 2026-10-25 | **Applied Remotely** | Reconciled Test Pilot Student (`23L31A0999`) and hardened `handle_new_auth_user()` for future invitations. |
| 5 | `20261025110000_simplify_profile_and_add_skills_achievements.sql` | 2026-10-25 | **Applied Remotely** | Implemented direct student profile saves, created `student_skills_goals` and `student_achievements`, added deadline trigger. |
| 6 | `20261025120000_update_profile_deadline_nov3.sql` | 2026-10-25 | **Applied Remotely** | Set profile deadline to Tuesday, Nov 3, 2026, 11:59:59 PM IST (`2026-11-03T23:59:59+05:30`). |
| 7 | `20261025130000_create_announcements_table.sql` | 2026-10-25 | **Applied Remotely** | Created `public.announcements` table with Markdown support, categories, and role-based permissions. |
| 8 | `20261025140000_profile_deadline_management_and_roadmap.sql` | 2026-10-25 | **Applied Remotely** | Created `development_roadmap` table and added `is_enabled` global deadline toggle support. |
| 9 | `20261025150000_import_development_roadmap_catalog.sql` | 2026-10-25 | **Applied Remotely** | Idempotent insertion of 27 development roadmap entries into `public.development_roadmap`. |
| 10 | `20261025160000_student_invitations_log.sql` | 2026-10-25 | **Stored in Repo / Ready** | Created `public.student_invitations` table for server-side invitation audit tracking. |

---

## 10. AUTHENTICATION, AUTHORIZATION & ROW-LEVEL SECURITY

### 10.1 Zero-Trust RLS Matrix

```
+--------------------------------+---------------+-----------------------+----------------------+
| Table                          | Anon / Public | Student (auth.uid())  | Admin (is_admin())   |
+--------------------------------+---------------+-----------------------+----------------------+
| user_roles                     | DENY ALL      | SELECT own role       | ALL (Full control)   |
| students                       | DENY ALL      | SELECT own, UPDATE*   | ALL (Full control)   |
| student_personal_details       | DENY ALL      | SELECT/INSERT/UPDATE  | ALL (Full control)   |
| student_family_details         | DENY ALL      | SELECT/INSERT/UPDATE  | ALL (Full control)   |
| student_education_details      | DENY ALL      | SELECT/INSERT/UPDATE  | ALL (Full control)   |
| student_skills_goals           | DENY ALL      | SELECT/INSERT/UPDATE  | ALL (Full control)   |
| student_achievements           | DENY ALL      | SELECT/INSERT/UPDATE/ | ALL (Full control)   |
|                                |               | DELETE own            |                      |
| student_directory              | DENY ALL      | SELECT active peers   | ALL (Full unmasked)  |
| announcements                  | DENY ALL      | SELECT published only | ALL (Full control)   |
| development_roadmap            | DENY ALL      | DENY ALL              | ALL (Full control)   |
| student_invitations            | DENY ALL      | DENY ALL              | ALL (Full control)   |
| storage.objects (profile-photo)| DENY ALL      | INSERT/UPDATE own dir | ALL (Full control)   |
+--------------------------------+---------------+-----------------------+----------------------+
* Students can only alter directory privacy flags (share_phone, share_email) and avatar_url on students table.
```

### 10.2 Decommissioning of Public Administrator Self-Registration
In commit `f3f47e1`, the public "Create Administrator Account" self-registration modal was decommissioned. Administrative access is restricted strictly to accounts manually verified and provisioned in `public.user_roles` with `role = 'admin'`.

---

## 11. STUDENT ONBOARDING LIFECYCLE & TEST PILOT STATUS

### 11.1 The 4-Stage Mentee Onboarding Lifecycle
```
+---------------+     Invite Sent     +---------------+     Auth Linked     +---------------+     Password Set    +---------------+
|  Roster Only  | ------------------> |  Invite Sent  | ------------------> |  Auth Linked  | ------------------> |   Activated   |
| (CSV Imported)|                     | (Email Outbox)|                     | (Account Gen) |                     | (Profile Ready|
+---------------+                     +---------------+                     +---------------+                     +---------------+
```

1. **Roster Only:** Student roll number, name, email, department, and section are staged in `public.students`. No Auth record exists (`user_id IS NULL`).
2. **Invite Sent:** Faculty mentor triggers the invitation. An email is dispatched via Brevo custom SMTP with an invitation token, recorded in `public.student_invitations`.
3. **Auth Linked:** An entry exists in `auth.users`, and `public.students.user_id` is linked to `auth.users.id` by the `handle_new_auth_user()` trigger.
4. **Activated:** Student completes password creation via `/login/reset-password`, logs in, and enters the Student Portal.

### 11.2 Checkpoint Status of the Cohort
- **Official Test Pilot Student:** Roll Number `23L31A0999`.
- **Pilot Status:** Successfully linked and activated. Profile Sections B through G populated; private profile photograph uploaded and verified.
- **Real Cohort Status:** Zero real student invitations have been dispatched. No bulk class roster has been imported. Live student onboarding is completely paused.

---

## 12. EDGE FUNCTION: `invite-student` SPECIFICATION

The Edge Function (`supabase/functions/invite-student/index.ts`) handles server-side invitation dispatch with the following controls:
1. **Admin Verification:** Resolves caller's JWT and queries `public.user_roles` for `role = 'admin'`.
2. **Roster Cross-Verification:** Verifies the provided `roll_number` exists in `public.students` and the requested email strictly matches the roster email.
3. **Fail-Closed Identity Check:** If an Auth account is already linked, verifies its email matches the roster email.
4. **Activation Guard:** Refuses invitation dispatch if the student has already completed onboarding.
5. **Redirect Validation:** Strictly enforces `https://mentorconnect.pages.dev/login/reset-password` in production. Rejects HTTP, unapproved domains, and localhost redirects.
6. **Anti-Collision & Cooldown:** Enforces a 30-second rate-limit cooldown per roll number and atomic in-flight locking.
7. **Audit Logging:** Logs attempts, resend counts, admin user IDs, and dispatch methods (`inviteUserByEmail` or `resetPasswordForEmail`) to `public.student_invitations`.

---

## 13. COMPLETED MODULES & VERIFICATION MATRIX

| Module | Location | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `src/features/landing/` | **Verified in Production** | Responsive hero, faculty credentials, dual student/faculty login cards, thoughts carousel, PWA install prompt. |
| **Student Authentication** | `src/features/authentication/` | **Verified in Production** | Student Login with roll number / email validation and Password Reset handling. |
| **Admin Authentication** | `src/features/authentication/` | **Verified in Production** | Faculty login with restricted access; public self-registration decommissioned. |
| **Student Home** | `src/features/student/` | **Verified in Production** | Verified mentor identity (J. Siddhartha Varma), direct contact cards, announcements feed, profile completion status. |
| **Student Profile (B–G)** | `src/features/student/` | **Verified in Production** | Direct saves for Personal, Family, Education, Skills, and Achievements with active deadline enforcement. |
| **Student Directory** | `src/features/student/` | **Verified Locally** | Privacy-conscious directory driven by `student_directory_view`; masks peer phone and email unless opted in. |
| **Student Journey** | `src/features/student/` | **Verified Locally** | Longitudinal view of mentee semester milestones and achievements. |
| **Announcements System** | `src/features/communication/` | **Verified in Production** | Admin Markdown editor with live preview, categories, and published feed in Student Portal. |
| **Admin Dashboard** | `src/features/admin/` | **Verified in Production** | Genuine student metrics, onboarding status breakdown, and direct navigation. |
| **Student Management** | `src/features/admin/` | **Verified Locally** | Searchable roster table, CSV template download, manual student entry, and invitation triggers. |
| **Mentor 360° Console** | `src/features/mentor360/` | **Verified in Production** | Comprehensive mentee dossier view pulling live data from Supabase across all sections. |
| **Deadline Management** | `src/features/admin/` | **Verified in Production** | Admin console to adjust global profile deadline, toggle editing access, and grant individual overrides. |
| **Development Roadmap** | `src/features/admin/` | **Verified in Production** | Categorized feature history workspace with Supabase persistence and local storage fallback. |
| **Admin Settings** | `src/features/admin/` | **Verified in Production** | Faculty profile settings and administrative controls. |
| **Edge Function Invitations** | `supabase/functions/` | **Verified Locally** | Comprehensive unit test suite (`student_invitation_safety_review.test.tsx`, 14 tests passing). |
| **End-to-End Email Delivery**| Supabase -> Brevo | **Not Yet Tested** | Production delivery of invitation emails to unconfirmed student mailboxes has not been tested end-to-end. |

---

## 14. DEVELOPMENT ROADMAP & RECONCILIATION

### 14.1 Catalog Breakdown (28 Authoritative Entries)
1. **Completed (6):**
   - Student Profile Direct Save (Sections B–G)
   - Mentor 360° Real Supabase Student Integration
   - Profile Deadline Enforcement (Nov 3, 2026 IST)
   - Announcement Management with Safe Markdown
   - Student Directory Privacy & Phone/Email Isolation
   - Minimal Faculty Mentoring Landing Page
2. **In Progress / Pending (2):**
   - Faculty Mentor Advice & Direct Guidance Notes
   - Bulk CSV Student Roster Schema Standardization
3. **Deferred (13):**
   - Daily/Weekly Mood Check-in Pulse (deferred until onboarding completes)
   - Self-Reported Attendance Hub (deferred pending official ERP integration)
   - Mentoring Calendar & Slot Booking (coordinated directly by faculty)
   - Upcoming Mentoring Discussions & Agenda Booking
   - Mentoring Commitments & Action Item Tracker
   - Advanced Academic Records & Examination Branch Sync
   - Automated Mentor & AI Recommendation Engine
   - Student Direct Messaging Enhancements
   - Advanced Attendance Monitoring Hub
   - Student Surveys & Feedback Questionnaires
   - Growth & Co-Curricular Portfolio Tracking
   - PDF & Bulk Mentee Dossier Export
   - Mentoring Workflow & Session Documentation Hub
4. **Removed Intentionally (7):**
   - Landing Page Tech News & RSS Feed (eliminated clutter)
   - Seven-Step Mentoring Cycle & Dev Banners (eliminated demo artifacts)
   - Fictional Quote Cards & Thought for Today (eliminated fake data)
   - Fictional Student Accounts & Hardcoded Mock Data (eliminated fake students)
   - Hardcoded 38 Mentees & Fake 2 Pending Approvals Metrics
   - Fictional KR Administrator Avatar & Identity
   - Public Administrator Account Self-Registration (decommissioned for security)

### 14.2 Database Count vs. Displayed UI Count Reconciliation
- **Database Catalog Count (`20261025150000_import_development_roadmap_catalog.sql`):** 27 items.
- **Client Catalog Count (`INITIAL_ROADMAP_ITEMS` in `roadmapService.ts`):** 28 items.
- **Reason for Difference:** In commit `f3f47e1`, public administrator self-registration was decommissioned, and an authoritative 28th roadmap item (`e0000000-0000-0000-0000-000000000007`) was added to `roadmapService.ts`. The UI service automatically merges local items whose titles do not yet exist in Supabase, resulting in 28 displayed items.

---

## 15. KNOWN LIMITATIONS & OPERATIONAL RISKS

1. **Profile Deadline Expiration:** The profile submission deadline is configured for **November 3, 2026, 11:59:59 PM IST**. If development resumes after this date, the database trigger will block student profile modifications until an administrator updates the deadline in Deadline Management.
2. **Untested Production Invitation Delivery:** While the Edge Function passes all unit tests and security reviews, sending an actual invitation email to an unconfirmed student account and having that student set up a password has **not** been tested end-to-end in production.
3. **Single Administrator Architecture:** The system currently assumes J. Siddhartha Varma is the sole faculty administrator. Multi-mentor assignment with departmental partitioning is deferred.
4. **Attendance and Official Marksheets:** Attendance and exam marks are not integrated with college servers; the UI displays a clean pending state until official data is imported.

---

## 16. RESTORATION PROCEDURES ON FRESH HARDWARE

To restore and run this codebase on a completely new computer:

```bash
# 1. Clone repository
git clone https://github.com/siddartha1905/Mentor-Connect.git
cd Mentor-Connect

# 2. Check out authoritative checkpoint tag
git checkout mentor-connect-pre-onboarding-2026-10-27

# 3. Install exact dependencies
npm ci

# 4. Configure local environment
cp .env.example .env.local
# Edit .env.local with live Supabase project credentials:
# VITE_SUPABASE_URL=https://mttocnlnmmtaugzthfih.supabase.co
# VITE_SUPABASE_ANON_KEY=<public-anon-key>
# VITE_APP_ENV=development

# 5. Run test suite to verify system integrity
npx vitest run

# 6. Verify production build
npm run build

# 7. Start local development server
npm run dev
```

---

## 17. DEVELOPMENT RESUMPTION PROTOCOLS

When work resumes after this pause:
1. **Step 1: Check Local & Remote Git Status:** Ensure `main` matches tag `mentor-connect-pre-onboarding-2026-10-27`.
2. **Step 2: Review Profile Deadline:** In the Admin Portal (`/admin/deadlines`), review the profile edit deadline. If the current date is past November 3, 2026, update the deadline to a future date before inviting students.
3. **Step 3: Conduct a Controlled Single-Student Pilot:** Use a controlled test email address to test the invitation dispatch, email delivery via Brevo, and password reset flow end-to-end before importing a real cohort roster.
4. **Step 4: Prepare Official Cohort CSV:** Standardize the CSV roster columns (`roll_number`, `name`, `email`, `department`, `year`, `semester`, `section`) and import via Student Management.

---

## 18. OFFICIAL PROJECT REFERENCES & RESOURCES

- **GitHub Repository:** [https://github.com/siddartha1905/Mentor-Connect](https://github.com/siddartha1905/Mentor-Connect)
- **Production Web Application:** [https://mentorconnect.pages.dev](https://mentorconnect.pages.dev/)
- **Supabase Project Reference:** `mttocnlnmmtaugzthfih`
- **Supabase Dashboard:** [https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih](https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih)
- **Cloudflare Pages Project:** `mentorconnect`

---

## 19. FINAL GIT CHECKPOINT & DEPLOYMENT IDENTIFIERS

- **Primary Branch:** `main`
- **Final Pre-Documentation Commit SHA:** `f3f47e1d82d9f553e32aaa2f9f4ec375a12e82c6`
- **Final Checkpoint Tag:** `mentor-connect-pre-onboarding-2026-10-27`
- **Active Production Deployed Asset Hashes:**
  - Script: `assets/index-D9cSWkw6.js`
  - Stylesheet: `assets/index-BvpSqdm6.css`
- **Automated Test Results:** 17 test files, 177 tests passing (100% pass rate).
- **TypeScript & Build Status:** Verified cleanly with zero errors (`tsc -b && vite build`).
