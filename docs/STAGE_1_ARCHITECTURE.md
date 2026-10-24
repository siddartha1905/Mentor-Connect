# Mentor Connect — Stage 1 Technical Architecture & Verification Report

## 1. Project Background & Scope
**Mentor Connect** is a personal mentoring, counselling, and academic guidance initiative designed for a faculty mentor working with approximately 35–40 second-year engineering students from the **CSE–Data Science (CSE–DS)** department at **Vignan Institute of Information Technology** (adult students aged 18–20).

Stage 1 delivers the **frontend foundation, UI/UX design system, public landing page, mobile-first student PWA experience, desktop administrator workspace, and Mentor 360° student hub**. 

> [!NOTE]
> **Stage 1 Constraint Adherence**: Stage 1 is **strictly frontend-only**. No live Supabase project was connected, no database migrations or real credentials were used, no push delivery or external API integrations were started, and no live deployment was executed.

---

## 2. Technology Stack & Key Dependencies

| Layer | Technology | Version & Rationale |
|---|---|---|
| **Framework** | React 19 + TypeScript | Strict typing, modern React Hooks |
| **Tooling & Bundler** | Vite 8 + `@tailwindcss/vite` | Sub-second HMR and optimized production bundles |
| **Styling** | Tailwind CSS + CSS Theme Variables | "Campus-Tech Minimalism" with pastel palette |
| **Typography** | Plus Jakarta Sans (Headings) + Inter (UI/Body) | Modern, clean readability across mobile and desktop |
| **Icons** | Lucide React | High-legibility, scalable SVG icons |
| **Charts** | Recharts | Meaningful attendance health and CGPA distribution charts |
| **Routing** | React Router DOM | Declarative client-side routing with nested layouts |
| **PWA** | `vite-plugin-pwa` + Web App Manifest | Installable app shell, offline caching foundation, icons |
| **Test Suite** | Vitest + Testing Library | Automated smoke tests for data layer, thresholds and routes |

---

## 3. Directory & Folder Organization

```text
mentor-connect/
├── public/
│   ├── favicon.svg              # Brand icon (dual nodes + guiding beacon)
│   ├── apple-touch-icon.png     # iOS home screen icon (180x180)
│   ├── manifest.webmanifest     # PWA Web App Manifest
│   └── icons/
│       ├── icon-192.png         # PWA icon 192x192
│       ├── icon-512.png         # PWA icon 512x512
│       └── icon.svg             # Scalable brand vector
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx  # Desktop layout with soft pastel lavender sidebar
│   │   │   └── StudentLayout.tsx# Mobile-first PWA layout with 5-tab bottom navigation
│   │   └── router/
│   │       └── index.tsx        # Unified React Router configuration (25+ routes)
│   ├── components/
│   │   ├── shared/
│   │   │   ├── DemoNotice.tsx   # Explicit banner/inline demo indicator component
│   │   │   ├── Logo.tsx         # Mentor Connect brand mark
│   │   │   └── QuoteCard.tsx    # Deterministic daily motivational quote card
│   │   └── ui/
│   │       ├── avatar.tsx       # Avatar with initials fallback & pastel hash
│   │       ├── badge.tsx        # Semantic status & priority badges
│   │       ├── button.tsx       # Primary, outline, ghost & pastel buttons
│   │       ├── card.tsx         # Card, CardHeader, CardTitle, CardContent
│   │       ├── dialog.tsx       # Accessible modal dialog with backdrop & ESC dismiss
│   │       ├── input.tsx        # Styled form input with labels & error states
│   │       └── tabs.tsx         # Pill, underline, and chip tab switchers
│   ├── data/
│   │   └── mock/
│   │       ├── announcements.ts # Cohort alerts & updates
│   │       ├── approvals.ts     # Profile update diffs (old vs proposed)
│   │       ├── attendance.ts    # Weekly official register vs daily check-ins
│   │       ├── communications.ts# Student-mentor private chats & notices
│   │       ├── index.ts         # Central barrel export
│   │       ├── mentoringSessions.ts# Before/during/after counselling records
│   │       ├── quotes.ts        # Rotating motivational thoughts
│   │       ├── schedules.ts     # Automated mentor rules (10:30 AM IST pulse)
│   │       ├── students.ts      # 7 realistic fictional CSE-DS 2nd-year profiles
│   │       └── surveys.ts       # Active feedback forms & response stats
│   ├── features/
│   │   ├── academics/           # Semester 2-1 assessments & marks portal lock
│   │   ├── admin/               # Admin dashboard, mentee list, growth, settings
│   │   ├── approvals/           # Profile Approval Centre with side-by-side diffs
│   │   ├── attendance/          # Dual attendance source tracking (80%/75% thresholds)
│   │   ├── authentication/      # Visual login screens (Student & Admin)
│   │   ├── automation/          # Automated Mentor scheduler shell
│   │   ├── communication/       # 1-on-1 private chat & cohort feed
│   │   ├── landing/             # Public landing page with dynamic SVG abstract hero
│   │   ├── mentor360/           # Primary Mentor 360° student detail workspace
│   │   ├── mentoring/           # 3-phase weekly counselling workflow
│   │   ├── reports/             # 8 institutional report preview cards
│   │   ├── student/             # Home, Journey, Check-in, Messages, More, Profile
│   │   └── surveys/             # Form builder preview & mentee polls
│   ├── lib/
│   │   └── utils.ts             # Tailwind class merging utility (`cn`)
│   ├── styles/
│   │   └── index.css            # Tailwind theme tokens & Google Fonts
│   ├── types/
│   │   └── index.ts             # Domain models (StudentProfile, AcademicHistory, etc.)
│   ├── App.tsx                  # Root router provider
│   └── main.tsx                 # Vite application mount
├── tests/
│   └── smoke.test.tsx           # Automated smoke test suite (4 tests)
├── docs/
│   └── STAGE_1_ARCHITECTURE.md  # Comprehensive architectural documentation
└── vite.config.ts               # Vite configuration with Tailwind v4 & PWA
```

---

## 4. Design System & Theme Tokens

### Campus-Tech Minimalism & Soft Pastel Palette
The design system complies with the strict architectural instruction:
- **Admin Sidebar**: Uses soft pastel lavender (`#F5F3FF` / `#EDE9FE`) with high-contrast slate typography (`#1E293B`), **never dark navy or black**.
- **Primary Pastels**:
  - Pastel Lavender: `#EDE9FE`
  - Pastel Blue: `#DBEAFE`
  - Pastel Mint: `#D1FAE5`
  - Pastel Rose: `#FFE4E6`
  - Cloud Canvas: `#F8FAFC`
  - White: `#FFFFFF`
- **Accents**:
  - Indigo: `#4F46E5`
  - Teal: `#0D9488`
  - Midnight Navy: `#111C36` (used exclusively on public landing abstract hero)
- **Semantic Badges**:
  - `Approved` / `Good`: Emerald green
  - `Pending`: Amber
  - `Changes Requested` / `Warning`: Orange / Amber
  - `Rejected` / `Critical`: Rose / Crimson
  - `Locked` / `Draft`: Slate / Lavender

---

## 5. Route Map

| Path | Experience | Description |
|---|---|---|
| `/` | Public Landing | Hero section, abstract canvas, quote, demo entry points |
| `/login/student` | Visual Auth | Student login form with "Explore Student Demo" button |
| `/login/admin` | Visual Auth | Faculty login form with "Explore Admin Demo" button |
| `/student` | Student PWA | Home tab: attendance gauge, marks snapshot, commitments |
| `/student/journey` | Student PWA | Coursework breakdown, skills, ambitions, mentor advice |
| `/student/check-in` | Student PWA | 10:30 AM IST morning check-in form & past responses |
| `/student/messages` | Student PWA | 1-on-1 private chat preview & cohort feed |
| `/student/more` | Student PWA | Navigation hub to profile, directory, calendar, docs |
| `/student/profile` | Student PWA | Multi-section profile (A to G), completion gauge, photo crop |
| `/student/directory` | Student PWA | Cohort roll list with privacy-conscious contact masking |
| `/student/documents`| Student PWA | Google-style external document links |
| `/student/calendar` | Student PWA | Booked counselling appointment slots & office hours |
| `/student/surveys` | Student PWA | Cohort surveys and interactive sample response form |
| `/admin` | Admin Workspace | Overview KPI cards, Recharts, follow-up priority queue |
| `/admin/mentor360` | Admin Workspace | **Mentor 360° Student Detail Console** (9 rich tabs) |
| `/admin/students` | Admin Workspace | 38-mentee management table with status filtering |
| `/admin/approvals` | Admin Workspace | Section-wise profile approvals with side-by-side diffs |
| `/admin/attendance`| Admin Workspace | Biometric weekly upload vs daily check-ins (80%/75% limits) |
| `/admin/academics` | Admin Workspace | Sem 2-1 subject assessment marks & portal locking |
| `/admin/mentoring` | Admin Workspace | 3-phase counselling flow (Before, During, After session) |
| `/admin/communication`| Admin Workspace| 1-on-1 student dialogue & broadcast announcements |
| `/admin/automation` | Admin Workspace | Automated check-in schedule rules & morning triggers |
| `/admin/growth` | Admin Workspace | Student certifications, hackathons and skill portfolios |
| `/admin/surveys` | Admin Workspace | Form builder preview and response analytics |
| `/admin/reports` | Admin Workspace | 8 institutional report cards & print previews |
| `/admin/settings` | Admin Workspace | Attendance thresholds (80%/75%) and academic term specs |

---

## 6. Mentor 360° Highlights (Primary Working Screen)
- **Fast Mentee Switching**: Global roll number search in top navigation bar immediately suggests matching records and navigates with `?roll=23L31A54xx`.
- **Student Header**: Displays photo, roll number, department, section, profile approval status, and administrator follow-up priority badge without any simulated AI psychological scores.
- **"Prepare for Your Next Mentoring Session" Panel**: Briefs the faculty mentor on prior discussions, pending student commitments, topics needing review, and rule-based suggested questions.
- **Strict Separation of Notes**:
  - **Mentor-Only Confidential Notes**: Private observations (medical issues, family distress, sensitive academic struggles).
  - **Student-Visible Guidance**: Concrete action items, coding drills, and tutorial tasks published directly to the student dashboard.

---

## 7. Mock Data Layer
Contains 7 representative fictional student profiles in `src/data/mock/students.ts`:
1. `23L31A5401` — **Aarav Sharma**: Approved profile, 88.5% attendance, 8.65 CGPA, ML track focus, resolved commitments.
2. `23L31A5402` — **Bhavya Reddy**: Pending approval, 81.2% attendance, 7.92 CGPA, hostel allotment update staged.
3. `23L31A5403` — **Chirag Varma**: Changes requested, 77.4% attendance (Warning), 1 active backlog (Applied Physics).
4. `23L31A5404` — **Divya Sri Patnala**: Approved, 71.8% attendance (Critical shortage due to viral fever), 2 pending doctor note commitments.
5. `23L31A5405` — **Eshwar Prasad K**: Approved, 93.0% attendance, 9.32 CGPA, hackathon winner, AWS certified.
6. `23L31A5406` — **Farhana Shaik**: Approved, 84.0% attendance, 7.50 CGPA, lab internal guidance requested.
7. `23L31A5407` — **Goutham Teja N**: Pending approval, 80.5% attendance, 8.10 CGPA, lateral entry diploma credit reconciliation.

---

## 8. Verification Results
- **TypeScript**: `tsc -b` passes with **0 errors**.
- **Production Build**: `vite build` bundles successfully in **372ms** producing service worker and web manifest.
- **Linting**: Oxlint passed on 53 files with **0 errors**.
- **Unit & Smoke Tests**: Vitest verified 4 test suites with **100% pass rate in 158ms**.
- **Local Dev Server**: Tested on `http://127.0.0.1:5173/` responding with `HTTP/1.1 200 OK`.

---

## 9. Stage 2 Migration Roadmap
When authorized to begin Stage 2:
1. Connect live Supabase project (URL and anon key in `.env`).
2. Implement Supabase Auth (email/password with college domain restriction and role claims: `student` vs `mentor`).
3. Deploy PostgreSQL schema matching `src/types/index.ts` with Row-Level Security (RLS) ensuring confidential mentor notes are inaccessible to student tokens.
4. Connect Supabase Storage for student profile photos (500 KB target, 1 MB hard limit).
5. Implement Supabase Realtime for instant private student-mentor messaging.
