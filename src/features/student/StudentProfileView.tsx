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
  Crop,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_STUDENTS } from '@/data/mock'
import { useAuth } from '@/app/providers/AuthContext'
import { studentService } from '@/services/studentService'
import { storageService } from '@/services/storageService'

export const StudentProfileView: React.FC = () => {
  const { studentProfile, studentDbId, user, isConfigured } = useAuth()
  const student = studentProfile || MOCK_STUDENTS[0] // fallback to Aarav Sharma

  const [activeSection, setActiveSection] = React.useState('A')
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false)
  const [photoPreview, setPhotoPreview] = React.useState(student.avatarUrl)
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)
  const [photoError, setPhotoError] = React.useState<string | null>(null)

  // Privacy Directory Toggles
  const [sharePhone, setSharePhone] = React.useState(false)
  const [shareEmail, setShareEmail] = React.useState(false)
  const [privacySaving, setPrivacySaving] = React.useState(false)

  // Edit Request Modal State
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
  const [submittingEdit, setSubmittingEdit] = React.useState(false)
  const [feedbackNotice, setFeedbackNotice] = React.useState<string | null>(null)
  const [globalDeadline, setGlobalDeadline] = React.useState<Date | null>(null)

  // Load backend details & deadline
  React.useEffect(() => {
    if (isConfigured) {
      studentService.getGlobalDeadline().then(setGlobalDeadline)
      if (studentDbId) {
        studentService.getStudentDetailsById(studentDbId).then((res) => {
          if (res?.student) {
            setSharePhone(Boolean(res.student.share_phone_in_directory))
            setShareEmail(Boolean(res.student.share_email_in_directory))
            if (res.student.avatar_url) {
              setPhotoPreview(res.student.avatar_url)
            }
          }
        })
      }
    }
  }, [isConfigured, studentDbId])

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
        setFeedbackNotice('Directory privacy preferences saved.')
        setTimeout(() => setFeedbackNotice(null), 3500)
      } finally {
        setPrivacySaving(false)
      }
    }
  }

  // Handle photo file selection and compressed upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setPhotoError(null)

    try {
      const userId = user?.id || studentDbId || 'demo-student'
      const { url, error } = await storageService.uploadProfilePhoto(userId, file)

      if (error || !url) {
        setPhotoError(error?.message || 'Failed to upload photo')
      } else {
        setPhotoPreview(url)
        // If student is linked, submit photo change for approval
        if (studentDbId) {
          await studentService.submitSectionUpdate(studentDbId, 'photo', { avatar_url: url })
        }
        setFeedbackNotice('Photograph compressed (<500KB) and uploaded.')
        setPhotoModalOpen(false)
        setTimeout(() => setFeedbackNotice(null), 4000)
      }
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Error processing photograph')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Open edit request modal
  const openEditModal = (section: 'personal' | 'family' | 'education', title: string, initialData: Record<string, unknown>) => {
    setEditModal({
      isOpen: true,
      section,
      title,
      formData: initialData
    })
  }

  // Submit profile edit request to Faculty Approval Centre
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingEdit(true)

    try {
      if (isConfigured && studentDbId) {
        const res = await studentService.submitSectionUpdate(
          studentDbId,
          editModal.section,
          editModal.formData
        )
        if (res.success) {
          setFeedbackNotice(`Changes submitted for section "${editModal.title}". Pending faculty mentor approval.`)
        } else {
          setFeedbackNotice(`Submission error: ${(res.error as any)?.message || 'Validation failed'}`)
        }
      } else {
        setFeedbackNotice(`Demo mode: Edit request for "${editModal.title}" queued for review.`)
      }
      setEditModal(prev => ({ ...prev, isOpen: false }))
      setTimeout(() => setFeedbackNotice(null), 5000)
    } finally {
      setSubmittingEdit(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/more"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to More</span>
        </Link>
        <div className="flex items-center gap-2">
          {globalDeadline && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-slate-400" />
              Deadline: {globalDeadline.toLocaleDateString()}
            </span>
          )}
          <Badge variant="approved">Status: {student.profileStatus}</Badge>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
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
              title="Upload / Update Profile Photo"
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
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
                  style={{ width: `${student.profileCompletionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Directory Privacy Preference Banner */}
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

      {/* SECTION A: BASIC IDENTITY */}
      {activeSection === 'A' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Section A — Basic Academic Identity
            </CardTitle>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Institutional Record
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
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Section B — Personal Information & Addresses
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('personal', 'Personal Details & Addresses', {
                  phone: student.phone,
                  emergency_contact: student.emergencyContact,
                  current_address: student.presentAddress,
                  permanent_address: student.permanentAddress
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Request Edit
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date of Birth</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.dob} (Age 20)</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mobile Contact</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">College Email Address</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.email}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Permanent Address</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.permanentAddress}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Present Address</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.presentAddress}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Same as Permanent Address
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION C: RESIDENCE & COMMUTE */}
      {activeSection === 'C' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Home className="h-4 w-4 text-indigo-600" />
              Section C — Residence & Commute Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Residence Type</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.residenceType}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Primary Transport Mode</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.transportType}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">College Bus Route</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.transportRoute}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION D: FAMILY DETAILS */}
      {activeSection === 'D' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Section D — Parent & Family Information
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('family', 'Family & Parent Information', {
                  father_name: student.fatherName,
                  father_occupation: student.fatherOccupation,
                  father_phone: student.fatherPhone,
                  mother_name: student.motherName,
                  mother_occupation: student.motherOccupation,
                  mother_phone: student.motherPhone
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Request Edit
            </Button>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Name</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.fatherName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Occupation</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.fatherOccupation}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Contact Number</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.fatherPhone}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Name</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.motherName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Occupation</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.motherOccupation}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Contact Number</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.motherPhone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION E: EDUCATION */}
      {activeSection === 'E' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Section E — Previous Academic Record
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openEditModal('education', 'Education & Board Marks', {
                  tenth_board: student.academics.class10.board,
                  tenth_school: student.academics.class10.schoolName,
                  tenth_percentage: parseFloat(student.academics.class10.percentage) || 92.4,
                  twelfth_board: student.academics.intermediate.board,
                  twelfth_college: student.academics.intermediate.collegeName,
                  twelfth_percentage: parseFloat(student.academics.intermediate.percentage) || 94.8
                })
              }
              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Request Edit
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">10th Standard (SSC / CBSE)</h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>School: <strong className="text-slate-800">{student.academics.class10.schoolName}</strong></div>
                <div>Board: <strong className="text-slate-800">{student.academics.class10.board}</strong></div>
                <div>Year: <strong className="text-slate-800">{student.academics.class10.passYear}</strong></div>
                <div>Percentage: <strong className="text-indigo-700">{student.academics.class10.percentage}</strong></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">12th Standard / Intermediate (BIEAP / CBSE)</h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>College: <strong className="text-slate-800">{student.academics.intermediate.collegeName}</strong></div>
                <div>Board: <strong className="text-slate-800">{student.academics.intermediate.board}</strong></div>
                <div>Year: <strong className="text-slate-800">{student.academics.intermediate.passYear}</strong></div>
                <div>Percentage: <strong className="text-indigo-700">{student.academics.intermediate.percentage}</strong></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION F: CAREER & GOALS */}
      {activeSection === 'F' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Section F — Career Interests & Aspirations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Target Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {student.careerInterests.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Higher Studies Aspirations</span>
              <p className="text-sm font-medium text-slate-800 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.higherEducationAspirations}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION G: ACHIEVEMENTS */}
      {activeSection === 'G' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" />
              Section G — Workshops & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Workshops & Seminars</span>
              <ul className="space-y-1">
                {student.workshops.map((w, i) => (
                  <li key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    • {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Verified Certifications</span>
              <ul className="space-y-1">
                {student.certifications.map((c, i) => (
                  <li key={i} className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900 font-medium flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Modal */}
      <Dialog
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title="Upload Student Profile Photograph"
        description="Select an image file. It will be compressed client-side to <500 KB and stored in private Supabase Storage."
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="h-44 w-44 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-indigo-300 relative bg-slate-50 flex items-center justify-center">
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
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

      {/* Section Edit Modal */}
      <Dialog
        isOpen={editModal.isOpen}
        onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
        title={`Request Update — ${editModal.title}`}
        description="Proposed edits are validated server-side against an allowlist and queued for faculty review."
      >
        <form onSubmit={handleSubmitEdit} className="space-y-3 pt-2 text-xs">
          {Object.entries(editModal.formData).map(([key, val]) => (
            <div key={key}>
              <label className="block text-[11px] font-semibold text-slate-700 capitalize mb-1">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type={typeof val === 'number' ? 'number' : 'text'}
                step={typeof val === 'number' ? '0.1' : undefined}
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
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submittingEdit}>
              {submittingEdit ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                'Submit for Mentor Approval'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
