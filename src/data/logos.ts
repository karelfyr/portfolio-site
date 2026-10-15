/**
 * Client logos, exported 1:1 from Figma ("Logos" section, node 367:1961).
 * Each SVG in /public/logos is the bare (unframed) logo.
 */
export type Logo = {
  name: string
  src: string
  /** What I did for them (bracket card caption). */
  description: string
  /** Bare logo size in the Figma export (px). */
  w: number
  h: number
  /** Width inside a bracket card, in Figma px (card is 1117 wide). */
  bracketW: number
  /** Position inside the equal-spacing 1000×600 frame (Figma px). */
  frame: { x: number; y: number }
}

export const logos: Logo[] = [
  {
    name: 'CertiCon',
    src: '/logos/certicon.svg',
    description: 'Positioning, brand and website for leading Czech software company.',
    w: 706, h: 226, bracketW: 440, frame: { x: 146, y: 186 },
  },
  {
    name: 'POS Digital',
    src: '/logos/posdigital.svg',
    description: '5 years of leading design at firm selling digital kiosks and screens across Europe.',
    w: 782, h: 159.621, bracketW: 504, frame: { x: 108, y: 219.55 },
  },
  {
    name: 'Kia',
    src: '/logos/kia.svg',
    description: 'Design interactive kiosk experience for live events.',
    w: 506, h: 119.561, bracketW: 344, frame: { x: 246, y: 238.84 },
  },
  {
    name: 'Marriott',
    src: '/logos/marriott.svg',
    description: 'Information kiosk design for premium hotel lobby experience.',
    w: 750, h: 152.173, bracketW: 455, frame: { x: 124, y: 224.09 },
  },
  {
    name: 'Perseuss',
    src: '/logos/perseus.svg',
    description: 'Video-creation and content strategy for US based AI startup.',
    w: 901.094, h: 167.682, bracketW: 560, frame: { x: 48.91, y: 216 },
  },
  {
    name: 'Decathlon',
    src: '/logos/decathlon.svg',
    description: 'Touchscreen store navigation kiosk with targeted advertisement.',
    w: 815.351, h: 122.499, bracketW: 520, frame: { x: 92.65, y: 238 },
  },
  {
    name: 'GolfDren',
    src: '/logos/golfdren.svg',
    description: 'Branding and website for a European leader in golf course solutions.',
    w: 795.091, h: 107.853, bracketW: 509, frame: { x: 101.46, y: 246 },
  },
  {
    name: 'Blackfish',
    src: '/logos/blackfish.svg',
    description: 'In-house designer for Czech based design agency working for brands like Lego or Forbes.',
    w: 746, h: 132, bracketW: 477, frame: { x: 126, y: 234 },
  },
]
