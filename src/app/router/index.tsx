import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { StudentLogin } from '@/features/authentication/StudentLogin'
import { AdminLogin } from '@/features/authentication/AdminLogin'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'

// Layouts
import { StudentLayout } from '@/app/layouts/StudentLayout'
import { AdminLayout } from '@/app/layouts/AdminLayout'

// Elegant Route Loading Spinner
const RouteLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-400">Loading view...</span>
  </div>
)

const withSuspense = (Component: React.ComponentType) => (
  <React.Suspense fallback={<RouteLoader />}>
    <Component />
  </React.Suspense>
)

// Lazy-loaded Student Screens (Code-Splitting for Performance)
const StudentHome = React.lazy(() => import('@/features/student/StudentHome').then(m => ({ default: m.StudentHome })))
const StudentJourney = React.lazy(() => import('@/features/student/StudentJourney').then(m => ({ default: m.StudentJourney })))
const StudentCheckIn = React.lazy(() => import('@/features/student/StudentCheckIn').then(m => ({ default: m.StudentCheckIn })))
const StudentMessages = React.lazy(() => import('@/features/student/StudentMessages').then(m => ({ default: m.StudentMessages })))
const StudentMore = React.lazy(() => import('@/features/student/StudentMore').then(m => ({ default: m.StudentMore })))
const StudentProfileView = React.lazy(() => import('@/features/student/StudentProfileView').then(m => ({ default: m.StudentProfileView })))
const StudentDirectory = React.lazy(() => import('@/features/student/StudentDirectory').then(m => ({ default: m.StudentDirectory })))
const StudentDocuments = React.lazy(() => import('@/features/student/StudentDocuments').then(m => ({ default: m.StudentDocuments })))
const StudentCalendar = React.lazy(() => import('@/features/student/StudentCalendar').then(m => ({ default: m.StudentCalendar })))
const StudentSurveys = React.lazy(() => import('@/features/student/StudentSurveys').then(m => ({ default: m.StudentSurveys })))

// Lazy-loaded Admin Screens (Heavy Chart & Table Modules)
const AdminDashboard = React.lazy(() => import('@/features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const Mentor360View = React.lazy(() => import('@/features/mentor360/Mentor360View').then(m => ({ default: m.Mentor360View })))
const StudentList = React.lazy(() => import('@/features/admin/StudentList').then(m => ({ default: m.StudentList })))
const ApprovalCentre = React.lazy(() => import('@/features/approvals/ApprovalCentre').then(m => ({ default: m.ApprovalCentre })))
const AttendanceManagement = React.lazy(() => import('@/features/attendance/AttendanceManagement').then(m => ({ default: m.AttendanceManagement })))
const AcademicManagement = React.lazy(() => import('@/features/academics/AcademicManagement').then(m => ({ default: m.AcademicManagement })))
const MentoringWorkflow = React.lazy(() => import('@/features/mentoring/MentoringWorkflow').then(m => ({ default: m.MentoringWorkflow })))
const AdminCommunication = React.lazy(() => import('@/features/communication/AdminCommunication').then(m => ({ default: m.AdminCommunication })))
const AutomatedMentor = React.lazy(() => import('@/features/automation/AutomatedMentor').then(m => ({ default: m.AutomatedMentor })))
const GrowthActivities = React.lazy(() => import('@/features/admin/GrowthActivities').then(m => ({ default: m.GrowthActivities })))
const SurveyManagement = React.lazy(() => import('@/features/surveys/SurveyManagement').then(m => ({ default: m.SurveyManagement })))
const ReportsManagement = React.lazy(() => import('@/features/reports/ReportsManagement').then(m => ({ default: m.ReportsManagement })))
const AdminSettings = React.lazy(() => import('@/features/admin/AdminSettings').then(m => ({ default: m.AdminSettings })))

export const router = createBrowserRouter([
  // Public Landing & Visual Auth
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login/student',
    element: <StudentLogin />,
  },
  {
    path: '/login/admin',
    element: <AdminLogin />,
  },

  // Student Mobile-first PWA Route Group
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student', 'admin']}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(StudentHome),
      },
      {
        path: 'journey',
        element: withSuspense(StudentJourney),
      },
      {
        path: 'check-in',
        element: withSuspense(StudentCheckIn),
      },
      {
        path: 'messages',
        element: withSuspense(StudentMessages),
      },
      {
        path: 'more',
        element: withSuspense(StudentMore),
      },
      {
        path: 'profile',
        element: withSuspense(StudentProfileView),
      },
      {
        path: 'directory',
        element: withSuspense(StudentDirectory),
      },
      {
        path: 'documents',
        element: withSuspense(StudentDocuments),
      },
      {
        path: 'calendar',
        element: withSuspense(StudentCalendar),
      },
      {
        path: 'surveys',
        element: withSuspense(StudentSurveys),
      },
    ],
  },

  // Administrator Desktop-optimized Route Group
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(AdminDashboard),
      },
      {
        path: 'mentor360',
        element: withSuspense(Mentor360View),
      },
      {
        path: 'students',
        element: withSuspense(StudentList),
      },
      {
        path: 'approvals',
        element: withSuspense(ApprovalCentre),
      },
      {
        path: 'attendance',
        element: withSuspense(AttendanceManagement),
      },
      {
        path: 'academics',
        element: withSuspense(AcademicManagement),
      },
      {
        path: 'mentoring',
        element: withSuspense(MentoringWorkflow),
      },
      {
        path: 'communication',
        element: withSuspense(AdminCommunication),
      },
      {
        path: 'automation',
        element: withSuspense(AutomatedMentor),
      },
      {
        path: 'growth',
        element: withSuspense(GrowthActivities),
      },
      {
        path: 'surveys',
        element: withSuspense(SurveyManagement),
      },
      {
        path: 'reports',
        element: withSuspense(ReportsManagement),
      },
      {
        path: 'settings',
        element: withSuspense(AdminSettings),
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
