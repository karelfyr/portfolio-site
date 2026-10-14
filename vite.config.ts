import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { imageSize } from 'image-size'

const IMAGES_DIR = 'public/images'
const VIRTUAL_ID = 'virtual:image-sizes'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Reads the pixel size of every image in public/images: { "/images/x.webp": [w, h] } */
function readImageSizes() {
  const sizes: Record<string, [number, number]> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(webp|png|jpe?g|avif|gif|svg)$/i.test(name)) {
        try {
          const { width, height } = imageSize(readFileSync(path))
          if (width && height) sizes['/' + relative('public', path).split(sep).join('/')] = [width, height]
        } catch {
          // unreadable file: the image still works, it just won't reserve space before loading
        }
      }
    }
  }
  walk(IMAGES_DIR)
  return sizes
}

/**
 * Exposes image dimensions to the app so every <img> gets width/height up front.
 * The browser then reserves the right space before the image loads, so the page
 * doesn't jump (and scrolling doesn't stutter) while images arrive.
 */
function imageSizes(): Plugin {
  return {
    name: 'image-sizes',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(readImageSizes())}` : undefined),
    configureServer(server) {
      // Re-read sizes when images are added, replaced or removed during development.
      const refresh = (file: string) => {
        // Only real image files — not e.g. .DS_Store, which Finder rewrites while browsing.
        if (!file.includes(`${sep}public${sep}images${sep}`) || !/\.(webp|png|jpe?g|avif|gif|svg)$/i.test(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(IMAGES_DIR)
      server.watcher.on('add', refresh).on('change', refresh).on('unlink', refresh)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imageSizes()],
})
