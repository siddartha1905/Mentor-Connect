# Mentor Connect

**Official Production Website:** [https://mentorconnect.pages.dev](https://mentorconnect.pages.dev/)  
**GitHub Repository:** [https://github.com/siddartha1905/Mentor-Connect](https://github.com/siddartha1905/Mentor-Connect)  
**Lead Faculty Administrator:** **J. Siddhartha Varma**, Assistant Professor, Department of CSE (Data Science)  
**Project Status:** Stage 2.2 Production Checkpoint & Development Freeze (27 October 2026)  
**Checkpoint Tag:** `mentor-connect-pre-onboarding-2026-10-27`  

---

## 1. Project Overview & Identity

**Mentor Connect** is an independent, faculty-initiated mentoring platform specifically designed for a focused cohort of approximately **35–40 invited second-year undergraduate students** in the Department of Computer Science & Engineering (Data Science) at Vignan's Institute of Information Technology (VIIT).

> [!IMPORTANT]
> **Independent Initiative Notice:**  
> Mentor Connect is an independent faculty mentoring project. It is **NOT** an officially endorsed institutional portal or college-wide student management system (ERP). It prioritizes direct mentor-student dialogue, verified profile records, structured academic tracking, and zero-distraction guidance.

---

## 2. Architecture & Technology Stack

- **Frontend:** React 18, TypeScript, Vite 8, Tailwind CSS
- **Routing:** React Router v7 with code-splitting and Cloudflare SPA fallback
- **Database & Auth:** Supabase PostgreSQL 15, GoTrue Auth, Zero-Trust Row-Level Security (RLS)
- **Object Storage:** Private Supabase Storage (`profile-photos`) with client canvas compression (< 500 KB)
- **Serverless Compute:** Supabase Edge Function (`invite-student`) with service-role security
- **Email Delivery:** Brevo custom SMTP relay integrated via Supabase
- **Hosting:** Cloudflare Pages (`mentorconnect.pages.dev`)
- **PWA:** Vite PWA with service worker caching and web manifest

---

## 3. Authoritative Documentation Repository

Detailed architecture, operations, and AI continuation documentation is located in the [`docs/`](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs) directory:

1. [**Technical Handover Report**](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs/MENTOR_CONNECT_TECHNICAL_HANDOVER.md) (`docs/MENTOR_CONNECT_TECHNICAL_HANDOVER.md`): Comprehensive 19-section architectural and technical audit report.
2. [**Operations Runbook**](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs/MENTOR_CONNECT_OPERATIONS_RUNBOOK.md) (`docs/MENTOR_CONNECT_OPERATIONS_RUNBOOK.md`): Step-by-step procedures for deployment, backups, roster CSV onboarding, deadline management, and disaster recovery.
3. [**AI Continuation Context**](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs/MENTOR_CONNECT_AI_CONTINUATION_CONTEXT.md) (`docs/MENTOR_CONNECT_AI_CONTINUATION_CONTEXT.md`): Essential context for future AI programming assistants and engineers.
4. [**Stage 1 Architecture Report**](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs/STAGE_1_ARCHITECTURE.md) (`docs/STAGE_1_ARCHITECTURE.md`): UI/UX design foundation and component hierarchy.
5. [**Stage 2 Architecture Report**](file:///Users/siddhu/Desktop/Anti%20Gravity/Mentoring%20Portal/docs/STAGE_2_ARCHITECTURE.md) (`docs/STAGE_2_ARCHITECTURE.md`): Supabase database schema, RLS matrix, and RPC functions.

---

## 4. Local Development & Quick Start

### Prerequisites
- Node.js (`v20+` LTS recommended)
- npm (`v10+`)

### Setup
```bash
# Clone the repository
git clone https://github.com/siddartha1905/Mentor-Connect.git
cd Mentor-Connect

# Install exact locked dependencies
npm ci

# Configure local environment variables
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local

# Run automated tests
npx vitest run

# Run TypeScript compilation and build
npm run build

# Start local development server
npm run dev
```

---

## 5. Current Checkpoint Status

- **Automated Tests:** 17 test files, 177 tests passing (100% pass rate).
- **Production Build:** Verified with zero compilation errors (`tsc -b && vite build`).
- **Production Deployment:** Live on Cloudflare Pages at [https://mentorconnect.pages.dev](https://mentorconnect.pages.dev/).
- **Live Student Onboarding:** Paused. One Test Pilot Student (`23L31A0999`) verified; zero live class invitations dispatched.
- **Profile Submission Deadline:** Tuesday, November 3, 2026, 11:59:59 PM IST.

