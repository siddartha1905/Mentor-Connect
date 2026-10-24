import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface SubmissionWithStudent {
  id: string
  student_id: string
  section: 'personal' | 'family' | 'education' | 'photo'
  proposed_changes: Record<string, any>
  current_snapshot: Record<string, any> | null
  status: 'Pending' | 'Approved' | 'Corrections_Requested' | 'Rejected'
  mentor_remarks: string | null
  created_at: string
  reviewed_at: string | null
  student?: {
    roll_number: string
    name: string
    department: string
    year: number
    section: string
    avatar_url: string | null
  }
}

export const approvalService = {
  // Fetch pending submissions for faculty review
  async getPendingSubmissions(): Promise<SubmissionWithStudent[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('profile_submissions')
      .select('*, student:students(roll_number, name, department, year, section, avatar_url)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending submissions:', error)
      return []
    }

    return (data || []) as SubmissionWithStudent[]
  },

  // Fetch all submissions with optional status filter
  async getAllSubmissions(statusFilter?: string): Promise<SubmissionWithStudent[]> {
    if (!isSupabaseConfigured()) return []

    let query = supabase
      .from('profile_submissions')
      .select('*, student:students(roll_number, name, department, year, section, avatar_url)')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching submissions:', error)
      return []
    }

    return (data || []) as SubmissionWithStudent[]
  },

  // Transactional RPC call: review_profile_submission
  async reviewSubmission(
    submissionId: string,
    action: 'approve' | 'request_corrections' | 'reject',
    remarks?: string
  ) {
    if (!isSupabaseConfigured()) {
      return { success: true, message: `Mock reviewed: ${action}` }
    }

    const { data, error } = await supabase.rpc('review_profile_submission', {
      p_submission_id: submissionId,
      p_action: action,
      p_remarks: remarks || null
    })

    if (error) {
      console.error('Error reviewing submission via RPC:', error)
      return { success: false, error }
    }

    return { success: true, data }
  }
}
