export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'student' | 'parent'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'student' | 'parent'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'student' | 'parent'
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          roll_number: string
          name: string
          email: string
          department: string
          year: number
          semester: number
          section: string
          mentor_id: string | null
          status: 'Active' | 'Inactive' | 'Archived' | 'Pending_Approval'
          avatar_url: string | null
          share_phone_in_directory: boolean
          share_email_in_directory: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          roll_number: string
          name: string
          email: string
          department?: string
          year?: number
          semester?: number
          section?: string
          mentor_id?: string | null
          status?: 'Active' | 'Inactive' | 'Archived' | 'Pending_Approval'
          avatar_url?: string | null
          share_phone_in_directory?: boolean
          share_email_in_directory?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          roll_number?: string
          name?: string
          email?: string
          department?: string
          year?: number
          semester?: number
          section?: string
          mentor_id?: string | null
          status?: 'Active' | 'Inactive' | 'Archived' | 'Pending_Approval'
          avatar_url?: string | null
          share_phone_in_directory?: boolean
          share_email_in_directory?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_personal_details: {
        Row: {
          id: string
          student_id: string
          dob: string | null
          gender: 'Male' | 'Female' | 'Other' | null
          blood_group: string | null
          phone: string | null
          emergency_contact: string | null
          current_address: string | null
          permanent_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          dob?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          blood_group?: string | null
          phone?: string | null
          emergency_contact?: string | null
          current_address?: string | null
          permanent_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          dob?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          blood_group?: string | null
          phone?: string | null
          emergency_contact?: string | null
          current_address?: string | null
          permanent_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_family_details: {
        Row: {
          id: string
          student_id: string
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          guardian_name: string | null
          guardian_phone: string | null
          annual_income: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          annual_income?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          annual_income?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      student_education_details: {
        Row: {
          id: string
          student_id: string
          tenth_board: string | null
          tenth_school: string | null
          tenth_percentage: number | null
          twelfth_board: string | null
          twelfth_college: string | null
          twelfth_percentage: number | null
          eamcet_rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          tenth_board?: string | null
          tenth_school?: string | null
          tenth_percentage?: number | null
          twelfth_board?: string | null
          twelfth_college?: string | null
          twelfth_percentage?: number | null
          eamcet_rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          tenth_board?: string | null
          tenth_school?: string | null
          tenth_percentage?: number | null
          twelfth_board?: string | null
          twelfth_college?: string | null
          twelfth_percentage?: number | null
          eamcet_rank?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          code: string
          name: string
          credits: number
          semester: number
          department: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          credits?: number
          semester?: number
          department?: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          credits?: number
          semester?: number
          department?: string
          created_at?: string
        }
      }
      student_subject_marks: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          weekly_test_1: number | null
          weekly_test_2: number | null
          weekly_test_3: number | null
          weekly_test_4: number | null
          mid_1: number | null
          mid_2: number | null
          lab_internal: number | null
          semester_end_marks: number | null
          grade: string | null
          attendance_percentage: number | null
          is_locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          weekly_test_1?: number | null
          weekly_test_2?: number | null
          weekly_test_3?: number | null
          weekly_test_4?: number | null
          mid_1?: number | null
          mid_2?: number | null
          lab_internal?: number | null
          semester_end_marks?: number | null
          grade?: string | null
          attendance_percentage?: number | null
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          weekly_test_1?: number | null
          weekly_test_2?: number | null
          weekly_test_3?: number | null
          weekly_test_4?: number | null
          mid_1?: number | null
          mid_2?: number | null
          lab_internal?: number | null
          semester_end_marks?: number | null
          grade?: string | null
          attendance_percentage?: number | null
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profile_submissions: {
        Row: {
          id: string
          student_id: string
          section: 'personal' | 'family' | 'education' | 'photo'
          proposed_changes: Json
          current_snapshot: Json | null
          status: 'Pending' | 'Approved' | 'Corrections_Requested' | 'Rejected'
          mentor_remarks: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          section: 'personal' | 'family' | 'education' | 'photo'
          proposed_changes: Json
          current_snapshot?: Json | null
          status?: 'Pending' | 'Approved' | 'Corrections_Requested' | 'Rejected'
          mentor_remarks?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          section?: 'personal' | 'family' | 'education' | 'photo'
          proposed_changes?: Json
          current_snapshot?: Json | null
          status?: 'Pending' | 'Approved' | 'Corrections_Requested' | 'Rejected'
          mentor_remarks?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      student_directory_view: {
        Row: {
          id: string
          roll_number: string
          name: string
          department: string
          year: number
          semester: number
          section: string
          avatar_url: string | null
          email: string
          phone: string
        }
      }
    }
  }
}
