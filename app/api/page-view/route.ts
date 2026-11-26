import { after, type NextRequest } from 'next/server'
import { sendMetaEvent } from '../../../lib/meta-conversions'

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const eventId = payload?.eventId
  if (typeof eventId !== 'string' || !/^[a-f0-9]{32}$/.test(eventId)) {
    return new Response(null, { status: 400 })
  }

  after(() => sendMetaEvent(request, 'PageView', eventId))
  return new Response(null, { status: 204 })
}
