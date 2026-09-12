import type { Clinic } from '../data/clinic'

export type Bindings = {
  DB: D1Database
  R2: R2Bucket
  ADMIN_PASSWORD: string
  SESSION_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  RESEND_API_KEY?: string
  NOTIFICATION_EMAIL?: string
  SITE_URL?: string
  STATS_API_TOKEN?: string
  LOCAL_STATS_TOKEN?: string
}

export type SessionUser = {
  id: number
  email: string
  name: string
  role: 'member' | 'admin'
}

export type StaffPrincipal = { id: number | null; login: string; name: string; role: 'owner' | 'reception' | 'editor'; version: number; bootstrap?: boolean }

export type Variables = {
  clinic: Clinic
  user: SessionUser | null
  admin: boolean
  staff: StaffPrincipal | null
  siteUrl: string
  nonce: string
}

export type Env = { Bindings: Bindings; Variables: Variables }
