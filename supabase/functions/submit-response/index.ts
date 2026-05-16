/**
 * 公開アンケート回答の受け口。service_role で survey_responses にのみ書き込む。
 * configKey / answers 以外のメタデータはクライアントを信用せずサーバー側で固定する。
 *
 * 新規案件を追加したら、このファイルの SURVEY_REGISTRY にエントリを追加すること
 * （フロントの src/surveyConfig.ts と整合させる）。
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SurveyEntry = {
  eventId: string
  surveyVersion: string
  questions: { id: string; options: string[] }[]
}

/** 許可する survey config キーと、INSERT に使う固定値・バリデーション用設問 */
const SURVEY_REGISTRY: Record<string, SurveyEntry> = {
  default: {
    eventId: 'natori-park',
    surveyVersion: 'v1.0.0_2026-05-13',
    questions: [
      {
        id: 'q1',
        options: ['1人', '2人', '3人', '4名以上'],
      },
      {
        id: 'q2',
        options: ['0~1歳', '2~3歳', '4~6歳', '7歳以上'],
      },
      {
        id: 'q3',
        options: ['名取市内', '仙台市内', 'それ以外の地域'],
      },
      {
        id: 'q4',
        options: ['初めて', '2回目', '3回目', '4回以上'],
      },
    ],
  },
  'natori-park': {
    eventId: 'natori-park',
    surveyVersion: 'v1.0.0_2026-05-13',
    questions: [
      {
        id: 'q1',
        options: ['1人', '2人', '3人', '4名以上'],
      },
      {
        id: 'q2',
        options: ['0~1歳', '2~3歳', '4~6歳', '7歳以上'],
      },
      {
        id: 'q3',
        options: ['名取市内', '仙台市内', 'それ以外の地域'],
      },
      {
        id: 'q4',
        options: ['初めて', '2回目', '3回目', '4回以上'],
      },
    ],
  },
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseSubmitEnvironment(): string {
  const raw = Deno.env.get('SUBMIT_ENVIRONMENT')?.trim()
  if (raw !== 'test' && raw !== 'production') {
    throw new Error(
      'SUBMIT_ENVIRONMENT must be set to "test" or "production" (Supabase Edge Function secrets)',
    )
  }
  return raw
}

function validateAnswers(
  entry: SurveyEntry,
  answersRaw: unknown,
): Record<string, string> | null {
  if (answersRaw === null || typeof answersRaw !== 'object' || Array.isArray(answersRaw)) {
    return null
  }
  const answers = answersRaw as Record<string, unknown>
  const expectedIds = entry.questions.map((q) => q.id)
  const keys = Object.keys(answers)
  if (keys.length !== expectedIds.length) {
    return null
  }
  const keySet = new Set(keys)
  for (const id of expectedIds) {
    if (!keySet.has(id)) return null
  }
  for (const extra of keys) {
    if (!expectedIds.includes(extra)) return null
  }

  const cleaned: Record<string, string> = {}
  for (const q of entry.questions) {
    const v = answers[q.id]
    if (typeof v !== 'string' || v.length === 0 || v.length > 500) {
      return null
    }
    if (!q.options.includes(v)) {
      return null
    }
    cleaned[q.id] = v
  }
  return cleaned
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let submitEnv: string
  try {
    submitEnv = parseSubmitEnvironment()
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Server misconfiguration' }, 500)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return jsonResponse({ error: 'Server misconfiguration' }, 500)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Body must be a JSON object' }, 400)
  }

  const { configKey, answers } = body as { configKey?: unknown; answers?: unknown }
  if (typeof configKey !== 'string' || configKey.trim() === '') {
    return jsonResponse({ error: 'configKey is required' }, 400)
  }

  const key = configKey.trim()
  const entry = SURVEY_REGISTRY[key]
  if (!entry) {
    return jsonResponse({ error: 'Unknown configKey' }, 400)
  }

  const cleaned = validateAnswers(entry, answers)
  if (!cleaned) {
    return jsonResponse({ error: 'Invalid answers' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const submittedAt = new Date().toISOString()

  const { error: insertError } = await admin.from('survey_responses').insert({
    event_id: entry.eventId,
    environment: submitEnv,
    survey_version: entry.surveyVersion,
    answers: cleaned,
    submitted_at: submittedAt,
  })

  if (insertError) {
    console.error('insert failed', insertError)
    return jsonResponse({ error: 'Failed to save response' }, 500)
  }

  return jsonResponse({ ok: true }, 200)
})
