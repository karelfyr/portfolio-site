// Records the Decathlon clip frame by frame for Safari's video (Safari can't run the live clip at
// 120 fps or keep it glitch-free while scrolling). Needs the dev server running (npm run dev).
//
//   node scripts/decathlon-video/record.mjs desktop <framesDir>
//   node scripts/decathlon-video/record.mjs phone <framesDir>
//
// Then encode with encode.swift (see README.md next to this file).
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.env.CLIP_URL ?? 'http://localhost:5173/works/decathlon?render'
const FPS = 120
// The clip's size on screen and the screen's pixel density: the video comes out at width × scale.
const LAYOUTS = {
  desktop: { width: 1280, height: 900, scale: 2, mobile: false }, // 2560 × 1800
  phone: { width: 430, height: 688, scale: 3, mobile: true }, // 1290 × 2064
}

const [layoutName, outDir] = process.argv.slice(2)
const layout = LAYOUTS[layoutName]
if (!layout || !outDir) {
  console.error('usage: record.mjs desktop|phone <framesDir>')
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

const profile = join(tmpdir(), `dk-record-${process.pid}`)
const port = 9300 + (process.pid % 500)
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  // the page's DevTools connection
  let target
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200)
    target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => null)
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)))
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }).then((r) => r.result.value)

  await send('Emulation.setDeviceMetricsOverride', { width: layout.width, height: layout.height, deviceScaleFactor: layout.scale, mobile: layout.mobile })
  await send('Page.navigate', { url: URL })
  // ready: the render hook, the fonts and every image
  for (let i = 0; i < 100; i++) {
    await sleep(200)
    const ready = await evaluate(`!!window.__dkRender && document.fonts.status === 'loaded' && [...document.images].every((i) => i.complete)`).catch(() => false)
    if (ready) break
  }
  const loop = await evaluate('window.__dkLoop')
  const frames = Math.min(Math.round((loop.end - loop.start) * FPS), Number(process.env.LIMIT) || Infinity) // LIMIT: a quick test
  console.log(`${layoutName}: ${frames} frames, ${layout.width * layout.scale} × ${layout.height * layout.scale}`)
  const clip = { x: 0, y: 0, width: layout.width, height: layout.height, scale: 1 }
  for (let i = 0; i < frames; i++) {
    await evaluate(`window.__dkRender(${loop.start + i / FPS}); new Promise((r) => requestAnimationFrame(() => r()))`)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip, optimizeForSpeed: false })
    writeFileSync(join(outDir, `f${String(i).padStart(5, '0')}.png`), Buffer.from(shot.data, 'base64'))
    if (i % 240 === 0) console.log(`  ${i}/${frames}`)
  }
  console.log('done')
  ws.close()
} finally {
  chrome.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
