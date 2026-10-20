/**
 * Server settings, all from environment variables (Railway → Variables, or a local .env file).
 * Without the Google / Resend keys the server runs in DEMO mode: it shows working hours as free,
 * "books" without touching a calendar and logs emails to the console instead of sending them.
 */

const env = (name: string, fallback = '') => process.env[name]?.trim() || fallback
const num = (name: string, fallback: number) => {
  const v = Number(process.env[name])
  return Number.isFinite(v) && process.env[name] !== '' && process.env[name] !== undefined ? v : fallback
}

export const config = {
  port: num('PORT', 8787),

  google: {
    clientId: env('GOOGLE_CLIENT_ID'),
    clientSecret: env('GOOGLE_CLIENT_SECRET'),
    refreshToken: env('GOOGLE_REFRESH_TOKEN'),
    /** Calendar new bookings are created in. */
    calendarId: env('GOOGLE_CALENDAR_ID', 'primary'),
    /** Calendars whose busy time blocks slots (comma-separated). Defaults to the booking calendar. */
    busyCalendarIds: env('GOOGLE_BUSY_CALENDAR_IDS', env('GOOGLE_CALENDAR_ID', 'primary'))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  mail: {
    resendKey: env('RESEND_API_KEY'),
    /** Where booking / inquiry notifications go. */
    notify: env('NOTIFY_EMAIL', 'karelfyrbach@gmail.com'),
    /**
     * Sender. "onboarding@resend.dev" works with no domain setup but can only send to the email
     * the Resend account was created with. Use an address on your own verified domain to also
     * send confirmations to visitors.
     */
    from: env('MAIL_FROM', 'Portfolio <onboarding@resend.dev>'),
  },

  /** Booking rules, in the host's time zone. */
  booking: {
    timeZone: env('HOST_TIMEZONE', 'America/New_York'),
    minutes: num('CALL_MINUTES', 20),
    dayStart: num('DAY_START_HOUR', 10), // first slot
    dayEnd: num('DAY_END_HOUR', 18), // last slot ends by then
    lunch: [num('LUNCH_START_HOUR', 13), num('LUNCH_END_HOUR', 14)] as [number, number],
    weekdays: env('BOOKING_WEEKDAYS', '1,2,3,4,5').split(',').map(Number), // 0 = Sunday
    noticeHours: num('NOTICE_HOURS', 12),
    horizonDays: num('HORIZON_DAYS', 60),
    bufferMinutes: num('BUFFER_MINUTES', 10), // kept free around existing meetings
    title: env('CALL_TITLE', 'Intro call'),
  },
}

export const calendarConnected = () =>
  !!(config.google.clientId && config.google.clientSecret && config.google.refreshToken)
export const mailConnected = () => !!config.mail.resendKey
/** Sender can mail anyone (own domain), not just the account owner. */
export const canMailGuests = () => mailConnected() && !config.mail.from.includes('resend.dev')
