# MENTOR CONNECT — OPERATIONS RUNBOOK
**Document Reference:** `MC-DOC-OR-2026-10-27`  
**Effective Date:** 27 October 2026  
**Status:** Certified Operational Standard  
**Lead Faculty Administrator:** J. Siddhartha Varma, Assistant Professor, CSE (Data Science)  

---

## TABLE OF CONTENTS
1. [Repository Setup & Local Environment](#1-repository-setup--local-environment)
2. [Local Development, Testing & Verification](#2-local-development-testing--verification)
3. [Frontend Deployment (Cloudflare Pages)](#3-frontend-deployment-cloudflare-pages)
4. [Supabase Edge Functions Deployment](#4-supabase-edge-functions-deployment)
5. [Database Migrations Management](#5-database-migrations-management)
6. [Authentication Verification & Admin Role Management](#6-authentication-verification--admin-role-management)
7. [Profile Deadline & Override Administration](#7-profile-deadline--override-administration)
8. [Student Roster CSV Onboarding](#8-student-roster-csv-onboarding)
9. [Student Invitation Dispatch Procedures](#9-student-invitation-dispatch-procedures)
10. [Invitation Audit Logs & Troubleshooting](#10-invitation-audit-logs--troubleshooting)
11. [Database & Storage Backup Procedures](#11-database--storage-backup-procedures)
12. [Disaster Recovery & Data Restoration](#12-disaster-recovery--data-restoration)
13. [Security & Credential Management Standard](#13-security--credential-management-standard)

---

## 1. REPOSITORY SETUP & LOCAL ENVIRONMENT

### 1.1 Cloning the Repository
```bash
git clone https://github.com/siddartha1905/Mentor-Connect.git
cd Mentor-Connect
```

### 1.2 Installing Dependencies
Use `npm ci` for deterministic, clean installs matching `package-lock.json`:
```bash
npm ci
```

### 1.3 Configuring Local Environment Variables
Create a `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```
Edit `.env.local` with the client configuration:
```env
VITE_SUPABASE_URL=https://mttocnlnmmtaugzthfih.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ubgTNXuef73iltLVtTItrg_Bh6XS2sz
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ubgTNXuef73iltLVtTItrg_Bh6XS2sz
VITE_APP_ENV=development
```

> [!WARNING]
> **Security Rule:** Never place the Supabase `service_role` key, database passwords, or SMTP secrets in `.env.local`. Client builds bundle `.env.local` into client-accessible JavaScript.

---

## 2. LOCAL DEVELOPMENT, TESTING & VERIFICATION

### 2.1 Starting Local Development Server
```bash
npm run dev
```
The server will bind to `http://localhost:5173`. Open in a modern browser (Chrome, Edge, Safari).

### 2.2 Executing Automated Tests
Run the complete Vitest test suite:
```bash
npx vitest run
```
*Expected Result:* 17 test files, 177 tests passing.

### 2.3 Compiling & Verifying Production Build
```bash
npm run build
```
This triggers TypeScript compiler validation (`tsc -b`) followed by Vite Rollup production bundling. Ensure zero errors and that files are generated in `dist/`.

---

## 3. FRONTEND DEPLOYMENT (CLOUDFLARE PAGES)

### 3.1 Git Integration Deployment
Mentor Connect is configured with direct GitHub integration on Cloudflare Pages.
1. When changes are committed and pushed to `origin/main`, Cloudflare Pages automatically triggers a production build.
2. Build Settings in Cloudflare Pages:
   - **Project Name:** `mentorconnect`
   - **Framework Preset:** None / Vite
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
   - **Root Directory:** `/`
3. Environment Variables in Cloudflare Pages Dashboard:
   - `VITE_SUPABASE_URL`: `https://mttocnlnmmtaugzthfih.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<supabase-anon-key>`
   - `VITE_APP_ENV`: `production`

### 3.2 Verifying Deployment Status
1. Open [https://mentorconnect.pages.dev/](https://mentorconnect.pages.dev/).
2. Verify HTTP 200 response and check the browser console for zero runtime exceptions.
3. Test direct deep-link reloads on `/login/student` and `/login/admin` to verify SPA fallback (`public/_redirects`).

---

## 4. SUPABASE EDGE FUNCTIONS DEPLOYMENT

### 4.1 Prerequisites
Ensure the Supabase CLI is available:
```bash
npx supabase --version
```

### 4.2 Logging in to Supabase CLI
Authenticate using a Supabase Personal Access Token (generate from Supabase Dashboard -> Account -> Access Tokens):
```bash
npx supabase login
```

### 4.3 Deploying the `invite-student` Function
```bash
npx supabase functions deploy invite-student --project-ref mttocnlnmmtaugzthfih
```

### 4.4 Configuring Edge Function Secrets
The Edge Function requires these secrets set in the Supabase Dashboard (Project -> Settings -> Edge Functions -> Secrets):
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" --project-ref mttocnlnmmtaugzthfih
npx supabase secrets set SITE_URL="https://mentorconnect.pages.dev" --project-ref mttocnlnmmtaugzthfih
```

---

## 5. DATABASE MIGRATIONS MANAGEMENT

### 5.1 Migration Execution Rule
> [!CAUTION]
> **Strict Operational Rule:** Never run ad-hoc DDL scripts directly against production without staging them in `supabase/migrations/` as timestamped SQL files.

### 5.2 Creating a New Migration
1. Name files with standard timestamp prefix:
   `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`
2. Write non-destructive SQL using `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and idempotent policy drops (`DROP POLICY IF EXISTS ...`).
3. Include explicit `REVOKE` statements from `public` and `anon` for any new tables.

### 5.3 Applying Migrations via Supabase Dashboard
1. Navigate to: [https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih/sql](https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih/sql)
2. Open the SQL Editor and create a new query.
3. Paste the contents of the migration file.
4. Execute the query and inspect the execution output for errors.

---

## 6. AUTHENTICATION VERIFICATION & ADMIN ROLE MANAGEMENT

### 6.1 Provisioning the Administrator Account
Administrator registration is decommissioned from the public UI. To grant faculty administrator privileges to an account:

```sql
-- Step 1: Locate Auth User ID
SELECT id, email FROM auth.users WHERE email = 'faculty.email@example.com';

-- Step 2: Assign Admin Role
INSERT INTO public.user_roles (user_id, role)
VALUES ('<auth-user-uuid>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Step 3: Verify Role Assignment
SELECT * FROM public.user_roles WHERE user_id = '<auth-user-uuid>';
```

### 6.2 Testing Administrator Access
1. Visit `https://mentorconnect.pages.dev/login/admin`.
2. Enter the administrator credentials.
3. Confirm redirection to `/admin`.
4. Verify that the faculty name displays as `J. Siddhartha Varma` and the avatar displays `SV`.

---

## 7. PROFILE DEADLINE & OVERRIDE ADMINISTRATION

### 7.1 Reviewing the Current Deadline
- **Configured Deadline:** November 3, 2026, 11:59:59 PM IST (`2026-11-03T23:59:59+05:30`).
- **Database Trigger:** `check_student_profile_deadline()` halts student modifications on `student_personal_details`, `student_family_details`, `student_education_details`, `student_skills_goals`, `student_achievements`, and `students.avatar_url`.

### 7.2 Updating the Deadline (via Admin Portal)
1. Log in to the Admin Portal.
2. Navigate to `/admin/deadlines`.
3. Select the new target date, time, and timezone.
4. Click **Update Deadline**.

### 7.3 Updating the Deadline (via SQL)
```sql
UPDATE public.system_settings
SET value = jsonb_build_object(
    'deadline', '2026-12-15T23:59:59+05:30',
    'timezone', 'Asia/Kolkata',
    'is_enabled', true,
    'description', 'Updated Semester 2-1 Profile Deadline'
),
updated_at = timezone('utc'::text, now())
WHERE key = 'profile_edit_deadline';
```

### 7.4 Granting Individual Student Overrides
To permit a specific mentee to update their profile after the global deadline:
```sql
INSERT INTO public.student_edit_overrides (student_id, section, allowed_until, reason, granted_by)
VALUES (
    '<student-uuid>',
    'all', -- or 'personal', 'education', 'photo'
    '2026-11-10T23:59:59+05:30',
    'Medical leave extension approved by faculty mentor',
    '<admin-auth-uuid>'
);
```

---

## 8. STUDENT ROSTER CSV ONBOARDING

### 8.1 Preparing the Roster File
Create a CSV file with the following exact column headers:
```csv
roll_number,name,email,department,year,semester,section
23L31A5401,Aarav Sharma,aarav.23l31a5401@viit.ac.in,CSE-Data Science,2,1,A
23L31A5402,Bhavya Reddy,bhavya.23l31a5402@viit.ac.in,CSE-Data Science,2,1,A
```

### 8.2 Roster Validation Checklist
- All roll numbers must be uppercase (`23L31A...`).
- All email addresses must be valid institutional student mailboxes.
- Department should be `CSE-Data Science`.
- Year should be `2`, Semester should be `1`.

### 8.3 Importing via Student Management
1. Navigate to `/admin/students`.
2. Click **Import CSV Roster**.
3. Select your validated CSV file.
4. The system validates the schema and checks for duplicates.
5. Click **Confirm Import**. The students are staged with status **Roster Only**.

---

## 9. STUDENT INVITATION DISPATCH PROCEDURES

### 9.1 Pre-Dispatch Verification
Before sending student invitations:
1. Confirm the Brevo custom SMTP service is active in Supabase Auth settings.
2. Verify that `https://mentorconnect.pages.dev/login/reset-password` is in Supabase Redirect URLs.
3. Verify that the global profile deadline is in the future.

### 9.2 Controlled Single-Student Pilot Test
Always dispatch to a single test account before batch dispatching:
1. In Student Management (`/admin/students`), find the test student.
2. Click **Send Invitation**.
3. Check the recipient's inbox and spam folder for the invitation email.
4. Click the link in the email; confirm it redirects to `https://mentorconnect.pages.dev/login/reset-password`.
5. Enter a new password and log in.

### 9.3 Batch Dispatch Strategy
- Dispatch in small batches of 5–10 students at a time.
- Allow 30–60 seconds between batches to prevent SMTP relay rate limiting.

---

## 10. INVITATION AUDIT LOGS & TROUBLESHOOTING

### 10.1 Inspecting Invitation Logs
```sql
SELECT roll_number, email, status, resend_count, last_attempt_at, error_message
FROM public.student_invitations
ORDER BY last_attempt_at DESC;
```

### 10.2 Common Errors & Remediation

| Code / Error | Cause | Remediation |
| :--- | :--- | :--- |
| `ROSTER_LOOKUP_FAILED` | Student roll number not in `public.students`. | Import student into roster first. |
| `ROSTER_EMAIL_MISMATCH` | Requested email differs from roster email. | Update student record in roster before inviting. |
| `ACCOUNT_ALREADY_ACTIVATED` | Student has already logged in and activated. | Direct student to use Password Reset instead. |
| `INVITATION_COOLDOWN` | Attempted re-dispatch within 30 seconds. | Wait for cooldown timer to expire. |
| `INSECURE_REDIRECT_PROTOCOL` | Non-HTTPS redirect passed to Edge Function. | Enforce `https://mentorconnect.pages.dev`. |

---

## 11. DATABASE & STORAGE BACKUP PROCEDURES

### 11.1 Logical SQL Backup (pg_dump)
Obtain your Supabase database connection string from Dashboard -> Project Settings -> Database.

```bash
# Export schema and all data to SQL file
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.mttocnlnmmtaugzthfih.supabase.co:5432/postgres" \
  --clean --if-exists --quote-all-identifiers \
  --file "mentor_connect_backup_$(date +%Y%m%d_%H%M%S).sql"
```

> [!CAUTION]
> Never commit SQL backup files containing student records to Git. Store encrypted backups on an offline external drive or secure institutional storage.

### 11.2 Supabase Dashboard Automated Backups
1. Navigate to: [https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih/database/backups](https://supabase.com/dashboard/project/mttocnlnmmtaugzthfih/database/backups)
2. Verify daily automated backup status.
3. Download or create a manual backup checkpoint.

### 11.3 Profile Photographs Storage Backup
Use the Supabase CLI or storage API script to export uploaded photos:
```bash
# Example using Supabase CLI
npx supabase storage download profile-photos ./backup_photos --project-ref mttocnlnmmtaugzthfih
```

---

## 12. DISASTER RECOVERY & DATA RESTORATION

### 12.1 Separation of Code and Data
- **Code Restoration:** Tracked in GitHub. Can be cloned and redeployed to Cloudflare Pages in minutes.
- **Data Restoration:** Maintained in Supabase PostgreSQL and private storage. Restored independently via SQL dumps.

### 12.2 Restoring Database to a Fresh Project
If the Supabase project needs to be recreated:
1. Create a fresh project on Supabase.
2. Note the new project reference ID.
3. Restore database schema using `pg_restore` or `psql`:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[NEW-REF].supabase.co:5432/postgres" < mentor_connect_backup_YYYYMMDD.sql
   ```
4. Deploy the `invite-student` Edge Function to the new project reference.
5. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages.

---

## 13. SECURITY & CREDENTIAL MANAGEMENT STANDARD

1. **Zero Git Secrets:** No `.env.local`, API secret keys, service-role tokens, or student photos in Git.
2. **Access Control:** Only the lead faculty administrator (`J. Siddhartha Varma`) holds administrator credentials.
3. **Session Revocation:** If a device is compromised, revoke sessions via Supabase Dashboard -> Authentication -> Users.
4. **Periodic Audit:** Run the SQL security test suite:
   ```bash
   # Inspect database security audit definitions
   cat supabase/tests/database_security_audit.sql
   ```
