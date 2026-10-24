# Mentor Connect

A personal student mentoring, counselling, and academic progress tracking portal designed for a faculty mentor working with second-year engineering students from the **CSE–Data Science (CSE–DS)** department at **Vignan Institute of Information Technology**.

---

## Stage 1 Features & Architecture

### 1. Public Landing Page (`/`)
- Abstract technology-inspired graphic hero section with flowing indigo and teal gradients
- Hero headline: *"Your journey. Your growth. Your future."*
- Deterministic daily motivational quote rotated by local calendar day
- Explicit development preview buttons: **"View Student Demo"** and **"View Admin Demo"**
- Complete feature sections: About, Mentoring Cycle, Academic Support, Privacy Notice, and Professional Footer

### 2. Visual Authentication Screens
- **Student Login** (`/login/student`): Email/roll number and password inputs, visibility toggle, forgot password flow, and direct link to Student Demo
- **Administrator Login** (`/login/admin`): Faculty login interface with direct link to Admin Demo
- Visual mocks only; live Supabase Auth planned for Stage 2

### 3. Student Mobile-First PWA Experience
- 5-tab mobile bottom navigation:
  1. **Home** (`/student`): Welcome banner, attendance gauge, academic snapshot, commitments checklist, upcoming session
  2. **My Journey** (`/student/journey`): Coursework breakdown, skills, ambitions, mentor advice
  3. **Check-in** (`/student/check-in`): 10:30 AM IST morning check-in form and response history
  4. **Messages** (`/student/messages`): 1-on-1 private chat preview and cohort feed (peer DM disabled)
  5. **More** (`/student/more`): Profile, directory, calendar, documents, and settings
- **Multi-section Profile** (`/student/profile`): Sections A through G, profile completion gauge, and photo crop preview shell

### 4. Administrator Desktop Workspace
- **Soft Pastel Lavender Sidebar**: Lavender/powder-blue palette (`#F5F3FF` / `#EDE9FE`) with dark slate typography (**never dark navy or black**)
- **Global Roll-Number Search**: Fast search bar with instant autocomplete dropdown to inspect any mentee
- **Mentor 360° View** (`/admin/mentor360`): Primary working screen with student header, 9 rich tabs, *"Prepare for Your Next Mentoring Session"* panel, and strict separation between confidential mentor notes and student-visible suggestions
- **Core Modules**:
  - Approval Centre (`/admin/approvals`): Side-by-side diffs with in-memory action toggles
  - Attendance Hub (`/admin/attendance`): Official register vs daily check-ins (80%/75% limits)
  - Academic Records (`/admin/academics`): Sem 2-1 assessments, WT1–WT4 marks, portal locking
  - Mentoring Workflow (`/admin/mentoring`): 3-phase Before/During/After counselling flow
  - Communications (`/admin/communication`): 1-on-1 dialogue and cohort announcements
  - Automated Mentor (`/admin/automation`): 10:30 AM IST check-in scheduler preview
  - Forms & Surveys (`/admin/surveys`): Custom form builder preview and response analytics
  - Reports & Analytics (`/admin/reports`): 8 institutional report preview cards

---

## Local Development & Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## Stage 1 Verification Status
- **TypeScript**: Strict compilation passed (`tsc -b`)
- **Linting**: Oxlint passed on 53 files with 0 errors
- **Tests**: Vitest smoke test suite passed (4/4 tests passed)
- **Production Bundle**: Bundled in 372ms with PWA service worker and manifest

> [!IMPORTANT]
> **Stage 1 Boundary**: No live Supabase backend was connected, no database migrations or live authentication were introduced, and no production deployment was performed.
