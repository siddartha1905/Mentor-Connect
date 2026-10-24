import * as React from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ArrowLeft, CheckCircle2, Send, Clock, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_SURVEYS } from '@/data/mock'

export const StudentSurveys: React.FC = () => {
  const [selectedSurvey, setSelectedSurvey] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  // Sample survey answer state
  const [q1Rating, setQ1Rating] = React.useState(4)
  const [q2Elective, setQ2Elective] = React.useState('Deep Learning Foundations')
  const [q3Comments, setQ3Comments] = React.useState('')

  const activeSurvey = MOCK_SURVEYS.find((s) => s.id === selectedSurvey) || MOCK_SURVEYS[0]

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student/more"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to More</span>
        </Link>
        <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-bold">
          Surveys Hub
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-indigo-600" />
          Forms & Surveys
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Departmental check-ins, course feedback forms and elective polls.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Stage 1 Interactive Form Preview. Submissions are staged in memory; Supabase storage will connect in Stage 2."
      />

      {/* Available Surveys List */}
      <div className="grid gap-3">
        {MOCK_SURVEYS.map((survey) => (
          <Card
            key={survey.id}
            className={`p-4 transition-all cursor-pointer ${
              selectedSurvey === survey.id
                ? 'border-indigo-500 ring-2 ring-indigo-100'
                : 'hover:border-slate-300'
            }`}
            onClick={() => {
              setSelectedSurvey(survey.id)
              setSubmitted(false)
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={survey.status === 'Active' ? 'good' : 'locked'}>
                    {survey.status}
                  </Badge>
                  <span className="text-[10px] text-slate-400">Deadline: {survey.deadline}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{survey.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{survey.description}</p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{survey.questionsCount} Questions</span>
              <span className="text-indigo-600 font-semibold">
                {survey.responseCount}/{survey.totalEligible} Mentees Responded
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Interactive Sample Response Form */}
      <Card className="border-indigo-100 mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Sample Form Response: {activeSurvey.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="py-6 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Survey Response Staged (Demo)</h4>
              <p className="text-xs text-slate-500">
                Your feedback has been captured in memory. Thank you for contributing to departmental planning.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs"
              >
                Reset Response
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSurveySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. How would you rate the clarity of Semester 2-1 DBMS & DSA laboratory experiments?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setQ1Rating(star)}
                      className={`h-9 w-9 rounded-xl font-bold border transition-all ${
                        q1Rating === star
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Select your preferred professional elective track for upcoming semester:
                </label>
                <select
                  value={q2Elective}
                  onChange={(e) => setQ2Elective(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500"
                >
                  <option value="Deep Learning Foundations">Deep Learning & Computer Vision Foundations</option>
                  <option value="Big Data Engineering">Big Data Engineering & Apache Spark Architecture</option>
                  <option value="Cloud Native Applications">Cloud Native Scalable Architectures</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Any specific recommendations for your faculty mentor? (Optional)
                </label>
                <textarea
                  rows={2}
                  value={q3Comments}
                  onChange={(e) => setQ3Comments(e.target.value)}
                  placeholder="Suggestions regarding weekly tutorial practice sessions..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <Button type="submit" variant="primary" size="sm" className="w-full">
                <Send className="h-3.5 w-3.5 mr-1" />
                Submit Form Feedback (Mock)
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
