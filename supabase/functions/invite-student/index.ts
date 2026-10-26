import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[invite-student] 401: Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header: User must be signed in', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseServiceRoleKey) {
      console.error('[invite-student] 500: SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not configured', code: 'CONFIG_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Authenticate caller JWT
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    const { data: { user }, error: userError } = await supabaseCaller.auth.getUser(token)
    if (userError || !user) {
      console.error('[invite-student] 401: Session authentication failed:', userError?.message || 'No user')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired authentication session', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Privileged admin client using SERVICE_ROLE_KEY (strictly server-side, never exposed to browser)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 3. Authorize caller: Verify role = 'admin' in public.user_roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || roleData?.role !== 'admin') {
      console.error('[invite-student] 403: Caller is not admin. Role:', roleData?.role, 'Error:', roleError?.message)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Administrator privileges required to dispatch invitations', code: 'FORBIDDEN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request payload
    const body = await req.json().catch(() => ({}))
    const { email, redirectTo, data } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('[invite-student] 400: Invalid or missing email in payload')
      return new Response(
        JSON.stringify({ error: 'A valid student email address is required', code: 'INVALID_EMAIL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const rollNumber = (body.roll_number || data?.roll_number || '').trim().toUpperCase()

    // STRICT REQUIREMENT 1: Student roll number is mandatory
    if (!rollNumber) {
      console.error('[invite-student] 400: Missing roll number in payload')
      return new Response(
        JSON.stringify({
          error: 'Student roll number is required to verify against the official roster before dispatching an invitation.',
          code: 'MISSING_ROLL_NUMBER'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // STRICT REQUIREMENT 1: Roster record lookup & verification
    const { data: studentRecord, error: studentLookupErr } = await supabaseAdmin
      .from('students')
      .select('id, roll_number, email, user_id, full_name, department, year, semester, section')
      .eq('roll_number', rollNumber)
      .maybeSingle()

    if (studentLookupErr) {
      console.error('[invite-student] 500: Database error while verifying student roster:', studentLookupErr.message)
      return new Response(
        JSON.stringify({
          error: `Database error while verifying student roster: ${studentLookupErr.message}`,
          code: 'ROSTER_LOOKUP_FAILED'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!studentRecord) {
      console.warn(`[invite-student] 404: Student roll number '${rollNumber}' not found in public.students`)
      return new Response(
        JSON.stringify({
          error: `Student roster record not found for roll number '${rollNumber}'. Students must be added to the official roster before an invitation can be dispatched.`,
          code: 'STUDENT_NOT_IN_ROSTER'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // STRICT REQUIREMENT 1: Verify roll number and email belong to the same roster student
    const rosterEmailClean = studentRecord.email.trim().toLowerCase()
    if (rosterEmailClean !== cleanEmail) {
      console.warn(`[invite-student] 400: Roster email mismatch for ${rollNumber}. Roster: '${rosterEmailClean}', Requested: '${cleanEmail}'`)
      return new Response(
        JSON.stringify({
          error: `Roster email mismatch for roll number '${rollNumber}'. Requested invitation email ('${cleanEmail}') does not match the official roster email ('${rosterEmailClean}'). To correct a student email, the administrator must update the roster record first.`,
          code: 'ROSTER_EMAIL_MISMATCH'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // STRICT REQUIREMENT 1: User metadata whitelisting
    const whitelistedData: Record<string, string | number> = {
      roll_number: studentRecord.roll_number,
      full_name: studentRecord.full_name || (typeof data?.full_name === 'string' ? data.full_name.trim() : (typeof data?.name === 'string' ? data.name.trim() : '')),
      role: 'student'
    }
    if (studentRecord.department) whitelistedData.department = studentRecord.department
    if (studentRecord.year) whitelistedData.year = studentRecord.year
    if (studentRecord.semester) whitelistedData.semester = studentRecord.semester
    if (studentRecord.section) whitelistedData.section = studentRecord.section

    // STRICT REQUIREMENT 1 & 2: Fail closed if getUserById() fails or linked Auth email mismatches
    let verifiedLinkedAuthUser: { id: string; email?: string } | null = null

    if (studentRecord.user_id) {
      const { data: authUserData, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(studentRecord.user_id)

      if (authUserErr || !authUserData?.user) {
        console.error(`[invite-student] 500: Failed to fetch linked Auth account (user_id: ${studentRecord.user_id}) for ${studentRecord.roll_number}:`, authUserErr?.message || 'No user')
        return new Response(
          JSON.stringify({
            error: `Failed to verify linked authentication account for ${studentRecord.roll_number}: ${authUserErr?.message || 'Linked auth user record not found'}. Never dispatching with an uncertain account identity.`,
            code: 'AUTH_VERIFICATION_FAILED'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const authUser = authUserData.user
      const authEmailClean = (authUser.email || '').trim().toLowerCase()

      // FAIL CLOSED: Email of linked auth account MUST match verified roster student email
      if (authEmailClean !== cleanEmail) {
        console.error(`[invite-student] 409: Linked auth user email '${authEmailClean}' does not match roster email '${cleanEmail}' for ${studentRecord.roll_number}`)
        return new Response(
          JSON.stringify({
            error: `Identity conflict: Linked authentication account (${authUser.id}) email '${authEmailClean}' does not match verified roster email '${cleanEmail}'. Invitation dispatch aborted.`,
            code: 'AUTH_EMAIL_MISMATCH'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hasCompletedOnboarding = Boolean(
        authUser.last_sign_in_at ||
        (authUser.email_confirmed_at && authUser.confirmed_at && authUser.user_metadata?.onboarding_completed)
      )

      if (hasCompletedOnboarding) {
        console.warn(`[invite-student] 400: Student ${studentRecord.roll_number} has already activated and completed onboarding (user_id: ${studentRecord.user_id})`)
        return new Response(
          JSON.stringify({
            error: `Student account for ${studentRecord.roll_number} (${cleanEmail}) has already completed onboarding and activated their account. Use Password Reset for recovery.`,
            code: 'ACCOUNT_ALREADY_ACTIVATED'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      verifiedLinkedAuthUser = authUser
      console.log(`[invite-student] Student ${studentRecord.roll_number} has verified linked unconfirmed auth user_id=${studentRecord.user_id}. Proceeding with supported resend flow.`)
    }

    // STRICT REQUIREMENT 3: Safe Invitation Redirect Validation (Requires HTTPS and Exact Route in Production)
    const configuredSiteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://mentorconnect.pages.dev'
    const isLocalDev = Boolean(
      supabaseUrl.includes('localhost') ||
      supabaseUrl.includes('127.0.0.1') ||
      Deno.env.get('DENO_ENV') === 'development' ||
      Deno.env.get('ALLOW_LOCAL_REDIRECTS') === 'true'
    )

    const ALLOWED_HOSTS = new Set<string>(['mentorconnect.pages.dev'])
    try {
      const siteHost = new URL(configuredSiteUrl).hostname
      if (siteHost) ALLOWED_HOSTS.add(siteHost)
    } catch {
      // ignore parse error on env var
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

        // Production Requirement: Must use HTTPS
        if (!isLocalDev && parsedUrl.protocol !== 'https:') {
          console.error(`[invite-student] 400: Insecure protocol '${parsedUrl.protocol}' requested in production`)
          return new Response(
            JSON.stringify({
              error: `Insecure redirect protocol: '${parsedUrl.protocol}'. Production redirects must use HTTPS.`,
              code: 'INSECURE_REDIRECT_PROTOCOL'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Production Requirement: Forbid localhost in production
        if (!isLocalDev && (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
          console.error(`[invite-student] 400: Localhost redirect requested in non-local environment`)
          return new Response(
            JSON.stringify({
              error: 'Localhost redirect URLs are forbidden in production deployments. Students must be redirected to the deployed portal.',
              code: 'LOCALHOST_REDIRECT_FORBIDDEN'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
          console.error(`[invite-student] 400: Unapproved redirect domain '${parsedUrl.hostname}'`)
          return new Response(
            JSON.stringify({
              error: `Invalid redirect URL: '${redirectTo}'. Domain '${parsedUrl.hostname}' is not an approved Mentor Connect host.`,
              code: 'INVALID_REDIRECT_URL'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Production Requirement: Must exactly match approved route
        if (parsedUrl.pathname !== EXACT_APPROVED_ROUTE) {
          console.error(`[invite-student] 400: Unapproved redirect route '${parsedUrl.pathname}'`)
          return new Response(
            JSON.stringify({
              error: `Invalid redirect route: '${parsedUrl.pathname}'. Redirect in production must exactly match approved route '${EXACT_APPROVED_ROUTE}'.`,
              code: 'INVALID_REDIRECT_ROUTE'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        targetRedirectTo = parsedUrl.toString()
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed redirect URL: '${redirectTo}'`, code: 'MALFORMED_REDIRECT_URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      const baseOrigin = isLocalDev ? 'http://localhost:5173' : configuredSiteUrl.replace(/\/$/, '')
      targetRedirectTo = `${baseOrigin}${EXACT_APPROVED_ROUTE}`
    }

    // STRICT REQUIREMENT 3: Prevent simultaneous duplicate dispatches via server-side atomic in-flight handling
    const { data: existingLog } = await supabaseAdmin
      .from('student_invitations')
      .select('id, roll_number, email, status, resend_count, last_attempt_at, history')
      .eq('roll_number', studentRecord.roll_number)
      .maybeSingle()

    const now = new Date().toISOString()
    const nowMs = Date.now()

    if (existingLog) {
      const lastAttemptMs = new Date(existingLog.last_attempt_at).getTime()
      const elapsedSeconds = Math.floor((nowMs - lastAttemptMs) / 1000)

      // 1. Simultaneous in-flight check: If currently pending within the last 15 seconds, block concurrent dispatch
      if (existingLog.status === 'pending' && elapsedSeconds < 15) {
        console.warn(`[invite-student] 409: Simultaneous in-flight dispatch detected for ${studentRecord.roll_number}`)
        return new Response(
          JSON.stringify({
            error: `An invitation dispatch for roll number ${studentRecord.roll_number} is currently in progress. Simultaneous duplicate dispatches are blocked.`,
            code: 'DISPATCH_IN_PROGRESS'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 2. Cooldown check: 30 seconds interval between consecutive attempts
      const COOLDOWN_SECONDS = 30
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remainingSeconds = COOLDOWN_SECONDS - elapsedSeconds
        console.warn(`[invite-student] 429: Rate-limit cooldown active for ${studentRecord.roll_number}. ${remainingSeconds}s remaining.`)
        return new Response(
          JSON.stringify({
            error: `An invitation was already dispatched for roll number ${studentRecord.roll_number} ${elapsedSeconds} seconds ago. Please wait ${remainingSeconds}s before retrying to prevent duplicate dispatches and SMTP rate limiting.`,
            code: 'INVITATION_COOLDOWN',
            retryAfter: remainingSeconds
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 3. Server-side atomic in-flight claim: Set status to 'pending' before calling GoTrue
      const { error: lockErr } = await supabaseAdmin
        .from('student_invitations')
        .update({
          status: 'pending',
          last_attempt_at: now,
          error_message: null
        })
        .eq('id', existingLog.id)

      if (lockErr) {
        console.warn('[invite-student] Failed to acquire in-flight lock on student_invitations:', lockErr.message)
      }
    } else {
      // If no row exists yet, claim atomic slot via INSERT with status = 'pending'
      // Due to UNIQUE (roll_number), any simultaneous insert will fail immediately
      const { error: claimInsertErr } = await supabaseAdmin
        .from('student_invitations')
        .insert({
          student_id: studentRecord.id,
          roll_number: studentRecord.roll_number,
          email: cleanEmail,
          status: 'pending',
          requested_at: now,
          last_attempt_at: now,
          invited_by: user.id
        })

      if (claimInsertErr) {
        if (claimInsertErr.code === '23505' || claimInsertErr.message?.includes('duplicate key') || claimInsertErr.message?.includes('unique')) {
          console.warn(`[invite-student] 409: Simultaneous duplicate insert caught for ${studentRecord.roll_number}`)
          return new Response(
            JSON.stringify({
              error: `Simultaneous duplicate dispatch collision detected for ${studentRecord.roll_number}. In-flight claim already registered.`,
              code: 'DISPATCH_IN_PROGRESS'
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // 5. Dispatch Invitation or Recovery Resend
    let authUserId: string | null = null
    let dispatchMethod = 'inviteUserByEmail'
    let inviteError: { message: string; status?: number } | null = null

    console.log(`[invite-student] Dispatching invitation for ${studentRecord.roll_number} (${cleanEmail}) with redirectTo=${targetRedirectTo}`)

    const { data: inviteData, error: initialInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        redirectTo: targetRedirectTo,
        data: whitelistedData
      }
    )

    if (initialInviteError) {
      const errorMsg = initialInviteError.message.toLowerCase()
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        // STRICT REQUIREMENT 2: Restrict password-recovery fallback strictly to an existing, positively verified, linked Auth account
        if (!verifiedLinkedAuthUser) {
          console.error(`[invite-student] 409: Account conflict. GoTrue reports ${cleanEmail} already exists, but student ${studentRecord.roll_number} has NO verified linked auth account.`)
          return new Response(
            JSON.stringify({
              error: `Account conflict: An authentication account already exists with email '${cleanEmail}', but it is not linked to student roll number '${studentRecord.roll_number}'. Password-recovery fallback is restricted strictly to verified linked accounts. Never sending recovery links for unrelated accounts.`,
              code: 'UNLINKED_ACCOUNT_EXISTS'
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[invite-student] Account already registered in Auth for verified linked user ${verifiedLinkedAuthUser.id}. Initiating supported recovery resend...`)
        dispatchMethod = 'resetPasswordForEmail'

        const { error: recoveryError } = await supabaseAdmin.auth.resetPasswordForEmail(
          cleanEmail,
          { redirectTo: targetRedirectTo }
        )

        if (recoveryError) {
          inviteError = recoveryError
        } else {
          authUserId = verifiedLinkedAuthUser.id
        }
      } else {
        inviteError = initialInviteError
      }
    } else {
      authUserId = inviteData?.user?.id || studentRecord.user_id || null
    }

    // Helper: Finalize audit log in public.student_invitations
    const recordInvitationLog = async (isSuccess: boolean, errorDetail?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const updateNow = new Date().toISOString()
        const historyEntry: Record<string, unknown> = {
          attempt_at: updateNow,
          admin_id: user.id,
          method: dispatchMethod,
          redirect_to: targetRedirectTo,
          status: isSuccess ? 'sent' : 'failed',
          result: isSuccess ? 'accepted_by_auth' : 'failed',
          error: errorDetail || null
        }

        // Re-fetch existing log id
        const { data: currentLog } = await supabaseAdmin
          .from('student_invitations')
          .select('id, resend_count, history')
          .eq('roll_number', studentRecord.roll_number)
          .maybeSingle()

        if (currentLog) {
          const { error: updateErr } = await supabaseAdmin
            .from('student_invitations')
            .update({
              student_id: studentRecord.id,
              email: cleanEmail,
              status: isSuccess ? 'sent' : 'failed',
              error_message: isSuccess ? null : (errorDetail || 'Invitation dispatch failed'),
              dispatch_result: isSuccess ? {
                user_id: authUserId,
                method: dispatchMethod,
                auth_accepted: true,
                email_delivery_confirmed: false
              } : null,
              resend_count: isSuccess ? (currentLog.resend_count || 0) + 1 : currentLog.resend_count,
              last_attempt_at: updateNow,
              invited_by: user.id,
              history: [...(currentLog.history || []), historyEntry],
              updated_at: updateNow
            })
            .eq('id', currentLog.id)

          if (updateErr) throw updateErr
        }
        return { success: true }
      } catch (logErr: any) {
        console.error('[invite-student] DB logging error:', logErr?.message)
        return { success: false, error: logErr?.message || 'Database logging failed' }
      }
    }

    if (inviteError) {
      console.error(`[invite-student] Auth dispatch failed: ${inviteError.message}`)
      await recordInvitationLog(false, inviteError.message)

      let safeErrorMessage = inviteError.message
      if (safeErrorMessage.toLowerCase().includes('redirect') || safeErrorMessage.toLowerCase().includes('url')) {
        safeErrorMessage = `${inviteError.message} (Verify that '${targetRedirectTo}' is added to Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs)`
      }
      return new Response(
        JSON.stringify({ error: safeErrorMessage, code: inviteError.status || 400 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[invite-student] Auth request accepted for ${studentRecord.roll_number} via ${dispatchMethod}. Persisting audit log...`)
    const logResult = await recordInvitationLog(true)

    // Partial Failure Reporting: Auth accepted invite, but audit logging failed to persist
    if (!logResult.success) {
      console.warn(`[invite-student] 207 Partial Failure: Auth request succeeded for ${cleanEmail}, but audit log persistence failed: ${logResult.error}`)
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Invitation request was accepted by Supabase Auth, but server-side audit logging to student_invitations failed to persist.',
          auditPersistenceFailed: true,
          auth_accepted: true,
          email_delivery_confirmed: false,
          logError: logResult.error,
          message: `Official invitation request accepted by Supabase Auth for ${cleanEmail}, but server-side audit persistence warning: ${logResult.error}. Please check student_invitations table. (Note: Email delivery is asynchronous and not confirmed until student sign-in).`
        }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fully verified success
    return new Response(
      JSON.stringify({
        success: true,
        warning: null,
        auditPersistenceFailed: false,
        auth_accepted: true,
        email_delivery_confirmed: false,
        message: `Official invitation request successfully accepted by Supabase Auth for ${cleanEmail} (${studentRecord.roll_number}). Server-side audit log persisted. (Note: Email delivery is asynchronous and depends on mail server delivery).`,
        roll_number: studentRecord.roll_number,
        email: cleanEmail
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[invite-student] 500 Uncaught Exception: ${message}`)
    return new Response(
      JSON.stringify({ error: message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
