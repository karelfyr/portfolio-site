export type Category = 'brands-products' | 'visuals-interfaces' | 'photography'

/** Paths under /public, e.g. "/images/golfdren/01.jpg". Leave empty for a placeholder. */
type Src = string | undefined

/** Live coded sections that can stand in for an image. */
export type SectionName = 'golfdren-edges'

/** A pair cell holds an image path (or nothing, for a placeholder) or a live section. */
export type PairItem = Src | { section: SectionName }

/** One row of the case study gallery. */
export type GalleryRow =
  | { type: 'tall'; src?: Src } // portrait, ~ 349 × 496
  | { type: 'large'; src?: Src } // portrait, 3840 × 5400
  | { type: 'wide'; src?: Src } // landscape, ~ 349 × 245
  | { type: 'pair'; src?: [PairItem, PairItem] } // two portraits side by side
  | { type: 'section'; name: SectionName } // live coded section, full width

export type Project = {
  slug: string
  title: string
  tagline: string
  cover?: Src
  categories: Category[]
  featured?: boolean
  // Case study
  hero?: Src
  intro: string
  year: string
  delivered: string
  impact: string
  tools: string
  gallery: GalleryRow[]
}

const allProjects: Project[] = [
  {
    slug: 'pos-digital',
    title: 'POS Digital',
    tagline: 'Signage experiences and kiosk interfaces for global brands',
    cover: '/images/pos-digital/decathlon-kiosk.jpg',
    categories: ['visuals-interfaces'],
    featured: true,
    hero: '/images/pos-digital/hero-kiosks.webp',
    intro:
      'POS Digital designs and sells advertisement screens and touchscreen kiosks for brands like Marriott, Decathlon, KIA, GAP, Celio and 100+ more major brands.',
    year: '2022 – now',
    delivered: 'Signage Experience Design · Product Visualizations · Kiosk Interface Design',
    impact:
      'I designed a touchscreen kiosk interface for Decathlon, KIA, and Marriott – projects serving more than 50 000 users monthly. I also create realistic signage experience visualizations that stand at the beginning of every project.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'wide', src: '/images/pos-digital/decathlon-references.jpg' },
      { type: 'pair', src: ['/images/pos-digital/peripherals.jpg', '/images/pos-digital/dahlia-kiosk.jpg'] },
      { type: 'wide', src: '/images/pos-digital/kiosk-stand.jpg' },
      { type: 'pair', src: ['/images/pos-digital/led-wall.jpg', '/images/pos-digital/decathlon-kiosk.jpg'] },
      { type: 'wide', src: '/images/pos-digital/ad-booking-ui.jpg' },
    ],
  },
  {
    // TODO: text is copied from POS Digital as a placeholder — replace with Float's own copy.
    slug: 'float',
    title: 'Float',
    tagline: 'Signage experiences and kiosk interfaces for global brands',
    cover: '/images/float/class-detail.webp',
    categories: ['brands-products', 'visuals-interfaces'],
    featured: true,
    hero: '/images/float/hero-app.webp',
    intro:
      'POS Digital designs and sells advertisement screens and touchscreen kiosks for brands like Marriott, Decathlon, KIA, GAP, Celio and 100+ more major brands.',
    year: '2022 – now',
    delivered: 'Signage Experience Design · Product Visualizations · Kiosk Interface Design',
    impact:
      'I designed a touchscreen kiosk interface for Decathlon, KIA, and Marriott – projects serving more than 50 000 users monthly. I also create realistic signage experience visualizations that stand at the beginning of every project.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'wide', src: '/images/float/moodboard.webp' },
      { type: 'wide', src: '/images/float/type-elements.webp' },
      { type: 'wide', src: '/images/float/category-cards.webp' },
      { type: 'wide', src: '/images/float/classes.webp' },
      { type: 'pair', src: ['/images/float/class-detail.webp', '/images/float/membership.webp'] },
      { type: 'wide', src: '/images/float/schedule.webp' },
    ],
  },
  {
    slug: 'golfdren',
    title: 'Golfdren',
    tagline: 'Weaving Artisan Stories into a Global Brand',
    cover: '/images/golfdren/tablet-aeration.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/golfdren/hero-desktop.webp',
    intro:
      'GolfDren makes drainage solutions for golf bunkers. The goal was a fresh brand that could support new services – while staying clear for older audiences.',
    year: '2026',
    delivered: 'Branding · Website Design & Dev · Design System · Custom Illustrations',
    impact:
      'All brand materials live in one Figma project – consistent and professional, with a service offering shaped by real competitor research.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'tall', src: '/images/golfdren/tablet-aeration.webp' },
      { type: 'wide', src: '/images/golfdren/installation-variants.webp' },
      { type: 'large', src: '/images/golfdren/page-aeration.webp' },
      { type: 'pair', src: ['/images/golfdren/project-proposal.webp', '/images/golfdren/poster.webp'] },
      { type: 'wide', src: '/images/golfdren/phone-articles.webp' },
    ],
  },
]

/** Projects in A–Z order by title, everywhere they're listed. */
export const projects = [...allProjects].sort((a, b) => a.title.localeCompare(b.title))

export const getProject =(slug?: string) => projects.find((p) => p.slug === slug)
