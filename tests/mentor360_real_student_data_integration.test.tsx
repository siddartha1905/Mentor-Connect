// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Mentor360View } from '@/features/mentor360/Mentor360View'
import { studentService, buildCleanStudentProfile } from '@/services/studentService'
import { AuthContext, type AuthContextType } from '@/app/providers/AuthContext'
import { MOCK_STUDENTS } from '@/data/mock'

// Real test pilot student database records
const mockRealStudentsList = [
  {
    id: 'db-student-uuid-pilot-0999',
    roll_number: '23L31A0999',
    name: 'Test Pilot Student',
    email: 'pilot.student@adityacollege.in',
    department: 'CSE-Data Science',
    branch: 'CSE-DS',
    year: 2,
    section: 'A',
    admission_type: 'Regular',
    academic_batch: '2023-2027',
    avatar_url: 'https://example.com/pilot-avatar.jpg',
    status: 'Active' as const,
    created_at: '2026-10-24T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z'
  },
  {
    id: 'db-student-uuid-second-0001',
    roll_number: '23L31A0001',
    name: 'Real Second Student',
    email: 'second.student@adityacollege.in',
    department: 'CSE',
    branch: 'CSE',
    year: 2,
    section: 'B',
    admission_type: 'Regular',
    academic_batch: '2023-2027',
    avatar_url: 'https://example.com/second-avatar.jpg',
    status: 'Active' as const,
    created_at: '2026-10-24T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z'
  }
]

const mockPilotDetails = {
  student: mockRealStudentsList[0],
  personal: {
    student_id: 'db-student-uuid-pilot-0999',
    dob: '2005-06-15',
    blood_group: 'O+',
    religion: 'Indian',
    nationality: 'Indian',
    caste_category: 'OC',
    aadhar_masked: 'XXXX-XXXX-1234',
    phone: '9876543210',
    emergency_contact: '9876543211',
    permanent_address: 'D.No 4-56, Main Road, Kakinada, AP',
    present_address: 'College Hostel Room 204, Surampalem',
    residence_type: 'College hostel',
    transport_type: 'Walking'
  },
  family: {
    student_id: 'db-student-uuid-pilot-0999',
    father_name: 'Venkata Rao',
    father_phone: '9876543211',
    father_occupation: 'Agriculture',
    mother_name: 'Lakshmi',
    mother_phone: '9876543212',
    mother_occupation: 'Homemaker'
  },
  education: {
    student_id: 'db-student-uuid-pilot-0999',
    tenth_school_name: 'ZPH School',
    tenth_board: 'SSC',
    tenth_passed_year: 2021,
    tenth_percentage: 92.5,
    inter_college_name: 'Aditya Junior College',
    inter_board: 'BIEAP',
    inter_passed_year: 2023,
    inter_percentage: 94.2
  },
  skillsGoals: {
    student_id: 'db-student-uuid-pilot-0999',
    career_interests: ['Data Scientist', 'AI Engineer'],
    higher_education_aspirations: 'MS in Artificial Intelligence',
    technical_skills: [
      { name: 'Python', proficiency: 'Advanced' },
      { name: 'Machine Learning', proficiency: 'Intermediate' }
    ],
    soft_skills: ['Analytical Thinking', 'Team Collaboration'],
    personal_strengths: ['Persistence', 'Curiosity'],
    development_goals: ['Publish a research paper on computer vision'],
    hobbies: ['Chess', 'Reading Research Papers']
  },
  achievements: [
    {
      id: 'ach-1',
      student_id: 'db-student-uuid-pilot-0999',
      achievement_type: 'certification',
      title: 'AWS Certified Machine Learning Specialist',
      issued_by: 'Amazon Web Services',
      issue_date: '2026-03-10',
      description: 'Passed specialty ML exam'
    }
  ],
  academicRecords: []
}

// Sparse student with empty fields
const mockSecondDetails = {
  student: mockRealStudentsList[1],
  personal: null,
  family: null,
  education: null,
  skillsGoals: null,
  achievements: [],
  academicRecords: []
}

const mockAdminAuthContext: AuthContextType = {
  user: {
    id: 'admin-user-uuid',
    email: 'admin@adityacollege.in',
    name: 'Administrator',
    role: 'admin'
  },
  role: 'admin',
  isAuthenticated: true,
  isLoading: false,
  isConfigured: true,
  isDemo: false, // Authenticated live mode!
  login: vi.fn(),
  loginAsDemo: vi.fn(),
  logout: vi.fn(),
  refreshRole: vi.fn()
}

const mockDemoAuthContext: AuthContextType = {
  user: {
    id: 'demo-user-uuid',
    email: 'demo@adityacollege.in',
    name: 'Demo Admin',
    role: 'admin'
  },
  role: 'admin',
  isAuthenticated: true,
  isLoading: false,
  isConfigured: true,
  isDemo: true, // Demo environment!
  login: vi.fn(),
  loginAsDemo: vi.fn(),
  logout: vi.fn(),
  refreshRole: vi.fn()
}

describe('Mentor 360° Real Student Data Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('1. buildCleanStudentProfile creates a clean StudentProfile with empty strings and no mock data spreading', () => {
    const cleanProfile = buildCleanStudentProfile(mockSecondDetails as any)

    expect(cleanProfile.fullName).toBe('Real Second Student')
    expect(cleanProfile.rollNumber).toBe('23L31A0001')
    expect(cleanProfile.email).toBe('second.student@adityacollege.in')
    expect(cleanProfile.avatarUrl).toBe('https://example.com/second-avatar.jpg')

    // Personal details must NOT be Aarav Sharma's details
    expect(cleanProfile.fatherName).toBe('')
    expect(cleanProfile.fatherPhone).toBe('')
    expect(cleanProfile.motherName).toBe('')
    expect(cleanProfile.permanentAddress).toBe('')
    expect(cleanProfile.presentAddress).toBe('')
    expect(cleanProfile.emergencyContact).toBe('')
    expect(cleanProfile.careerInterests).toEqual([])
    expect(cleanProfile.technicalSkillsList).toEqual([])
    expect(cleanProfile.achievementsList).toEqual([])
  })

  it('2. In authenticated admin mode, retrieves real student list from Supabase and does not include mock students', async () => {
    const getAllStudentsSpy = vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    const getStudentDetailsByIdSpy = vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockPilotDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0999']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getAllStudentsSpy).toHaveBeenCalled()
    })

    // Dropdown / options must display the real students
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select).toBeDefined()
      expect(select.options.length).toBe(2)
      expect(select.options[0].textContent).toContain('23L31A0999')
      expect(select.options[0].textContent).toContain('Test Pilot Student')
      expect(select.options[1].textContent).toContain('23L31A0001')
      expect(select.options[1].textContent).toContain('Real Second Student')
    })

    // Verify mock student Aarav Sharma is NOT in the select options
    const select = screen.getByRole('combobox') as HTMLSelectElement
    const optionTexts = Array.from(select.options).map(o => o.textContent)
    expect(optionTexts.some(t => t?.includes('23L31A5401'))).toBe(false)
    expect(optionTexts.some(t => t?.includes('Aarav Sharma'))).toBe(false)
  })

  it('3. In demo mode, uses demo students and does not query Supabase', async () => {
    const getAllStudentsSpy = vi.spyOn(studentService, 'getAllStudents')

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360']}>
        <AuthContext.Provider value={mockDemoAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select).toBeDefined()
      // In demo mode, MOCK_STUDENTS are used
      expect(select.options.length).toBe(MOCK_STUDENTS.length)
      expect(select.options[0].textContent).toContain('23L31A5401')
      expect(select.options[0].textContent).toContain('Aarav Sharma')
    })

    // getAllStudents should NOT be called in demo mode
    expect(getAllStudentsSpy).not.toHaveBeenCalled()
  })

  it('4. Real student list is searchable by Name, Roll Number, and Email', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockPilotDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search name, roll/i)).toBeDefined()
    })

    const searchInput = screen.getByPlaceholderText(/Search name, roll/i)
    const select = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by name
    fireEvent.change(searchInput, { target: { value: 'Pilot' } })
    expect(select.options.length).toBe(1)
    expect(select.options[0].textContent).toContain('Test Pilot Student')

    // Filter by roll number
    fireEvent.change(searchInput, { target: { value: '23L31A0001' } })
    expect(select.options.length).toBe(1)
    expect(select.options[0].textContent).toContain('Real Second Student')

    // Filter by email
    fireEvent.change(searchInput, { target: { value: 'second.student' } })
    expect(select.options.length).toBe(1)
    expect(select.options[0].textContent).toContain('Real Second Student')

    // Filter with no matches
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    expect(select.options.length).toBe(1)
    expect(select.options[0].textContent).toContain('No matching students')
  })

  it('5. Test Pilot Student opens directly with correct name, roll, photo and all saved sections', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    const getStudentDetailsByIdSpy = vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockPilotDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0999']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getStudentDetailsByIdSpy).toHaveBeenCalledWith('db-student-uuid-pilot-0999')
    })

    // Profile Header Check
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeDefined()
      expect(screen.getAllByText(/23L31A0999/i).length).toBeGreaterThanOrEqual(1)
    })

    // Check photograph
    const avatarImg = screen.getByAltText(/Test Pilot Student/i) as HTMLImageElement
    expect(avatarImg.src).toBe('https://example.com/pilot-avatar.jpg')

    // Section 2 & 3: Personal & Family Tab
    fireEvent.click(screen.getByText('2. Personal & Family'))
    expect(screen.getByText('D.No 4-56, Main Road, Kakinada, AP')).toBeDefined()
    expect(screen.getByText(/College hostel/i)).toBeDefined()
    expect(screen.getByText('9876543210')).toBeDefined()
    expect(screen.getByText('9876543211')).toBeDefined() // emergency
    expect(screen.getByText(/Venkata Rao/i)).toBeDefined()
    expect(screen.getByText(/Lakshmi/i)).toBeDefined()
    expect(screen.getByText(/Agriculture/i)).toBeDefined()

    // Section 4: Academics Tab
    fireEvent.click(screen.getByText('3. Academics'))
    expect(screen.getByText('ZPH School')).toBeDefined()
    expect(screen.getByText('Aditya Junior College')).toBeDefined()

    // Section 6: Skills Tab
    fireEvent.click(screen.getByText('6. Skills & Aspirations'))
    expect(screen.getByText('Python')).toBeDefined()
    expect(screen.getByText('Data Scientist')).toBeDefined()
    expect(screen.getByText('MS in Artificial Intelligence')).toBeDefined()

    // Section 7: Achievements Tab
    fireEvent.click(screen.getByText('7. Achievements'))
    expect(screen.getByText('AWS Certified Machine Learning Specialist')).toBeDefined()
  })

  it('6. Empty or missing fields display "Not yet provided", never fabricated or mock information', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockSecondDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0001']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Real Second Student/i })).toBeDefined()
    })

    // Check Personal & Family Tab for "Not yet provided"
    fireEvent.click(screen.getByText('2. Personal & Family'))
    const notProvidedElements = screen.getAllByText('Not yet provided')
    // Missing: DOB, Residence, Present Address, Permanent Address, Father Name, Father Phone, Mother Name, etc.
    expect(notProvidedElements.length).toBeGreaterThanOrEqual(4)

    // Ensure Aarav Sharma's father's name "Rajesh Sharma" is NOT anywhere in the document
    expect(screen.queryByText(/Rajesh Sharma/i)).toBeNull()
    expect(screen.queryByText(/Sunita Sharma/i)).toBeNull()

    // Check Skills Tab
    fireEvent.click(screen.getByText('6. Skills & Aspirations'))
    const skillsNotProvided = screen.getAllByText('Not yet provided')
    expect(skillsNotProvided.length).toBeGreaterThanOrEqual(1)

    // Check Achievements Tab
    fireEvent.click(screen.getByText('7. Achievements'))
    expect(screen.getByText(/No student-reported achievements/i)).toBeDefined()
  })

  it('7. Switching between students updates all profile sections and clears/swaps the photograph cleanly', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    const getStudentDetailsByIdSpy = vi.spyOn(studentService, 'getStudentDetailsById')
      .mockImplementation(async (id: string) => {
        if (id === 'db-student-uuid-pilot-0999') {
          return mockPilotDetails as any
        }
        return mockSecondDetails as any
      })

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0999']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Verify first student is loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeDefined()
      const avatar = screen.getByAltText(/Test Pilot Student/i) as HTMLImageElement
      expect(avatar.src).toBe('https://example.com/pilot-avatar.jpg')
    })

    // Switch to second student via select dropdown
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '23L31A0001' } })

    // Verify second student details are loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Real Second Student/i })).toBeDefined()
      const avatar = screen.getByAltText(/Real Second Student/i) as HTMLImageElement
      expect(avatar.src).toBe('https://example.com/second-avatar.jpg')
    })

    // Confirm that Pilot Student's heading and unique info are NOT displayed
    expect(screen.queryByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeNull()
    expect(screen.queryByText('D.No 4-56, Main Road, Kakinada, AP')).toBeNull()
  })

  it('8. Displays "Not yet available" for unrecorded attendance, backlogs, and CGPA without misleading 0% or All Clear', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockSecondDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0001']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Real Second Student/i })).toBeDefined()
    })

    // In Overview: Attendance, CGPA, and Backlogs cards show "Not yet available"
    const notYetAvailableList = screen.getAllByText('Not yet available')
    expect(notYetAvailableList.length).toBeGreaterThanOrEqual(3)

    // Ensure unsupported Clear Standing or All Clear are NOT rendered without verified records
    expect(screen.queryByText('Clear Standing')).toBeNull()
    expect(screen.queryByText('All Clear')).toBeNull()
    expect(screen.getByText('Biometric register pending upload')).toBeDefined()

    // Tab 4 (Attendance) also displays truthful unrecorded state
    fireEvent.click(screen.getByText('4. Attendance'))
    expect(screen.getAllByText('Not yet available').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/Official biometric register has not been uploaded yet/i)).toBeDefined()
  })

  it('9. Correct mentor assignment to J. Siddartha Varma, Assistant Professor, CSE (Data Science) and no fictional faculty names or Institutionally Verified badges', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    vi.spyOn(studentService, 'getStudentDetailsById').mockResolvedValue(mockPilotDetails as any)

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0999']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeDefined()
    })

    // Check mentor identity
    expect(screen.getByText(/Faculty Mentor: J. Siddartha Varma, Assistant Professor, CSE \(Data Science\)/i)).toBeDefined()

    // No fictional names
    expect(screen.queryByText(/Dr. K. Srinivas/i)).toBeNull()
    expect(screen.queryByText(/Dr. K. S. Rao/i)).toBeNull()

    // No misleading "Institutionally Verified" badge
    expect(screen.queryByText(/Institutionally Verified/i)).toBeNull()

    // Check Tab 5 (Mentoring History) mentor identity
    fireEvent.click(screen.getByText('5. Mentoring History'))
    expect(screen.queryByText(/Dr. K. S. Rao/i)).toBeNull()
  })

  it('10. Student profile completion correctly reflects saved Sections A–G and avoids confusing profile completion with faculty approval', async () => {
    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockRealStudentsList as any)
    vi.spyOn(studentService, 'getStudentDetailsById').mockImplementation(async (id: string) => {
      if (id === 'db-student-uuid-pilot-0999') return mockPilotDetails as any
      return mockSecondDetails as any
    })

    render(
      <MemoryRouter initialEntries={['/admin/mentor-360?roll=23L31A0999']}>
        <AuthContext.Provider value={mockAdminAuthContext}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeDefined()
    })

    // Pilot Student has 100% profile completion
    expect(screen.getByText('Profile Completion:')).toBeDefined()
    expect(screen.getAllByText('Profile Complete').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/7 sections saved \(A–G\)/i)).toBeDefined()

    // Switch to sparse student 23L31A0001
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '23L31A0001' } })

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Real Second Student/i })).toBeDefined()
    })

    // Sparse student without student-saved sections -> Not Started and 0%
    expect(screen.getAllByText('Not Started').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('0%')).toBeDefined()
    expect(screen.getByText(/0 of 7 sections saved \(A–G\)/i)).toBeDefined()

    // Does NOT say "Profile Status: Approved"
    expect(screen.queryByText('Profile Status: Approved')).toBeNull()
  })
})
