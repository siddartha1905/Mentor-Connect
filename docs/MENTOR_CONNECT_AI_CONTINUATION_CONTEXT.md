# MENTOR CONNECT — AI CONTINUATION & ARCHITECTURAL CONTEXT
**Target Audience:** Future AI Programming Assistants & Senior Engineers  
**Date of Document Freeze:** 27 October 2026  
**Document Reference:** `MC-DOC-AI-2026-10-27`  
**Lead Faculty Mentor:** J. Siddhartha Varma, Assistant Professor, CSE (Data Science)  

---

## 1. EXECUTIVE SUMMARY & SYSTEM OVERVIEW

**Mentor Connect** is an independent, faculty-led academic mentoring platform built specifically for a focused cohort of approximately **35–40 second-year undergraduate students** in the Department of Computer Science & Engineering (Data Science).

> [!IMPORTANT]
> **Core Identity & Boundary Constraint:**  
> This application is **NOT** an officially endorsed institutional portal, college-wide ERP, or university examination management system. It was created and is administered exclusively by **J. Siddhartha Varma**, Assistant Professor, CSE (Data Science). Its sole focus is fostering meaningful faculty-to-student mentoring dialogues, tracking longitudinal academic milestones, managing verified personal records, and providing a clean, distraction-free digital space.

---

## 2. VERIFIED IDENTITY & NAMING CONVENTIONS

- **Creator & Administrator:** **J. Siddhartha Varma**
- **Spelling Rule:** Always spell "**Siddhartha**" with an **'h'** in documentation, UI text, and announcements.
- **GitHub Identifier:** `siddartha1905` (the GitHub username was registered without the 'h' and must remain unchanged in git remote URLs and configuration paths).
- **Institution Reference:** Department of CSE (Data Science), Vignan's Institute of Information Technology (VIIT).
- **Cohort:** 2nd Year, Semester 2-1, Section A (initially 35–40 invited mentees).

---

## 3. TECHNOLOGY STACK & CONNECTED SYSTEMS

- **Frontend:** React 18, TypeScript (~5.6), Vite 8, Tailwind CSS 3.4.
- **Styling Architecture:** Clean, modern Tailwind CSS design system with curated slate/indigo palettes, responsive layouts, glassmorphic accents, and zero generic MVP aesthetics.
- **Routing:** React Router v7 with lazy loading (`React.lazy`) and Cloudflare SPA fallback (`/* /index.html 200` in `public/_redirects`).
- **Database & Backend:** Supabase PostgreSQL 15 (`mttocnlnmmtaugzthfih.supabase.co`).
- **Authentication:** Supabase Auth (GoTrue), JWT session handling, role enforcement via `public.user_roles`.
- **Storage:** Private Supabase Storage bucket `profile-photos` with client canvas compression (< 500 KB) and user-isolated RLS.
- **Serverless Compute:** Deno-based Supabase Edge Function `invite-student` for authenticated, rate-limited student onboarding.
- **Mail Gateway:** Brevo custom SMTP configured inside Supabase Auth.
- **Hosting:** Cloudflare Pages project `mentorconnect` at `https://mentorconnect.pages.dev/`.
- **PWA Support:** Vite PWA with service worker registration and manifest.

---

## 4. WHAT IS ALREADY COMPLETED & VERIFIED

1. **Production Infrastructure:** Cloudflare Pages build is automated on `main` branch push. Asset hashes on production match local builds with zero errors.
2. **Security & Role Enforcement:** Zero-trust Row-Level Security (RLS) is active on every table. Public administrator self-registration has been completely decommissioned.
3. **Student Profile Direct Save (Sections B through G):**
   - Section A (Basic Identity: Roll number, name, dept, year, section) is institutionally locked.
   - Section B (Personal Details), Section C (Contact & Transport), Section D (Family Background), Section E (Education & Lateral Entry), Section F (Skills & Goals), and Section G (Achievements) save directly to Supabase with PostgreSQL trigger deadline checks.
4. **Profile Deadline Enforcement:**
   - PostgreSQL trigger `check_student_profile_deadline()` halts modifications after the deadline unless an administrator has granted a student override in `student_edit_overrides`.
   - The deadline is set to **Tuesday, November 3, 2026, 11:59:59 PM IST**.
5. **Mentor 360° Console:**
   - High-density faculty console loading live Supabase students with instant client search, comprehensive dossier cards, and dossier printing.
6. **Announcements System:**
   - Pure-React Markdown parser (no `dangerouslySetInnerHTML`), categorized publication (`Mentor Update`, `Department Information`, etc.), live previews, and student portal feed.
7. **Development Roadmap:**
   - Database-backed tracking system with 28 authoritative entries cataloging completed, deferred, pending, and removed features.
8. **Student Directory Privacy:**
   - Sanitized directory table and `student_directory_view` with `security_invoker = true`. Peer phone and email addresses remain strictly confidential unless opted in.

---

## 5. WHY DUMMY DATA WAS ELIMINATED

During Stage 1 development, demo student records (e.g., Aarav Sharma, Divya Sri Patnala) and fictional metrics (e.g., hardcoded "38 Mentees", fictional avatar "KR", "Dr. K. S. Rao") were used for layout design.

In Stage 2, **all fictional records, fake attendance figures, inspirational quote carousels, and hardcoded metrics were completely eliminated**:
- Fictional student names risked colliding with real student onboarding.
- Fake metrics compromised the integrity of the faculty administrator's dashboard.
- Unverified attendance and academic marks were hidden until official institutional data is imported.
- Only one genuine test pilot student exists: **`23L31A0999`**.

---

## 6. MODULES THAT MUST NOT BE DISTURBED

> [!CAUTION]
> When resuming work, do **NOT** modify or delete the following components without explicit faculty instruction:

1. **`src/app/providers/AuthContext.tsx`:** Governs session state, JWT lifecycle, role assignment, and logout flow.
2. **`src/app/router/ProtectedRoute.tsx`:** Route security guards enforcing student and administrator access limits.
3. **`supabase/functions/invite-student/index.ts`:** Security-reviewed invitation dispatch engine with rate limits, redirect allowlists, and audit logging.
4. **`public/_redirects` & `public/_headers`:** Essential for Cloudflare Pages SPA deep-linking and browser security policies.
5. **PostgreSQL Trigger Functions:** `handle_new_auth_user()`, `check_student_profile_deadline()`, and `check_student_update_privileges()`.
6. **Test Pilot Student (`23L31A0999`):** Required as the verified benchmark account for future regression testing.

---

## 7. CURRENT STOPPING POINT & FIRST RESUMPTION TASKS

### Stopping Point (27 October 2026)
The application has completed all Stage 2.2 foundational milestones. The code is frozen, verified, documented, and tagged in Git. Real student invitations have **not** been dispatched.

### First Resumption Tasks
When development resumes:
1. **Check the Current Date vs. Profile Deadline:**
   - The profile deadline in `public.system_settings` is set to **November 3, 2026, 11:59:59 PM IST**.
   - If resuming after that date, student profile edits will be locked. Update the deadline in `/admin/deadlines` to a future date before inviting mentees.
2. **Perform End-to-End Email Verification:**
   - Create a test student record in the roster with an email address you control.
   - Dispatch an invitation from `/admin/students`.
   - Verify that Brevo custom SMTP delivers the email, the student receives the invitation link, and `/login/reset-password` enables password setup.
3. **Verify Cohort CSV Columns:**
   - Ensure the department roster CSV adheres strictly to: `roll_number,name,email,department,year,semester,section`.
4. **Deploy Any Staged Migrations:**
   - Verify whether `supabase/migrations/20261025160000_student_invitations_log.sql` has been applied to the live database if invitation logging is required.

---

## 8. AUTHORITATIVE DOCUMENTATION LOCATIONS

All detailed specifications are maintained inside the repository's `docs/` folder:
- **`docs/MENTOR_CONNECT_TECHNICAL_HANDOVER.md`:** Comprehensive 19-section architectural handover report.
- **`docs/MENTOR_CONNECT_OPERATIONS_RUNBOOK.md`:** Step-by-step procedures for deployment, backups, roster imports, and disaster recovery.
- **`docs/STAGE_1_ARCHITECTURE.md`:** UI/UX design specifications, component catalog, and responsive layouts.
- **`docs/STAGE_2_ARCHITECTURE.md`:** Supabase integration, RLS policy matrix, and RPC functions.
