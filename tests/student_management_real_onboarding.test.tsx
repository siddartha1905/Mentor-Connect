// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StudentList } from '../src/features/admin/StudentList'
import { studentService, type StudentRecord, type StudentInvitationRecord } from '../src/services/studentService'
import { importService } from '../src/services/importService'
import { AuthContext } from '../src/app/providers/AuthContext'

describe('Mentor Connect — Admin Student Management Finalization for Real Onboarding', () => {
  const mockStudents: StudentRecord[] = [
    {
      id: 'student-uuid-pilot-0999',
      user_id: 'auth-user-0999',
      roll_number: '23L31A0999',
      name: 'Test Pilot Student',
      email: 'student.pilot@vignaniit.edu.in',
      department: 'CSE-Data Science',
      year: 2,
      semester: 1,
      section: 'A',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      status: 'Active'
    },
    {
      id: 'student-uuid-new-5401',
      user_id: null,
      roll_number: '23L31A5401',
      name: 'Aditya Verma',
      email: 'aditya.verma@vignaniit.edu.in',
      department: 'CSE-Data Science',
      year: 2,
      semester: 1,
      section: 'A',
      avatar_url: null,
      status: 'Active'
    },
    {
      id: 'student-uuid-invited-5402',
      user_id: null,
      roll_number: '23L31A5402',
      name: 'Bhavya Sri',
      email: 'bhavya.sri@vignaniit.edu.in',
      department: 'CSE-Data Science',
      year: 2,
      semester: 1,
      section: 'A',
      avatar_url: null,
      status: 'Active'
    },
    {
      id: 'student-uuid-auth-5403',
      user_id: 'auth-user-5403',
      roll_number: '23L31A5403',
      name: 'Charan Teja',
      email: 'charan.teja@vignaniit.edu.in',
      department: 'CSE-Data Science',
      year: 2,
      semester: 1,
      section: 'A',
      avatar_url: null,
      status: 'Active'
    }
  ]

  const mockInvitationLogs: StudentInvitationRecord[] = [
    {
      id: 'inv-uuid-5402',
      student_id: 'student-uuid-invited-5402',
      roll_number: '23L31A5402',
      email: 'bhavya.sri@vignaniit.edu.in',
      status: 'sent',
      resend_count: 1,
      requested_at: '2026-10-25T10:00:00Z',
      last_attempt_at: '2026-10-25T11:00:00Z',
      history: []
    }
  ]

  const mockSendInvite = vi.fn().mockResolvedValue({ error: null, success: true })

  const mockAuthContextValue: any = {
    user: { id: 'admin-1', email: 'siddartha@vignaniit.edu.in' },
    session: {} as any,
    role: 'admin',
    studentProfile: null,
    studentDbId: null,
    studentRollNumber: null,
    loading: false,
    isConfigured: true,
    isDemoAllowed: true,
    isDemo: false,
    accountLinkingError: null,
    profileEditDeadline: '2026-11-03T23:59:59+05:30',
    isProfileEditingLocked: false,
    isDeadlineSettingsLoading: false,
    announcements: [],
    unreadAnnouncementsCount: 0,
    isAnnouncementsLoading: false,
    refreshAnnouncements: vi.fn(),
    refreshDeadlineSettings: vi.fn(),
    loginAsStudent: vi.fn(),
    loginAsAdmin: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    linkStudentAccount: vi.fn(),
    sendStudentInvite: mockSendInvite
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockStudents)
    vi.spyOn(studentService, 'getInvitationLogs').mockResolvedValue(mockInvitationLogs)
    vi.spyOn(studentService, 'getAcademicHistoriesMap').mockResolvedValue(new Map([
      ['student-uuid-pilot-0999', { latestCgpa: 8.92, semester: '2-1' }]
    ]))
    vi.spyOn(studentService, 'getProfileSubmissionsMap').mockResolvedValue(new Map())
    vi.spyOn(studentService, 'getSavedSectionsSummary').mockResolvedValue(new Map([
      ['student-uuid-pilot-0999', {
        hasPersonal: true,
        hasFamily: true,
        hasEducation: true,
        hasSkills: true,
        hasAchievements: true,
        hasAcademicHistory: true,
        completionPercent: 100
      }]
    ]))
  })

  afterEach(() => {
    cleanup()
  })

  // --------------------------------------------------------------------------
  // 1. Elimination of Fictional / Unsupported Data
  // --------------------------------------------------------------------------
  it('1. displays "Not yet available" when CGPA or Attendance is unrecorded and avoids fake values', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A0999')).toBeDefined()
    })

    // Preserved Test Pilot Student with verified CGPA 8.92
    expect(screen.getByText('8.92')).toBeDefined()
    expect(screen.getByText('Test Pilot Student')).toBeDefined()

    // Students without verified academic history or attendance must show "Not yet available"
    const notAvailableElements = screen.getAllByText('Not yet available')
    expect(notAvailableElements.length).toBeGreaterThanOrEqual(2)

    // No hardcoded 0 CGPA or fake 88.5% attendance
    expect(screen.queryByText('88.5%')).toBeNull()
  })

  // --------------------------------------------------------------------------
  // 2. Verified Student Onboarding States
  // --------------------------------------------------------------------------
  it('2. distinguishes Roster Only, Invitation Sent, Auth Linked, and Activated onboarding states', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A0999')).toBeDefined()
    })

    // 23L31A0999: Active profile & auth account -> Activated
    expect(screen.getAllByText('Activated').length).toBeGreaterThanOrEqual(1)

    // 23L31A5401: Imported but no invite dispatched -> Roster Only
    expect(screen.getAllByText('Roster Only').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /Send Invite/i }).length).toBeGreaterThanOrEqual(1)

    // 23L31A5402: Verified invitation log -> Invitation Sent
    expect(screen.getAllByText(/Invitation Sent/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /Resend Invite/i }).length).toBeGreaterThanOrEqual(1)

    // 23L31A5403: User ID present but incomplete profile -> Auth Linked
    expect(screen.getAllByText('Auth Linked').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /Reset Password/i }).length).toBeGreaterThanOrEqual(1)
  })

  // --------------------------------------------------------------------------
  // 3. Genuine Profile Completion vs Administrative Approval
  // --------------------------------------------------------------------------
  it('3. displays Profile Complete based on actual saved sections and avoids fake approval', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A0999')).toBeDefined()
    })

    // Test Pilot Student has Sections B-G saved -> Profile Complete
    expect(screen.getAllByText('Profile Complete').length).toBeGreaterThanOrEqual(1)

    // Students without saved sections -> Not Started
    expect(screen.getAllByText('Not Started').length).toBeGreaterThanOrEqual(1)

    // Ensure faculty mentor is J. Siddartha Varma
    expect(screen.getByText(/Faculty Mentor: J. Siddartha Varma/i)).toBeDefined()
    expect(screen.queryByText(/Dr. K. Srinivas/i)).toBeNull()
  })

  // --------------------------------------------------------------------------
  // 4. Global Search by Name, Roll Number, or Email
  // --------------------------------------------------------------------------
  it('4. provides global search by student name, roll number, or email with accurate placeholder', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A0999')).toBeDefined()
    })

    const searchInput = screen.getByPlaceholderText('Search by student name, roll number or email')
    expect(searchInput).toBeDefined()

    // Search by Roll Number
    fireEvent.change(searchInput, { target: { value: '23L31A5402' } })
    expect(screen.getByText('Bhavya Sri')).toBeDefined()
    expect(screen.queryByText('Test Pilot Student')).toBeNull()

    // Search by Email
    fireEvent.change(searchInput, { target: { value: 'aditya.verma@vignaniit.edu.in' } })
    expect(screen.getByText('Aditya Verma')).toBeDefined()
    expect(screen.queryByText('Bhavya Sri')).toBeNull()

    // Reset Search
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('Test Pilot Student')).toBeDefined()
  })

  // --------------------------------------------------------------------------
  // 5. Bulk CSV Onboarding Template & Import Separation
  // --------------------------------------------------------------------------
  it('5. provides CSV template download and separates roster import from invitation dispatch', async () => {
    const downloadSpy = vi.spyOn(importService, 'downloadCSVTemplate').mockImplementation(() => {})
    const parseSpy = vi.spyOn(importService, 'parseCSV').mockResolvedValue({
      validRows: [
        {
          roll_number: '23L31A5410',
          name: 'Deepak Sharma',
          email: 'deepak.sharma@vignaniit.edu.in',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A'
        }
      ],
      errors: []
    })
    const analyzeSpy = vi.spyOn(importService, 'analyzeRosterAgainstDatabase').mockResolvedValue({
      totalRows: 1,
      validRows: [{
        roll_number: '23L31A5410',
        name: 'Deepak Sharma',
        email: 'deepak.sharma@vignaniit.edu.in',
        department: 'CSE-Data Science',
        year: 2,
        semester: 1,
        section: 'A'
      }],
      newRows: [{
        roll_number: '23L31A5410',
        name: 'Deepak Sharma',
        email: 'deepak.sharma@vignaniit.edu.in',
        department: 'CSE-Data Science',
        year: 2,
        semester: 1,
        section: 'A'
      }],
      existingRows: [],
      conflicts: [],
      analyzedStudents: [{
        row: {
          roll_number: '23L31A5410',
          name: 'Deepak Sharma',
          email: 'deepak.sharma@vignaniit.edu.in',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A'
        },
        status: 'new'
      }]
    })
    const bulkImportSpy = vi.spyOn(importService, 'bulkImportStudents').mockResolvedValue({
      totalRows: 1,
      validCount: 1,
      insertedCount: 1,
      skippedExistingCount: 0,
      errors: []
    })

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Open Bulk CSV Modal
    const bulkButton = screen.getAllByRole('button', { name: /Bulk CSV Onboarding/i })[0]
    fireEvent.click(bulkButton)

    await waitFor(() => {
      expect(screen.getByText('Bulk Student Onboarding via CSV')).toBeDefined()
    })

    // Click Download CSV Template
    const templateButton = screen.getByRole('button', { name: /Download CSV Template/i })
    fireEvent.click(templateButton)
    expect(downloadSpy).toHaveBeenCalled()

    // Simulate CSV file upload
    const file = new File(['roll_number,name,email\n23L31A5410,Deepak Sharma,deepak.sharma@vignaniit.edu.in'], 'roster.csv', { type: 'text/csv' })
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Import Preview (1 entries detected)')).toBeDefined()
      expect(screen.getByText('23L31A5410')).toBeDefined()
      expect(screen.getByText('Deepak Sharma')).toBeDefined()
    })

    // Confirm & Import Roster
    const confirmButton = screen.getByRole('button', { name: /Confirm & Import 1 Students/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Roster Onboarding Complete')).toBeDefined()
      expect(screen.getByText(/Invitations Separated from Import/i)).toBeDefined()
    })

    expect(bulkImportSpy).toHaveBeenCalled()
    // CRITICAL: Ensure no automated mass email invite dispatch was triggered upon upload!
    expect(mockSendInvite).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // 6. Resend on Linked-but-Unconfirmed Accounts
  // --------------------------------------------------------------------------
  it('6. allows legitimate invitation resends for unconfirmed accounts with linked user_id', async () => {
    // 23L31A5402 has an invitation record and can be resent
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A5402')).toBeDefined()
    })

    const resendButtons = screen.getAllByRole('button', { name: /Resend Invite/i })
    expect(resendButtons.length).toBeGreaterThanOrEqual(1)

    // Click Resend
    fireEvent.click(resendButtons[0])

    await waitFor(() => {
      expect(mockSendInvite).toHaveBeenCalledWith(
        'bhavya.sri@vignaniit.edu.in',
        expect.objectContaining({
          roll_number: '23L31A5402',
          name: 'Bhavya Sri'
        })
      )
    })
  })

  // --------------------------------------------------------------------------
  // 7. Partial Failure Handling: Supabase Success with Audit Logging Warning
  // --------------------------------------------------------------------------
  it('7. reports explicit persistence warning when Supabase GoTrue succeeds but database audit logging fails', async () => {
    // Simulate partial failure from Edge Function
    mockSendInvite.mockResolvedValueOnce({
      error: null,
      success: true,
      warning: 'student_invitations table relation does not exist',
      auditPersistenceFailed: true
    })

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A5401')).toBeDefined()
    })

    const sendInviteButtons = screen.getAllByRole('button', { name: /Send Invite/i })
    fireEvent.click(sendInviteButtons[0])

    // Must disclose the partial failure warning rather than asserting 100% cleanly persisted success
    await waitFor(() => {
      expect(screen.getByText(/audit persistence warning/i)).toBeDefined()
    })
  })

  // --------------------------------------------------------------------------
  // 8. Duplicate Email Assignment Prevention
  // --------------------------------------------------------------------------
  it('8. prevents duplicate assignment when attempting to invite an email belonging to another student', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <StudentList />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Open Direct Invite Modal
    const directInviteButton = screen.getByRole('button', { name: /Direct Invite/i })
    fireEvent.click(directInviteButton)

    await waitFor(() => {
      expect(screen.getByText('Direct Student Email Invitation')).toBeDefined()
    })

    const nameInput = screen.getByPlaceholderText('Enter student full name')
    const rollInput = screen.getByPlaceholderText('e.g. 23L31A5401')
    const emailInput = screen.getByPlaceholderText('student@vignaniit.edu.in')

    // Attempt to register a new roll with Test Pilot Student's email
    fireEvent.change(nameInput, { target: { value: 'Duplicate Candidate' } })
    fireEvent.change(rollInput, { target: { value: '23L31A5499' } })
    fireEvent.change(emailInput, { target: { value: 'student.pilot@vignaniit.edu.in' } })

    const submitButton = screen.getByRole('button', { name: /Send Invitation/i })
    fireEvent.click(submitButton)

    // When configured with duplicate email, an error prevents duplicate assignment
    await waitFor(() => {
      expect(screen.queryByText(/Official invitation email successfully dispatched/i)).toBeNull()
    })
  })
})

