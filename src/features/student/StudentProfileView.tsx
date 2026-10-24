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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_STUDENTS } from '@/data/mock'

export const StudentProfileView: React.FC = () => {
  const student = MOCK_STUDENTS[0] // Aarav Sharma
  const [activeSection, setActiveSection] = React.useState('A')
  const [cropModalOpen, setCropModalOpen] = React.useState(false)
  const [photoPreview, setPhotoPreview] = React.useState(student.avatarUrl)

  const sectionTabs = [
    { id: 'A', label: 'A. Basic Identity' },
    { id: 'B', label: 'B. Personal Info' },
    { id: 'C', label: 'C. Residence & Commute' },
    { id: 'D', label: 'D. Family Details' },
    { id: 'E', label: 'E. Education' },
    { id: 'F', label: 'F. Skills & Goals' },
    { id: 'G', label: 'G. Achievements' },
  ]

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
        <Badge variant="approved">Status: {student.profileStatus}</Badge>
      </div>

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
              onClick={() => setCropModalOpen(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
              title="Upload / Crop Profile Photo"
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

      <DemoNotice
        variant="inline"
        message="Multi-section interface preview. Section edits will require administrator approval in later stages."
      />

      {/* Section Switcher Tabs */}
      <Tabs tabs={sectionTabs} activeTab={activeSection} onChange={setActiveSection} variant="chips" />

      {/* SECTION A: BASIC IDENTITY */}
      {activeSection === 'A' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Section A — Basic Academic Identity
            </CardTitle>
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
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Section B — Personal Information & Addresses
            </CardTitle>
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

      {/* SECTION C: RESIDENCE & TRANSPORTATION */}
      {activeSection === 'C' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Home className="h-4 w-4 text-indigo-600" />
              Section C — Residence & Commute Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Residence Type</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.residenceType}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Transportation Mode</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.transportType}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Assigned Route / Stop (Non-Mandatory)</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {student.transportRoute || 'Not configured'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION D: FAMILY DETAILS */}
      {activeSection === 'D' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Section D — Family & Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Father's Name</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.fatherName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{student.fatherOccupation}</p>
              <p className="text-xs text-slate-500">{student.fatherPhone}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Mother's Name</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{student.motherName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{student.motherOccupation}</p>
              <p className="text-xs text-slate-500">{student.motherPhone}</p>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Emergency Contact</span>
              <p className="text-sm font-bold text-rose-700 mt-0.5">{student.emergencyContact}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION E: EDUCATIONAL BACKGROUND */}
      {activeSection === 'E' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Section E — Educational Background
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Class 10 (Secondary)</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{student.academics.class10.schoolName}</p>
                <p className="text-xs text-slate-500">{student.academics.class10.board} • Year {student.academics.class10.passYear}</p>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Score</span>
                <p className="text-base font-extrabold text-indigo-700 mt-0.5">{student.academics.class10.percentage}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Intermediate / Diploma</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{student.academics.intermediate.collegeName}</p>
                <p className="text-xs text-slate-500">{student.academics.intermediate.board} • Year {student.academics.intermediate.passYear}</p>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Score</span>
                <p className="text-base font-extrabold text-indigo-700 mt-0.5">{student.academics.intermediate.percentage}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sem 1-1 SGPA</span>
                <p className="text-base font-bold text-indigo-900 mt-0.5">{student.academics.sem1_1.sgpa}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sem 1-2 SGPA</span>
                <p className="text-base font-bold text-purple-900 mt-0.5">{student.academics.sem1_2.sgpa}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Current CGPA</span>
                <p className="text-base font-bold text-emerald-900 mt-0.5">{student.academics.cgpa}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION F: SKILLS & ASPIRATIONS */}
      {activeSection === 'F' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Section F — Skills & Career Aspirations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Career Interests</span>
              <div className="flex flex-wrap gap-1.5">
                {student.careerInterests.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Higher Education Ambitions</span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                {student.higherEducationAspirations}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Desired Technical Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {student.desiredTechnicalSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION G: ACTIVITIES & ACHIEVEMENTS */}
      {activeSection === 'G' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Section G — Activities, Workshops & Certifications
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

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Sports & Cultural Participation</span>
              <div className="flex flex-wrap gap-1.5">
                {student.sportsCultural.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload / Crop Preview Modal */}
      <Dialog
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        title="Upload Professional Profile Photo"
        description="Target maximum file size: 500 KB (1 MB hard limit). In Stage 2, compressed images will upload to Supabase Storage."
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="h-44 w-44 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-indigo-300 relative bg-slate-50 flex items-center justify-center">
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center text-white">
              <Crop className="h-6 w-6" />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
            Please upload a front-facing formal photograph suitable for institutional student mentoring records.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCropModalOpen(false)
              }}
            >
              Confirm Mock Crop
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
