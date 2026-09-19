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
  AI_API_KEY?: string      // OpenAI 호환 LLM 키 (기본 Gemini)
  AI_BASE_URL?: string     // 기본 https://generativelanguage.googleapis.com/v1beta/openai
  AI_MODEL?: string        // 기본 gemini-3.5-flash-lite
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}

export type SessionUser = {
  id: number
  email: string
  name: string
  role: 'member' | 'admin'
}

export type StaffPrincipal = { id: number | null; login: string; name: string; role: 'owner' | 'reception' | 'editor'; version: number; bootstrap?: boolean; shared?: boolean }

export type Variables = {
  clinic: Clinic
  user: SessionUser | null
  admin: boolean
  staff: StaffPrincipal | null
  siteUrl: string
  nonce: string
}

export type Env = { Bindings: Bindings; Variables: Variables }
