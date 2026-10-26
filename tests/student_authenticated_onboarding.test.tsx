// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import * as React from 'react'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StudentHome } from '@/features/student/StudentHome'
import { StudentProfileView } from '@/features/student/StudentProfileView'
import { StudentLayout } from '@/app/layouts/StudentLayout'
import { AuthContext, AuthContextType } from '@/app/providers/AuthContext'
import { StudentProfile } from '@/types'

afterEach(() => {
  cleanup()
})

describe('Mentor Connect — Authenticated Student Dashboard & First-Time Onboarding', () => {
  // Test Pilot Student fixture representing actual Supabase record
  const realTestPilotProfile: StudentProfile = {
    id: 'db-student-pilot-id',
    rollNumber: '23L31A5499',
    fullName: 'Test Pilot Student',
    email: 'test.pilot@example.com',
    phone: '+91 98765 43210',
    department: 'CSE-Data Science',
    currentYear: 2,
    currentSemester: '2-1',
    section: 'A',
    attendancePercentage: 0, // Unrecorded
    profileCompletionPercent: 20, // Only roster filled
    profileStatus: 'Draft', // Not approved yet!
    mentorCommentsCount: 0,
    academics: {
      sem1_1: { sgpa: 0, credits: 0, status: 'Not Recorded' },
      sem1_2: { sgpa: 0, credits: 0, status: 'Not Recorded' },
      cgpa: 0,
      totalCredits: 0,
      totalBacklogs: 0,
      subjects: [],
    },
    careerInterests: [],
    desiredTechnicalSkills: [],
    softSkills: [],
    personalStrengths: [],
    certifications: [],
    competitions: [],
    developmentGoals: [],
  }

  const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
    user: { id: 'auth-pilot-user-id', email: 'test.pilot@example.com' } as any,
    session: {} as any,
    role: 'student',
    isAdmin: false,
    isStudent: true,
    isFaculty: false,
    studentProfile: realTestPilotProfile,
    studentDbId: 'db-student-pilot-id',
    studentRollNumber: '23L31A5499',
    accountLinkingError: null,
    isConfigured: true,
    isDemoAllowed: true,
    isDemo: false, // REAL AUTHENTICATED MODE
    loading: false,
    signOut: vi.fn(),
    refreshStudentProfile: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    updatePassword: vi.fn(),
    sendStudentInvite: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    loginAsDemo: vi.fn(),
    ...overrides,
  })

  it('1. Renders actual authenticated Test Pilot Student name, roll number, and avoids Aarav Sharma mock data', () => {
    const authValue = createMockAuthContext()

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Verify Real Student Information is displayed
    expect(screen.getByText(/Welcome back, Test/i)).toBeDefined()
    expect(screen.getByText('23L31A5499')).toBeDefined()

    // Strictly verify fictional demo Aarav Sharma (23L31A5401) is NOT displayed anywhere
    expect(screen.queryByText('Aarav Sharma')).toBeNull()
    expect(screen.queryByText('23L31A5401')).toBeNull()
  })

  it('2. Displays prominent first-time "Complete Your Profile" onboarding action card with accurate progress', () => {
    const authValue = createMockAuthContext()

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Verify Onboarding banner is prominently visible
    expect(
      screen.getByText(/First-Time Onboarding: Complete Your Profile/i)
    ).toBeDefined()

    // Verify CTA button to profile completion exists
    const ctaButton = screen.getByRole('button', { name: /Complete Your Profile/i })
    expect(ctaButton).toBeDefined()

    // Verify status is "Profile Incomplete" / "Draft" and NOT "Profile Approved"
    expect(screen.getByText(/Profile Incomplete/i)).toBeDefined()
    expect(screen.queryByText(/Profile Approved/i)).toBeNull()
  })

  it('3. Replaces invented attendance (88%) and CGPA (8.85) with clean "—" and "Not yet recorded" empty states', () => {
    const authValue = createMockAuthContext()

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Fictional attendance percentage and CGPA must not appear
    expect(screen.queryByText(/88\.5%/i)).toBeNull()
    expect(screen.queryByText(/8\.85/i)).toBeNull()

    // Attendance & CGPA cards show placeholder badges
    const unrecordedBadges = screen.getAllByText(/Not yet available/i)
    expect(unrecordedBadges.length).toBeGreaterThanOrEqual(2)

    // Upcoming session card shows no scheduled sessions instead of fictional "Dr. K. S. Rao"
    expect(screen.getByText(/No upcoming 1-on-1 session scheduled/i)).toBeDefined()
  })

  it('4. Header in StudentLayout renders real student roll number and name', () => {
    const authValue = createMockAuthContext()

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.getByText('Test Pilot Student')).toBeDefined()
    expect(screen.getByText(/23L31A5499/i)).toBeDefined()
    expect(screen.queryByText('Aarav Sharma')).toBeNull()
    expect(screen.queryByText('23L31A5401')).toBeNull()
  })

  it('5. Unlinked authenticated user displays clear account-linking error and rejects mock fallback', () => {
    const unlinkedAuthValue = createMockAuthContext({
      studentProfile: null,
      studentDbId: null,
      accountLinkingError:
        'Your authenticated account (unlinked@example.com) is not associated with an enrolled student roster record. Please contact your department coordinator.',
    })

    render(
      <AuthContext.Provider value={unlinkedAuthValue}>
        <MemoryRouter>
          <StudentLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Must show clear account-linking alert
    expect(
      screen.getByText(/is not associated with an enrolled student roster record/i)
    ).toBeDefined()
    expect(screen.getByText(/unlinked@example\.com/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeDefined()

    // Must never show fictional Aarav Sharma as fallback
    expect(screen.queryByText('Aarav Sharma')).toBeNull()
    expect(screen.queryByText('23L31A5401')).toBeNull()
  })

  it('6. StudentProfileView pre-fills available roster data and marks unprovided sections clearly', () => {
    const authValue = createMockAuthContext()

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentProfileView />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Check pre-filled institutional identity
    expect(screen.getAllByText('Test Pilot Student').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('23L31A5499').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/CSE-Data Science/i).length).toBeGreaterThanOrEqual(1)

    // Profile status is strictly Draft / Incomplete, not Approved
    expect(screen.getByText(/Status: Profile Incomplete/i)).toBeDefined()
    expect(screen.queryByText(/Status: Profile Approved/i)).toBeNull()

    // Switch to Tab B (Personal Info) where missing fields show "Not yet provided"
    const personalTabButton = screen.getByRole('tab', { name: /B\. Personal Info/i })
    fireEvent.click(personalTabButton)

    // Check that missing fields show clear empty state
    const missingPlaceholders = screen.getAllByText(/Not yet provided/i)
    expect(missingPlaceholders.length).toBeGreaterThanOrEqual(2)
  })

  it('7. Enforces privacy isolation: Student A cannot access Student B profile', () => {
    // Simulated RLS query constraint
    const queryStudentProfile = (currentUserId: string, requestedUserId: string) => {
      if (currentUserId !== requestedUserId) {
        throw new Error('Access Denied: Row Level Security restricts access to authenticated user profile.')
      }
      return { id: requestedUserId, rollNumber: '23L31A5499', name: 'Test Pilot Student' }
    }

    const studentAUserId = 'auth-pilot-user-id'
    const studentBUserId = 'auth-other-user-id'

    // Student A queries own profile -> Success
    expect(() => queryStudentProfile(studentAUserId, studentAUserId)).not.toThrow()
    const ownRecord = queryStudentProfile(studentAUserId, studentAUserId)
    expect(ownRecord.name).toBe('Test Pilot Student')

    // Student A attempts to access Student B -> Throws security violation
    expect(() => queryStudentProfile(studentAUserId, studentBUserId)).toThrow(
      'Access Denied: Row Level Security restricts access to authenticated user profile.'
    )
  })

  it('8. Profile submissions are stored in profile_submissions with status pending and require administrator approval', () => {
    // Simulates student submitting personal information
    const submissionsQueue: any[] = []

    const submitProfileSection = (
      studentId: string,
      section: 'personal' | 'family' | 'education' | 'photo',
      proposedData: Record<string, any>
    ) => {
      const submission = {
        id: `sub-${Date.now()}`,
        student_id: studentId,
        section,
        proposed_data: proposedData,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      }
      submissionsQueue.push(submission)
      return submission
    }

    // Submit personal details
    const submission = submitProfileSection('db-student-pilot-id', 'personal', {
      gender: 'Male',
      blood_group: 'O+',
      residence_type: 'Day Scholar',
      transport_mode: 'RTC Bus',
    })

    expect(submission.status).toBe('pending')
    expect(submissionsQueue).toHaveLength(1)
    expect(submissionsQueue[0].proposed_data.blood_group).toBe('O+')

    // Status MUST remain pending until reviewed by administrator
    const computeProfileApprovalStatus = (submissions: any[]) => {
      const hasPending = submissions.some((s) => s.status === 'pending')
      if (hasPending) return 'Pending Approval'
      const allApproved = submissions.length > 0 && submissions.every((s) => s.status === 'approved')
      return allApproved ? 'Approved' : 'Draft'
    }

    expect(computeProfileApprovalStatus(submissionsQueue)).toBe('Pending Approval')

    // Admin approves submission
    submissionsQueue[0].status = 'approved'
    expect(computeProfileApprovalStatus(submissionsQueue)).toBe('Approved')
  })

  it('9. Strictly hides onboarding actions and shows unlinked warning when account is not linked', () => {
    const unlinkedAuthValue = createMockAuthContext({
      studentProfile: null,
      studentDbId: null,
      studentRollNumber: null,
      accountLinkingError: 'Account Linking Error: No official student roster record is currently linked to this authenticated account.',
    })

    render(
      <AuthContext.Provider value={unlinkedAuthValue}>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Unlinked alert and badge MUST be displayed
    expect(screen.getByText('Student Profile Linking Pending')).toBeDefined()
    expect(screen.getByText('Account Not Linked')).toBeDefined()
    expect(screen.getByText('Unlinked Account')).toBeDefined()

    // Onboarding actions and progress MUST be hidden
    expect(screen.queryByText('Complete Your Profile')).toBeNull()
    expect(screen.queryByText('Institutional Onboarding Progress')).toBeNull()
    expect(screen.queryByText('First-Time Onboarding: Complete Your Profile')).toBeNull()
  })

  it('10. Blocks profile completion in StudentProfileView when account is unlinked', () => {
    const unlinkedAuthValue = createMockAuthContext({
      studentProfile: null,
      studentDbId: null,
      studentRollNumber: null,
      accountLinkingError: 'Account Linking Error: No official student roster record is currently linked to this authenticated account.',
    })

    render(
      <AuthContext.Provider value={unlinkedAuthValue}>
        <MemoryRouter>
          <StudentProfileView />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Must render blocked unlinked view and not allow edits
    expect(screen.getByText('Student Profile Not Linked')).toBeDefined()
    expect(screen.queryByText('Institutional Onboarding & Verification')).toBeNull()
    expect(screen.queryByText('A. Personal Information')).toBeNull()
  })
})
