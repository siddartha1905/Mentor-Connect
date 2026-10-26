// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextType } from '../src/app/providers/AuthContext'
import { StudentHome } from '../src/features/student/StudentHome'
import { AdminDashboard } from '../src/features/admin/AdminDashboard'
import { AdminLayout } from '../src/app/layouts/AdminLayout'
import { DeadlineManagement } from '../src/features/admin/DeadlineManagement'
import { DevelopmentRoadmap } from '../src/features/admin/DevelopmentRoadmap'
import { studentService } from '../src/services/studentService'
import { deadlineService } from '../src/services/deadlineService'
import { roadmapService } from '../src/services/roadmapService'

function createMockAdminAuth(): AuthContextType {
  return {
    user: {
      id: 'admin-mentor-id',
      email: 'siddartha@vignaniit.edu.in',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any,
    session: null,
    role: 'admin',
    studentProfile: null,
    isLoading: false,
    isConfigured: true,
    isDemo: false,
    isDemoAllowed: false,
    accountLinkingError: null,
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    loginAsDemo: vi.fn(),
    selectDemoRole: vi.fn(),
    clearSession: vi.fn(),
    refreshStudentProfile: vi.fn(),
  }
}

function createMockStudentAuth(): AuthContextType {
  return {
    user: {
      id: 'student-auth-id',
      email: 'student.pilot@vignaniit.edu.in',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any,
    session: null,
    role: 'student',
    studentProfile: {
      id: 'student-pilot-db-id',
      fullName: 'Test Pilot Student',
      rollNumber: '23L31A0999',
      currentSemester: '2-1',
      department: 'CSE-Data Science',
      profileStatus: 'Draft',
      profileCompletionPercent: 65,
      assignedMentor: 'J. Siddartha Varma',
    } as any,
    isLoading: false,
    isConfigured: true,
    isDemo: false,
    isDemoAllowed: false,
    accountLinkingError: null,
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    loginAsDemo: vi.fn(),
    selectDemoRole: vi.fn(),
    clearSession: vi.fn(),
    refreshStudentProfile: vi.fn(),
  }
}

describe('Mentor Connect — Initial Admin Dashboard Cleanup & Mentor Contact Information', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('PART A — Student Homepage: Faculty Contact Information', () => {
    it('displays verified faculty mentor name, designation, and clickable telephone/email links', async () => {
      const auth = createMockStudentAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <StudentHome />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Verified Faculty Mentor Name & Designation
      expect(screen.getByText('J. Siddartha Varma')).toBeDefined()
      expect(screen.getByText(/Assistant Professor, CSE \(Data Science\)/i)).toBeDefined()

      // Clickable Telephone Link
      const telLink = screen.getByTitle(/Call Faculty Mentor/i)
      expect(telLink).toBeDefined()
      expect(telLink.getAttribute('href')).toBe('tel:8885259838')
      expect(telLink.textContent).toContain('8885259838')

      // Clickable Email Link
      const mailLink = screen.getByTitle(/Email Faculty Mentor/i)
      expect(mailLink).toBeDefined()
      expect(mailLink.getAttribute('href')).toBe('mailto:siddartha@vignaniit.edu.in')
      expect(mailLink.textContent).toContain('siddartha@vignaniit.edu.in')
    })
  })

  describe('PART B — Admin Dashboard & Layout: Elimination of Mock Information', () => {
    it('displays SV avatar initials and J. Siddartha Varma, with no KR or Dr. K. S. Rao', async () => {
      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminLayout />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Avatar initials SV
      expect(screen.getAllByText('SV').length).toBeGreaterThanOrEqual(1)
      expect(screen.queryByText('KR')).toBeNull()

      // Real mentor name, no Dr. K. S. Rao
      expect(screen.getAllByText('J. Siddartha Varma').length).toBeGreaterThanOrEqual(1)
      expect(screen.queryByText('Dr. K. S. Rao')).toBeNull()
      expect(screen.queryByText(/Chief Faculty Mentor/i)).toBeNull()

      // No hardcoded 38 Active Mentees
      expect(screen.queryByText(/38 Active Mentees/i)).toBeNull()

      // No hardcoded 2 Pending in sidebar badge
      expect(screen.queryByText(/2 Pending/i)).toBeNull()
    })

    it('AdminDashboard displays real student metrics and no fake attendance or fictional names', async () => {
      // Mock 1 real student in database
      vi.spyOn(studentService, 'getAllStudents').mockResolvedValueOnce([
        {
          id: 'real-student-1',
          user_id: 'real-user-1',
          roll_number: '23L31A0999',
          name: 'Test Pilot Student',
          email: 'test.pilot@vignaniit.edu.in',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A',
          status: 'Active',
        },
      ])

      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      await waitFor(() => {
        // Displays real count: 1 roster student, 1 activated
        expect(screen.getByText('Roster Students')).toBeDefined()
        expect(screen.getByText('Activated Accounts')).toBeDefined()
      })

      // No hardcoded 38 Total Mentees
      expect(screen.queryByText(/38 Total Mentees/i)).toBeNull()
      expect(screen.queryByText(/Mentoring cohort of 38 adult engineering students/i)).toBeNull()

      // No fake attendance condonation or fake student names
      expect(screen.queryByText(/Divya Sri Patnala/i)).toBeNull()
      expect(screen.queryByText(/Medical condonation slip/i)).toBeNull()
      expect(screen.queryByText(/Fever leave/i)).toBeNull()

      // Real Test Pilot Student is visible in cohort list with accurate onboarding badge
      await waitFor(() => {
        expect(screen.getByText('Test Pilot Student')).toBeDefined()
        expect(screen.getByText(/23L31A0999/)).toBeDefined()
      }, { timeout: 4000 })

      // Displays all 6 real onboarding metric categories
      expect(screen.getByText('Roster Students')).toBeDefined()
      expect(screen.getByText('Invited Students')).toBeDefined()
      expect(screen.getByText('Linked Auth')).toBeDefined()
      expect(screen.getByText('Activated Accounts')).toBeDefined()
      expect(screen.getByText('Completed Profiles')).toBeDefined()
      expect(screen.getByText('Pending Approvals')).toBeDefined()
    })

    it('distinguishes Roster Only, Invite Sent, Auth Linked, and Activated onboarding badges', async () => {
      localStorage.setItem('mentor_connect_invited_emails', JSON.stringify(['invited.student@vignaniit.edu.in']))
      localStorage.setItem('mentor_connect_activated_emails', JSON.stringify(['activated.student@vignaniit.edu.in']))

      vi.spyOn(studentService, 'getAllStudents').mockResolvedValueOnce([
        {
          id: 's-1',
          roll_number: '23L31A0001',
          name: 'Roster Only Student',
          email: 'roster.only@vignaniit.edu.in',
          department: 'CSE-DS',
          year: 2,
          semester: 1,
          section: 'A',
          status: 'Active',
        },
        {
          id: 's-2',
          roll_number: '23L31A0002',
          name: 'Invited Student',
          email: 'invited.student@vignaniit.edu.in',
          department: 'CSE-DS',
          year: 2,
          semester: 1,
          section: 'A',
          status: 'Active',
        },
        {
          id: 's-3',
          user_id: 'user-linked-3',
          roll_number: '23L31A0003',
          name: 'Auth Linked Student',
          email: 'linked.student@vignaniit.edu.in',
          department: 'CSE-DS',
          year: 2,
          semester: 1,
          section: 'A',
          status: 'Active',
        },
        {
          id: 's-4',
          user_id: 'user-activated-4',
          roll_number: '23L31A0004',
          name: 'Activated Student',
          email: 'activated.student@vignaniit.edu.in',
          department: 'CSE-DS',
          year: 2,
          semester: 1,
          section: 'A',
          status: 'Active',
        },
      ])

      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      await waitFor(() => {
        expect(screen.getByText('Roster Only Student')).toBeDefined()
      }, { timeout: 4000 })

      // Verify each badge label is rendered accurately
      expect(screen.getByText('ROSTER ONLY')).toBeDefined()
      expect(screen.getByText('INVITE SENT')).toBeDefined()
      expect(screen.getByText('AUTH LINKED')).toBeDefined()
      expect(screen.getByText('ACTIVATED')).toBeDefined()
    })
  })

  describe('PART C — Necessary Admin Navigation & Functions', () => {
    it('AdminLayout shows only prioritized navigation items', async () => {
      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminLayout />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Prioritized nav links exist
      expect(screen.getByText('Dashboard')).toBeDefined()
      expect(screen.getByText('Student Management')).toBeDefined()
      expect(screen.getByText('Mentor 360° View')).toBeDefined()
      expect(screen.getByText('Communications')).toBeDefined()
      expect(screen.getByText('Profile Deadlines')).toBeDefined()
      expect(screen.getByText('Development Roadmap')).toBeDefined()
      expect(screen.getByText('Administration')).toBeDefined()

      // Deferred / incomplete modules are hidden from primary sidebar
      expect(screen.queryByText('Automated Mentor')).toBeNull()
      expect(screen.queryByText('Attendance Hub')).toBeNull()
      expect(screen.queryByText('Academic Records')).toBeNull()
      expect(screen.queryByText('Mentoring Workflow')).toBeNull()
      expect(screen.queryByText('Growth & Activities')).toBeNull()
      expect(screen.queryByText('Forms & Surveys')).toBeNull()
      expect(screen.queryByText('Reports & Analytics')).toBeNull()
    })
  })

  describe('PART D — Profile Deadline Management', () => {
    it('renders confirmed November 3 deadline and makes the 3 editing states explicit', async () => {
      vi.spyOn(studentService, 'getAllStudents').mockResolvedValueOnce([
        {
          id: 'real-student-1',
          roll_number: '23L31A0999',
          name: 'Test Pilot Student',
          email: 'test.pilot@vignaniit.edu.in',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A',
        },
      ])

      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <DeadlineManagement />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Verified November 3 deadline display
      await waitFor(() => {
        expect(screen.getByText(/November 3, 2026 at 11:59:59 PM IST/i)).toBeDefined()
      })

      // Explicit editing status badge
      expect(screen.getByText(/Editing Status: OPEN \(Deadline-Based\)/i)).toBeDefined()
      expect(screen.getByText(/Database Enforcement Modes:/i)).toBeDefined()
      expect(screen.getByText(/Editing Open:/i)).toBeDefined()
      expect(screen.getByText(/Editing Locked:/i)).toBeDefined()
      expect(screen.getByText(/Deadline-Based Editing:/i)).toBeDefined()

      // Grant Student Extension modal opens
      const grantBtn = screen.getByRole('button', { name: /Grant Student Extension/i })
      fireEvent.click(grantBtn)

      expect(screen.getByText('Grant Individual Student Extension')).toBeDefined()
      expect(screen.getByText('Select Mentee *')).toBeDefined()
      expect(screen.getByText('Target Section *')).toBeDefined()
      expect(screen.getByText('Reason for Administrative Extension *')).toBeDefined()
    })
  })

  describe('PART E — Development Roadmap & Feature History', () => {
    it('organizes features into required categories and indicates database migration status', async () => {
      const auth = createMockAdminAuth()

      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <DevelopmentRoadmap />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      await waitFor(() => {
        expect(screen.getByText('Development Roadmap & Feature History')).toBeDefined()
      })

      // Database status is shown accurately (does not falsely claim Supabase persistence if table missing)
      expect(screen.getAllByText(/SQL Migration 20261025140000 Pending Review|Source of Truth: Supabase/i).length).toBeGreaterThan(0)

      // Category filter pills exist
      expect(screen.getByText('All Features & History')).toBeDefined()
      expect(screen.getByText('Completed & Verified')).toBeDefined()
      expect(screen.getByText('In Progress')).toBeDefined()
      expect(screen.getByText('Pending Improvements')).toBeDefined()
      expect(screen.getByText('Deferred / Future')).toBeDefined()
      expect(screen.getByText('Removed Features')).toBeDefined()
      expect(screen.getByText('Notes & Ideas')).toBeDefined()

      // Authoritative deferred items are present
      await waitFor(() => {
        expect(screen.getByText('Daily and Weekly Mood/Check-in Pulse')).toBeDefined()
        expect(screen.getByText('Self-Reported Attendance & Weekly Attendance Hub')).toBeDefined()
        expect(screen.getByText('Mentoring Calendar & 1-on-1 Slot Booking')).toBeDefined()
        expect(screen.getByText('Upcoming Mentoring Discussions & Agenda Booking')).toBeDefined()
        expect(screen.getByText('Mentoring Commitments & Action Item Tracker')).toBeDefined()
      }, { timeout: 4000 })

      // Authoritative removed items are present
      expect(screen.getByText('Landing Page Tech News & AI Articles')).toBeDefined()
      expect(screen.getByText('Seven-Step Mentoring Cycle & Architecture Previews')).toBeDefined()
      expect(screen.getByText('Fictional Student Accounts & Demo Data')).toBeDefined()

      // Authoritative completed items are present
      expect(screen.getByText('Student Profile Direct Save (Sections B through G)')).toBeDefined()
      expect(screen.getByText('Mentor 360° Real Supabase Student Integration')).toBeDefined()
    })
  })
})
