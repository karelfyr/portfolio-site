// Tiny loading placeholders for every image in public/images: a 16 px wide copy of each, shown
// heavily blurred until the real file has loaded. The originals are never touched – these are
// separate, inlined into the app (src/data/image-placeholders.json). Needs ffmpeg.
//
//   npm run placeholders      (after adding or replacing images)
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DIR = 'public/images'
const OUT = 'src/data/image-placeholders.json'
const WIDTH = 16

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(webp|png|jpe?g|avif|gif)$/i.test(name)) files.push(path)
  }
}
walk(DIR)

const placeholders = {}
for (const path of files) {
  const key = '/' + relative('public', path).split(sep).join('/')
  try {
    const pixFmt = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=pix_fmt', '-of', 'csv=p=0', path])
      .toString()
      .trim()
    // keep transparency where the image has it (PNG); everything else as a small JPEG
    const alpha = /a/.test(pixFmt.replace('yuvj', 'yuv'))
    const args = ['-v', 'error', '-i', path, '-frames:v', '1', '-vf', `scale=${WIDTH}:-2:flags=area`]
    const data = execFileSync('ffmpeg', [...args, ...(alpha ? ['-f', 'image2pipe', '-c:v', 'png'] : ['-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '5']), '-'])
    placeholders[key] = `data:image/${alpha ? 'png' : 'jpeg'};base64,${data.toString('base64')}`
  } catch {
    console.warn(`skipped ${key} (ffmpeg couldn't read it) – it loads without a placeholder`)
  }
}
writeFileSync(OUT, JSON.stringify(placeholders, null, 1) + '\n')
const bytes = Object.values(placeholders).reduce((n, s) => n + s.length, 0)
console.log(`${Object.keys(placeholders).length} placeholders, ${Math.round(bytes / 1000)} KB → ${OUT}`)
