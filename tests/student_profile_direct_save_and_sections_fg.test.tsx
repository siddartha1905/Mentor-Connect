// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StudentProfileView } from '@/features/student/StudentProfileView'
import { Mentor360View } from '@/features/mentor360/Mentor360View'
import { studentService } from '@/services/studentService'
import { AuthContext, type AuthContextType } from '@/app/providers/AuthContext'
import type { StudentProfile } from '@/types'

// Mock student profile
const mockPilotStudent: StudentProfile = {
  fullName: 'Test Pilot Student',
  rollNumber: '23L31A0999',
  department: 'CSE-Data Science',
  branch: 'CSE-DS',
  year: 2,
  section: 'A',
  currentSemester: '2-1',
  admissionType: 'Regular',
  academicBatch: '2023-2027',
  avatarUrl: 'https://example.com/avatar.jpg',
  dob: '2005-06-15',
  phone: '9876543210',
  email: 'pilot.student@adityacollege.in',
  permanentAddress: 'D.No 4-56, Main Road, Kakinada, AP',
  presentAddress: 'College Hostel Room 204, Surampalem',
  isSameAddress: false,
  residenceType: 'College hostel',
  transportType: 'Walking',
  transportRoute: '',
  fatherName: 'Venkata Rao',
  fatherPhone: '9876543211',
  fatherOccupation: 'Agriculture',
  motherName: 'Lakshmi',
  motherPhone: '9876543212',
  motherOccupation: 'Homemaker',
  emergencyContact: '9876543211',
  academics: {
    class10: { schoolName: 'ZPH School', board: 'SSC', passYear: '2021', percentage: '92%' },
    intermediate: { collegeName: 'Aditya Junior College', board: 'BIEAP', passYear: '2023', percentage: '94%' },
    sem1_1: { sgpa: 8.5, creditsEarned: 20, backlogs: 0 },
    sem1_2: { sgpa: 8.7, creditsEarned: 20, backlogs: 0 },
    currentSem: '2-1',
    cgpa: 8.6,
    totalBacklogs: 0,
    subjects: []
  },
  careerInterests: ['Data Scientist', 'AI Engineer'],
  higherEducationAspirations: 'MS in Artificial Intelligence',
  desiredTechnicalSkills: ['Python (Advanced)', 'Machine Learning (Intermediate)'],
  technicalSkillsList: [
    { name: 'Python', proficiency: 'Advanced' },
    { name: 'Machine Learning', proficiency: 'Intermediate' }
  ],
  softSkills: ['Analytical Thinking', 'Team Collaboration'],
  personalStrengths: ['Persistence', 'Curiosity'],
  developmentGoals: ['Publish a research paper on computer vision'],
  hobbies: ['Chess', 'Reading Research Papers'],
  shortTermGoals: ['Complete Python Deep Learning Specialization'],
  longTermGoals: ['Lead an AI Research Lab'],
  workshops: ['Hands-on ML Workshop with TensorFlow'],
  certifications: ['DeepLearning.AI TensorFlow Developer'],
  internships: ['Aditya Summer Research Intern'],
  competitions: ['1st Place - College AI Hackathon 2024'],
  sportsCultural: [],
  otherAchievements: ['Smart Agriculture Crop Disease Detection System'],
  achievementsList: [
    {
      id: 'ach-1',
      studentId: 'student-uuid-999',
      category: 'certification',
      title: 'DeepLearning.AI TensorFlow Developer',
      organizer: 'Coursera / DeepLearning.AI',
      dateOrYear: '2024',
      description: 'Built CNN models for computer vision classification.'
    },
    {
      id: 'ach-2',
      studentId: 'student-uuid-999',
      category: 'competition',
      title: '1st Place - College AI Hackathon 2024',
      organizer: 'Aditya Engineering College',
      dateOrYear: 'Oct 2024',
      description: 'Created automated crop prediction app.'
    }
  ],
  profileStatus: 'Approved',
  profileCompletionPercent: 100,
  followUpPriority: 'Normal',
  assignedMentor: 'Dr. K. Srinivas',
  notesCount: 2
}

const mockAuthContext: AuthContextType = {
  user: { id: 'test-user-id', email: 'pilot.student@adityacollege.in' } as any,
  session: null,
  role: 'student',
  studentProfile: mockPilotStudent,
  studentDbId: 'student-uuid-999',
  studentRollNumber: '23L31A0999',
  loading: false,
  isConfigured: true,
  isDemoAllowed: true,
  isDemo: false,
  accountLinkingError: null,
  refreshStudentProfile: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updatePassword: vi.fn(),
  sendStudentInvite: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  loginAsDemo: vi.fn()
}

describe('Mentor Connect — Simplified Student Profile & Sections F and G', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    try { window.localStorage.clear() } catch {}
  })

  it('1. Section A (Basic Identity) is read-only and marked Institutional Record', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Verify Section A displays institutional record badge
    expect(screen.getByText(/Institutional Record/i)).toBeDefined()
    expect(screen.getByText(/Read-Only/i)).toBeDefined()
    expect(screen.getAllByText('Test Pilot Student').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('23L31A0999').length).toBeGreaterThanOrEqual(1)

    // Verify no edit button exists on Section A
    expect(screen.queryByRole('button', { name: /Edit Details/i })).toBeNull()
  })

  it('2. Section B displays "Student-Provided" badge and direct "Edit Details" action', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Switch to Tab B
    const tabB = screen.getByRole('tab', { name: /B\. Personal Info/i })
    fireEvent.click(tabB)

    // Verify Student-Provided badge and Edit button
    expect(screen.getByText(/Student-Provided/i)).toBeDefined()
    const editBtn = screen.getByRole('button', { name: /Edit Details/i })
    expect(editBtn).toBeDefined()

    // Open edit modal
    fireEvent.click(editBtn)
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeDefined()
    // Verify NOT "Submit for Approval"
    expect(screen.queryByText(/Submit for Faculty Approval/i)).toBeNull()
  })

  it('3. Direct Save updates Section B in Supabase and displays "Saved Successfully"', async () => {
    const saveSpy = vi.spyOn(studentService, 'savePersonalDetails').mockResolvedValue({
      success: true,
      data: { phone: '9999999999' }
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('tab', { name: /B\. Personal Info/i }))
    fireEvent.click(screen.getByRole('button', { name: /Edit Details/i }))

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith('student-uuid-999', expect.any(Object))
      expect(screen.getByText(/Saved Successfully/i)).toBeDefined()
    })
  })

  it('4. Section F provides repeatable fields for technical skills with proficiency, soft skills, hobbies, and goals', async () => {
    const saveSkillsSpy = vi.spyOn(studentService, 'saveSkillsGoals').mockResolvedValue({
      success: true,
      data: {}
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Switch to Tab F
    fireEvent.click(screen.getByRole('tab', { name: /F\. Skills & Goals/i }))

    expect(screen.getByText(/Section F — Skills, Hobbies & Goals/i)).toBeDefined()
    const editSkillsBtn = screen.getByRole('button', { name: /Edit Skills & Goals/i })
    expect(editSkillsBtn).toBeDefined()

    // Open Skills Modal
    fireEvent.click(editSkillsBtn)

    // Verify "Add Another" options exist
    expect(screen.getByRole('button', { name: /Add Another Skill/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Add Another Soft Skill/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Add Another Hobby/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Add Another Goal/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Add Another Long-Term Goal/i })).toBeDefined()

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveSkillsSpy).toHaveBeenCalled()
      expect(screen.getByText(/Saved Successfully/i)).toBeDefined()
    })
  })

  it('5. Section G provides repeatable fields for achievements with Add, Edit, and Remove options', async () => {
    const saveAchSpy = vi.spyOn(studentService, 'saveAchievement').mockResolvedValue({
      success: true,
      data: { id: 'ach-new', title: 'New Workshop' } as any
    })

    const deleteAchSpy = vi.spyOn(studentService, 'deleteAchievement').mockResolvedValue({
      success: true
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Switch to Tab G
    fireEvent.click(screen.getByRole('tab', { name: /G\. Achievements/i }))

    expect(screen.getByText(/Section G — Achievements & Activities/i)).toBeDefined()
    const addAchBtn = screen.getByRole('button', { name: /Add Achievement/i })
    expect(addAchBtn).toBeDefined()

    // Open Add Achievement Modal
    fireEvent.click(addAchBtn)
    expect(screen.getAllByText(/Add Achievement/i).length).toBeGreaterThanOrEqual(1)

    // Fill title
    const titleInput = screen.getByPlaceholderText(/AWS Certified Cloud Practitioner/i)
    fireEvent.change(titleInput, { target: { value: 'AWS Certified Solutions Architect' } })

    // Save Changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(saveAchSpy).toHaveBeenCalledWith('student-uuid-999', expect.objectContaining({
        title: 'AWS Certified Solutions Architect'
      }))
      expect(screen.getByText(/Saved Successfully/i)).toBeDefined()
    })
  })

  it('6. Mentor 360° console displays latest student-provided details clearly badged as "Student-Provided"', async () => {
    vi.spyOn(studentService, 'getStudentByRoll').mockResolvedValue({
      student: {
        id: 'student-uuid-999',
        roll_number: '23L31A0999',
        name: 'Test Pilot Student',
        email: 'pilot.student@adityacollege.in',
        department: 'CSE-Data Science',
        year: 2,
        semester: 1,
        section: 'A'
      },
      personal: {
        phone: '9876543210',
        current_address: 'College Hostel',
        permanent_address: 'Kakinada'
      },
      family: {
        father_name: 'Venkata Rao',
        mother_name: 'Lakshmi'
      },
      education: {
        tenth_school: 'ZPH School',
        tenth_percentage: 92
      },
      skillsGoals: {
        student_id: 'student-uuid-999',
        technical_skills: [{ name: 'Python', proficiency: 'Advanced' }],
        soft_skills: ['Problem Solving'],
        hobbies: ['Robotics'],
        short_term_goals: ['Pass AI Certification'],
        long_term_goals: ['Data Scientist']
      },
      achievements: [
        {
          id: 'ach-1',
          student_id: 'student-uuid-999',
          category: 'workshop',
          title: 'Docker & Kubernetes Workshop',
          organizer: 'Aditya College',
          date_or_year: '2024',
          description: 'Hands-on containerization.'
        }
      ],
      marks: []
    })

    render(
      <MemoryRouter initialEntries={['/mentor/mentees?roll=23L31A0999']}>
        <AuthContext.Provider value={{ ...mockAuthContext, role: 'admin' }}>
          <Mentor360View />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    // Wait for student details to load
    await waitFor(() => {
      // Identity card loads with student heading and no misleading institutional verification
      expect(screen.getByRole('heading', { level: 1, name: /Test Pilot Student/i })).toBeDefined()
      expect(screen.queryByText(/Institutionally Verified/i)).toBeNull()
    })

    // Switch to Tab 2 (Personal & Family)
    const tab2 = screen.getByText('2. Personal & Family')
    fireEvent.click(tab2)

    // Tab 2 cards have Student-Provided badges
    const badges = screen.getAllByText(/Student-Provided/i)
    expect(badges.length).toBeGreaterThanOrEqual(1)

    // Switch to Tab 6 (Skills & Aspirations)
    const tab6 = screen.getByText('6. Skills & Aspirations')
    fireEvent.click(tab6)
    expect(screen.getByText(/Goals & Career Ambitions/i)).toBeDefined()

    // Switch to Tab 7 (Achievements)
    const tab7 = screen.getByText('7. Achievements')
    fireEvent.click(tab7)
    expect(screen.getByText(/Student-Reported Achievements & Activities/i)).toBeDefined()
  })

  it('7. No pending approval ticket is created for ordinary student profile edits', async () => {
    const submitSectionUpdateSpy = vi.spyOn(studentService, 'submitSectionUpdate')
    const savePersonalSpy = vi.spyOn(studentService, 'savePersonalDetails').mockResolvedValue({
      success: true,
      data: {}
    })

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentProfileView />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('tab', { name: /B\. Personal Info/i }))
    fireEvent.click(screen.getByRole('button', { name: /Edit Details/i }))
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(savePersonalSpy).toHaveBeenCalled()
      // Verification: submitSectionUpdate was NOT called
      expect(submitSectionUpdateSpy).not.toHaveBeenCalled()
    })
  })

  it('8. Migration SQL enforces least-privilege Data API grants and anonymous lockout', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20261025110000_simplify_profile_and_add_skills_achievements.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // 1. Anon lockout
    expect(sql).toContain('REVOKE ALL ON TABLE public.student_skills_goals FROM anon, public;')
    expect(sql).toContain('REVOKE ALL ON TABLE public.student_achievements FROM anon, public;')
    expect(sql).toContain('REVOKE ALL ON TABLE public.student_personal_details FROM anon, public;')
    expect(sql).toContain('REVOKE ALL ON TABLE public.student_family_details FROM anon, public;')
    expect(sql).toContain('REVOKE ALL ON TABLE public.student_education_details FROM anon, public;')

    // 2. Least-privilege Data API grants to authenticated
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.student_skills_goals TO authenticated;')
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_achievements TO authenticated;')
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.student_personal_details TO authenticated;')
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.student_family_details TO authenticated;')
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.student_education_details TO authenticated;')

    // 3. Backend service role access
    expect(sql).toContain('GRANT ALL ON TABLE public.student_skills_goals TO service_role;')
    expect(sql).toContain('GRANT ALL ON TABLE public.student_achievements TO service_role;')
  })

  it('9. Migration SQL enforces deadline on achievements DELETE and photo updates using OLD', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20261025110000_simplify_profile_and_add_skills_achievements.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Achievement deadline trigger must intercept DELETE
    expect(sql).toContain('CREATE TRIGGER trg_deadline_achievements')
    expect(sql).toContain('BEFORE INSERT OR UPDATE OR DELETE ON public.student_achievements')

    // Photo deadline trigger must intercept avatar_url updates on students
    expect(sql).toContain('CREATE TRIGGER trg_deadline_students_photo')
    expect(sql).toContain('BEFORE UPDATE OF avatar_url ON public.students')

    // check_student_profile_deadline function handles TG_OP = 'DELETE' with OLD and returns OLD
    expect(sql).toContain("IF TG_OP = 'DELETE' THEN")
    expect(sql).toContain('RETURN OLD;')
    expect(sql).toContain("v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;")
    expect(sql).toContain("v_section := 'photo';")
    expect(sql).toContain("v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;")
  })

  it('10. Migration SQL is non-destructive and strictly preserves existing records', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20261025110000_simplify_profile_and_add_skills_achievements.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // No DROP TABLE statements
    expect(sql.toUpperCase()).not.toContain('DROP TABLE')
    // No TRUNCATE statements
    expect(sql.toUpperCase()).not.toContain('TRUNCATE')
    // No DELETE FROM statements that clear student data
    expect(sql.toUpperCase()).not.toContain('DELETE FROM PUBLIC.STUDENTS')
    expect(sql.toUpperCase()).not.toContain('DELETE FROM PUBLIC.STUDENT_PERSONAL_DETAILS')
    expect(sql.toUpperCase()).not.toContain('DELETE FROM PUBLIC.STUDENT_FAMILY_DETAILS')
    expect(sql.toUpperCase()).not.toContain('DELETE FROM PUBLIC.STUDENT_EDUCATION_DETAILS')

    // Uses CREATE TABLE IF NOT EXISTS
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.student_skills_goals')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.student_achievements')
  })
})

