import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { MOCK_STUDENTS } from '@/data/mock/students'
import type { StudentProfile } from '@/types'

export type UserRole = 'admin' | 'student' | 'guest'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  studentProfile: StudentProfile | null
  studentDbId: string | null
  studentRollNumber: string | null
  loading: boolean
  isConfigured: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>
  loginAsDemo: (role: 'admin' | 'student', rollNumber?: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('guest')
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentDbId, setStudentDbId] = useState<string | null>(null)
  const [studentRollNumber, setStudentRollNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const configured = isSupabaseConfigured()

  // Helper to load role and student profile for authenticated user
  const loadUserDetails = async (userId: string, userEmail?: string) => {
    try {
      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      let assignedRole: UserRole = 'student'
      if (!roleError && roleData?.role) {
        assignedRole = roleData.role as UserRole
      } else if (userEmail?.toLowerCase().includes('admin') || userEmail?.toLowerCase().includes('mentor')) {
        assignedRole = 'admin'
      }

      setRole(assignedRole)

      // 2. If student, fetch student record
      if (assignedRole === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, roll_number, name, email, department, year, semester, section, avatar_url')
          .eq('user_id', userId)
          .maybeSingle()

        if (!studentError && studentData) {
          setStudentDbId(studentData.id)
          setStudentRollNumber(studentData.roll_number)

          // Find or construct matching StudentProfile
          const matchedMock = MOCK_STUDENTS.find(s => s.rollNumber.toLowerCase() === studentData.roll_number.toLowerCase())
          if (matchedMock) {
            setStudentProfile({
              ...matchedMock,
              fullName: studentData.name || matchedMock.fullName,
              email: studentData.email || matchedMock.email,
              avatarUrl: studentData.avatar_url || matchedMock.avatarUrl
            })
          } else {
            // Default baseline
            setStudentProfile({
              ...MOCK_STUDENTS[0],
              fullName: studentData.name,
              rollNumber: studentData.roll_number,
              email: studentData.email,
              avatarUrl: studentData.avatar_url || MOCK_STUDENTS[0].avatarUrl
            })
          }
        } else {
          // If student has not yet been linked to a row in students, check by email
          if (userEmail) {
            const { data: byEmail } = await supabase
              .from('students')
              .select('id, roll_number, name, email, avatar_url')
              .eq('email', userEmail)
              .maybeSingle()

            if (byEmail) {
              setStudentDbId(byEmail.id)
              setStudentRollNumber(byEmail.roll_number)
              const matched = MOCK_STUDENTS.find(s => s.rollNumber.toLowerCase() === byEmail.roll_number.toLowerCase())
              setStudentProfile(matched || MOCK_STUDENTS[0])
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error resolving user role/profile:', err)
    }
  }

  useEffect(() => {
    // Check if demo user was saved in localStorage
    const savedDemoRole = localStorage.getItem('mentor_connect_demo_role') as UserRole | null
    const savedDemoRoll = localStorage.getItem('mentor_connect_demo_roll')

    if (!configured) {
      if (savedDemoRole) {
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
      } else if (savedDemoRole) {
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
        const demoRole = localStorage.getItem('mentor_connect_demo_role') as UserRole | null
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
  }, [configured])

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
    } catch (err: any) {
      return { error: err }
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
    } catch (err: any) {
      return { error: err }
    }
  }

  const loginAsDemo = (demoRole: 'admin' | 'student', rollNumber?: string) => {
    localStorage.setItem('mentor_connect_demo_role', demoRole)
    if (rollNumber) {
      localStorage.setItem('mentor_connect_demo_roll', rollNumber)
    }
    setRole(demoRole)
    if (demoRole === 'student') {
      const matched = MOCK_STUDENTS.find(s => s.rollNumber === (rollNumber || '23L31A5401'))
      setStudentProfile(matched || MOCK_STUDENTS[0])
      setStudentRollNumber(matched ? matched.rollNumber : '23L31A5401')
    } else {
      setStudentProfile(null)
      setStudentRollNumber(null)
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
        signInWithPassword,
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
