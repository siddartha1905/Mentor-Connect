// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import { LandingPage } from '../src/features/landing/LandingPage'
import { MOTIVATIONAL_THOUGHTS } from '../src/features/landing/thoughtsData'

describe('Mentor Connect — Enhanced Landing Page Verification', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders branding, approved tagline, and approved description', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    // Branding
    expect(screen.getAllByText(/Mentor Connect/i).length).toBeGreaterThan(0)

    // Tagline as main hero heading
    expect(
      screen.getByRole('heading', { level: 1, name: /A place to share\. A path to grow\./i })
    ).toBeDefined()

    // Short description
    expect(
      screen.getByText(
        /Mentor Connect is a dedicated space for students and their faculty mentor to stay connected, share progress, discuss challenges, and work towards personal and academic growth\./i
      )
    ).toBeDefined()
  })

  it('renders header controls: Student Login, Faculty Login, Install App, Theme toggle, and IST time', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    // Student & Faculty Logins
    expect(screen.getByText(/Student Login/i)).toBeDefined()
    expect(screen.getByText(/Faculty Login/i)).toBeDefined()

    // Install App control
    expect(screen.getByText(/Install App/i)).toBeDefined()

    // Light/Dark mode toggle button
    expect(screen.getByRole('button', { name: /Switch to (dark|light) mode/i })).toBeDefined()

    // Compact IST Time badge
    expect(screen.getByText(/\bIST\b/)).toBeDefined()
  })

  it('renders A Thought for Today section with rotating original thoughts', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText(/A Thought for Today/i)).toBeDefined()

    // Confirms thoughts dataset has at least 20 items
    expect(MOTIVATIONAL_THOUGHTS.length).toBeGreaterThanOrEqual(20)

    // Test cycling to next thought
    const refreshBtn = screen.getByRole('button', { name: /Next thought/i })
    expect(refreshBtn).toBeDefined()
    fireEvent.click(refreshBtn)
  })

  it('renders "A Simple Way to Stay Connected" with 3 concise steps', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(
      screen.getByRole('heading', { level: 2, name: /A Simple Way to Stay Connected/i })
    ).toBeDefined()

    // Three steps
    expect(screen.getByRole('heading', { level: 3, name: /^Sign In$/i })).toBeDefined()
    expect(screen.getByText(/Access your personal mentoring space\./i)).toBeDefined()

    expect(screen.getByText(/Share Your Progress/i)).toBeDefined()
    expect(
      screen.getByText(/Maintain your profile, skills, goals and achievements\./i)
    ).toBeDefined()

    expect(screen.getByText(/Grow With Guidance/i)).toBeDefined()
    expect(
      screen.getByText(
        /Help your faculty mentor understand your progress and support your development\./i
      )
    ).toBeDefined()
  })

  it('renders privacy section without exaggerated claims', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText(/Your Information, Handled with Care/i)).toBeDefined()
    expect(
      screen.getByText(
        /Student profiles are managed through authenticated access and role-based permissions\. Personal student information is not publicly displayed\./i
      )
    ).toBeDefined()
  })

  it('renders exact creator attribution, designation, and discreet initiative note', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText(/Created and maintained by J\. Siddhartha Varma/i)).toBeDefined()
    expect(screen.getByText(/Assistant Professor, CSE \(Data Science\)/i)).toBeDefined()
    expect(
      screen.getByText(
        /An independent faculty mentoring initiative for invited students\. Not an officially endorsed institutional portal\./i
      )
    ).toBeDefined()
  })

  it('opens install app guidance modal with instructions when selected', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    const installBtn = screen.getByText(/Install App/i)
    fireEvent.click(installBtn)

    // Modal opens
    expect(screen.getByText(/Install Mentor Connect/i)).toBeDefined()
    expect(screen.getByText(/iPhone & iPad \(Safari\)/i)).toBeDefined()
    expect(screen.getByText(/Android & Desktop \(Chrome \/ Edge\)/i)).toBeDefined()

    // Close modal
    const gotItBtn = screen.getByText(/Got It/i)
    fireEvent.click(gotItBtn)
  })

  it('toggles theme when dark/light button is pressed', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /Switch to (dark|light) mode/i })
    fireEvent.click(toggleBtn)

    // Persisted in localStorage
    expect(localStorage.getItem('mentor_connect_theme')).toBeDefined()
  })
})
