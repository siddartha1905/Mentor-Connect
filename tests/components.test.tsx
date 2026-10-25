// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import { LandingPage } from '../src/features/landing/LandingPage'
import { StudentHome } from '../src/features/student/StudentHome'
import { Mentor360View } from '../src/features/mentor360/Mentor360View'
import { ApprovalCentre } from '../src/features/approvals/ApprovalCentre'
import { StudentDirectory } from '../src/features/student/StudentDirectory'

describe('Mentor Connect — Local Component Integration & Rendering Verification', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders LandingPage with branding, sign-in CTA buttons, and features', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    // Verify brand logo text
    expect(screen.getAllByText(/Mentor Connect/i).length).toBeGreaterThan(0)

    // Verify navigation buttons
    expect(screen.getByText(/Student Sign In/i)).toBeDefined()
    expect(screen.getByText(/Admin Sign In/i)).toBeDefined()

    // Verify cohort context
    expect(screen.getAllByText(/CSE-Data Science/i).length).toBeGreaterThan(0)
  })

  it('renders StudentHome dashboard with welcome message and attendance', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <StudentHome />
        </MemoryRouter>
      </AuthProvider>
    )

    // Student dashboard elements
    expect(screen.getAllByText(/Welcome back/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Semester 2-1 Active/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Attendance/i).length).toBeGreaterThan(0)
  })

  it('renders Mentor 360° console with student selector and all 9 tabs', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Mentor360View />
        </MemoryRouter>
      </AuthProvider>
    )

    // Verify 9 core tabs in Mentor 360°
    expect(screen.getAllByText(/1\. Overview/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2\. Personal & Family/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/3\. Academics/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/4\. Attendance/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5\. Mentoring History/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/6\. Skills & Aspirations/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/7\. Achievements/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/8\. Communications/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/9\. Follow-ups & Timeline/i).length).toBeGreaterThan(0)
  })

  it('renders ApprovalCentre with pending modification submissions', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <ApprovalCentre />
        </MemoryRouter>
      </AuthProvider>
    )

    // Verify approval queue
    expect(screen.getAllByText(/Approval Centre/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Pending/i).length).toBeGreaterThan(0)
  })

  it('renders StudentDirectory with search filter and privacy badge', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <StudentDirectory />
        </MemoryRouter>
      </AuthProvider>
    )

    // Verify directory components
    expect(screen.getByPlaceholderText(/Search by student name or roll number/i)).toBeDefined()
    expect(screen.getAllByText(/CSE-DS Mentee Directory/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Privacy Safeguard Notice/i).length).toBeGreaterThan(0)
  })
})
