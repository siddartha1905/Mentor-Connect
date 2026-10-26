import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { studentService } from '@/services/studentService'
import { MOCK_STUDENTS } from '@/data/mock/students'
import type { StudentProfile, ProfileStatus, PriorityLevel } from '@/types'

export type UserRole = 'admin' | 'student' | 'guest'

export interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  studentProfile: StudentProfile | null
  studentDbId: string | null
  studentRollNumber: string | null
  loading: boolean
  isConfigured: boolean
  isDemoAllowed: boolean
  isDemo: boolean
  accountLinkingError: string | null
  refreshStudentProfile: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  sendStudentInvite: (
    email: string,
    metadata?: { name?: string; roll_number?: string }
  ) => Promise<{
    error: Error | null
    success?: boolean
    warning?: string | null
    auditPersistenceFailed?: boolean
  }>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  loginAsDemo: (role: 'admin' | 'student', rollNumber?: string) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Builds a real StudentProfile strictly from Supabase database tables.
 * Never injects fictional names, roll numbers, fake CGPA or fake attendance.
 */
function buildStudentProfileFromDb(
  studentData: any,
  personal: any,
  family: any,
  education: any,
  submissions: any[] = [],
  academicRecords: any[] = [],
  skillsGoals?: any,
  achievements: any[] = []
): StudentProfile {
  // 1. Determine profile status:
  // Self-reported profile details do not require faculty approval.
  // Profile is 'Approved' (Complete & Active) once core personal/family/education details exist.
  let status: ProfileStatus = 'Draft'
  if (personal?.dob && family?.father_name && education?.tenth_school) {
    status = 'Approved'
  } else if (personal || family || education || skillsGoals || achievements.length > 0) {
    status = 'Draft'
  }

  // 2. Compute profile completion percentage
  // Section A: Institutional Roster Identity (20%)
  let completion = 20
  if (personal?.dob && personal?.phone && personal?.permanent_address) {
    completion += 15
  } else if (personal?.phone || personal?.permanent_address) {
    completion += 8
  }

  if (personal?.residence_type || personal?.transport_mode) {
    completion += 10
  }

  if (family?.father_name && family?.mother_name) {
    completion += 15
  } else if (family?.father_name || family?.mother_name) {
    completion += 8
  }

  if (education?.tenth_percentage && education?.twelfth_percentage) {
    completion += 15
  } else if (education?.tenth_percentage || education?.twelfth_percentage) {
    completion += 8
  }

  if (studentData.avatar_url) {
    completion += 10
  }

  // Section F: Skills & Goals (10%)
  if (skillsGoals?.technical_skills?.length > 0 || skillsGoals?.soft_skills?.length > 0) {
    completion += 10
  }

  // Section G: Achievements (5%)
  if (achievements && achievements.length > 0) {
    completion += 5
  }

  // 3. Academics
  const sem1_1 = academicRecords.find(a => a.semester === '1-1')
  const sem1_2 = academicRecords.find(a => a.semester === '1-2')
  const latestCgpa = academicRecords.length > 0 ? Number(academicRecords[academicRecords.length - 1].cgpa) : 0
  const totalBacklogs = academicRecords.reduce((acc, curr) => acc + (Number(curr.backlogs_count) || 0), 0)

  return {
    fullName: studentData.name || '',
    rollNumber: studentData.roll_number || '',
    department: studentData.department || 'CSE-Data Science',
    branch: studentData.department === 'CSE-Data Science' ? 'CSE-DS' : studentData.department || 'CSE-DS',
    year: Number(studentData.year) || 2,
    section: studentData.section || 'A',
    currentSemester: `${studentData.year || 2}-${studentData.semester || 1}`,
    admissionType: education?.entry_type === 'Lateral' ? 'Lateral' : 'Regular',
    academicBatch: '2023-2027',

    avatarUrl: studentData.avatar_url || '',
    dob: personal?.dob || '',
    phone: personal?.phone || '',
    email: studentData.email || '',
    permanentAddress: personal?.permanent_address || '',
    presentAddress: personal?.current_address || '',
    isSameAddress:
      personal?.permanent_address && personal?.current_address
        ? personal.permanent_address === personal.current_address
        : true,

    residenceType: personal?.residence_type || 'Living at home / day scholar',
    transportType: personal?.transport_mode || 'College bus',
    transportRoute: personal?.bus_route_details || '',

    fatherName: family?.father_name || '',
    fatherPhone: family?.father_phone || '',
    fatherOccupation: family?.father_occupation || '',
    motherName: family?.mother_name || '',
    motherPhone: family?.mother_phone || '',
    motherOccupation: family?.mother_occupation || '',
    guardianName: family?.guardian_name || '',
    emergencyContact:
      personal?.emergency_contact ||
      family?.father_phone ||
      family?.mother_phone ||
      '',

    academics: {
      class10: {
        schoolName: education?.tenth_school || '',
        board: education?.tenth_board || '',
        passYear: '',
        percentage: education?.tenth_percentage != null ? `${education.tenth_percentage}%` : '',
      },
      intermediate: {
        collegeName: education?.twelfth_college || '',
        board: education?.twelfth_board || '',
        passYear: '',
        percentage: education?.twelfth_percentage != null ? `${education.twelfth_percentage}%` : '',
      },
      sem1_1: {
        sgpa: sem1_1 ? Number(sem1_1.sgpa) : 0,
        creditsEarned: sem1_1 ? Number(sem1_1.credits_earned) : 0,
        backlogs: sem1_1 ? Number(sem1_1.backlogs_count) : 0,
      },
      sem1_2: {
        sgpa: sem1_2 ? Number(sem1_2.sgpa) : 0,
        creditsEarned: sem1_2 ? Number(sem1_2.credits_earned) : 0,
        backlogs: sem1_2 ? Number(sem1_2.backlogs_count) : 0,
      },
      currentSem: `${studentData.year || 2}-${studentData.semester || 1}`,
      cgpa: latestCgpa,
      totalBacklogs: totalBacklogs,
      subjects: [],
    },

    careerInterests: skillsGoals?.short_term_goals || [],
    higherEducationAspirations: skillsGoals?.long_term_goals?.[0] || '',
    desiredTechnicalSkills: (skillsGoals?.technical_skills || []).map((t: any) => `${t.name} (${t.proficiency})`),
    technicalSkillsList: skillsGoals?.technical_skills || [],
    softSkills: skillsGoals?.soft_skills || [],
    personalStrengths: [],
    developmentGoals: skillsGoals?.short_term_goals || [],
    hobbies: skillsGoals?.hobbies || [],
    shortTermGoals: skillsGoals?.short_term_goals || [],
    longTermGoals: skillsGoals?.long_term_goals || [],

    workshops: (achievements || []).filter((a: any) => a.category === 'workshop').map((a: any) => a.title),
    certifications: (achievements || []).filter((a: any) => a.category === 'certification').map((a: any) => a.title),
    internships: (achievements || []).filter((a: any) => a.category === 'training').map((a: any) => a.title),
    competitions: (achievements || []).filter((a: any) => a.category === 'competition').map((a: any) => a.title),
    sportsCultural: [],
    otherAchievements: (achievements || []).filter((a: any) => a.category === 'project' || a.category === 'other').map((a: any) => a.title),
    achievementsList: (achievements || []).map((a: any) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      organizer: a.organizer || '',
      dateOrYear: a.date_or_year || '',
      description: a.description || ''
    })),

    profileStatus: status,
    profileCompletionPercent: Math.min(100, completion),
    followUpPriority: 'Normal',
    assignedMentor: 'Assigned Faculty Mentor',
    notesCount: 0,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('guest')
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentDbId, setStudentDbId] = useState<string | null>(null)
  const [studentRollNumber, setStudentRollNumber] = useState<string | null>(null)
  const [accountLinkingError, setAccountLinkingError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const configured = isSupabaseConfigured()

  // Helper to load role and student profile for authenticated user
  const loadUserDetails = useCallback(async (userId: string, userEmail?: string) => {
    try {
      setIsDemo(false)
      setAccountLinkingError(null)

      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      let assignedRole: UserRole = 'guest'
      if (!roleError && roleData?.role) {
        assignedRole = roleData.role as UserRole
      }

      setRole(assignedRole)

      // 2. If student, fetch student record strictly by user_id = auth.uid()
      if (assignedRole === 'student') {
        let studentRecord: any = null

        // Primary & Only Security Standard: Query students strictly by authenticated user_id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (!studentError && studentData) {
          studentRecord = studentData
        }

        if (studentRecord) {
          setStudentDbId(studentRecord.id)
          setStudentRollNumber(studentRecord.roll_number)
          setAccountLinkingError(null)

          // Load real child records (including Sections B-G)
          const [details, academicRes, submissionsRes] = await Promise.all([
            studentService.getStudentDetailsById(studentRecord.id),
            supabase.from('student_academic_history').select('*').eq('student_id', studentRecord.id),
            supabase.from('profile_submissions').select('*').eq('student_id', studentRecord.id)
          ])

          const realProfile = buildStudentProfileFromDb(
            studentRecord,
            details?.personal,
            details?.family,
            details?.education,
            submissionsRes.data || [],
            academicRes.data || [],
            details?.skillsGoals,
            details?.achievements || []
          )

          setStudentProfile(realProfile)
        } else {
          // Authenticated as student, but no roster record linked to user_id
          setStudentDbId(null)
          setStudentRollNumber(null)
          setStudentProfile(null)
          setAccountLinkingError(
            `Account Linking Error: No official student roster record is currently linked to this authenticated account (${userEmail || 'unknown'}). Please contact your department administrator.`
          )
        }
      } else {
        // Admin, guest, or unlinked role
        setStudentProfile(null)
        setStudentDbId(null)
        setStudentRollNumber(null)
        if (assignedRole === 'guest') {
          setAccountLinkingError(
            `Account Notice: No authorized role is assigned to this account (${userEmail || 'unknown'}). Please contact your department administrator.`
          )
        } else {
          setAccountLinkingError(null)
        }
      }
    } catch (err) {
      console.warn('Error resolving user role/profile:', err)
    }
  }, [])

  // Public method to refresh student profile on demand (e.g. after profile edit submission)
  const refreshStudentProfile = useCallback(async () => {
    if (user) {
      await loadUserDetails(user.id, user.email)
    }
  }, [user, loadUserDetails])

  const isProduction = import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production'

  useEffect(() => {
    // In production builds, demonstration bypass is strictly disabled
    if (isProduction) {
      localStorage.removeItem('mentor_connect_demo_role')
      localStorage.removeItem('mentor_connect_demo_roll')
    }

    const savedDemoRole = !isProduction ? (localStorage.getItem('mentor_connect_demo_role') as UserRole | null) : null
    const savedDemoRoll = !isProduction ? localStorage.getItem('mentor_connect_demo_roll') : null

    if (!configured) {
      if (!isProduction && savedDemoRole) {
        setRole(savedDemoRole)
        if (savedDemoRole === 'student') {
          const matched = MOCK_STUDENTS.find(s => s.rollNumber === (savedDemoRoll || '23L31A5401'))
          setStudentProfile(matched || MOCK_STUDENTS[0])
          setStudentRollNumber(matched ? matched.rollNumber : '23L31A5401')
        }
      }
      setLoading(false)
      return
    }

    // Live Supabase initialization
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserDetails(session.user.id, session.user.email).finally(() => setLoading(false))
      } else if (!isProduction && savedDemoRole) {
        setRole(savedDemoRole)
        if (savedDemoRole === 'student') {
          const matched = MOCK_STUDENTS.find(s => s.rollNumber === (savedDemoRoll || '23L31A5401'))
          setStudentProfile(matched || MOCK_STUDENTS[0])
          setStudentRollNumber(matched ? matched.rollNumber : '23L31A5401')
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        localStorage.removeItem('mentor_connect_demo_role')
        localStorage.removeItem('mentor_connect_demo_roll')
        loadUserDetails(session.user.id, session.user.email)
      } else {
        const demoRole = !isProduction ? (localStorage.getItem('mentor_connect_demo_role') as UserRole | null) : null
        if (!demoRole) {
          setRole('guest')
          setStudentProfile(null)
          setStudentDbId(null)
          setStudentRollNumber(null)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [configured, isProduction])

  const signInWithPassword = async (email: string, password: string): Promise<{ error: Error | null; role?: UserRole }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        await loadUserDetails(data.user.id, data.user.email)
        // Determine role immediately
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle()

        const activeRole: UserRole = (roleRow?.role as UserRole) || (email.includes('admin') ? 'admin' : 'student')
        return { error: null, role: activeRole }
      }

      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const signOut = async (): Promise<void> => {
    localStorage.removeItem('mentor_connect_demo_role')
    localStorage.removeItem('mentor_connect_demo_roll')
    if (configured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setRole('guest')
    setIsDemo(false)
    setAccountLinkingError(null)
    setStudentProfile(null)
    setStudentDbId(null)
    setStudentRollNumber(null)
  }

  const resetPasswordForEmail = async (email: string): Promise<{ error: Error | null }> => {
    if (!configured) {
      return { error: new Error('Supabase is not configured') }
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login/reset-password`,
      })
      return { error }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const loginAsDemo = (demoRole: 'admin' | 'student', rollNumber?: string) => {
    if (isProduction) {
      console.warn('Demo authentication is strictly disabled in production.')
      return
    }
    localStorage.setItem('mentor_connect_demo_role', demoRole)
    if (rollNumber) {
      localStorage.setItem('mentor_connect_demo_roll', rollNumber)
    }
    setRole(demoRole)
    setIsDemo(true)
    setAccountLinkingError(null)
    if (demoRole === 'student') {
      const matched = MOCK_STUDENTS.find(s => s.rollNumber === (rollNumber || '23L31A5401'))
      setStudentProfile(matched || MOCK_STUDENTS[0])
      setStudentRollNumber(matched ? matched.rollNumber : '23L31A5401')
    } else {
      setStudentProfile(null)
      setStudentRollNumber(null)
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error: Error | null; user?: User | null }> => {
    if (!configured) {
      return { error: new Error('Supabase is not configured') }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login/reset-password`
        }
      })
      if (error) {
        return { error }
      }
      if (data.user) {
        await loadUserDetails(data.user.id, data.user.email)
      }
      return { error: null, user: data.user }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    if (!configured) {
      return { error: new Error('Supabase is not configured') }
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      if (error) {
        return { error }
      }
      if (data.user) {
        await loadUserDetails(data.user.id, data.user.email)
      }
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const sendStudentInvite = async (
    email: string,
    metadata?: { name?: string; roll_number?: string }
  ): Promise<{
    error: Error | null
    success?: boolean
    warning?: string | null
    auditPersistenceFailed?: boolean
  }> => {
    if (!configured) {
      return { error: null, success: true }
    }
    try {
      const isLocalHost = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
      const targetRedirect = isLocalHost
        ? (import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/login/reset-password` : undefined)
        : `${window.location.origin}/login/reset-password`

      const { data, error } = await supabase.functions.invoke('invite-student', {
        body: {
          email: email.trim().toLowerCase(),
          roll_number: metadata?.roll_number,
          redirectTo: targetRedirect,
          data: metadata || {}
        }
      })

      if (error) {
        let detailedMessage = error.message
        if ('context' in error && error.context) {
          try {
            const body = await (error.context as Response).json()
            if (body?.error) {
              detailedMessage = body.error
            } else if (body?.message) {
              detailedMessage = body.message
            }
          } catch {
            try {
              const text = await (error.context as Response).text()
              if (text) detailedMessage = text
            } catch {
              // fallback
            }
          }
        }
        return { error: new Error(detailedMessage) }
      }

      if (data?.error) {
        return { error: new Error(data.error) }
      }

      if (data?.warning || data?.auditPersistenceFailed) {
        return {
          error: null,
          success: true,
          warning: data.warning || data.message,
          auditPersistenceFailed: Boolean(data.auditPersistenceFailed)
        }
      }

      return { error: null, success: true, warning: null, auditPersistenceFailed: false }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        studentProfile,
        studentDbId,
        studentRollNumber,
        loading,
        isConfigured: configured,
        isDemoAllowed: !isProduction,
        isDemo,
        accountLinkingError,
        refreshStudentProfile,
        signInWithPassword,
        signUp,
        updatePassword,
        sendStudentInvite,
        signOut,
        resetPasswordForEmail,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
