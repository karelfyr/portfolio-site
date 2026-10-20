import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { TextEffect } from '../components/TextEffect'
import { Img } from '../components/Img'
import { Appear } from '../components/Appear'
import { TagList } from '../components/TagList'
import { getProject, type GalleryRow, type PairItem, type SectionName } from '../data/projects'
import { GolfdrenEdges } from '../sections/GolfdrenEdges'
import { ShortcutsHero } from '../sections/ShortcutsHero'
import { ShortcutsClip } from '../sections/shortcuts/ShortcutsClip'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Image block that fades + rises in as it scrolls into view, in sequence with
 * everything else revealing. No blur: animating blur on large images causes jank.
 */
function Reveal({ className, children }: { className: string; children: React.ReactNode }) {
  return <Appear className={className} y={40} duration={1}>{children}</Appear>
}

const sections: Record<SectionName, () => React.JSX.Element> = {
  'golfdren-edges': GolfdrenEdges,
  'shortcuts-hero': ShortcutsHero,
  'shortcuts-clip': ShortcutsClip,
}

function PairCell({ item, alt }: { item: PairItem; alt: string }) {
  // Live sections run their own entrance animation, so they skip the Reveal wrapper.
  if (item && typeof item === 'object') {
    const Section = sections[item.section]
    return <Section />
  }
  return <Reveal className="cs-img cs-img--pair"><Img src={item} alt={alt} /></Reveal>
}

function Row({ row, alt }: { row: GalleryRow; alt: string }) {
  if (row.type === 'section') {
    const Section = sections[row.name]
    return <Section />
  }
  if (row.type === 'pair') {
    const hasSection = row.src?.some((item) => item && typeof item === 'object')
    return (
      <div className={hasSection ? 'cs-pair cs-pair--section' : 'cs-pair'}>
        <PairCell item={row.src?.[0]} alt={alt} />
        <PairCell item={row.src?.[1]} alt={alt} />
      </div>
    )
  }
  return <Reveal className={`cs-img cs-img--${row.type}`}><Img src={row.src} alt={alt} /></Reveal>
}

export function CaseStudy() {
  const { slug } = useParams()
  const project = getProject(slug)

  if (!project) {
    return (
      <section className="cs container">
        <h1 className="cs__title">Not found</h1>
        <Link to="/works" className="label underline-link">Back to works</Link>
      </section>
    )
  }

  const facts = [
    { label: 'Year', value: project.year },
    ...(project.delivered ? [{ label: 'Delivered', value: project.delivered }] : []),
    ...(project.impact ? [{ label: project.impactLabel ?? 'Impact', value: project.impact }] : []),
  ]

  return (
    <article className="cs container">
      <header className="cs__head">
        <TextEffect as="h1" className="cs__title" text={project.title} per="word" trigger="appear" delay={0.3} />
        {project.heroSection ? (
          // Coded hero sections are shown fully static.
          (() => {
            const HeroSection = sections[project.heroSection]
            return <HeroSection />
          })()
        ) : (
          <motion.div
            className="cs-img cs-img--hero"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease, delay: 0.5 }}
          >
            <Img src={project.hero} alt={project.title} priority />
          </motion.div>
        )}
      </header>

      <div className="cs__body">
        <aside className="cs__info">
          <TextEffect className="body" text={project.intro} per="line" trigger="inView" delay={0.2} />
          <dl className="cs__facts">
            {facts.map((f) => (
              <div key={f.label} className="cs__fact">
                <Appear as="dt" className="label label--muted" blur>{f.label}</Appear>
                {f.label === 'Delivered' ? (
                  // Tags never split; a wrap shows "·" at the end of the line and the start of the next.
                  <Appear as="dd" className="body" blur>
                    <TagList value={f.value} />
                  </Appear>
                ) : (
                  <TextEffect as="dd" className="body" text={f.value} per="line" trigger="inView" delay={0.2} />
                )}
              </div>
            ))}
          </dl>
          <Appear>
            <Link to="/contact" className="btn">Work with me</Link>
          </Appear>
        </aside>

        <div className="cs__gallery">
          {project.gallery.map((row, i) => <Row key={i} row={row} alt={`${project.title} — image ${i + 1}`} />)}
        </div>
      </div>
    </article>
  )
}
