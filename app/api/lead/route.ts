import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

const GO_HIGH_LEVEL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/iGbC817rCzAfj7HtPYRs/webhook-trigger/OLjYU2M7uy4NrhraIdkq'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const META_CAPI_TOKEN = process.env.META_CONVERSIONS_API_TOKEN

const sha256 = (value: string) => createHash('sha256').update(value.trim().toLowerCase()).digest('hex')

async function sendMetaLeadEvent(request: Request, payload: Record<string, unknown>) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return

  const answers = (payload.answers ?? {}) as Record<string, string>
  const userData: Record<string, unknown> = {}

  if (answers.email) userData.em = [sha256(answers.email)]
  const phoneDigits = (answers.phone || '').replace(/\D/g, '')
  if (phoneDigits) userData.ph = [sha256(phoneDigits)]

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip) userData.client_ip_address = ip
  const ua = request.headers.get('user-agent')
  if (ua) userData.client_user_agent = ua

  const cookie = request.headers.get('cookie') || ''
  const fbp = cookie.match(/_fbp=([^;]+)/)?.[1]
  const fbc = cookie.match(/_fbc=([^;]+)/)?.[1]
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: typeof payload.eventId === 'string' ? payload.eventId : undefined,
      action_source: 'website',
      event_source_url: typeof payload.pageUrl === 'string' ? payload.pageUrl : undefined,
      user_data: userData,
    }],
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) console.error('[meta-capi] Lead event failed:', res.status, await res.text())
  } catch (error) {
    console.error('[meta-capi] Lead event error:', error)
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload || typeof payload !== 'object' || !payload.answers) {
      return NextResponse.json({ error: 'Invalid lead payload' }, { status: 400 })
    }

    const answers = payload.answers as Record<string, string>
    const clean = (value: unknown): unknown => {
      if (typeof value === 'string') return value.trim() || undefined
      if (Array.isArray(value)) return value.map(clean).filter(item => item !== undefined)
      if (value && typeof value === 'object') {
        const entries = Object.entries(value).map(([key, item]) => [key, clean(item)] as const).filter(([, item]) => item !== undefined)
        return entries.length ? Object.fromEntries(entries) : undefined
      }
      return value == null ? undefined : value
    }
    const webhookPayload = clean({
      ...payload,
      first_name: answers.first,
      last_name: answers.last,
      full_name: [answers.first, answers.last].filter(Boolean).join(' '),
      email: answers.email,
      phone: answers.phone,
      country_code: answers.phoneCode,
      looking_for: answers.looking,
      unit_size: answers.size,
      language: ({ en: 'English', pt: 'Portuguese', es: 'Spanish' } as Record<string, string>)[payload.language] || payload.language,
      language_code: payload.language,
    })

    const response = await fetch(GO_HIGH_LEVEL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[v0] GoHighLevel webhook failed:', response.status)
      return NextResponse.json({ error: 'Webhook delivery failed' }, { status: 502 })
    }

    await sendMetaLeadEvent(request, payload)

    return NextResponse.json({ delivered: true })
  } catch (error) {
    console.error('[v0] Lead webhook error:', error)
    return NextResponse.json({ error: 'Unable to submit lead' }, { status: 500 })
  }
}




