import { api } from './api'

/**
 * Booking data layer: talks to the site's server (server/api.ts), which reads your Google
 * Calendar, creates the event and sends the emails. Working hours and rules live on the server.
 */

export const HOST = {
  name: 'Karel Fyrbach',
  email: 'karelfyrbach@gmail.com',
  photo: '/images/Profilovka/pp.webp',
  timeZone: 'America/New_York',
}

export const EVENT = {
  title: 'Intro call',
  description: '20 minutes on what you’re building and whether I’m the right designer for it.',
  minutes: 20,
  location: 'Google Meet',
}

export type Booking = {
  start: string
  name: string
  email: string
  notes: string
  timeZone: string
  /** Hidden spam trap – always empty for people. */
  website?: string
}

/** Every free slot start (ISO, UTC): the server's working hours minus your Google Calendar busy time. */
export async function getAvailability(): Promise<string[]> {
  const { slots } = await api<{ slots: string[] }>('/api/availability')
  return slots
}

/** Books a slot: creates the calendar event with a Meet link, invites the guest and emails you. */
export function book(booking: Booking) {
  return api<{ ok: true; meetLink: string | null }>('/api/book', booking)
}
