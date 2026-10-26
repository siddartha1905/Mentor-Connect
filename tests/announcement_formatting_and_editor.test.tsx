// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextType } from '../src/app/providers/AuthContext'
import { AnnouncementContent } from '../src/components/shared/AnnouncementContent'
import { AdminCommunication } from '../src/features/communication/AdminCommunication'
import { StudentHome } from '../src/features/student/StudentHome'
import { announcementService, type AnnouncementRecord } from '../src/services/announcementService'

function createMockAdminAuth(): AuthContextType {
  return {
    user: {
      id: 'admin-auth-id',
      email: 'mentor@institution.edu',
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

describe('Mentor Connect — Announcement Formatting and Editor Improvements', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. AnnouncementContent Component — Rich Formatting & Safety', () => {
    it('preserves paragraph breaks into distinct paragraphs', () => {
      const message = 'Paragraph 1: Welcome to the new term.\n\nParagraph 2: Please attend the lab briefing.'
      const { container } = render(<AnnouncementContent content={message} />)

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(2)
      expect(paragraphs[0].textContent).toContain('Paragraph 1: Welcome to the new term.')
      expect(paragraphs[1].textContent).toContain('Paragraph 2: Please attend the lab briefing.')
    })

    it('preserves single line breaks as <br /> elements within a paragraph', () => {
      const message = 'Line 1\nLine 2\nLine 3'
      const { container } = render(<AnnouncementContent content={message} />)

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(1)
      const brElements = paragraphs[0].querySelectorAll('br')
      expect(brElements.length).toBe(2)
      expect(paragraphs[0].textContent).toContain('Line 1Line 2Line 3')
    })

    it('properly parses bold, italic, and inline markdown safely without innerHTML', () => {
      const message = 'This is **important notice** with *italic emphasis* and regular text.'
      const { container } = render(<AnnouncementContent content={message} />)

      const boldEl = container.querySelector('strong')
      expect(boldEl).toBeDefined()
      expect(boldEl?.textContent).toBe('important notice')

      const italicEl = container.querySelector('em')
      expect(italicEl).toBeDefined()
      expect(italicEl?.textContent).toBe('italic emphasis')
    })

    it('groups bullet points into <ul> with <li> items', () => {
      const message = 'Required items:\n- Bring your student ID\n- Submit project synopsis\n- Review lab manual'
      const { container } = render(<AnnouncementContent content={message} />)

      const ul = container.querySelector('ul')
      expect(ul).toBeDefined()
      const items = container.querySelectorAll('ul li')
      expect(items.length).toBe(3)
      expect(items[0].textContent).toContain('Bring your student ID')
      expect(items[1].textContent).toContain('Submit project synopsis')
      expect(items[2].textContent).toContain('Review lab manual')
    })

    it('groups numbered list items into <ol> with <li> items', () => {
      const message = 'Follow these steps:\n1. Log into Mentor Connect\n2. Fill out Section B\n3. Save your changes'
      const { container } = render(<AnnouncementContent content={message} />)

      const ol = container.querySelector('ol')
      expect(ol).toBeDefined()
      const items = container.querySelectorAll('ol li')
      expect(items.length).toBe(3)
      expect(items[0].textContent).toContain('Log into Mentor Connect')
      expect(items[1].textContent).toContain('Fill out Section B')
      expect(items[2].textContent).toContain('Save your changes')
    })

    it('formats faculty signatures and contact details on separate lines', () => {
      const message = `Please complete your profile.\n\nWarm regards,\nJ. Siddhartha Varma\nFaculty Mentor, Department of CSE (Data Science)\nEmail: mentor@institution.edu`
      const { container } = render(<AnnouncementContent content={message} />)

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(2)
      // Signature paragraph is detected and styled
      const sigPara = paragraphs[1]
      expect(sigPara.textContent).toContain('Warm regards')
      expect(sigPara.textContent).toContain('J. Siddhartha Varma')
      expect(sigPara.textContent).toContain('Faculty Mentor')

      // Line breaks are preserved in signature
      const brs = sigPara.querySelectorAll('br')
      expect(brs.length).toBeGreaterThanOrEqual(2)

      // Email address converted to mailto link
      const mailLink = sigPara.querySelector('a')
      expect(mailLink).toBeDefined()
      expect(mailLink?.getAttribute('href')).toBe('mailto:mentor@institution.edu')
    })

    it('does not render unsanitized HTML tags like <script> or <img onerror>', () => {
      const malicious = '<script>alert("xss")</script><img src="x" onerror="alert(1)">'
      const { container } = render(<AnnouncementContent content={malicious} />)

      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('img')).toBeNull()
      // Raw text is rendered safely as escaped text
      expect(container.textContent).toContain('<script>')
    })
  })

  describe('2. Admin Announcement Editor — Toolbar, Write and Preview Tabs', () => {
    it('renders the Announcement Editor with formatting buttons and preview toggle', async () => {
      const auth = createMockAdminAuth()
      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminCommunication />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Click "Post New Announcement"
      const postBtn = screen.getByRole('button', { name: /Post New Announcement/i })
      fireEvent.click(postBtn)

      // Dialog opens
      expect(screen.getByRole('heading', { name: 'Post New Announcement' })).toBeDefined()
      expect(screen.getByText('Announcement Title *')).toBeDefined()

      // Formatting Toolbar buttons exist
      expect(screen.getByTitle(/Bold \(\*\*text\*\*\)/i)).toBeDefined()
      expect(screen.getByTitle(/Italic \(\*text\*\)/i)).toBeDefined()
      expect(screen.getByTitle(/Bullet List/i)).toBeDefined()
      expect(screen.getByTitle(/Numbered List/i)).toBeDefined()
      expect(screen.getByTitle(/Insert Faculty Signature/i)).toBeDefined()
      expect(screen.getByTitle(/Insert Contact Info/i)).toBeDefined()

      // Write and Live Student Preview tab buttons exist
      const previewTabBtn = screen.getByRole('button', { name: /Live Student Preview/i })
      expect(previewTabBtn).toBeDefined()

      // Fill in title and message with bold and lists
      const titleInput = screen.getByPlaceholderText(/e\.g\. Mid-Semester Lab Schedule/i)
      fireEvent.change(titleInput, { target: { value: 'Welcome to Mentor Connect – Student Mentoring Portal' } })

      const textarea = screen.getByPlaceholderText(/Write announcement details/i)
      fireEvent.change(textarea, {
        target: {
          value:
            'Welcome to the mentoring portal.\n\nKey highlights:\n- Meet your faculty mentor\n- Update your profile details\n\nWarm regards,\nJ. Siddhartha Varma\nFaculty Mentor',
        },
      })

      // Switch to Live Preview
      fireEvent.click(previewTabBtn)

      // The preview renders the announcement with title heading, bullet list, and signature
      expect(screen.getByText('Welcome to Mentor Connect – Student Mentoring Portal')).toBeDefined()
      expect(screen.getByText('Meet your faculty mentor')).toBeDefined()
      expect(screen.getByText('Update your profile details')).toBeDefined()
      expect(screen.getByText(/Published by J\. Siddhartha Varma/i)).toBeDefined()

      // Switch back to Write mode
      const writeTabBtn = screen.getByRole('button', { name: /^Write$/i })
      fireEvent.click(writeTabBtn)
      expect(screen.getByPlaceholderText(/Write announcement details/i)).toBeDefined()
    })

    it('inserts faculty signature and contact info templates on click', async () => {
      const auth = createMockAdminAuth()
      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminCommunication />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      fireEvent.click(screen.getByRole('button', { name: /Post New Announcement/i }))

      const textarea = screen.getByPlaceholderText(/Write announcement details/i) as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'Please review and confirm.' } })

      // Click + Signature
      const sigBtn = screen.getByTitle(/Insert Faculty Signature/i)
      fireEvent.click(sigBtn)

      expect(textarea.value).toContain('Warm regards,')
      expect(textarea.value).toContain('J. Siddhartha Varma')

      // Click + Contact Info
      const contactBtn = screen.getByTitle(/Insert Contact Info/i)
      fireEvent.click(contactBtn)

      expect(textarea.value).toContain('Faculty Contact:')
    })

    it('editing an existing announcement loads its exact formatting and preserves it', async () => {
      // Mock announcement in service
      const testAnnouncement: AnnouncementRecord = {
        id: 'ann-welcome-portal',
        title: 'Welcome to Mentor Connect – Student Mentoring Portal',
        message: 'Welcome mentee cohort.\n\n- Track your progress\n- Request 1-on-1 guidance\n\nWarm regards,\nJ. Siddhartha Varma',
        category: 'Mentor Update',
        informationSource: null,
        publishedByName: 'J. Siddhartha Varma',
        date: '2026-10-25',
        status: 'published',
        createdAt: '2026-10-25T10:00:00Z',
        updatedAt: '2026-10-25T10:00:00Z',
      }

      vi.spyOn(announcementService, 'getAllAnnouncements').mockResolvedValueOnce([testAnnouncement])

      const auth = createMockAdminAuth()
      render(
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <AdminCommunication />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Wait for announcement to appear in list
      await waitFor(() => {
        expect(screen.getByText('Welcome to Mentor Connect – Student Mentoring Portal')).toBeDefined()
      })

      // Click Edit button
      const editBtn = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editBtn)

      // Modal title is Edit Announcement
      expect(screen.getByText('Edit Announcement')).toBeDefined()

      // The textarea has loaded the exact message with linebreaks intact
      const textarea = screen.getByPlaceholderText(/Write announcement details/i) as HTMLTextAreaElement
      expect(textarea.value).toBe(testAnnouncement.message)

      // Title has loaded without "Title:" prefix
      const titleInput = screen.getByPlaceholderText(/e\.g\. Mid-Semester Lab Schedule/i) as HTMLInputElement
      expect(titleInput.value).toBe('Welcome to Mentor Connect – Student Mentoring Portal')
    })
  })

  describe('3. Student Portal Announcement Display — Headings, Clean Spacing & Footers', () => {
    it('displays announcement title as a proper heading with clean categories and separated footer', async () => {
      const mockRecord: AnnouncementRecord = {
        id: 'ann-dept-notice',
        title: 'Mid-Term Mentoring Review Guidelines',
        message: 'Please review your mentoring commitments.\n\n- Keep your attendance above 80%\n- Complete your profile\n\nWarm regards,\nJ. Siddhartha Varma',
        category: 'Department Information',
        informationSource: 'Dean Academics',
        publishedByName: 'J. Siddhartha Varma',
        date: '2026-10-25',
        status: 'published',
        createdAt: '2026-10-25T10:00:00Z',
        updatedAt: '2026-10-25T10:00:00Z',
      }

      vi.spyOn(announcementService, 'getPublishedAnnouncements').mockResolvedValueOnce([mockRecord])

      const studentAuth: AuthContextType = {
        ...createMockAdminAuth(),
        role: 'student',
        studentProfile: {
          id: 'mock-student',
          fullName: 'Test Pilot Student',
          rollNumber: '23L31A0999',
          currentSemester: '2-1',
          department: 'CSE-Data Science',
          profileStatus: 'Draft',
          profileCompletionPercent: 65,
          assignedMentor: 'J. Siddhartha Varma',
        } as any,
      }

      render(
        <AuthContext.Provider value={studentAuth}>
          <MemoryRouter>
            <StudentHome />
          </MemoryRouter>
        </AuthContext.Provider>
      )

      // Wait for announcement to load
      await waitFor(() => {
        expect(screen.getByText('Mid-Term Mentoring Review Guidelines')).toBeDefined()
      })

      // Heading has no "Title:" prefix
      expect(screen.queryByText(/Title:\s*Mid-Term/i)).toBeNull()

      // Category and information source are badged
      expect(screen.getByText('Department Information')).toBeDefined()
      expect(screen.getByText('Source: Dean Academics')).toBeDefined()

      // List items are rendered properly
      expect(screen.getByText('Keep your attendance above 80%')).toBeDefined()
      expect(screen.getByText('Complete your profile')).toBeDefined()

      // Publisher attribution in separate footer
      expect(screen.getByText(/Published by J\. Siddhartha Varma/i)).toBeDefined()
      expect(screen.getByText(/Relayed announcement/i)).toBeDefined()
    })
  })
})
