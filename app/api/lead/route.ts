import { randomUUID } from 'node:crypto'
import { after, NextResponse, type NextRequest } from 'next/server'
import { sendMetaEvent } from '../../../lib/meta-conversions'

const GO_HIGH_LEVEL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/iGbC817rCzAfj7HtPYRs/webhook-trigger/OLjYU2M7uy4NrhraIdkq'

function clean(value: unknown): unknown {
  if (typeof value === 'string') return value.trim() || undefined
  if (Array.isArray(value)) return value.map(clean).filter(item => item !== undefined)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, clean(item)] as const).filter(([, item]) => item !== undefined)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value == null ? undefined : value
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const answers = payload?.answers
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return NextResponse.json({ error: 'Invalid lead payload' }, { status: 400 })
  }

  const { first, email, phone } = answers
  if (
    typeof first !== 'string' || first.trim().length < 2 ||
    typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim()) ||
    typeof phone !== 'string' || phone.replace(/\D/g, '').length < 6
  ) {
    return NextResponse.json({ error: 'Invalid contact details' }, { status: 400 })
  }

  const eventId = randomUUID()
  try {
    const webhookPayload = clean({
      ...payload,
      eventId,
      first_name: first,
      last_name: answers.last,
      full_name: [first, answers.last].filter(Boolean).join(' '),
      email,
      phone,
      country_code: answers.phoneCode,
      looking_for: answers.looking,
      unit_size: answers.size,
      language_code: payload.language_code || payload.language,
    })

    const response = await fetch(GO_HIGH_LEVEL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[lead] GoHighLevel webhook failed', response.status)
      return NextResponse.json({ error: 'Webhook delivery failed' }, { status: 502 })
    }
  } catch {
    console.error('[lead] GoHighLevel webhook request failed')
    return NextResponse.json({ error: 'Unable to submit lead' }, { status: 500 })
  }

  after(() => sendMetaEvent(request, 'Lead', eventId, { email, phone }))
  return NextResponse.json({ delivered: true, eventId })
}
