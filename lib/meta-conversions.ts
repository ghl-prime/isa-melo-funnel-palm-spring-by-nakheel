import 'server-only'
import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { BASE_PATH } from './base-path'
import { META_PIXEL_ID } from './tracking'

const sha256 = (value: string) => createHash('sha256').update(value.trim().toLowerCase()).digest('hex')

export async function sendMetaEvent(
  request: NextRequest,
  eventName: 'PageView' | 'Lead',
  eventId: string,
  contact?: { email: string; phone: string },
) {
  const token = process.env.META_CONVERSIONS_API_TOKEN
  if (!token) return

  try {
    const userData = {
      client_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      client_user_agent: request.headers.get('user-agent') || undefined,
      fbp: request.cookies.get('_fbp')?.value,
      fbc: request.cookies.get('_fbc')?.value,
      em: contact ? [sha256(contact.email)] : undefined,
      ph: contact ? [sha256(contact.phone.replace(/\D/g, ''))] : undefined,
    }

    const response = await fetch(`https://graph.facebook.com/v27.0/${META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        test_event_code: process.env.META_CONVERSIONS_API_TEST_EVENT_CODE || undefined,
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: request.headers.get('referer') || new URL(BASE_PATH, request.url).href,
          user_data: userData,
        }],
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) console.error('[meta-capi] Event rejected', eventName, response.status)
  } catch {
    console.error('[meta-capi] Event request failed', eventName)
  }
}
