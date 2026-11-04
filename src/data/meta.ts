/**
 * What search engines and link previews show for each page: title, description, preview image.
 * Used by the server (written into the HTML before it's sent, so Google and WhatsApp/LinkedIn/Slack
 * see it without running the app) and by the app (kept in sync as you navigate).
 */
import { getProject, projects } from './projects.ts'

export const SITE = {
  name: 'Karel Fyrbach',
  url: 'https://karelfyrbach.cz',
  role: 'Design Engineer',
  image: '/images/Profilovka/pp.webp',
  linkedin: 'https://www.linkedin.com/in/karelfyrbach/',
}

export type PageMeta = {
  title: string
  description: string
  /** Path under /public; the site's portrait when left out. */
  image?: string
  /** Kept out of search results (pages only reachable by direct link). */
  noindex?: boolean
}

const HOME_DESCRIPTION = 'I’m Karel, a design engineer. I design and build software, brands and store signage experiences.'

const PAGES: Record<string, PageMeta> = {
  '/': { title: `${SITE.name} — ${SITE.role}`, description: HOME_DESCRIPTION },
  '/works': {
    title: `Works — ${SITE.name}`,
    description:
      'Selected works: store signage and kiosk experiences for Decathlon, KIA and Marriott, brand identities, websites and app design.',
  },
  '/contact': {
    title: `Contact — ${SITE.name}`,
    description: 'Let’s create something meaningful. Start a project, book a call or write me an email.',
  },
  '/start': {
    title: `Start a project — ${SITE.name}`,
    description: 'Three short questions – about a minute. Then pick a time on my calendar, or just send a message.',
  },
  '/book': {
    title: `Let’s talk — ${SITE.name}`,
    description: 'Pick a time. The calendar invite and Google Meet link arrive straight away.',
  },
  '/logos': { title: `Logos — ${SITE.name}`, description: HOME_DESCRIPTION },
}

/** Shortens text to a search-result-sized description, at a word boundary. */
const clip = (text: string, max = 158) => (text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`)

/** The page's meta, or null when nothing lives at that path (a 404). */
export function pageMeta(path: string): PageMeta | null {
  path = path.replace(/\/+$/, '') || '/'
  if (PAGES[path]) return PAGES[path]
  const slug = /^\/works\/([^/]+)$/.exec(path)?.[1]
  const project = slug ? getProject(slug) : undefined
  if (!project) return null
  return {
    title: `${project.title} – ${project.tagline} — ${SITE.name}`,
    description: clip(project.intro),
    image: project.cover,
    noindex: project.hidden,
  }
}

export const NOT_FOUND: PageMeta = { title: `Page not found — ${SITE.name}`, description: HOME_DESCRIPTION, noindex: true }

/** Every page worth listing in the sitemap. */
export const sitemapPaths = () => [
  ...Object.keys(PAGES),
  ...projects.filter((p) => !p.hidden).map((p) => `/works/${p.slug}`),
]
