/**
 * One small Node server for the whole site: the built React app (dist/) plus the booking API.
 * No dependencies — Node's http, fs and zlib. Runs TypeScript directly (Node ≥ 22.18).
 *
 *   GET  /api/availability   free slot starts (ISO) for the next HORIZON_DAYS
 *   POST /api/book           { start, email, name?, notes?, timeZone? }
 *   POST /api/inquiry        project brief or quick message
 *   GET  /api/health         which integrations are connected
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { calendarConnected, config, mailConnected } from './config.ts'
import { availability, book, HttpError, inquiry } from './api.ts'

const DIST = resolve(import.meta.dirname, '../dist')

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt'])

/* ── Rate limit: 12 form posts per 10 minutes per visitor ─── */
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 12
}
setInterval(() => hits.clear(), 60 * 60_000).unref()

const clientIp = (req: IncomingMessage) =>
  (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket.remoteAddress || '?'

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 32_000) throw new HttpError(413, 'Too much data.')
    chunks.push(chunk)
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (body && typeof body === 'object' && !Array.isArray(body)) return body
  } catch {
    /* fall through */
  }
  throw new HttpError(400, 'Invalid request.')
}

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function handleApi(req: IncomingMessage, res: ServerResponse, path: string) {
  try {
    if (req.method === 'GET' && path === '/api/health') {
      return json(res, 200, { ok: true, calendar: calendarConnected(), mail: mailConnected() })
    }
    if (req.method === 'GET' && path === '/api/availability') return json(res, 200, await availability())
    if (req.method === 'POST' && (path === '/api/book' || path === '/api/inquiry')) {
      if (limited(clientIp(req))) throw new HttpError(429, 'Too many requests – try again in a few minutes.')
      const body = await readJson(req)
      return json(res, 200, path === '/api/book' ? await book(body) : await inquiry(body))
    }
    throw new HttpError(404, 'Not found.')
  } catch (err) {
    if (err instanceof HttpError) return json(res, err.status, { error: err.message })
    console.error(`[api] ${req.method} ${path}`, err)
    return json(res, 500, { error: `Something broke on my side. Email ${config.mail.notify} instead.` })
  }
}

/* ── Static files (with SPA fallback) ─── */
const gzCache = new Map<string, Buffer>()

/** Friendly addresses for the stand-alone pages in public/. */
const ALIASES: Record<string, string> = { '/signageexperiencedesign': '/signage.html' }

async function serveStatic(req: IncomingMessage, res: ServerResponse, path: string) {
  path = ALIASES[path.replace(/\/+$/, '')] ?? path
  let file = normalize(join(DIST, decodeURIComponent(path)))
  if (!file.startsWith(DIST)) return json(res, 400, { error: 'Bad path' })
  let info = await stat(file).catch(() => null)
  if (!info || info.isDirectory()) {
    // Client-side routes (/works/float, /start, …) all load index.html; real missing files 404.
    if (extname(path)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      return res.end('Not found')
    }
    file = join(DIST, 'index.html')
    info = await stat(file)
  }
  const ext = extname(file)
  const headers: Record<string, string> = {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    // Hashed build assets never change; everything else revalidates.
    'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
  }
  let body: Buffer = await readFile(file)
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding']))) {
    const key = `${file}:${info.mtimeMs}`
    let gz = gzCache.get(key)
    if (!gz) gzCache.set(key, (gz = gzipSync(body)))
    body = gz
    headers['content-encoding'] = 'gzip'
    headers.vary = 'accept-encoding'
  }
  res.writeHead(200, headers)
  res.end(req.method === 'HEAD' ? undefined : body)
}

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  if (path.startsWith('/api/')) return void handleApi(req, res, path)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    return void res.end()
  }
  serveStatic(req, res, path).catch((err) => {
    console.error('[static]', err)
    res.writeHead(500)
    res.end()
  })
}).listen(config.port, () => {
  console.log(
    `Server on :${config.port} — calendar ${calendarConnected() ? 'connected' : 'DEMO'}, mail ${mailConnected() ? 'connected' : 'DEMO (console)'}`,
  )
})
