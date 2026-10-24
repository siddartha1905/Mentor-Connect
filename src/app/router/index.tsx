import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { StudentLogin } from '@/features/authentication/StudentLogin'
import { AdminLogin } from '@/features/authentication/AdminLogin'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'

// Student layout & screens
import { StudentLayout } from '@/app/layouts/StudentLayout'
import { StudentHome } from '@/features/student/StudentHome'
import { StudentJourney } from '@/features/student/StudentJourney'
import { StudentCheckIn } from '@/features/student/StudentCheckIn'
import { StudentMessages } from '@/features/student/StudentMessages'
import { StudentMore } from '@/features/student/StudentMore'
import { StudentProfileView } from '@/features/student/StudentProfileView'
import { StudentDirectory } from '@/features/student/StudentDirectory'
import { StudentDocuments } from '@/features/student/StudentDocuments'
import { StudentCalendar } from '@/features/student/StudentCalendar'
import { StudentSurveys } from '@/features/student/StudentSurveys'

// Admin layout & screens
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { Mentor360View } from '@/features/mentor360/Mentor360View'
import { StudentList } from '@/features/admin/StudentList'
import { ApprovalCentre } from '@/features/approvals/ApprovalCentre'
import { AttendanceManagement } from '@/features/attendance/AttendanceManagement'
import { AcademicManagement } from '@/features/academics/AcademicManagement'
import { MentoringWorkflow } from '@/features/mentoring/MentoringWorkflow'
import { AdminCommunication } from '@/features/communication/AdminCommunication'
import { AutomatedMentor } from '@/features/automation/AutomatedMentor'
import { GrowthActivities } from '@/features/admin/GrowthActivities'
import { SurveyManagement } from '@/features/surveys/SurveyManagement'
import { ReportsManagement } from '@/features/reports/ReportsManagement'
import { AdminSettings } from '@/features/admin/AdminSettings'

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
        element: <StudentHome />,
      },
      {
        path: 'journey',
        element: <StudentJourney />,
      },
      {
        path: 'check-in',
        element: <StudentCheckIn />,
      },
      {
        path: 'messages',
        element: <StudentMessages />,
      },
      {
        path: 'more',
        element: <StudentMore />,
      },
      {
        path: 'profile',
        element: <StudentProfileView />,
      },
      {
        path: 'directory',
        element: <StudentDirectory />,
      },
      {
        path: 'documents',
        element: <StudentDocuments />,
      },
      {
        path: 'calendar',
        element: <StudentCalendar />,
      },
      {
        path: 'surveys',
        element: <StudentSurveys />,
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
        element: <AdminDashboard />,
      },
      {
        path: 'mentor360',
        element: <Mentor360View />,
      },
      {
        path: 'students',
        element: <StudentList />,
      },
      {
        path: 'approvals',
        element: <ApprovalCentre />,
      },
      {
        path: 'attendance',
        element: <AttendanceManagement />,
      },
      {
        path: 'academics',
        element: <AcademicManagement />,
      },
      {
        path: 'mentoring',
        element: <MentoringWorkflow />,
      },
      {
        path: 'communication',
        element: <AdminCommunication />,
      },
      {
        path: 'automation',
        element: <AutomatedMentor />,
      },
      {
        path: 'growth',
        element: <GrowthActivities />,
      },
      {
        path: 'surveys',
        element: <SurveyManagement />,
      },
      {
        path: 'reports',
        element: <ReportsManagement />,
      },
      {
        path: 'settings',
        element: <AdminSettings />,
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
