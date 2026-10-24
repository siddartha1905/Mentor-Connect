import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface StudentFullDetails {
  student: any
  personal: any
  family: any
  education: any
  marks: any[]
}

export const studentService = {
  // Fetch student and all linked sections by user ID
  async getStudentByUserId(userId: string): Promise<StudentFullDetails | null> {
    if (!isSupabaseConfigured()) return null

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (studentError || !student) return null

    return this.getStudentDetailsById(student.id)
  },

  // Fetch student and all linked sections by roll number
  async getStudentByRoll(rollNumber: string): Promise<StudentFullDetails | null> {
    if (!isSupabaseConfigured()) return null

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('roll_number', rollNumber)
      .maybeSingle()

    if (studentError || !student) return null

    return this.getStudentDetailsById(student.id)
  },

  // Fetch full details by student database UUID
  async getStudentDetailsById(studentId: string): Promise<StudentFullDetails | null> {
    if (!isSupabaseConfigured()) return null

    const [studentRes, personalRes, familyRes, educationRes, marksRes] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
      supabase.from('student_personal_details').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('student_family_details').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('student_education_details').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('student_subject_marks').select('*, subjects(*)').eq('student_id', studentId)
    ])

    if (!studentRes.data) return null

    return {
      student: studentRes.data,
      personal: personalRes.data || null,
      family: familyRes.data || null,
      education: educationRes.data || null,
      marks: marksRes.data || []
    }
  },

  // Get all students for admin view
  async getAllStudents() {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number', { ascending: true })

    if (error) {
      console.error('Error fetching all students:', error)
      return []
    }
    return data || []
  },

  // Fetch directory view (respects student phone/email privacy opt-ins)
  async getStudentDirectory() {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('student_directory_view')
      .select('*')
      .order('roll_number', { ascending: true })

    if (error) {
      console.error('Error fetching student directory:', error)
      return []
    }
    return data || []
  },

  // Update directory privacy preferences
  async updatePrivacySettings(studentId: string, sharePhone: boolean, shareEmail: boolean) {
    if (!isSupabaseConfigured()) return { success: true }

    const { data, error } = await supabase
      .from('students')
      .update({
        share_phone_in_directory: sharePhone,
        share_email_in_directory: shareEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single()

    return { success: !error, error, data }
  },

  // Check global deadline
  async getGlobalDeadline(): Promise<Date | null> {
    if (!isSupabaseConfigured()) return null

    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'profile_edit_deadline')
      .maybeSingle()

    if (error || !data) return null
    const val = data.value as any
    return val?.deadline ? new Date(val.deadline) : null
  },

  // Check if student has active override
  async hasActiveOverride(studentId: string, section: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('student_edit_overrides')
      .select('id')
      .eq('student_id', studentId)
      .eq('section', section)
      .gt('allowed_until', now)
      .limit(1)

    if (error || !data || data.length === 0) return false
    return true
  },

  // Submit profile section update for approval
  async submitSectionUpdate(
    studentId: string,
    section: 'personal' | 'family' | 'education' | 'photo',
    proposedChanges: Record<string, any>,
    currentSnapshot?: Record<string, any>
  ) {
    if (!isSupabaseConfigured()) {
      return { success: true, submissionId: 'mock-sub-' + Date.now() }
    }

    const { data, error } = await supabase
      .from('profile_submissions')
      .insert({
        student_id: studentId,
        section,
        proposed_changes: proposedChanges,
        current_snapshot: currentSnapshot || null,
        status: 'Pending'
      })
      .select()
      .single()

    if (error) {
      return { success: false, error }
    }
    return { success: true, submissionId: data.id, data }
  },

  // Fetch pending or past submissions for a student
  async getStudentSubmissions(studentId: string) {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('profile_submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return []
    }
    return data || []
  }
}
