// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext, type AuthContextType } from '../src/app/providers/AuthContext'
import { StudentLayout } from '../src/app/layouts/StudentLayout'
import { StudentHome } from '../src/features/student/StudentHome'
import { StudentLogin } from '../src/features/authentication/StudentLogin'
import { StudentProfileView } from '../src/features/student/StudentProfileView'
import { StudentJourney } from '../src/features/student/StudentJourney'
import { announcementService } from '../src/services/announcementService'

function createMockAuthContext(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: {
      id: 'mock-pilot-auth-id',
      email: 'test.pilot@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any,
    session: null,
    role: 'student',
    studentProfile: {
      id: 'mock-pilot-db-id',
      fullName: 'Test Pilot Student',
      rollNumber: '23L31A0999',
      currentSemester: '2-1',
      department: 'CSE-Data Science',
      profileStatus: 'Draft',
      profileCompletionPercent: 65,
      assignedMentor: 'J. Siddhartha Varma',
      phone: '9876543210',
      fatherName: 'Mr. Pilot Father',
      motherName: 'Mrs. Pilot Mother',
      tenthMarksPercent: 92,
      interMarksPercent: 90,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
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
    ...overrides,
  }
}

describe('Mentor Connect — Student Portal Final Simplification & Navigation Fixes', () => {
  afterEach(() => {
    cleanup()
  })

  it('A. Clicking Mentor Connect logo inside StudentLayout navigates to /student and preserves session', () => {
    const auth = createMockAuthContext()
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/student']}>
          <StudentLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // The logo link inside StudentLayout must point to /student
    const logoLink = screen.getByTitle(/Return to Student Home/i)
    expect(logoLink).toBeDefined()
    expect(logoLink.getAttribute('href')).toBe('/student')

    // Header/Navigation must have clearly labelled Home navigation option
    const homeLinks = screen.getAllByRole('link', { name: /^Home$/i })
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    expect(homeLinks[0].getAttribute('href')).toBe('/student')

    // Header must have explicit separate Sign Out button
    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i })
    expect(signOutBtn).toBeDefined()
  })

  it('B. StudentLogin page is clean, contains no demo buttons, and requires invited email', () => {
    const auth = createMockAuthContext()
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <StudentLogin />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Verify no demo preview buttons
    expect(screen.queryByText(/Interactive Student Preview/i)).toBeNull()
    expect(screen.queryByText(/Explore Student Demo/i)).toBeNull()
    expect(screen.queryByText(/Aarav Sharma/i)).toBeNull()
    expect(screen.queryByText(/Or Sign In With Supabase/i)).toBeNull()

    // Verify required controls exist
    expect(screen.getByPlaceholderText(/student@institution\.edu/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeDefined()
    expect(screen.getByText(/invited college email address/i)).toBeDefined()
    expect(screen.getByText(/Switch to Faculty Login/i)).toBeDefined()
  })

  it('C. StudentHome displays actual mentor J. Siddhartha Varma and no Dr. K. S. Rao', async () => {
    const auth = createMockAuthContext()
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Real student welcome
    expect(screen.getByText(/Welcome back, Test!/i)).toBeDefined()
    expect(screen.getByText('23L31A0999')).toBeDefined()

    // Faculty Mentor is J. Siddhartha Varma
    expect(screen.getByText('J. Siddhartha Varma')).toBeDefined()
    expect(screen.queryByText(/Dr\. K\. S\. Rao/i)).toBeNull()

    // Status is Profile Incomplete (65%), not Profile Approved
    expect(screen.getByText('Profile Incomplete')).toBeDefined()
    expect(screen.queryByText('Profile Approved')).toBeNull()

    // Attendance and Academics show "Not yet available"
    const notAvailableBadges = screen.getAllByText(/Not yet available/i)
    expect(notAvailableBadges.length).toBeGreaterThanOrEqual(2)

    // No quote card, no upcoming discussion card, no commitments card
    expect(screen.queryByText(/A Thought for Today/i)).toBeNull()
    expect(screen.queryByText(/Upcoming Mentoring Discussion/i)).toBeNull()
    expect(screen.queryByText(/My Mentoring Commitments/i)).toBeNull()

    // Clean empty state when no announcements published; no dummy announcements
    await waitFor(() => {
      expect(screen.getByText(/No active announcements have been published/i)).toBeDefined()
    }, { timeout: 4000 })
    expect(screen.queryByText(/Welcome to Mentor Connect — Academic Term Onboarding/i)).toBeNull()

    // Daily Check-in card is hidden from StudentHome
    expect(screen.queryByText(/^Check-in$/i)).toBeNull()
    expect(screen.queryByText(/Daily Pulse/i)).toBeNull()
  })

  it('D. Announcement Management allows creating, publishing, and archiving announcements', async () => {
    const created = await announcementService.createAnnouncement({
      title: 'Lab Session Notice for II B.Tech CSE-DS',
      message: 'Practical evaluation for Data Science lab scheduled for Friday.',
      category: 'Department Information',
      informationSource: 'HOD Office',
      publishedByName: 'J. Siddhartha Varma',
      status: 'published',
    })

    expect(created.data).toBeDefined()
    expect(created.data?.title).toBe('Lab Session Notice for II B.Tech CSE-DS')
    expect(created.data?.informationSource).toBe('HOD Office')
    expect(created.data?.publishedByName).toBe('J. Siddhartha Varma')

    // Published announcements retrieved
    const published = await announcementService.getPublishedAnnouncements()
    const found = published.find((a) => a.id === created.data?.id)
    expect(found).toBeDefined()

    // Archive announcement
    const archived = await announcementService.archiveAnnouncement(created.data!.id)
    expect(archived.success).toBe(true)

    // Cleanup
    await announcementService.deleteAnnouncement(created.data!.id)
  })

  it('E. StudentProfileView navigation links back to Home and displays November 3 deadline', () => {
    const auth = createMockAuthContext()
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <StudentProfileView />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Obvious Back to Home navigation
    const backBtn = screen.getByRole('link', { name: /Back to Home/i })
    expect(backBtn).toBeDefined()
    expect(backBtn.getAttribute('href')).toBe('/student')
    expect(screen.queryByText(/Back to More/i)).toBeNull()

    // Displayed deadline agrees with November 3, 2026 IST
    expect(screen.getByText(/Deadline:.*3 Nov.*2026.*IST/i)).toBeDefined()
  })

  it('F. StudentJourney displays "Not yet available" and does not show "0 Backlogs" when unrecorded', () => {
    const auth = createMockAuthContext()
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <StudentJourney />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    // Verify backlogs displays "Not yet available" and never "0 Backlogs"
    expect(screen.queryByText('0 Backlogs')).toBeNull()
    const notAvailable = screen.getAllByText(/Not yet available/i)
    expect(notAvailable.length).toBeGreaterThanOrEqual(3) // Sem 1-1, Sem 1-2, Backlogs/Active Term
  })
})
