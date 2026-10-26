import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface DeadlineSettings {
  deadline: string // ISO 8601 string with IST timezone
  timezone: string
  formatted_ist: string
  is_enabled: boolean
  description?: string
}

export interface StudentOverrideItem {
  id: string
  studentId: string
  rollNumber: string
  studentName: string
  studentEmail?: string
  section: string
  allowedUntil: string
  reason: string
  grantedBy?: string
  createdAt: string
}

const DEFAULT_DEADLINE_SETTINGS: DeadlineSettings = {
  deadline: '2026-11-03T23:59:59+05:30',
  timezone: 'Asia/Kolkata',
  formatted_ist: 'Tuesday, November 3, 2026 at 11:59:59 PM IST',
  is_enabled: true,
  description: 'Student profile editing deadline: Tuesday, November 3, 2026 at 11:59:59 PM IST',
}

const DEADLINE_STORAGE_KEY = 'mentor_connect_deadline_settings'
const OVERRIDES_STORAGE_KEY = 'mentor_connect_deadline_overrides'

function formatISTDate(date: Date): string {
  try {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST'
  } catch {
    return date.toISOString()
  }
}

function getLocalDeadlineSettings(): DeadlineSettings {
  if (typeof window === 'undefined') return DEFAULT_DEADLINE_SETTINGS
  try {
    const raw = localStorage.getItem(DEADLINE_STORAGE_KEY)
    if (!raw) return DEFAULT_DEADLINE_SETTINGS
    return JSON.parse(raw)
  } catch {
    return DEFAULT_DEADLINE_SETTINGS
  }
}

function saveLocalDeadlineSettings(settings: DeadlineSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEADLINE_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function getLocalOverrides(): StudentOverrideItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveLocalOverrides(items: StudentOverrideItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export const deadlineService = {
  // Fetch current global profile editing deadline
  async getDeadlineSettings(): Promise<DeadlineSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value, description')
          .eq('key', 'profile_edit_deadline')
          .maybeSingle()

        if (!error && data?.value) {
          const val = data.value as any
          const settings: DeadlineSettings = {
            deadline: val.deadline || DEFAULT_DEADLINE_SETTINGS.deadline,
            timezone: val.timezone || 'Asia/Kolkata',
            formatted_ist: val.formatted_ist || formatISTDate(new Date(val.deadline || DEFAULT_DEADLINE_SETTINGS.deadline)),
            is_enabled: val.is_enabled !== undefined ? Boolean(val.is_enabled) : true,
            description: data.description || val.description || DEFAULT_DEADLINE_SETTINGS.description,
          }
          saveLocalDeadlineSettings(settings)
          return settings
        }
      } catch {
        // Fallback to local
      }
    }

    return getLocalDeadlineSettings()
  },

  // Update global deadline & enable/disable toggle
  async updateDeadlineSettings(
    newDeadlineISO: string,
    isEnabled: boolean
  ): Promise<{ data: DeadlineSettings | null; error: any }> {
    const d = new Date(newDeadlineISO)
    const formatted = formatISTDate(d)

    const updatedSettings: DeadlineSettings = {
      deadline: newDeadlineISO,
      timezone: 'Asia/Kolkata',
      formatted_ist: formatted,
      is_enabled: isEnabled,
      description: `Student profile editing deadline: ${formatted}`,
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .upsert(
            {
              key: 'profile_edit_deadline',
              value: {
                deadline: updatedSettings.deadline,
                timezone: updatedSettings.timezone,
                formatted_ist: updatedSettings.formatted_ist,
                is_enabled: updatedSettings.is_enabled,
                description: updatedSettings.description,
              },
              description: updatedSettings.description,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
          .select()
          .single()

        if (!error) {
          saveLocalDeadlineSettings(updatedSettings)
          return { data: updatedSettings, error: null }
        }
        console.warn('Supabase system_settings deadline update error:', error.message)
      } catch (err: any) {
        console.warn('Supabase system_settings unavailable:', err?.message)
      }
    }

    saveLocalDeadlineSettings(updatedSettings)
    return { data: updatedSettings, error: null }
  },

  // Fetch all active and past individual overrides
  async getAllOverrides(): Promise<StudentOverrideItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_edit_overrides')
          .select(`
            id,
            student_id,
            section,
            allowed_until,
            reason,
            granted_by,
            created_at,
            students:student_id (
              roll_number,
              name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        if (!error && data) {
          const mapped: StudentOverrideItem[] = data.map((d: any) => {
            const student = Array.isArray(d.students) ? d.students[0] : d.students
            return {
              id: d.id,
              studentId: d.student_id,
              rollNumber: student?.roll_number || 'Unknown Roll',
              studentName: student?.name || 'Unknown Student',
              studentEmail: student?.email,
              section: d.section,
              allowedUntil: d.allowed_until,
              reason: d.reason || 'Faculty authorized deadline extension',
              grantedBy: d.granted_by,
              createdAt: d.created_at,
            }
          })
          saveLocalOverrides(mapped)
          return mapped
        }
      } catch {
        // Fallback to local
      }
    }

    return getLocalOverrides()
  },

  // Grant an individual extension
  async grantOverride(input: {
    studentId: string
    rollNumber: string
    studentName: string
    section: string
    allowedUntilISO: string
    reason: string
  }): Promise<{ data: StudentOverrideItem | null; error: any }> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ovr-${Date.now()}`
    const record: StudentOverrideItem = {
      id: newId,
      studentId: input.studentId,
      rollNumber: input.rollNumber,
      studentName: input.studentName,
      section: input.section || 'all',
      allowedUntil: input.allowedUntilISO,
      reason: input.reason.trim() || 'Faculty authorized individual extension',
      createdAt: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_edit_overrides')
          .insert({
            id: record.id,
            student_id: record.studentId,
            section: record.section,
            allowed_until: record.allowedUntil,
            reason: record.reason,
          })
          .select()
          .single()

        if (!error) {
          const local = getLocalOverrides()
          saveLocalOverrides([record, ...local])
          return { data: record, error: null }
        }
        console.warn('Supabase student_edit_overrides insert error:', error.message)
      } catch (err: any) {
        console.warn('Supabase student_edit_overrides unavailable:', err?.message)
      }
    }

    const local = getLocalOverrides()
    saveLocalOverrides([record, ...local])
    return { data: record, error: null }
  },

  // Revoke an individual extension
  async revokeOverride(overrideId: string): Promise<{ success: boolean; error: any }> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('student_edit_overrides')
          .delete()
          .eq('id', overrideId)

        if (!error) {
          const local = getLocalOverrides().filter((o) => o.id !== overrideId)
          saveLocalOverrides(local)
          return { success: true, error: null }
        }
      } catch (err: any) {
        // Fallback
      }
    }

    const local = getLocalOverrides().filter((o) => o.id !== overrideId)
    saveLocalOverrides(local)
    return { success: true, error: null }
  },
}
