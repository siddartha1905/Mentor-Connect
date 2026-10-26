import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type AnnouncementCategory =
  | 'Mentor Update'
  | 'Department Information'
  | 'College Information'
  | 'Important Notice'

export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface AnnouncementRecord {
  id: string
  title: string
  message: string
  category: AnnouncementCategory
  informationSource?: string | null
  publishedByName: string
  authorId?: string | null
  date: string
  status: AnnouncementStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAnnouncementInput {
  title: string
  message: string
  category: AnnouncementCategory
  informationSource?: string | null
  publishedByName?: string
  date?: string
  status?: AnnouncementStatus
}

export interface UpdateAnnouncementInput {
  title?: string
  message?: string
  category?: AnnouncementCategory
  informationSource?: string | null
  publishedByName?: string
  date?: string
  status?: AnnouncementStatus
}

const STORAGE_KEY = 'mentor_connect_announcements'

// Clean initial announcements: empty state by default (no fictional/placeholder announcements)
const INITIAL_ANNOUNCEMENTS: AnnouncementRecord[] = []

function getLocalAnnouncements(): AnnouncementRecord[] {
  if (typeof window === 'undefined') return INITIAL_ANNOUNCEMENTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return INITIAL_ANNOUNCEMENTS
    }
    const parsed = JSON.parse(raw) as AnnouncementRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return INITIAL_ANNOUNCEMENTS
  }
}

function saveLocalAnnouncements(items: AnnouncementRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore local storage error
  }
}

export const announcementService = {
  // Fetch published announcements for student homepage
  async getPublishedAnnouncements(): Promise<AnnouncementRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        // When table exists in Supabase, return data directly (even if empty [])
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            category: d.category,
            informationSource: d.information_source,
            publishedByName: d.published_by_name || 'J. Siddhartha Varma',
            authorId: d.author_id,
            date: d.date,
            status: d.status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }))
        }
      } catch {
        // Fallback to local storage if table not yet created
      }
    }

    const local = getLocalAnnouncements()
    return local.filter((a) => a.status === 'published')
  },

  // Fetch all announcements for admin management
  async getAllAnnouncements(): Promise<AnnouncementRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        // When table exists in Supabase, return data directly (even if empty [])
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            category: d.category,
            informationSource: d.information_source,
            publishedByName: d.published_by_name || 'J. Siddhartha Varma',
            authorId: d.author_id,
            date: d.date,
            status: d.status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }))
        }
      } catch {
        // Fallback to local
      }
    }

    return getLocalAnnouncements()
  },

  // Create new announcement (Admin only)
  async createAnnouncement(
    input: CreateAnnouncementInput
  ): Promise<{ data: AnnouncementRecord | null; error: any }> {
    const today = new Date().toISOString().split('T')[0]
    const newRecord: AnnouncementRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ann-${Date.now()}`,
      title: input.title.trim(),
      message: input.message.trim(),
      category: input.category,
      informationSource: input.informationSource?.trim() || null,
      publishedByName: input.publishedByName?.trim() || 'J. Siddhartha Varma',
      date: input.date || today,
      status: input.status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            id: newRecord.id,
            title: newRecord.title,
            message: newRecord.message,
            category: newRecord.category,
            information_source: newRecord.informationSource,
            published_by_name: newRecord.publishedByName,
            date: newRecord.date,
            status: newRecord.status,
          })
          .select()
          .single()

        if (!error && data) {
          const created: AnnouncementRecord = {
            id: data.id,
            title: data.title,
            message: data.message,
            category: data.category,
            informationSource: data.information_source,
            publishedByName: data.published_by_name,
            authorId: data.author_id,
            date: data.date,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
          // also sync local
          const local = getLocalAnnouncements()
          saveLocalAnnouncements([created, ...local])
          return { data: created, error: null }
        }
      } catch (err) {
        // fallback to local
      }
    }

    const local = getLocalAnnouncements()
    const updated = [newRecord, ...local]
    saveLocalAnnouncements(updated)
    return { data: newRecord, error: null }
  },

  // Update announcement (Admin only)
  async updateAnnouncement(
    id: string,
    input: UpdateAnnouncementInput
  ): Promise<{ data: AnnouncementRecord | null; error: any }> {
    if (isSupabaseConfigured()) {
      try {
        const updates: any = { updated_at: new Date().toISOString() }
        if (input.title !== undefined) updates.title = input.title.trim()
        if (input.message !== undefined) updates.message = input.message.trim()
        if (input.category !== undefined) updates.category = input.category
        if (input.informationSource !== undefined) updates.information_source = input.informationSource?.trim() || null
        if (input.publishedByName !== undefined) updates.published_by_name = input.publishedByName.trim()
        if (input.date !== undefined) updates.date = input.date
        if (input.status !== undefined) updates.status = input.status

        const { data, error } = await supabase
          .from('announcements')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) {
          const updatedRecord: AnnouncementRecord = {
            id: data.id,
            title: data.title,
            message: data.message,
            category: data.category,
            informationSource: data.information_source,
            publishedByName: data.published_by_name,
            authorId: data.author_id,
            date: data.date,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
          const local = getLocalAnnouncements().map((a) => (a.id === id ? updatedRecord : a))
          saveLocalAnnouncements(local)
          return { data: updatedRecord, error: null }
        }
      } catch {
        // fallback
      }
    }

    const local = getLocalAnnouncements()
    const target = local.find((a) => a.id === id)
    if (!target) return { data: null, error: new Error('Announcement not found') }

    const updatedRecord: AnnouncementRecord = {
      ...target,
      ...input,
      updatedAt: new Date().toISOString(),
    }
    const updated = local.map((a) => (a.id === id ? updatedRecord : a))
    saveLocalAnnouncements(updated)
    return { data: updatedRecord, error: null }
  },

  // Archive announcement (Admin only)
  async archiveAnnouncement(id: string): Promise<{ success: boolean; error: any }> {
    return this.updateAnnouncement(id, { status: 'archived' }).then((res) => ({
      success: Boolean(res.data),
      error: res.error,
    }))
  },

  // Delete announcement (Admin only)
  async deleteAnnouncement(id: string): Promise<{ success: boolean; error: any }> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id)
        if (!error) {
          const local = getLocalAnnouncements().filter((a) => a.id !== id)
          saveLocalAnnouncements(local)
          return { success: true, error: null }
        }
      } catch {
        // fallback
      }
    }

    const local = getLocalAnnouncements().filter((a) => a.id !== id)
    saveLocalAnnouncements(local)
    return { success: true, error: null }
  },
}
