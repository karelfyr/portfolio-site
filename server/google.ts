/**
 * Google Calendar over plain REST (no SDK): an access token from the stored refresh token,
 * free/busy for availability, and event creation with a Google Meet link. Google itself emails
 * the guest the invite (sendUpdates=all).
 */
import { randomUUID } from 'node:crypto'
import { config } from './config.ts'

let token: { value: string; expires: number } | null = null

async function accessToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      refresh_token: config.google.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  token = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 }
  return token.value
}

async function google<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method: init.method,
    headers: { authorization: `Bearer ${await accessToken()}`, 'content-type': 'application/json' },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  if (!res.ok) throw new Error(`Google Calendar ${init.method} ${path} failed (${res.status}): ${await res.text()}`)
  return (await res.json()) as T
}

export type Interval = { start: number; end: number }

/** Busy intervals (ms timestamps) across the configured calendars. */
export async function busyBetween(from: Date, to: Date): Promise<Interval[]> {
  const json = await google<{ calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> }>(
    '/freeBusy',
    {
      method: 'POST',
      body: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: config.google.busyCalendarIds.map((id) => ({ id })),
      },
    },
  )
  const busy: Interval[] = []
  for (const [id, cal] of Object.entries(json.calendars)) {
    if (cal.errors?.length) console.warn(`[calendar] free/busy error for ${id}:`, cal.errors)
    for (const b of cal.busy ?? []) busy.push({ start: Date.parse(b.start), end: Date.parse(b.end) })
  }
  return busy
}

export type CreatedEvent = { id: string; htmlLink: string; meetLink: string | null }

/** Creates the call in the host calendar with a Meet link and invites the guest. */
export async function createEvent(e: {
  start: Date
  end: Date
  summary: string
  description: string
  guest: { email: string; name?: string }
}): Promise<CreatedEvent> {
  const calendar = encodeURIComponent(config.google.calendarId)
  const json = await google<{ id: string; htmlLink: string; hangoutLink?: string }>(
    `/calendars/${calendar}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      body: {
        summary: e.summary,
        description: e.description,
        start: { dateTime: e.start.toISOString() },
        end: { dateTime: e.end.toISOString() },
        attendees: [{ email: e.guest.email, displayName: e.guest.name || undefined }],
        conferenceData: {
          createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
        reminders: { useDefault: true },
      },
    },
  )
  return { id: json.id, htmlLink: json.htmlLink, meetLink: json.hangoutLink ?? null }
}
