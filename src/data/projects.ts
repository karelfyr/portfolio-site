export type Category = 'brands-products' | 'visuals-interfaces' | 'photography'

/** Paths under /public, e.g. "/images/golfdren/01.jpg". Leave empty for a placeholder. */
type Src = string | undefined

/** Live coded sections that can stand in for an image. */
export type SectionName = 'golfdren-edges' | 'shortcuts-hero' | 'shortcuts-clip'

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
  /** A live coded section shown instead of the hero image. */
  heroSection?: SectionName
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
    cover: '/images/Thumbnails/posdigital_thumb.webp',
    categories: ['visuals-interfaces'],
    featured: true,
    hero: '/images/pos-digital/posdigital_1.webp',
    intro:
      'POS Digital designs and sells advertisement screens and touchscreen kiosks for brands like Marriott, Decathlon, KIA, GAP, Celio and 100+ more major brands.',
    year: '2022 – now',
    delivered: 'Signage Experience Design · Product Visualizations · Kiosk Interface Design',
    impact:
      'I designed a touchscreen kiosk interface for Decathlon, KIA, and Marriott – projects serving more than 50 000 users monthly. I also create realistic signage experience visualizations that stand at the beginning of every project.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'wide', src: '/images/pos-digital/posdigital_2.webp' },
      { type: 'pair', src: ['/images/pos-digital/posdigital_3.webp', '/images/pos-digital/posdigital_4.webp'] },
      { type: 'wide', src: '/images/pos-digital/posdigital_5.webp' },
      { type: 'pair', src: ['/images/pos-digital/posdigital_6.webp', '/images/pos-digital/posdigital_7.webp'] },
      { type: 'wide', src: '/images/pos-digital/posdigital_8.webp' },
    ],
  },
  {
    // TODO: text is copied from POS Digital as a placeholder — replace with Float's own copy.
    slug: 'float',
    title: 'Float',
    tagline: 'Signage experiences and kiosk interfaces for global brands',
    cover: '/images/Thumbnails/float_thumb.webp',
    categories: ['brands-products', 'visuals-interfaces'],
    featured: true,
    hero: '/images/float/Float_1.webp',
    intro:
      'POS Digital designs and sells advertisement screens and touchscreen kiosks for brands like Marriott, Decathlon, KIA, GAP, Celio and 100+ more major brands.',
    year: '2022 – now',
    delivered: 'Signage Experience Design · Product Visualizations · Kiosk Interface Design',
    impact:
      'I designed a touchscreen kiosk interface for Decathlon, KIA, and Marriott – projects serving more than 50 000 users monthly. I also create realistic signage experience visualizations that stand at the beginning of every project.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'wide', src: '/images/float/Float_2.webp' },
      { type: 'wide', src: '/images/float/Float_3.webp' },
      { type: 'wide', src: '/images/float/Float_4.webp' },
      { type: 'pair', src: ['/images/float/Float_5.webp', '/images/float/Float_6.webp'] },
      { type: 'wide', src: '/images/float/Float_7.webp' },
      { type: 'wide', src: '/images/float/Float_8.webp' },
    ],
  },
  {
    // TODO: placeholder lorem ipsum and empty gallery — replace with Shortcuts' own copy and images.
    slug: 'shortcuts',
    title: 'Shortcuts',
    tagline: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
    cover: '/images/Thumbnails/Shortcuts_thumb.webp',
    categories: ['visuals-interfaces'],
    featured: true,
    heroSection: 'shortcuts-hero',
    intro:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua – ut enim ad minim veniam.',
    year: '2026',
    delivered: 'Lorem Ipsum · Dolor Sit Amet · Consectetur',
    impact:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    tools: 'Lorem, Ipsum, Dolor, Sit Amet',
    gallery: [
      { type: 'section', name: 'shortcuts-clip' }, // 3840 × 2700 animated HUD clip
    ],
  },
  {
    // TODO: placeholder lorem ipsum — replace with Zoe's own copy.
    slug: 'zoe',
    title: 'Zoe',
    tagline: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
    cover: '/images/Thumbnails/zoe_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/Zoe/zoe_1.webp',
    intro:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua – ut enim ad minim veniam.',
    year: '2026',
    delivered: 'Lorem Ipsum · Dolor Sit Amet · Consectetur',
    impact:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    tools: 'Lorem, Ipsum, Dolor, Sit Amet',
    gallery: [
      { type: 'wide', src: '/images/Zoe/zoe_2.webp' },
      { type: 'pair', src: ['/images/Zoe/zoe_3.webp', '/images/Zoe/zoe_4.webp'] },
      { type: 'pair', src: ['/images/Zoe/zoe_5.webp', '/images/Zoe/zoe_6.webp'] },
      { type: 'wide', src: '/images/Zoe/zoe_7.webp' },
      { type: 'wide', src: '/images/Zoe/zoe_8.webp' },
      { type: 'wide', src: '/images/Zoe/zoe_9.webp' },
      { type: 'wide', src: '/images/Zoe/zoe_10.webp' },
    ],
  },
  {
    // TODO: placeholder lorem ipsum — replace with Polyglow's own copy.
    slug: 'polyglow',
    title: 'Polyglow',
    tagline: 'Lorem ipsum dolor sit amet, consectetur adipiscing',
    cover: '/images/Thumbnails/polyglow_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/polyglow/PolyGlow_1.webp',
    intro:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua – ut enim ad minim veniam.',
    year: '2026',
    delivered: 'Lorem Ipsum · Dolor Sit Amet · Consectetur',
    impact:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    tools: 'Lorem, Ipsum, Dolor, Sit Amet',
    gallery: [
      { type: 'wide', src: '/images/polyglow/PolyGlow_2.webp' },
      { type: 'large', src: '/images/polyglow/PolyGlow_3.webp' },
      { type: 'large', src: '/images/polyglow/PolyGlow_4.webp' },
      { type: 'wide', src: '/images/polyglow/PolyGlow_5.webp' },
      { type: 'wide', src: '/images/polyglow/PolyGlow_6.webp' },
    ],
  },
  {
    slug: 'golfdren',
    title: 'Golfdren',
    tagline: 'Weaving Artisan Stories into a Global Brand',
    cover: '/images/Thumbnails/golfdren_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/golfdren/GolfDren_1.webp',
    intro:
      'GolfDren makes drainage solutions for golf bunkers. The goal was a fresh brand that could support new services – while staying clear for older audiences.',
    year: '2026',
    delivered: 'Branding · Website Design & Dev · Design System · Custom Illustrations',
    impact:
      'All brand materials live in one Figma project – consistent and professional, with a service offering shaped by real competitor research.',
    tools: 'Figma, Claude, Weavy, Pixelmator Pro, Photomator',
    gallery: [
      { type: 'large', src: '/images/golfdren/GolfDren_2.webp' },
      { type: 'wide', src: '/images/golfdren/GolfDren_3.webp' },
      { type: 'large', src: '/images/golfdren/GolfDren_4.webp' },
      { type: 'pair', src: ['/images/golfdren/GolfDren_5.webp', '/images/golfdren/GolfDren_6.webp'] },
      { type: 'wide', src: '/images/golfdren/GolfDren_7.webp' },
    ],
  },
]

/** Display order by slug. Projects not listed here follow in A–Z order by title. */
const order = ['float', 'pos-digital', 'golfdren', 'polyglow', 'shortcuts', 'zoe']

const rank = (p: Project) => {
  const i = order.indexOf(p.slug)
  return i === -1 ? order.length : i
}

export const projects = [...allProjects].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))

export const getProject =(slug?: string) => projects.find((p) => p.slug === slug)
