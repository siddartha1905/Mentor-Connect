# Mentor Connect — Stage 2 Architecture & Integration Report

## Executive Summary
Stage 2 connects **Mentor Connect** with a Supabase PostgreSQL backend, establishing a role-based access control architecture, student onboarding workflows, auditable profile modification queues, client-side photo compression, privacy-conscious directory views, and zero-trust Row Level Security (RLS) policies.

---

## 1. Database Schema & Migration (Option A)

The database schema is organized under:
- `supabase/migrations/20261025000000_stage2_consolidated_master.sql`: Authoritative master schema containing core tables, reconciled academic/diploma/commute fields, RLS security policies, deadline triggers, storage policies, and duplicate-claim-protected onboarding triggers. (Superseded drafts archived in `supabase/migrations/archive/`).
- `supabase/seed.sql`: 7 fictional CSE-Data Science 2nd-year student profiles with academic marks, personal records, and test approval queue submissions.

### Table Schema Summary:
1. **`user_roles`**: Role-based access control (`admin`, `student`, `parent`). Helper functions `is_admin()` and `get_my_role()` execute with `SECURITY DEFINER` and fixed `search_path = public`.
2. **`students`**: Master cohort directory for CSE-DS second-year students (`roll_number`, `user_id`, `email`, `department`, `year`, `section`, `status`, `avatar_url`, `share_phone_in_directory`, `share_email_in_directory`).
3. **`student_personal_details`**: Extended personal data (DOB, blood group, emergency contact, addresses).
4. **`student_family_details`**: Parent & family records (father/mother occupations, contacts, annual income).
5. **`student_education_details`**: Historical schooling (10th/12th percentages, boards, EAMCET rank).
6. **`subjects` & `student_subject_marks`**: Academic assessments (WT1-4, Mid1-2, Lab internals, grades, attendance).
7. **`system_settings` & `student_edit_overrides`**: Global profile edit deadlines and mentor-granted individual overrides.
8. **`profile_submissions`**: Section-wise auditable student change requests with an automated PostgreSQL trigger validating field allowlists.
9. **`student_directory_view`**: Privacy-conscious SQL view masking peer phone numbers and emails unless explicitly opted in.

---

## 2. Row Level Security (RLS) Matrix

| Entity | Public / Anon | Student Role (`auth.uid() = user_id`) | Admin Role (`is_admin()`) |
| :--- | :--- | :--- | :--- |
| `user_roles` | None | SELECT own role | ALL (Manage roles) |
| `students` | None | SELECT own, UPDATE privacy flags | ALL (Full management) |
| `student_personal_details` | None | SELECT own record | ALL |
| `student_family_details` | None | SELECT own record | ALL |
| `student_education_details` | None | SELECT own record | ALL |
| `student_subject_marks` | None | SELECT own marks | ALL |
| `profile_submissions` | None | SELECT own, INSERT pending | ALL (Review via RPC) |
| `storage.objects` (`profile-photos`) | None | SELECT approved, INSERT/UPDATE own folder | ALL |

---

## 3. Atomic Approval RPC (`review_profile_submission`)

All profile review operations execute inside a single transactional PostgreSQL function:
```sql
SELECT public.review_profile_submission(
    p_submission_id := 'uuid-here',
    p_action := 'approve', -- or 'request_corrections', 'reject'
    p_remarks := 'Verified against submitted certificate'
);
```
- **Atomicity**: Changes are merged into the target section table (`student_personal_details`, `student_family_details`, etc.) and the submission status is set to `'Approved'` within the same database transaction.
- **Auditing**: Reviewer identity (`auth.uid()`) and timestamp are recorded automatically.

---

## 4. Frontend Integration & Client Architecture

- **`src/lib/supabase.ts`**: Lazy Supabase client initialization supporting both live keys and graceful fallback.
- **`src/app/providers/AuthContext.tsx`**: Unified session management, role resolution, and seamless demo login bypass.
- **`src/app/router/ProtectedRoute.tsx`**: Route guards enforcing role permissions for `/student/*` and `/admin/*`.
- **`src/services/studentService.ts`**: Student profile retrieval, privacy toggles, and edit submissions.
- **`src/services/approvalService.ts`**: Submission queue query and RPC execution.
- **`src/services/storageService.ts`**: Client-side canvas compression targeting <500 KB before upload to private bucket.
- **`src/services/importService.ts`**: CSV roster onboarding with Papaparse, Zod validation, and database duplicate checks.
