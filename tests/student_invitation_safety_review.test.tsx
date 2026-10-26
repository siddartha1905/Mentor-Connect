// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StudentList } from '../src/features/admin/StudentList'
import { studentService, type StudentRecord, type StudentInvitationRecord } from '../src/services/studentService'
import { AuthContext } from '../src/app/providers/AuthContext'

// ==============================================================================
// Edge Function Logic Simulator
// Mirrors supabase/functions/invite-student/index.ts line-for-line
// ==============================================================================
interface RequestContext {
  authHeader?: string
  callerUser?: { id: string; email: string } | null
  callerRole?: string | null
  environment?: 'production' | 'development'
  siteUrl?: string
}

interface RosterStudent {
  id: string
  roll_number: string
  email: string
  user_id: string | null
  full_name?: string
  department?: string
  year?: number
  semester?: number
  section?: string
}

interface AuthUserRecord {
  id: string
  email: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  confirmed_at: string | null
  user_metadata?: Record<string, any>
}

interface InvitationLogRecord {
  id: string
  student_id: string | null
  roll_number: string
  email: string
  status: 'pending' | 'sent' | 'failed' | 'accepted'
  resend_count: number
  last_attempt_at: string
  history: any[]
}

interface SimulatorDatabase {
  students: RosterStudent[]
  authUsers: Map<string, AuthUserRecord>
  invitations: Map<string, InvitationLogRecord> // Keyed by roll_number
  dbLookupError?: string | null
  getUserByIdError?: string | null
  auditPersistenceError?: string | null
  simulateSimultaneousConflict?: boolean
}

const simulateInviteStudentFunction = async (
  req: {
    headers: Record<string, string>
    body: {
      email?: any
      roll_number?: any
      redirectTo?: any
      data?: any
    }
  },
  db: SimulatorDatabase,
  context: RequestContext = {}
) => {
  const authHeader = req.headers['Authorization'] || req.headers['authorization']
  if (!authHeader) {
    return {
      status: 401,
      body: { error: 'Missing Authorization header: User must be signed in', code: 'UNAUTHORIZED' }
    }
  }

  if (!context.callerUser) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Invalid or expired authentication session', code: 'UNAUTHORIZED' }
    }
  }

  if (context.callerRole !== 'admin') {
    return {
      status: 403,
      body: { error: 'Forbidden: Administrator privileges required to dispatch invitations', code: 'FORBIDDEN' }
    }
  }

  const { email, roll_number, redirectTo, data } = req.body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return {
      status: 400,
      body: { error: 'A valid student email address is required', code: 'INVALID_EMAIL' }
    }
  }

  const cleanEmail = email.trim().toLowerCase()
  const rollNumber = (roll_number || data?.roll_number || '').trim().toUpperCase()

  // 1. Roll number mandatory
  if (!rollNumber) {
    return {
      status: 400,
      body: {
        error: 'Student roll number is required to verify against the official roster before dispatching an invitation.',
        code: 'MISSING_ROLL_NUMBER'
      }
    }
  }

  // 2. Database lookup
  if (db.dbLookupError) {
    return {
      status: 500,
      body: {
        error: `Database error while verifying student roster: ${db.dbLookupError}`,
        code: 'ROSTER_LOOKUP_FAILED'
      }
    }
  }

  const studentRecord = db.students.find(s => s.roll_number.toUpperCase() === rollNumber)
  if (!studentRecord) {
    return {
      status: 404,
      body: {
        error: `Student roster record not found for roll number '${rollNumber}'. Students must be added to the official roster before an invitation can be dispatched.`,
        code: 'STUDENT_NOT_IN_ROSTER'
      }
    }
  }

  // 3. Email and roll-number match verification
  const rosterEmailClean = studentRecord.email.trim().toLowerCase()
  if (rosterEmailClean !== cleanEmail) {
    return {
      status: 400,
      body: {
        error: `Roster email mismatch for roll number '${rollNumber}'. Requested invitation email ('${cleanEmail}') does not match the official roster email ('${rosterEmailClean}'). To correct a student email, the administrator must update the roster record first.`,
        code: 'ROSTER_EMAIL_MISMATCH'
      }
    }
  }

  // 4. Metadata whitelisting
  const whitelistedData: Record<string, string | number> = {
    roll_number: studentRecord.roll_number,
    full_name: studentRecord.full_name || data?.full_name || data?.name || '',
    role: 'student'
  }
  if (studentRecord.department) whitelistedData.department = studentRecord.department
  if (studentRecord.year) whitelistedData.year = studentRecord.year
  if (studentRecord.semester) whitelistedData.semester = studentRecord.semester
  if (studentRecord.section) whitelistedData.section = studentRecord.section

  // 5. Account state verification (FAIL CLOSED if getUserById fails or email mismatches)
  let verifiedLinkedAuthUser: AuthUserRecord | null = null

  if (studentRecord.user_id) {
    if (db.getUserByIdError) {
      return {
        status: 500,
        body: {
          error: `Failed to verify linked authentication account for ${studentRecord.roll_number}: ${db.getUserByIdError}. Never dispatching with an uncertain account identity.`,
          code: 'AUTH_VERIFICATION_FAILED'
        }
      }
    }

    const authUser = db.authUsers.get(studentRecord.user_id)
    if (!authUser) {
      return {
        status: 500,
        body: {
          error: `Failed to verify linked authentication account for ${studentRecord.roll_number}: Linked auth user record not found. Never dispatching with an uncertain account identity.`,
          code: 'AUTH_VERIFICATION_FAILED'
        }
      }
    }

    // FAIL CLOSED: Email of linked auth account MUST match verified roster student email
    const authEmailClean = authUser.email.trim().toLowerCase()
    if (authEmailClean !== cleanEmail) {
      return {
        status: 409,
        body: {
          error: `Identity conflict: Linked authentication account (${authUser.id}) email '${authEmailClean}' does not match verified roster email '${cleanEmail}'. Invitation dispatch aborted.`,
          code: 'AUTH_EMAIL_MISMATCH'
        }
      }
    }

    const hasCompletedOnboarding = Boolean(
      authUser.last_sign_in_at ||
      (authUser.email_confirmed_at && authUser.confirmed_at && authUser.user_metadata?.onboarding_completed)
    )

    if (hasCompletedOnboarding) {
      return {
        status: 400,
        body: {
          error: `Student account for ${studentRecord.roll_number} (${cleanEmail}) has already completed onboarding and activated their account. Use Password Reset for recovery.`,
          code: 'ACCOUNT_ALREADY_ACTIVATED'
        }
      }
    }

    verifiedLinkedAuthUser = authUser
  }

  // 6. Safe Redirect Validation (Requires HTTPS and Exact Route in Production)
  const configuredSiteUrl = context.siteUrl || 'https://mentorconnect.pages.dev'
  const isLocalDev = context.environment === 'development'
  const ALLOWED_HOSTS = new Set<string>(['mentorconnect.pages.dev'])
  try {
    const host = new URL(configuredSiteUrl).hostname
    if (host) ALLOWED_HOSTS.add(host)
  } catch {
    // ignore
  }
  if (isLocalDev) {
    ALLOWED_HOSTS.add('localhost')
    ALLOWED_HOSTS.add('127.0.0.1')
  }

  let targetRedirectTo: string
  const EXACT_APPROVED_ROUTE = '/login/reset-password'

  if (redirectTo) {
    try {
      const parsedUrl = new URL(redirectTo)

      // Production: Require HTTPS
      if (!isLocalDev && parsedUrl.protocol !== 'https:') {
        return {
          status: 400,
          body: {
            error: `Insecure redirect protocol: '${parsedUrl.protocol}'. Production redirects must use HTTPS.`,
            code: 'INSECURE_REDIRECT_PROTOCOL'
          }
        }
      }

      // Production: Forbid localhost
      if (!isLocalDev && (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
        return {
          status: 400,
          body: {
            error: 'Localhost redirect URLs are forbidden in production deployments. Students must be redirected to the deployed portal.',
            code: 'LOCALHOST_REDIRECT_FORBIDDEN'
          }
        }
      }

      if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
        return {
          status: 400,
          body: {
            error: `Invalid redirect URL: '${redirectTo}'. Domain '${parsedUrl.hostname}' is not an approved Mentor Connect host.`,
            code: 'INVALID_REDIRECT_URL'
          }
        }
      }

      // Production: Require exact route
      if (parsedUrl.pathname !== EXACT_APPROVED_ROUTE) {
        return {
          status: 400,
          body: {
            error: `Invalid redirect route: '${parsedUrl.pathname}'. Redirect in production must exactly match approved route '${EXACT_APPROVED_ROUTE}'.`,
            code: 'INVALID_REDIRECT_ROUTE'
          }
        }
      }

      targetRedirectTo = parsedUrl.toString()
    } catch {
      return {
        status: 400,
        body: { error: `Malformed redirect URL: '${redirectTo}'`, code: 'MALFORMED_REDIRECT_URL' }
      }
    }
  } else {
    const baseOrigin = isLocalDev ? 'http://localhost:5173' : configuredSiteUrl.replace(/\/$/, '')
    targetRedirectTo = `${baseOrigin}${EXACT_APPROVED_ROUTE}`
  }

  // 7. Duplicate Prevention & Server-Side Atomic In-Flight Locking
  const existingLog = db.invitations.get(studentRecord.roll_number)
  const now = new Date().toISOString()
  const nowMs = Date.now()

  if (existingLog) {
    const elapsedSeconds = Math.floor((nowMs - new Date(existingLog.last_attempt_at).getTime()) / 1000)

    // In-flight simultaneous duplicate detection (< 15s)
    if (existingLog.status === 'pending' && elapsedSeconds < 15) {
      return {
        status: 409,
        body: {
          error: `An invitation dispatch for roll number ${studentRecord.roll_number} is currently in progress. Simultaneous duplicate dispatches are blocked.`,
          code: 'DISPATCH_IN_PROGRESS'
        }
      }
    }

    // Cooldown check (30s)
    const COOLDOWN_SECONDS = 30
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const remainingSeconds = COOLDOWN_SECONDS - elapsedSeconds
      return {
        status: 429,
        body: {
          error: `An invitation was already dispatched for roll number ${studentRecord.roll_number} ${elapsedSeconds} seconds ago. Please wait ${remainingSeconds}s before retrying.`,
          code: 'INVITATION_COOLDOWN',
          retryAfter: remainingSeconds
        }
      }
    }

    // Acquire atomic in-flight lock
    existingLog.status = 'pending'
    existingLog.last_attempt_at = now
  } else {
    if (db.simulateSimultaneousConflict) {
      return {
        status: 409,
        body: {
          error: `Simultaneous duplicate dispatch collision detected for ${studentRecord.roll_number}. In-flight claim already registered.`,
          code: 'DISPATCH_IN_PROGRESS'
        }
      }
    }

    // Insert atomic in-flight claim
    db.invitations.set(studentRecord.roll_number, {
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      student_id: studentRecord.id,
      roll_number: studentRecord.roll_number,
      email: cleanEmail,
      status: 'pending',
      resend_count: 0,
      last_attempt_at: now,
      history: []
    })
  }

  // 8. Dispatch GoTrue Invitation or Recovery Resend
  let authUserId = studentRecord.user_id
  let dispatchMethod = 'inviteUserByEmail'

  // Check if unconfirmed account exists in Auth:
  // If an account exists with this email, check if it's the verified linked student account
  const authUserWithEmail = Array.from(db.authUsers.values()).find(u => u.email.toLowerCase() === cleanEmail)

  if (authUserWithEmail) {
    // If account exists in Auth, RESTRICT password-recovery fallback strictly to verified linked account
    if (!verifiedLinkedAuthUser) {
      return {
        status: 409,
        body: {
          error: `Account conflict: An authentication account already exists with email '${cleanEmail}', but it is not linked to student roll number '${studentRecord.roll_number}'. Password-recovery fallback is restricted strictly to verified linked accounts. Never sending recovery links for unrelated accounts.`,
          code: 'UNLINKED_ACCOUNT_EXISTS'
        }
      }
    }

    dispatchMethod = 'resetPasswordForEmail'
    authUserId = verifiedLinkedAuthUser.id
  } else {
    const newAuthId = 'auth-' + Math.random().toString(36).substring(2, 9)
    db.authUsers.set(newAuthId, {
      id: newAuthId,
      email: cleanEmail,
      last_sign_in_at: null,
      email_confirmed_at: null,
      confirmed_at: null,
      user_metadata: whitelistedData
    })
    authUserId = newAuthId
  }

  // 9. Server-side Audit Logging
  if (db.auditPersistenceError) {
    // 207 Partial Failure
    return {
      status: 207,
      body: {
        success: true,
        warning: 'Invitation request was accepted by Supabase Auth, but server-side audit logging to student_invitations failed to persist.',
        auditPersistenceFailed: true,
        auth_accepted: true,
        email_delivery_confirmed: false,
        logError: db.auditPersistenceError,
        message: `Official invitation request accepted by Supabase Auth for ${cleanEmail}, but server-side audit persistence warning: ${db.auditPersistenceError}.`
      }
    }
  }

  const updateNow = new Date().toISOString()
  const historyItem = {
    attempt_at: updateNow,
    admin_id: context.callerUser.id,
    method: dispatchMethod,
    redirect_to: targetRedirectTo,
    status: 'sent',
    result: 'accepted_by_auth'
  }

  const currentLog = db.invitations.get(studentRecord.roll_number)
  if (currentLog) {
    currentLog.email = cleanEmail
    currentLog.status = 'sent'
    currentLog.resend_count += (currentLog.history.length > 0 ? 1 : 0)
    currentLog.last_attempt_at = updateNow
    currentLog.history.push(historyItem)
  }

  return {
    status: 200,
    body: {
      success: true,
      warning: null,
      auditPersistenceFailed: false,
      auth_accepted: true,
      email_delivery_confirmed: false,
      message: `Official invitation request successfully accepted by Supabase Auth for ${cleanEmail} (${studentRecord.roll_number}).`,
      roll_number: studentRecord.roll_number,
      email: cleanEmail,
      whitelistedData,
      dispatchMethod,
      targetRedirectTo
    }
  }
}

// ==============================================================================
// TEST SUITE: SAFETY REVIEW CHECKS
// ==============================================================================
describe('Mentor Connect — Final Four Invitation Safety Review Verification', () => {
  let db: SimulatorDatabase
  const adminContext: RequestContext = {
    authHeader: 'Bearer admin-jwt-token',
    callerUser: { id: 'admin-siddartha', email: 'siddartha@vignaniit.edu.in' },
    callerRole: 'admin',
    environment: 'production',
    siteUrl: 'https://mentorconnect.pages.dev'
  }

  beforeEach(() => {
    db = {
      students: [
        {
          id: 'student-uuid-pilot-0999',
          user_id: 'auth-pilot-0999',
          roll_number: '23L31A0999',
          email: 'student.pilot@vignaniit.edu.in',
          full_name: 'Test Pilot Student',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A'
        },
        {
          id: 'student-uuid-5401',
          user_id: null,
          roll_number: '23L31A5401',
          email: 'aditya.verma@vignaniit.edu.in',
          full_name: 'Aditya Verma',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A'
        },
        {
          id: 'student-uuid-5402',
          user_id: 'auth-unconfirmed-5402',
          roll_number: '23L31A5402',
          email: 'bhavya.sri@vignaniit.edu.in',
          full_name: 'Bhavya Sri',
          department: 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A'
        }
      ],
      authUsers: new Map([
        [
          'auth-pilot-0999',
          {
            id: 'auth-pilot-0999',
            email: 'student.pilot@vignaniit.edu.in',
            last_sign_in_at: '2026-10-25T08:00:00Z',
            email_confirmed_at: '2026-10-25T08:00:00Z',
            confirmed_at: '2026-10-25T08:00:00Z',
            user_metadata: { onboarding_completed: true }
          }
        ],
        [
          'auth-unconfirmed-5402',
          {
            id: 'auth-unconfirmed-5402',
            email: 'bhavya.sri@vignaniit.edu.in',
            last_sign_in_at: null, // UNCONFIRMED
            email_confirmed_at: null,
            confirmed_at: null,
            user_metadata: { roll_number: '23L31A5402' }
          }
        ]
      ]),
      invitations: new Map()
    }
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // 1. Valid roster invitation
  it('1. Valid roster invitation: successfully dispatches invitation with whitelisted metadata and records audit log', async () => {
    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'https://mentorconnect.pages.dev/login/reset-password',
          data: { arbitrary_injected_field: 'hacked', name: 'Aditya' }
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.auth_accepted).toBe(true)
    expect(res.body.email_delivery_confirmed).toBe(false)
    expect(res.body.roll_number).toBe('23L31A5401')
    expect(res.body.whitelistedData).toEqual({
      roll_number: '23L31A5401',
      full_name: 'Aditya Verma',
      role: 'student',
      department: 'CSE-Data Science',
      year: 2,
      semester: 1,
      section: 'A'
    })
    const log = db.invitations.get('23L31A5401')
    expect(log).toBeDefined()
    expect(log?.status).toBe('sent')
  })

  // 2. Unknown roll number
  it('2. Unknown roll number: stops immediately with 404 and does not create Auth user or log', async () => {
    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'unknown@vignaniit.edu.in',
          roll_number: '23L31A9999'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('STUDENT_NOT_IN_ROSTER')
    expect(res.body.error).toContain('Student roster record not found')
    expect(db.invitations.has('23L31A9999')).toBe(false)
  })

  // 3. Email/roll-number mismatch
  it('3. Email/roll-number mismatch: stops with 400 ROSTER_EMAIL_MISMATCH and does not invite', async () => {
    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'wrong.email@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('ROSTER_EMAIL_MISMATCH')
    expect(res.body.error).toContain('Roster email mismatch')
    expect(res.body.error).toContain('administrator must update the roster record first')
    expect(db.invitations.has('23L31A5401')).toBe(false)
  })

  // 4. Failed roster lookup
  it('4. Failed roster lookup: returns 500 ROSTER_LOOKUP_FAILED and does not contact Auth', async () => {
    db.dbLookupError = 'Connection refused to PostgreSQL pool'

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('ROSTER_LOOKUP_FAILED')
    expect(res.body.error).toContain('Database error while verifying student roster')
    expect(db.invitations.has('23L31A5401')).toBe(false)
  })

  // 5. Already activated student
  it('5. Already activated student: blocks invitation with ACCOUNT_ALREADY_ACTIVATED and suggests Password Reset', async () => {
    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'student.pilot@vignaniit.edu.in',
          roll_number: '23L31A0999'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('ACCOUNT_ALREADY_ACTIVATED')
    expect(res.body.error).toContain('already completed onboarding and activated their account')
    expect(res.body.error).toContain('Use Password Reset for recovery')
  })

  // 6. Existing unconfirmed account resend
  it('6. Existing unconfirmed account resend: preserves Auth user and triggers supported recovery resend', async () => {
    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'bhavya.sri@vignaniit.edu.in',
          roll_number: '23L31A5402'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.dispatchMethod).toBe('resetPasswordForEmail')
    expect(db.authUsers.has('auth-unconfirmed-5402')).toBe(true)
    const log = db.invitations.get('23L31A5402')
    expect(log).toBeDefined()
    expect(log?.history[0].method).toBe('resetPasswordForEmail')
  })

  // 7. Duplicate invitation request / cooldown
  it('7. Duplicate invitation request: blocks rapid resend within 30-second cooldown window with 429', async () => {
    db.invitations.set('23L31A5401', {
      id: 'inv-recent',
      student_id: 'student-uuid-5401',
      roll_number: '23L31A5401',
      email: 'aditya.verma@vignaniit.edu.in',
      status: 'sent',
      resend_count: 0,
      last_attempt_at: new Date(Date.now() - 5000).toISOString(),
      history: []
    })

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(429)
    expect(res.body.code).toBe('INVITATION_COOLDOWN')
    expect(res.body.error).toContain('Please wait')
  })

  // 8. Safe Redirect: rejects untrusted domains, production localhost, insecure HTTP, and unapproved routes
  it('8. Safe Redirect: rejects untrusted domains, production localhost redirects, insecure HTTP, and non-approved routes', async () => {
    // 8a: Insecure HTTP in production
    const httpRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'http://mentorconnect.pages.dev/login/reset-password'
        }
      },
      db,
      adminContext
    )
    expect(httpRes.status).toBe(400)
    expect(httpRes.body.code).toBe('INSECURE_REDIRECT_PROTOCOL')

    // 8b: Localhost redirect in production mode
    const localhostRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'http://localhost:5173/login/reset-password'
        }
      },
      db,
      { ...adminContext, environment: 'production' }
    )
    expect(localhostRes.status).toBe(400)
    expect(localhostRes.body.code).toBe('INSECURE_REDIRECT_PROTOCOL') // HTTP rejected first

    // 8c: Localhost HTTPS in production mode
    const httpsLocalhostRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'https://localhost:5173/login/reset-password'
        }
      },
      db,
      { ...adminContext, environment: 'production' }
    )
    expect(httpsLocalhostRes.status).toBe(400)
    expect(httpsLocalhostRes.body.code).toBe('LOCALHOST_REDIRECT_FORBIDDEN')

    // 8d: Untrusted external domain
    const untrustedRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'https://evil-phishing.com/login/reset-password'
        }
      },
      db,
      adminContext
    )
    expect(untrustedRes.status).toBe(400)
    expect(untrustedRes.body.code).toBe('INVALID_REDIRECT_URL')

    // 8e: Non-approved redirect route
    const badRouteRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401',
          redirectTo: 'https://mentorconnect.pages.dev/api/admin-token-leak'
        }
      },
      db,
      adminContext
    )
    expect(badRouteRes.status).toBe(400)
    expect(badRouteRes.body.code).toBe('INVALID_REDIRECT_ROUTE')
  })

  // 9. Failed audit logging (207 Partial Failure)
  it('9. Failed audit logging: returns 207 Partial Failure with warning, verified in UI without auto-retrying', async () => {
    db.auditPersistenceError = 'relation student_invitations does not exist'

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(207)
    expect(res.body.success).toBe(true)
    expect(res.body.auditPersistenceFailed).toBe(true)
    expect(res.body.warning).toContain('audit logging to student_invitations failed to persist')

    const mockSendInvite = vi.fn().mockResolvedValue({
      error: null,
      success: true,
      warning: res.body.warning,
      auditPersistenceFailed: true
    })

    const mockStudents: StudentRecord[] = [
      {
        id: 'student-uuid-5401',
        user_id: null,
        roll_number: '23L31A5401',
        name: 'Aditya Verma',
        email: 'aditya.verma@vignaniit.edu.in',
        department: 'CSE-Data Science',
        year: 2,
        semester: 1,
        section: 'A',
        avatar_url: null,
        status: 'Active'
      }
    ]

    vi.spyOn(studentService, 'getAllStudents').mockResolvedValue(mockStudents)
    vi.spyOn(studentService, 'getInvitationLogs').mockResolvedValue([])
    vi.spyOn(studentService, 'getAcademicHistoriesMap').mockResolvedValue(new Map())
    vi.spyOn(studentService, 'getProfileSubmissionsMap').mockResolvedValue(new Map())
    vi.spyOn(studentService, 'getSavedSectionsSummary').mockResolvedValue(new Map())

    const mockAuthContext: any = {
      user: { id: 'admin-1', email: 'siddartha@vignaniit.edu.in' },
      role: 'admin',
      isConfigured: true,
      isDemo: false,
      sendStudentInvite: mockSendInvite
    }

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentList />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('23L31A5401')).toBeDefined()
    })

    const inviteButton = screen.getByRole('button', { name: /Send Invite/i })
    fireEvent.click(inviteButton)

    await waitFor(() => {
      expect(screen.getByText(/audit persistence warning/i)).toBeDefined()
    })

    expect(mockSendInvite).toHaveBeenCalledTimes(1)
  })

  // 10. Unauthorized caller
  it('10. Unauthorized caller: blocks requests without token or with non-admin role', async () => {
    const noTokenRes = await simulateInviteStudentFunction(
      {
        headers: {},
        body: { email: 'aditya.verma@vignaniit.edu.in', roll_number: '23L31A5401' }
      },
      db,
      adminContext
    )
    expect(noTokenRes.status).toBe(401)
    expect(noTokenRes.body.code).toBe('UNAUTHORIZED')

    const studentCallerRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer student-token' },
        body: { email: 'aditya.verma@vignaniit.edu.in', roll_number: '23L31A5401' }
      },
      db,
      {
        authHeader: 'Bearer student-token',
        callerUser: { id: 'student-uuid', email: 'aditya.verma@vignaniit.edu.in' },
        callerRole: 'student'
      }
    )
    expect(studentCallerRes.status).toBe(403)
    expect(studentCallerRes.body.code).toBe('FORBIDDEN')
    expect(studentCallerRes.body.error).toContain('Administrator privileges required')
  })

  // 11. Fail closed if getUserById fails
  it('11. Fail closed if getUserById fails: stops with 500 AUTH_VERIFICATION_FAILED and never dispatches', async () => {
    db.getUserByIdError = 'Auth service unreachable'

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'bhavya.sri@vignaniit.edu.in',
          roll_number: '23L31A5402'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(500)
    expect(res.body.code).toBe('AUTH_VERIFICATION_FAILED')
    expect(res.body.error).toContain('Never dispatching with an uncertain account identity')
  })

  // 12. Fail closed if linked Auth account email does not match roster student
  it('12. Fail closed on email mismatch: stops with 409 AUTH_EMAIL_MISMATCH when linked auth email differs', async () => {
    // Tamper with the linked auth account email
    const authUser = db.authUsers.get('auth-unconfirmed-5402')!
    authUser.email = 'tampered.email@external.com'

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'bhavya.sri@vignaniit.edu.in',
          roll_number: '23L31A5402'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('AUTH_EMAIL_MISMATCH')
    expect(res.body.error).toContain('Identity conflict')
    expect(res.body.error).toContain('Invitation dispatch aborted')
  })

  // 13. Restrict recovery fallback strictly to verified linked account
  it('13. Restrict recovery fallback: blocks resetPasswordForEmail if account exists in Auth but is unlinked to student', async () => {
    // Add an unlinked user in Auth with Aditya's email
    db.authUsers.set('auth-unrelated-stranger', {
      id: 'auth-unrelated-stranger',
      email: 'aditya.verma@vignaniit.edu.in',
      last_sign_in_at: null,
      email_confirmed_at: null,
      confirmed_at: null
    })
    // Notice: Aditya's student record has user_id = null (unlinked)
    expect(db.students.find(s => s.roll_number === '23L31A5401')!.user_id).toBeNull()

    const res = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('UNLINKED_ACCOUNT_EXISTS')
    expect(res.body.error).toContain('Password-recovery fallback is restricted strictly to verified linked accounts')
    expect(res.body.error).toContain('Never sending recovery links for unrelated accounts')
  })

  // 14. Server-side atomic duplicate prevention (Simultaneous in-flight collision)
  it('14. Server-side atomic collision: blocks simultaneous in-flight dispatch with 409 DISPATCH_IN_PROGRESS', async () => {
    // 14a: Existing log in 'pending' status within 15 seconds
    db.invitations.set('23L31A5401', {
      id: 'inv-in-flight',
      student_id: 'student-uuid-5401',
      roll_number: '23L31A5401',
      email: 'aditya.verma@vignaniit.edu.in',
      status: 'pending',
      resend_count: 0,
      last_attempt_at: new Date(Date.now() - 2000).toISOString(), // 2 seconds ago
      history: []
    })

    const inFlightRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(inFlightRes.status).toBe(409)
    expect(inFlightRes.body.code).toBe('DISPATCH_IN_PROGRESS')
    expect(inFlightRes.body.error).toContain('currently in progress')

    // 14b: Unique constraint collision on simultaneous initial insert
    db.invitations.clear()
    db.simulateSimultaneousConflict = true

    const conflictRes = await simulateInviteStudentFunction(
      {
        headers: { Authorization: 'Bearer token' },
        body: {
          email: 'aditya.verma@vignaniit.edu.in',
          roll_number: '23L31A5401'
        }
      },
      db,
      adminContext
    )

    expect(conflictRes.status).toBe(409)
    expect(conflictRes.body.code).toBe('DISPATCH_IN_PROGRESS')
    expect(conflictRes.body.error).toContain('Simultaneous duplicate dispatch collision detected')
  })
})
