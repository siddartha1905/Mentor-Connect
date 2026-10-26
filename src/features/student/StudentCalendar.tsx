import * as React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, MapPin, User, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentCalendar: React.FC = () => {
  const { isDemo } = useAuth()
  const upcomingSlots = isDemo ? [
    {
      date: 'Wednesday, 28 Oct 2026',
      time: '03:45 PM – 04:15 PM IST',
      faculty: 'J. Siddhartha Varma (Faculty Mentor)',
      venue: 'Faculty Cabin #204, CSE-DS Department Block',
      status: 'Confirmed',
      topic: 'Semester 2-1 Academic Review & Kaggle EDA Submission',
    },
    {
      date: 'Thursday, 12 Nov 2026',
      time: '04:00 PM – 04:30 PM IST',
      faculty: 'J. Siddhartha Varma (Faculty Mentor)',
      venue: 'Faculty Cabin #204',
      status: 'Tentative',
      topic: 'Mid-1 Assessment Mark Analysis & Backlog Check',
    },
  ] : []

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-bold">
          Semester Schedule
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-indigo-600" />
          Mentoring Calendar & Office Hours
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Weekly counselling appointment slots and mentor availability.
        </p>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Mentoring appointments schedule preview."
        />
      )}

      <div className="space-y-3">
        {upcomingSlots.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Mentoring Sessions Scheduled</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your faculty mentor will publish available 1-on-1 office hours and review slots here.
            </p>
          </div>
        ) : (
          upcomingSlots.map((slot, idx) => (
          <Card key={idx} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {slot.time}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{slot.date}</h3>
              </div>
              <Badge variant={slot.status === 'Confirmed' ? 'approved' : 'pending'}>
                {slot.status}
              </Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <p className="font-semibold text-slate-800">{slot.topic}</p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  {slot.faculty}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {slot.venue}
                </span>
              </div>
            </div>
          </Card>
        )))}
      </div>
    </div>
  )
}
