/**
 * One-time: connect your Google Calendar and print the refresh token for GOOGLE_REFRESH_TOKEN.
 *
 *   1. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env (OAuth client of type "Desktop app")
 *   2. npm run google:auth
 *   3. Sign in in the browser window that opens and allow calendar access
 *   4. Copy the printed GOOGLE_REFRESH_TOKEN into .env and Railway → Variables
 */
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'

const PORT = 53682
const REDIRECT = `http://127.0.0.1:${PORT}/callback`
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events', // create the booked calls
  'https://www.googleapis.com/auth/calendar.freebusy', // read when you're busy (not event details)
]

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env first.')
  process.exit(1)
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // gives a refresh token
    prompt: 'consent', // always return one, even if you've connected before
  })

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT)
  if (url.pathname !== '/callback') return void res.writeHead(404).end()
  const code = url.searchParams.get('code')
  if (!code) {
    res.end(`No code returned: ${url.searchParams.get('error') ?? 'unknown error'}. You can close this tab.`)
    return server.close()
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
  })
  const json = (await tokenRes.json()) as { refresh_token?: string; error?: string; error_description?: string }
  if (!json.refresh_token) {
    res.end('Google did not return a refresh token – see the terminal.')
    console.error('Token exchange failed:', json)
  } else {
    res.end('Calendar connected. You can close this tab and go back to the terminal.')
    console.log('\nAdd this to .env and to Railway → Variables:\n')
    console.log(`GOOGLE_REFRESH_TOKEN=${json.refresh_token}\n`)
  }
  server.close()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('Opening Google sign-in… If nothing opens, visit:\n\n' + authUrl + '\n')
  execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [authUrl], () => {})
})
