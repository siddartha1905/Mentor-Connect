import * as React from 'react'
import {
  GraduationCap,
  Award,
  Target,
  Sparkles,
  BookOpen,
  CheckCircle,
  Lightbulb,
  Layers,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS } from '@/data/mock'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentJourney: React.FC = () => {
  const { studentProfile, isDemo } = useAuth()
  const student = studentProfile || (isDemo ? MOCK_STUDENTS[0] : null)
  const [activeTab, setActiveTab] = React.useState('academics')

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Student Profile Not Linked</h3>
        <p className="text-xs text-slate-500 mt-1">
          Academic journey data is not linked to this authenticated account.
        </p>
      </div>
    )
  }

  const hasRealAcademics = Boolean(student.academics?.cgpa && student.academics.cgpa > 0)

  const tabs = [
    { id: 'academics', label: 'Academics & Backlogs' },
    { id: 'skills', label: 'Skills & Aspirations' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'mentor', label: 'Mentor Advice' },
  ]

  return (
    <div className="space-y-5 pb-6">
      {/* Back to Home Navigation */}
      <div>
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-purple-700" />
          My Academic Journey
        </h1>
        <p className="text-xs text-slate-500">
          Comprehensive record of coursework, skills, ambitions and faculty guidance.
        </p>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Sample course records for exploration."
        />
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* TAB 1: ACADEMICS & BACKLOGS */}
      {activeTab === 'academics' && (
        <div className="space-y-4">
          {/* Semester Overview Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="p-3 bg-indigo-50/60 border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Sem 1-1</span>
              <p className="text-xl font-extrabold text-indigo-950 mt-1">
                {hasRealAcademics ? student?.academics?.sem1_1?.sgpa || '—' : '—'}
              </p>
              <span className="text-[10px] text-slate-500">
                {hasRealAcademics ? '21 Credits' : 'Not yet available'}
              </span>
            </Card>

            <Card className="p-3 bg-purple-50/60 border-purple-100">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Sem 1-2</span>
              <p className="text-xl font-extrabold text-purple-950 mt-1">
                {hasRealAcademics ? student?.academics?.sem1_2?.sgpa || '—' : '—'}
              </p>
              <span className="text-[10px] text-slate-500">
                {hasRealAcademics ? '21 Credits' : 'Not yet available'}
              </span>
            </Card>

            <Card className="p-3 bg-emerald-50/60 border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Cumulative</span>
              <p className="text-xl font-extrabold text-emerald-950 mt-1">
                {hasRealAcademics ? student?.academics?.cgpa || '—' : '—'}
              </p>
              <span className="text-[10px] text-slate-600 font-semibold">
                {hasRealAcademics ? `${student?.academics?.totalBacklogs || 0} Backlogs` : 'Not yet available'}
              </span>
            </Card>
          </div>

          {/* Current Semester 2-1 Subject Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  Semester 2-1 Subjects & Internal Assessments
                </CardTitle>
                <Badge variant="low" className="bg-slate-100 text-slate-600 border-slate-200">
                  {hasRealAcademics && student?.academics?.subjects && student.academics.subjects.length > 0 ? 'Active Term' : 'Not yet available'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student?.academics?.subjects && student.academics.subjects.length > 0 ? (
                student.academics.subjects.map((subj) => (
                  <div
                    key={subj.code}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {subj.code} • {subj.credits} Credits
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                          {subj.name}
                        </h4>
                      </div>
                      <Badge variant={subj.status === 'Good' ? 'good' : 'warning'}>
                        {subj.status}
                      </Badge>
                    </div>

                    {/* Marks Breakdown Pill Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center pt-1 text-xs">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">WT-1</span>
                        <span className="font-bold text-slate-800">{subj.wt1}/5</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">WT-2</span>
                        <span className="font-bold text-slate-800">{subj.wt2}/5</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">WT-3</span>
                        <span className="font-bold text-slate-800">{subj.wt3}/5</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">WT-4</span>
                        <span className="font-bold text-slate-800">{subj.wt4}/5</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">Mid-1</span>
                        <span className="font-bold text-indigo-700">{subj.mid1}/30</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        <span className="text-[9px] text-slate-400 block font-medium">Mid-2</span>
                        <span className="font-bold text-indigo-700">{subj.mid2}/30</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">No Coursework Records Uploaded</p>
                  <p>Semester subjects and internal assessment marks will be synced after department evaluation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SKILLS & ASPIRATIONS */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                Career Focus & Higher Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Career Interests
                </span>
                <div className="flex flex-wrap gap-2">
                  {student?.careerInterests && student.careerInterests.length > 0 ? (
                    student.careerInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No career interests specified yet.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Higher Education Goal
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {student?.higherEducationAspirations || <span className="text-slate-400 italic">Not yet recorded</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical and Soft Skills */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Technical Competencies & Soft Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Desired Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student?.desiredTechnicalSkills && student.desiredTechnicalSkills.length > 0 ? (
                    student.desiredTechnicalSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No technical skills recorded yet.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Soft Skills & Strengths
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {((student?.softSkills || []).concat(student?.personalStrengths || [])).length > 0 ? (
                    (student?.softSkills || []).concat(student?.personalStrengths || []).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No soft skills or strengths recorded yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: ACHIEVEMENTS & CERTIFICATIONS */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Verified Certifications & Competitions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {((student?.certifications && student.certifications.length > 0) || (student?.competitions && student.competitions.length > 0)) ? (
                <>
                  {student?.certifications?.map((cert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs"
                    >
                      <Award className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">{cert}</p>
                        <span className="text-[10px] text-amber-700 font-medium">Verified by Department</span>
                      </div>
                    </div>
                  ))}

                  {student?.competitions?.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                      <p className="font-semibold text-slate-800">{comp}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No verified certifications or competitions uploaded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: MENTOR SUGGESTIONS */}
      {activeTab === 'mentor' && (
        <div className="space-y-4">
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-indigo-600" />
                Active Faculty Mentor Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDemo ? (
                <div className="p-3.5 rounded-2xl bg-white border border-indigo-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Advice from J. Siddhartha Varma:
                  </span>
                  <p className="text-slate-600 leading-relaxed italic">
                    “Continue LeetCode daily practice. Connect with Assistant Professor for paper survey guidance on Graph Neural Networks.”
                  </p>
                </div>
              ) : (
                <div className="p-4 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                  Faculty mentor advice notes will be logged here following your 1-on-1 mentoring sessions.
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Agreed Semester Development Goals
                </span>
                <div className="space-y-1.5">
                  {student?.developmentGoals && student.developmentGoals.length > 0 ? (
                    student.developmentGoals.map((goal, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{goal}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-white rounded-xl border border-slate-200">
                      No development goals set yet. These will be established during your initial mentor meeting.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
