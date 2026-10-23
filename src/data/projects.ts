export type Category = 'brands-products' | 'visuals-interfaces' | 'photography'

/** Paths under /public, e.g. "/images/golfdren/01.jpg". Leave empty for a placeholder. */
type Src = string | undefined

/** Live coded sections that can stand in for an image. */
export type SectionName = 'golfdren-edges' | 'shortcuts-hero' | 'shortcuts-clip' | 'decathlon-clip'

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
  /** Not listed anywhere (no card, not in Works); its case study page opens only by direct link. */
  hidden?: boolean
  // Case study
  hero?: Src
  /** A live coded section shown instead of the hero image. */
  heroSection?: SectionName
  intro: string
  year: string
  /** Optional; left out when empty. */
  delivered?: string
  /** Optional; the fact is left out when there's no impact line. */
  impact?: string
  /** Label for the impact fact; defaults to "Impact". */
  impactLabel?: string
  gallery: GalleryRow[]
}

const allProjects: Project[] = [
  {
    slug: 'pos-digital',
    title: 'POS Digital',
    tagline: 'Digital signage kiosk experiences',
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
    gallery: [
      { type: 'wide', src: '/images/pos-digital/posdigital_2.webp' },
      { type: 'pair', src: ['/images/pos-digital/posdigital_3.webp', '/images/pos-digital/posdigital_4.webp'] },
      { type: 'wide', src: '/images/pos-digital/posdigital_5.webp' },
      { type: 'pair', src: ['/images/pos-digital/posdigital_6.webp', '/images/pos-digital/posdigital_7.webp'] },
      { type: 'wide', src: '/images/pos-digital/posdigital_8.webp' },
    ],
  },
  {
    slug: 'float',
    title: 'Float',
    tagline: 'Branding refresh and app design',
    cover: '/images/Thumbnails/float_thumb.webp',
    categories: ['brands-products', 'visuals-interfaces'],
    featured: true,
    hero: '/images/float/Float_1.webp',
    intro:
      'Float is a breathing and meditation app by STRV, a digital product studio with $16M in revenue in 2025. In their Senior Designer hiring process, I placed 2nd after a 4-day design challenge.',
    year: '2026',
    delivered: 'Visual Direction · Key App Screens · Breathing Class Booking Flow',
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
    slug: 'shortcuts',
    title: 'Shortcuts',
    tagline: 'Keyboard shortcuts list app',
    cover: '/images/Thumbnails/Shortcuts_thumb.webp',
    categories: ['visuals-interfaces'],
    featured: true,
    heroSection: 'shortcuts-hero',
    intro:
      'I designed and built a macOS app that pulls up a searchable list of shortcuts for whichever app you’re in, with a single keystroke – and shipped it to 100+ developers.',
    year: '2026',
    gallery: [
      { type: 'section', name: 'shortcuts-clip' }, // 3840 × 2700 animated HUD clip
    ],
  },
  {
    slug: 'zoe',
    title: 'ZoeAI',
    tagline: 'Pitch deck design',
    cover: '/images/Thumbnails/zoe_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/Zoe/zoe_1.webp',
    intro:
      'I redesigned the investor deck and visual identity for Zoe AI (now Perselio), an e-commerce search and recommendation platform for European retailers – to sharpen its value proposition and set it apart.',
    year: '2024',
    delivered: 'Pitch Deck Copywriting · Pitch Deck Visuals',
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
    slug: 'polyglow',
    title: 'Polyglow',
    tagline: 'Brand visuals, landing page and app',
    cover: '/images/Thumbnails/polyglow_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/polyglow/PolyGlow_1.webp',
    intro:
      'I conceived and designed the Polyglow language app to win a product designer seat at Blackfish, a Czech digital product studio with ~$1M ARR.',
    year: '2024',
    delivered: 'Product Concept · Positioning · Web Copy · Landing Page · App Design',
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
    tagline: 'Visual identity and web design',
    cover: '/images/Thumbnails/golfdren_thumb.webp',
    categories: ['brands-products'],
    featured: true,
    hero: '/images/golfdren/GolfDren_1.webp',
    intro:
      'GolfDren makes drainage solutions for golf bunkers. The goal was a fresh brand that could support new services – while staying clear for older audiences.',
    year: '2026',
    delivered: 'Branding · Website Design & Dev · Design System · Custom Illustrations',
    gallery: [
      { type: 'large', src: '/images/golfdren/GolfDren_2.webp' },
      { type: 'wide', src: '/images/golfdren/GolfDren_3.webp' },
      { type: 'large', src: '/images/golfdren/GolfDren_4.webp' },
      { type: 'pair', src: ['/images/golfdren/GolfDren_5.webp', '/images/golfdren/GolfDren_6.webp'] },
      { type: 'wide', src: '/images/golfdren/GolfDren_7.webp' },
    ],
  },
  {
    slug: 'decathlon',
    title: 'Decathlon',
    tagline: 'Navigation kiosk design',
    cover: '/images/Thumbnails/decathlon_thumb.webp',
    categories: ['visuals-interfaces'],
    featured: true,
    hero: '/images/decathlon/Decathlon_1.webp',
    intro:
      'I designed the in-store navigation kiosk for Decathlon. Shoppers pick a sports section or search a sport from A to Z, and the kiosk shows them the way – the section’s sports, the route across the store map from where they stand, and a matching product next to it.',
    year: '2026',
    delivered: 'Kiosk Interface Design · Wayfinding Flow · Store Map · Motion Prototype',
    impact:
      'Part of my kiosk work at POS Digital for Decathlon, KIA and Marriott – touchscreen interfaces serving more than 50 000 users every month.',
    gallery: [
      { type: 'section', name: 'decathlon-clip' }, // 3840 × 2700 animated kiosk clip
    ],
  },
  {
    // TODO: placeholder lorem ipsum and empty images — replace with Blackfish's own copy and images.
    slug: 'blackfish',
    title: 'Blackfish',
    hidden: true,
    tagline: 'Design agency work',
    categories: ['brands-products'],
    featured: true,
    intro:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua – ut enim ad minim veniam.',
    year: '2026',
    delivered: 'Lorem Ipsum · Dolor Sit Amet · Consectetur',
    impact:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    gallery: [{ type: 'tall' }, { type: 'wide' }, { type: 'pair' }, { type: 'wide' }],
  },
]

/** Display order by slug. Projects not listed here follow in A–Z order by title. */
const order = ['float', 'pos-digital', 'golfdren', 'polyglow', 'shortcuts', 'zoe']

const rank = (p: Project) => {
  const i = order.indexOf(p.slug)
  return i === -1 ? order.length : i
}

export const projects = allProjects
  .filter((p) => !p.hidden)
  .sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))

/** Any project's case study by slug – unlisted (hidden) ones too, so they open by direct link. */
export const getProject = (slug?: string) => allProjects.find((p) => p.slug === slug)
