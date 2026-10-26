import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  MapPin,
  Home,
  Users,
  GraduationCap,
  Target,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowLeft,
  ShieldCheck,
  Edit3,
  Loader2,
  Lock,
  Clock,
  Sparkles,
  PlusCircle,
  Trash2,
  Plus,
  Briefcase,
  Heart,
  Compass,
  Check
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_STUDENTS } from '@/data/mock'
import { useAuth } from '@/app/providers/AuthContext'
import {
  studentService,
  type StudentFullDetails,
  type StudentSkillsGoalsRecord,
  type StudentAchievementRecord,
  type TechnicalSkillItem
} from '@/services/studentService'
import { storageService } from '@/services/storageService'

export const StudentProfileView: React.FC = () => {
  const { studentProfile, studentDbId, user, isConfigured, isDemo, refreshStudentProfile, accountLinkingError } = useAuth()
  const student = studentProfile || (isDemo || !user ? MOCK_STUDENTS[0] : null)
  const isLinked = user ? Boolean(studentProfile && !accountLinkingError) : true

  const [activeSection, setActiveSection] = React.useState('A')
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false)
  const [photoPreview, setPhotoPreview] = React.useState(student?.avatarUrl || '')
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const [photoError, setPhotoError] = React.useState<string | null>(null)

  // Child table records & submissions
  const [dbDetails, setDbDetails] = React.useState<StudentFullDetails | null>(null)
  const [skillsGoals, setSkillsGoals] = React.useState<StudentSkillsGoalsRecord | null>(null)
  const [achievements, setAchievements] = React.useState<StudentAchievementRecord[]>([])

  // Privacy Directory Toggles
  const [sharePhone, setSharePhone] = React.useState(false)
  const [shareEmail, setShareEmail] = React.useState(false)
  const [privacySaving, setPrivacySaving] = React.useState(false)

  // Direct Section Edit Modal State (Sections B, C, D, E)
  const [editModal, setEditModal] = React.useState<{
    isOpen: boolean
    section: 'personal' | 'family' | 'education'
    title: string
    formData: Record<string, any>
  }>({
    isOpen: false,
    section: 'personal',
    title: '',
    formData: {}
  })
  const [savingEdit, setSavingEdit] = React.useState(false)

  // Section F: Skills & Goals Modal
  const [skillsModalOpen, setSkillsModalOpen] = React.useState(false)
  const [technicalSkillsList, setTechnicalSkillsList] = React.useState<TechnicalSkillItem[]>([])
  const [softSkillsList, setSoftSkillsList] = React.useState<string[]>([])
  const [hobbiesList, setHobbiesList] = React.useState<string[]>([])
  const [shortTermGoalsList, setShortTermGoalsList] = React.useState<string[]>([])
  const [longTermGoalsList, setLongTermGoalsList] = React.useState<string[]>([])
  const [savingSkills, setSavingSkills] = React.useState(false)

  // Section G: Achievement Add / Edit Modal
  const [achievementModal, setAchievementModal] = React.useState<{
    isOpen: boolean
    isEdit: boolean
    item: Partial<StudentAchievementRecord>
  }>({
    isOpen: false,
    isEdit: false,
    item: {
      category: 'workshop',
      title: '',
      organizer: '',
      date_or_year: '',
      description: ''
    }
  })
  const [savingAchievement, setSavingAchievement] = React.useState(false)
  const [deletingAchievementId, setDeletingAchievementId] = React.useState<string | null>(null)

  const [feedbackNotice, setFeedbackNotice] = React.useState<string | null>(null)
  const [globalDeadline, setGlobalDeadline] = React.useState<Date | null>(
    new Date('2026-11-03T23:59:59+05:30')
  )

  const formatDeadlineIST = React.useCallback((date: Date): string => {
    try {
      const dStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date)
      return `${dStr} IST`
    } catch {
      return date.toLocaleDateString()
    }
  }, [])

  // Load backend details, skills, achievements & deadline
  const loadProfileData = React.useCallback(async () => {
    if (!studentDbId) return

    studentService.getGlobalDeadline().then(setGlobalDeadline)

    try {
      const details = await studentService.getStudentDetailsById(studentDbId)
      if (details) {
        setDbDetails(details)
        if (details.student) {
          setSharePhone(Boolean(details.student.share_phone_in_directory))
          setShareEmail(Boolean(details.student.share_email_in_directory))
          if (details.student.avatar_url) {
            setPhotoPreview(details.student.avatar_url)
          }
        }
        if (details.skillsGoals) {
          setSkillsGoals(details.skillsGoals)
          setTechnicalSkillsList(details.skillsGoals.technical_skills || [])
          setSoftSkillsList(details.skillsGoals.soft_skills || [])
          setHobbiesList(details.skillsGoals.hobbies || [])
          setShortTermGoalsList(details.skillsGoals.short_term_goals || [])
          setLongTermGoalsList(details.skillsGoals.long_term_goals || [])
        }
        if (details.achievements) {
          setAchievements(details.achievements)
        }
      }
    } catch (err) {
      console.warn('Error loading student profile details:', err)
    }
  }, [studentDbId])

  React.useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  // Sync photo preview when student profile changes
  React.useEffect(() => {
    if (student?.avatarUrl) {
      setPhotoPreview(student.avatarUrl)
    }
  }, [student?.avatarUrl])

  if (!isLinked || !student) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-extrabold text-slate-800">Student Profile Not Linked</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {accountLinkingError || 'Your authenticated account is not currently linked to an active student roster record. Please contact your department administrator.'}
        </p>
        <Link to="/">
          <Button size="sm" variant="outline">
            Return Home
          </Button>
        </Link>
      </div>
    )
  }

  const sectionTabs = [
    { id: 'A', label: 'A. Basic Identity' },
    { id: 'B', label: 'B. Personal Info' },
    { id: 'C', label: 'C. Residence & Commute' },
    { id: 'D', label: 'D. Family Details' },
    { id: 'E', label: 'E. Education' },
    { id: 'F', label: 'F. Skills & Goals' },
    { id: 'G', label: 'G. Achievements' },
  ]

  // Handle privacy toggles
  const handleTogglePrivacy = async (type: 'phone' | 'email') => {
    const nextPhone = type === 'phone' ? !sharePhone : sharePhone
    const nextEmail = type === 'email' ? !shareEmail : shareEmail
    if (type === 'phone') setSharePhone(nextPhone)
    if (type === 'email') setShareEmail(nextEmail)

    if (isConfigured && studentDbId) {
      setPrivacySaving(true)
      try {
        await studentService.updatePrivacySettings(studentDbId, nextPhone, nextEmail)
        setFeedbackNotice('Saved Successfully.')
        setTimeout(() => setFeedbackNotice(null), 3000)
      } finally {
        setPrivacySaving(false)
      }
    }
  }

  // Handle direct photo upload & replace without approval queue
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setPhotoError(null)

    try {
      const targetUserId = user?.id || studentDbId || 'student-photo'
      const { url, error } = await storageService.uploadProfilePhoto(targetUserId, file)

      if (error || !url) {
        setPhotoError(error?.message || 'Failed to upload photo')
      } else {
        setPhotoPreview(url)
        if (studentDbId) {
          const res = await studentService.updateProfilePhoto(studentDbId, url)
          if (!res.success) {
            setPhotoError('Could not update profile record: ' + ((res.error as any)?.message || 'Database error'))
            return
          }
          await refreshStudentProfile()
          await loadProfileData()
        }
        setFeedbackNotice('Saved Successfully.')
        setPhotoModalOpen(false)
        setTimeout(() => setFeedbackNotice(null), 3500)
      }
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Error processing photograph')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Open direct edit modal for Sections B, C, D, E
  const openEditModal = (
    section: 'personal' | 'family' | 'education',
    title: string,
    initialData: Record<string, unknown>
  ) => {
    setEditModal({
      isOpen: true,
      section,
      title,
      formData: initialData
    })
  }

  // Save changes directly to Supabase
  const handleSaveSectionChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)

    try {
      if (studentDbId) {
        let res: { success: boolean; error?: any }
        if (editModal.section === 'personal') {
          res = await studentService.savePersonalDetails(studentDbId, editModal.formData)
        } else if (editModal.section === 'family') {
          res = await studentService.saveFamilyDetails(studentDbId, editModal.formData)
        } else {
          res = await studentService.saveEducationDetails(studentDbId, editModal.formData)
        }

        if (res.success) {
          setFeedbackNotice('Saved Successfully.')
          await refreshStudentProfile()
          await loadProfileData()
        } else {
          setFeedbackNotice(`Error saving: ${(res.error as any)?.message || 'Validation failed'}`)
        }
      } else {
        setFeedbackNotice('Saved Successfully.')
      }
      setEditModal(prev => ({ ...prev, isOpen: false }))
      setTimeout(() => setFeedbackNotice(null), 3500)
    } finally {
      setSavingEdit(false)
    }
  }

  // Open Section F Skills & Goals Modal
  const openSkillsModal = () => {
    if (skillsGoals) {
      setTechnicalSkillsList(skillsGoals.technical_skills || [])
      setSoftSkillsList(skillsGoals.soft_skills || [])
      setHobbiesList(skillsGoals.hobbies || [])
      setShortTermGoalsList(skillsGoals.short_term_goals || [])
      setLongTermGoalsList(skillsGoals.long_term_goals || [])
    } else {
      setTechnicalSkillsList([
        { name: 'Python', proficiency: 'Intermediate' },
        { name: 'SQL', proficiency: 'Beginner' }
      ])
      setSoftSkillsList(['Team Collaboration', 'Presentation Skills'])
      setHobbiesList(['Reading Tech Blogs', 'Competitive Programming'])
      setShortTermGoalsList(['Complete AWS Cloud Certification this semester'])
      setLongTermGoalsList(['Become a Data Architect or Machine Learning Engineer'])
    }
    setSkillsModalOpen(true)
  }

  // Save Section F Skills & Goals directly to Supabase
  const handleSaveSkills = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSkills(true)

    try {
      if (studentDbId) {
        const payload: Partial<StudentSkillsGoalsRecord> = {
          technical_skills: technicalSkillsList.filter(t => t.name.trim().length > 0),
          soft_skills: softSkillsList.filter(s => s.trim().length > 0),
          hobbies: hobbiesList.filter(h => h.trim().length > 0),
          short_term_goals: shortTermGoalsList.filter(g => g.trim().length > 0),
          long_term_goals: longTermGoalsList.filter(g => g.trim().length > 0)
        }

        const res = await studentService.saveSkillsGoals(studentDbId, payload)
        if (res.success) {
          setFeedbackNotice('Saved Successfully.')
          await refreshStudentProfile()
          await loadProfileData()
        } else {
          setFeedbackNotice('Error saving skills & goals.')
        }
      } else {
        setFeedbackNotice('Saved Successfully.')
      }
      setSkillsModalOpen(false)
      setTimeout(() => setFeedbackNotice(null), 3500)
    } finally {
      setSavingSkills(false)
    }
  }

  // Open Section G Achievement Modal (Add or Edit)
  const openAchievementModal = (existing?: StudentAchievementRecord) => {
    if (existing) {
      setAchievementModal({
        isOpen: true,
        isEdit: true,
        item: { ...existing }
      })
    } else {
      setAchievementModal({
        isOpen: true,
        isEdit: false,
        item: {
          category: 'workshop',
          title: '',
          organizer: '',
          date_or_year: '',
          description: ''
        }
      })
    }
  }

  // Save Section G Achievement directly to Supabase
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAchievement(true)

    try {
      if (studentDbId) {
        const res = await studentService.saveAchievement(studentDbId, achievementModal.item)
        if (res.success) {
          setFeedbackNotice('Saved Successfully.')
          await refreshStudentProfile()
          await loadProfileData()
        } else {
          setFeedbackNotice('Error saving achievement.')
        }
      } else {
        setFeedbackNotice('Saved Successfully.')
      }
      setAchievementModal(prev => ({ ...prev, isOpen: false }))
      setTimeout(() => setFeedbackNotice(null), 3500)
    } finally {
      setSavingAchievement(false)
    }
  }

  // Delete Section G Achievement
  const handleDeleteAchievement = async (achievementId: string) => {
    setDeletingAchievementId(achievementId)
    try {
      if (studentDbId) {
        await studentService.deleteAchievement(studentDbId, achievementId)
        setFeedbackNotice('Saved Successfully.')
        await refreshStudentProfile()
        await loadProfileData()
        setTimeout(() => setFeedbackNotice(null), 3500)
      }
    } finally {
      setDeletingAchievementId(null)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          {globalDeadline && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-purple-700" />
              Deadline: {formatDeadlineIST(globalDeadline)}
            </span>
          )}
          {(student.profileCompletionPercent ?? 0) >= 100 ? (
            <Badge variant="approved">Status: Profile Complete</Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold">
              Status: Profile Incomplete
            </Badge>
          )}
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Header Profile Identity Card */}
      <Card className="p-5 bg-gradient-to-r from-purple-50 via-white to-indigo-50 border-purple-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative group">
            <Avatar
              src={photoPreview}
              alt={student.fullName}
              fallback={student.fullName}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
              title="Upload / Replace Profile Photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {student.fullName}
              </h1>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full self-center sm:self-auto">
                {student.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Department of {student.department} • Year {student.year}, Section {student.section}
            </p>
            <p className="text-xs text-slate-500">
              Current Semester: <strong>{student.currentSemester}</strong> • Batch: {student.academicBatch}
            </p>

            {/* Profile Completion Indicator */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Profile Completion</span>
                <span className="font-bold text-indigo-600">{student.profileCompletionPercent}% Completed</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${student.profileCompletionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Directory Privacy Preference Controls */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Student Directory Privacy Controls</span>
            </h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Choose whether peer classmates can view your contact details in the public student directory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={sharePhone}
                onChange={() => handleTogglePrivacy('phone')}
                disabled={privacySaving}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <span>Share Phone</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shareEmail}
                onChange={() => handleTogglePrivacy('email')}
                disabled={privacySaving}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <span>Share Email</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Section Switcher Tabs */}
      <Tabs tabs={sectionTabs} activeTab={activeSection} onChange={setActiveSection} variant="chips" />

      {/* SECTION A: BASIC IDENTITY (READ ONLY INSTITUTIONAL RECORD) */}
      {activeSection === 'A' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Section A — Basic Academic Identity
              </CardTitle>
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px]">
                Institutional Record
              </Badge>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Read-Only
            </span>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Full Name</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.fullName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">College Roll Number</span>
              <p className="text-sm font-mono font-bold text-indigo-700 mt-0.5">{student.rollNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Department</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.department}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Branch & Year</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.branch} • 2nd Year (Sec {student.section})</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Current Semester</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.currentSemester}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Admission Type</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.admissionType} Entry</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION B: PERSONAL INFORMATION */}
      {activeSection === 'B' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                Section B — Personal Information & Addresses
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('personal', 'Personal Details & Addresses', {
                  dob: dbDetails?.personal?.dob || student.dob || '',
                  gender: dbDetails?.personal?.gender || 'Male',
                  blood_group: dbDetails?.personal?.blood_group || '',
                  phone: dbDetails?.personal?.phone || student.phone || '',
                  emergency_contact: dbDetails?.personal?.emergency_contact || student.emergencyContact || '',
                  permanent_address: dbDetails?.personal?.permanent_address || student.permanentAddress || '',
                  current_address: dbDetails?.personal?.current_address || student.presentAddress || ''
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Details
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date of Birth</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.dob ? student.dob : <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mobile Contact</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.phone ? student.phone : <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Blood Group</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {dbDetails?.personal?.blood_group || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Emergency Contact</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.emergencyContact || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">College Email Address</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.email || user?.email || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Permanent Address</span>
              <div className="text-sm font-medium text-slate-800 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.permanentAddress ? student.permanentAddress : <span className="text-slate-400 italic">Not yet provided</span>}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Present Address</span>
              <div className="text-sm font-medium text-slate-800 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.presentAddress ? student.presentAddress : <span className="text-slate-400 italic">Not yet provided</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION C: RESIDENCE & COMMUTE */}
      {activeSection === 'C' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Home className="h-4 w-4 text-indigo-600" />
                Section C — Residence & Commute Details
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('personal', 'Residence & Commute Details', {
                  residence_type: dbDetails?.personal?.residence_type || student.residenceType || 'Living at home / day scholar',
                  transport_mode: dbDetails?.personal?.transport_mode || student.transportType || 'College bus',
                  bus_route_details: dbDetails?.personal?.bus_route_details || student.transportRoute || ''
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Details
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Residence Type</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.residenceType || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Primary Transport Mode</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.transportType || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">College Bus Route</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.transportRoute || <span className="text-slate-400 italic">Not applicable / Not provided</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION D: FAMILY DETAILS */}
      {activeSection === 'D' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Section D — Parent & Family Information
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('family', 'Family & Parent Information', {
                  father_name: dbDetails?.family?.father_name || student.fatherName || '',
                  father_occupation: dbDetails?.family?.father_occupation || student.fatherOccupation || '',
                  father_phone: dbDetails?.family?.father_phone || student.fatherPhone || '',
                  mother_name: dbDetails?.family?.mother_name || student.motherName || '',
                  mother_occupation: dbDetails?.family?.mother_occupation || student.motherOccupation || '',
                  mother_phone: dbDetails?.family?.mother_phone || student.motherPhone || '',
                  guardian_name: dbDetails?.family?.guardian_name || student.guardianName || '',
                  guardian_phone: dbDetails?.family?.guardian_phone || '',
                  annual_income: dbDetails?.family?.annual_income || 0
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Details
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Name</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {student.fatherName || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Occupation</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.fatherOccupation || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Contact Number</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.fatherPhone || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Name</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {student.motherName || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Occupation</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.motherOccupation || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Contact Number</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {student.motherPhone || <span className="text-slate-400 italic">Not yet provided</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION E: EDUCATION */}
      {activeSection === 'E' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                Section E — Previous Academic Record
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('education', 'Education & Board Records', {
                  tenth_board: dbDetails?.education?.tenth_board || student.academics.class10.board || '',
                  tenth_school: dbDetails?.education?.tenth_school || student.academics.class10.schoolName || '',
                  tenth_percentage: dbDetails?.education?.tenth_percentage ?? (parseFloat(student.academics.class10.percentage) || 0),
                  twelfth_board: dbDetails?.education?.twelfth_board || student.academics.intermediate.board || '',
                  twelfth_college: dbDetails?.education?.twelfth_college || student.academics.intermediate.collegeName || '',
                  twelfth_percentage: dbDetails?.education?.twelfth_percentage ?? (parseFloat(student.academics.intermediate.percentage) || 0),
                  eamcet_rank: dbDetails?.education?.eamcet_rank ?? 0,
                  entry_type: dbDetails?.education?.entry_type || student.admissionType || 'Regular'
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Details
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">10th Standard (SSC / CBSE)</h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>School: <strong className="text-slate-800">{student.academics.class10.schoolName || '—'}</strong></div>
                <div>Board: <strong className="text-slate-800">{student.academics.class10.board || '—'}</strong></div>
                <div>Percentage: <strong className="text-indigo-700">{student.academics.class10.percentage || '—'}</strong></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">12th Standard / Intermediate (BIEAP / CBSE)</h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>College: <strong className="text-slate-800">{student.academics.intermediate.collegeName || '—'}</strong></div>
                <div>Board: <strong className="text-slate-800">{student.academics.intermediate.board || '—'}</strong></div>
                <div>Percentage: <strong className="text-indigo-700">{student.academics.intermediate.percentage || '—'}</strong></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION F: SKILLS & GOALS (EDITABLE REPEATABLE FIELDS) */}
      {activeSection === 'F' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                Section F — Skills, Hobbies & Goals
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openSkillsModal}
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Skills & Goals
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Technical Skills & Proficiency */}
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5">
                Technical Skills & Proficiency Levels
              </span>
              {technicalSkillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {technicalSkillsList.map((skill, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 flex items-center gap-2 font-medium"
                    >
                      <span className="font-bold">{skill.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-200/70 text-[10px] font-semibold text-indigo-800">
                        {skill.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No technical skills added yet. Click "Edit Skills & Goals" to add your skills.</p>
              )}
            </div>

            {/* Communication & Soft Skills */}
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5">
                Communication & Soft Skills
              </span>
              {softSkillsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {softSkillsList.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No soft skills logged yet.</p>
              )}
            </div>

            {/* Hobbies & Interests */}
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5 flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" />
                Hobbies & Interests
              </span>
              {hobbiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {hobbiesList.map((h, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No hobbies entered yet.</p>
              )}
            </div>

            {/* Short-Term Goals */}
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5 flex items-center gap-1">
                <Compass className="h-3 w-3 text-amber-500" />
                Short-Term Academic & Learning Goals
              </span>
              {shortTermGoalsList.length > 0 ? (
                <ul className="space-y-1.5">
                  {shortTermGoalsList.map((goal, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">No short-term goals recorded yet.</p>
              )}
            </div>

            {/* Long-Term Career Goals */}
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5 flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-purple-600" />
                Long-Term Career Goals
              </span>
              {longTermGoalsList.length > 0 ? (
                <ul className="space-y-1.5">
                  {longTermGoalsList.map((goal, i) => (
                    <li key={i} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200 text-purple-950 flex items-start gap-2 font-medium">
                      <Target className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">No long-term goals recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION G: ACHIEVEMENTS (REPEATABLE WITH ADD/EDIT/REMOVE) */}
      {activeSection === 'G' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                Section G — Achievements & Activities
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                Student-Provided
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAchievementModal()}
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Achievement
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            {achievements.length > 0 ? (
              <div className="space-y-2.5">
                {achievements.map((item) => {
                  const categoryLabels: Record<string, string> = {
                    workshop: 'Workshop Attended',
                    training: 'Training Program',
                    certification: 'Certification Completed',
                    competition: 'Competition & Award',
                    project: 'Project & Achievement',
                    other: 'Other Accomplishment'
                  }
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {categoryLabels[item.category] || item.category}
                          </span>
                          {item.date_or_year && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              • {item.date_or_year}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        {item.organizer && (
                          <p className="text-xs text-slate-600 font-medium">
                            Institution / Organizer: <strong className="text-slate-800">{item.organizer}</strong>
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-slate-600 pt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAchievementModal(item)}
                          className="h-7 px-2 text-indigo-600 hover:bg-indigo-50 text-xs"
                          title="Edit Achievement"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAchievement(item.id)}
                          disabled={deletingAchievementId === item.id}
                          className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-xs"
                          title="Remove Achievement"
                        >
                          {deletingAchievementId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remove
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Award className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium text-xs">No achievements logged yet.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Record workshops, training programs, certifications, competitions, or personal projects.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAchievementModal()}
                  className="text-xs text-indigo-700 border-indigo-200 mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Achievement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Modal (Direct Save without Approval Queue) */}
      <Dialog
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title="Upload Student Profile Photograph"
        description="Select an image file. It will be compressed client-side to <500 KB and stored directly in your profile."
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="h-44 w-44 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-indigo-300 relative bg-slate-50 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-slate-400 text-center p-2">
                <Camera className="h-8 w-8 mx-auto mb-1 text-slate-300" />
                <span>No photo uploaded</span>
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>

          {photoError && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs">
              {photoError}
            </div>
          )}

          <div className="text-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
              id="student-photo-file"
              disabled={uploadingPhoto}
            />
            <label
              htmlFor="student-photo-file"
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span>Choose Photo to Upload</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setPhotoModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Sections B, C, D, E Direct Save Edit Modal */}
      <Dialog
        isOpen={editModal.isOpen}
        onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
        title={`Edit Details — ${editModal.title}`}
        description="Update your details below and click 'Save Changes' to update your student profile."
      >
        <form onSubmit={handleSaveSectionChanges} className="space-y-3 pt-2 text-xs">
          {Object.entries(editModal.formData).map(([key, val]) => {
            const isAddress = key.includes('address')
            const isSelect = key === 'gender' || key === 'residence_type' || key === 'transport_mode' || key === 'entry_type' || key === 'blood_group'
            const isDate = key === 'dob'

            return (
              <div key={key}>
                <label className="block text-[11px] font-semibold text-slate-700 capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </label>

                {isSelect ? (
                  <select
                    value={val ?? ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, [key]: e.target.value }
                    }))}
                    className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white"
                  >
                    {key === 'gender' && (
                      <>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {key === 'blood_group' && (
                      <>
                        <option value="">Select Blood Group...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </>
                    )}
                    {key === 'residence_type' && (
                      <>
                        <option value="Living at home / day scholar">Living at home / day scholar</option>
                        <option value="College hostel">College hostel</option>
                        <option value="Private hostel">Private hostel</option>
                        <option value="PG accommodation">PG accommodation</option>
                        <option value="Rented accommodation">Rented accommodation</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {key === 'transport_mode' && (
                      <>
                        <option value="College bus">College bus</option>
                        <option value="RTC/public bus">RTC/public bus</option>
                        <option value="Train">Train</option>
                        <option value="Auto">Auto</option>
                        <option value="Own vehicle">Own vehicle</option>
                        <option value="Walking">Walking</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {key === 'entry_type' && (
                      <>
                        <option value="Regular">Regular Entry</option>
                        <option value="Lateral">Lateral Entry (Diploma)</option>
                      </>
                    )}
                  </select>
                ) : isAddress ? (
                  <textarea
                    rows={2}
                    value={val ?? ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, [key]: e.target.value }
                    }))}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 resize-none"
                  />
                ) : (
                  <input
                    type={isDate ? 'date' : typeof val === 'number' ? 'number' : 'text'}
                    step={typeof val === 'number' ? '0.01' : undefined}
                    value={val ?? ''}
                    onChange={(e) => {
                      const newVal = typeof val === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                      setEditModal(prev => ({
                        ...prev,
                        formData: { ...prev.formData, [key]: newVal }
                      }))
                    }}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            )
          })}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Section F: Skills & Goals Multi-Item Modal */}
      <Dialog
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        title="Edit Section F — Skills, Hobbies & Goals"
        description="Add multiple technical skills with proficiency levels, soft skills, hobbies, and goals."
      >
        <form onSubmit={handleSaveSkills} className="space-y-4 pt-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Technical Skills & Proficiency */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase text-[10px]">
                Technical Skills & Proficiency Levels
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTechnicalSkillsList(prev => [...prev, { name: '', proficiency: 'Intermediate' }])}
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Skill
              </Button>
            </div>

            {technicalSkillsList.map((skill, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Python, React, PostgreSQL"
                  value={skill.name}
                  onChange={(e) => {
                    const next = [...technicalSkillsList]
                    next[index].name = e.target.value
                    setTechnicalSkillsList(next)
                  }}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                />
                <select
                  value={skill.proficiency}
                  onChange={(e) => {
                    const next = [...technicalSkillsList]
                    next[index].proficiency = e.target.value as any
                    setTechnicalSkillsList(next)
                  }}
                  className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <button
                  type="button"
                  onClick={() => setTechnicalSkillsList(prev => prev.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove Skill"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Communication & Soft Skills */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase text-[10px]">
                Communication & Soft Skills
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSoftSkillsList(prev => [...prev, ''])}
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Soft Skill
              </Button>
            </div>

            {softSkillsList.map((skill, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Active Listening, Public Speaking, Leadership"
                  value={skill}
                  onChange={(e) => {
                    const next = [...softSkillsList]
                    next[index] = e.target.value
                    setSoftSkillsList(next)
                  }}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setSoftSkillsList(prev => prev.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Hobbies & Interests */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase text-[10px]">
                Hobbies & Interests
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHobbiesList(prev => [...prev, ''])}
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Hobby
              </Button>
            </div>

            {hobbiesList.map((hobby, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Robotics Club, Chess, Badminton"
                  value={hobby}
                  onChange={(e) => {
                    const next = [...hobbiesList]
                    next[index] = e.target.value
                    setHobbiesList(next)
                  }}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setHobbiesList(prev => prev.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Short-Term Goals */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase text-[10px]">
                Short-Term Goals
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShortTermGoalsList(prev => [...prev, ''])}
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Goal
              </Button>
            </div>

            {shortTermGoalsList.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Score >8.5 SGPA in 2-1 semester"
                  value={goal}
                  onChange={(e) => {
                    const next = [...shortTermGoalsList]
                    next[index] = e.target.value
                    setShortTermGoalsList(next)
                  }}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShortTermGoalsList(prev => prev.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Long-Term Career Goals */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase text-[10px]">
                Long-Term Career Goals
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLongTermGoalsList(prev => [...prev, ''])}
                className="h-6 px-2 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Another Long-Term Goal
              </Button>
            </div>

            {longTermGoalsList.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Software Development Engineer at top tech company or Master's abroad"
                  value={goal}
                  onChange={(e) => {
                    const next = [...longTermGoalsList]
                    next[index] = e.target.value
                    setLongTermGoalsList(next)
                  }}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setLongTermGoalsList(prev => prev.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSkillsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={savingSkills}>
              {savingSkills ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Section G: Add / Edit Achievement Modal */}
      <Dialog
        isOpen={achievementModal.isOpen}
        onClose={() => setAchievementModal(prev => ({ ...prev, isOpen: false }))}
        title={achievementModal.isEdit ? 'Edit Achievement' : 'Add Achievement'}
        description="Fill out the details of your workshop, training program, certification, competition, or project."
      >
        <form onSubmit={handleSaveAchievement} className="space-y-3 pt-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={achievementModal.item.category || 'workshop'}
              onChange={(e) => setAchievementModal(prev => ({
                ...prev,
                item: { ...prev.item, category: e.target.value as any }
              }))}
              className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white"
            >
              <option value="workshop">Workshop Attended</option>
              <option value="training">Training Program</option>
              <option value="certification">Certification Completed</option>
              <option value="competition">Competition & Award</option>
              <option value="project">Project & Achievement</option>
              <option value="other">Other Accomplishment</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Title / Activity Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Certified Cloud Practitioner / Smart India Hackathon"
              value={achievementModal.item.title || ''}
              onChange={(e) => setAchievementModal(prev => ({
                ...prev,
                item: { ...prev.item, title: e.target.value }
              }))}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Organizer / Institution (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services, IIT Madras"
                value={achievementModal.item.organizer || ''}
                onChange={(e) => setAchievementModal(prev => ({
                  ...prev,
                  item: { ...prev.item, organizer: e.target.value }
                }))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Year or Date (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2024, Oct 2024"
                value={achievementModal.item.date_or_year || ''}
                onChange={(e) => setAchievementModal(prev => ({
                  ...prev,
                  item: { ...prev.item, date_or_year: e.target.value }
                }))}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Brief Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief details about what you built, learned, or achieved..."
              value={achievementModal.item.description || ''}
              onChange={(e) => setAchievementModal(prev => ({
                ...prev,
                item: { ...prev.item, description: e.target.value }
              }))}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAchievementModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={savingAchievement}>
              {savingAchievement ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
