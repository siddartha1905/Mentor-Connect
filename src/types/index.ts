// ==========================================
// MENTOR CONNECT — CORE TYPE DEFINITIONS
// ==========================================

export type ProfileStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Changes Requested'
  | 'Rejected'
  | 'Locked'

export type PriorityLevel = 'High' | 'Medium' | 'Low' | 'Normal'

export type SessionOutcome =
  | 'No Action'
  | 'Follow-up Required'
  | 'Resolved'
  | 'Referred'

export type AttendanceHealth = 'Good' | 'Warning' | 'Critical'
 
export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface TechnicalSkill {
  id?: string
  name: string
  proficiency: SkillProficiency
}

export type AchievementCategory =
  | 'workshop'
  | 'training'
  | 'certification'
  | 'competition'
  | 'project'
  | 'other'

export interface AchievementRecord {
  id: string
  studentId?: string
  category: AchievementCategory
  title: string
  organizer?: string
  dateOrYear?: string
  description?: string
}

export interface CommitmentItem {
  id: string
  task: string
  owner: 'student' | 'mentor'
  dueDate: string
  isCompleted: boolean
}

export interface MentoringSession {
  id: string
  studentRollNumber: string
  sessionNumber: number
  date: string
  facultyName: string
  beforeSession: {
    previousDiscussionSummary: string
    pendingCommitments: string[]
    suggestedQuestions: string[]
  }
  duringSession: {
    attendanceMarked: 'Present' | 'Absent'
    academicConcerns: string
    personalSupportConcerns: string
    confidentialMentorNotes: string // Restricted Mentor Only
    studentVisibleSuggestions: string // Visible to Student
  }
  afterSession: {
    commitments: CommitmentItem[]
    outcome: SessionOutcome
    nextFollowUpDate: string
  }
}

export interface SubjectAssessment {
  code: string
  name: string
  credits: number
  wt1: number // Weekly Test 1 (max 5)
  wt2: number // Weekly Test 2 (max 5)
  wt3: number // Weekly Test 3 (max 5)
  wt4: number // Weekly Test 4 (max 5)
  mid1: number // Mid 1 (max 30)
  mid2: number // Mid 2 (max 30)
  labInternal?: number // Lab Internals if applicable
  totalInternal: number
  maxInternal: number
  status: 'Good' | 'Needs Attention' | 'Critical'
}

export interface AcademicHistory {
  class10: {
    schoolName: string
    board: string
    passYear: string
    percentage: string
  }
  intermediate: {
    collegeName: string
    board: string
    passYear: string
    percentage: string
  }
  sem1_1: {
    sgpa: number
    creditsEarned: number
    backlogs: number
  }
  sem1_2: {
    sgpa: number
    creditsEarned: number
    backlogs: number
  }
  currentSem: string // e.g. "2-1"
  cgpa: number
  totalBacklogs: number
  subjects: SubjectAssessment[]
}

export interface AttendanceProfile {
  officialPercentage: number
  totalClassesHeld: number
  classesAttended: number
  lastUpdated: string
  health: AttendanceHealth
  studentReportedCheckIns: {
    date: string
    status: 'Present' | 'Absent' | 'Late'
    note?: string
  }[]
  discrepancyCount: number
}

export interface StudentProfile {
  // Section A: Basic Identity
  fullName: string
  rollNumber: string
  department: string // "CSE-Data Science"
  branch: string // "CSE-DS"
  year: number // 2
  section: string // "A" or "B"
  currentSemester: string // "2-1"
  admissionType: 'Regular' | 'Lateral'
  academicBatch: string // "2023-2027"

  // Section B: Personal Information
  avatarUrl: string
  dob: string
  phone: string
  email: string
  permanentAddress: string
  presentAddress: string
  isSameAddress: boolean

  // Section C: Residence & Transportation
  residenceType:
    | 'Living at home / day scholar'
    | 'College hostel'
    | 'Private hostel'
    | 'PG accommodation'
    | 'Rented accommodation'
    | 'Other'
  transportType:
    | 'College bus'
    | 'RTC/public bus'
    | 'Train'
    | 'Auto'
    | 'Own vehicle'
    | 'Walking'
    | 'Other'
  transportRoute?: string

  // Section D: Family Details
  fatherName: string
  fatherPhone?: string
  fatherOccupation?: string
  motherName: string
  motherPhone?: string
  motherOccupation?: string
  guardianName?: string
  emergencyContact: string

  // Section E: Educational Background
  academics: AcademicHistory

  // Section F: Skills & Aspirations
  careerInterests: string[]
  higherEducationAspirations: string
  desiredTechnicalSkills: string[]
  technicalSkillsList?: TechnicalSkill[]
  softSkills: string[]
  personalStrengths: string[]
  developmentGoals: string[]
  hobbies?: string[]
  shortTermGoals?: string[]
  longTermGoals?: string[]

  // Section G: Activities & Achievements
  workshops: string[]
  certifications: string[]
  internships: string[]
  competitions: string[]
  sportsCultural: string[]
  otherAchievements: string[]
  achievementsList?: AchievementRecord[]

  // Administrative metadata
  profileStatus: ProfileStatus
  profileCompletionPercent: number
  followUpPriority: PriorityLevel
  nextMentoringDate?: string
  assignedMentor: string
  notesCount: number
}

export interface ApprovalItem {
  id: string
  studentRollNumber: string
  studentName: string
  sectionName: string // e.g., "Personal Info", "Residence & Transport", "Family Details"
  submissionDate: string
  status: 'Pending' | 'Approved' | 'Changes Requested' | 'Rejected'
  oldValues: Record<string, string>
  proposedValues: Record<string, string>
  adminComments?: string
}

export interface ChatMessage {
  id: string
  senderRole: 'student' | 'mentor' | 'system'
  senderName: string
  content: string
  timestamp: string
  isPrivate: boolean
  isConfidential?: boolean
}

export interface AnnouncementItem {
  id: string
  title: string
  content: string
  date: string
  author: string
  priority: 'Normal' | 'Important' | 'Urgent'
  category: 'Academic' | 'Mentoring' | 'Notice'
  reactionsCount: number
}

export interface FormSurveyItem {
  id: string
  title: string
  description: string
  targetCohort: string
  deadline: string
  status: 'Active' | 'Draft' | 'Closed'
  questionsCount: number
  responseCount: number
  totalEligible: number
}

export interface AutomatedScheduleRule {
  id: string
  title: string
  scheduleTime: string
  frequency: string
  targetGroup: string
  isActive: boolean
  templateSnippet: string
  category: 'Attendance Check-in' | 'Motivational' | 'Academic Reminder' | 'Follow-up'
}

export interface MotivationalQuote {
  quote: string
  author: string
  focus: string
}
