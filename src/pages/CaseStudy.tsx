import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { TextEffect } from '../components/TextEffect'
import { Img } from '../components/Img'
import { getProject, type GalleryRow, type PairItem, type SectionName } from '../data/projects'
import { GolfdrenEdges } from '../sections/GolfdrenEdges'

const ease = [0.22, 1, 0.36, 1] as const

/** Image block that blurs + rises in as it scrolls into view. */
function Reveal({ className, children, delay = 0 }: { className: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

const sections: Record<SectionName, () => React.JSX.Element> = { 'golfdren-edges': GolfdrenEdges }

function PairCell({ item, alt, delay }: { item: PairItem; alt: string; delay: number }) {
  // Live sections run their own entrance animation, so they skip the Reveal wrapper.
  if (item && typeof item === 'object') {
    const Section = sections[item.section]
    return <Section />
  }
  return <Reveal className="cs-img cs-img--pair" delay={delay}><Img src={item} alt={alt} /></Reveal>
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
        <PairCell item={row.src?.[0]} alt={alt} delay={0} />
        <PairCell item={row.src?.[1]} alt={alt} delay={0.1} />
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
    { label: 'Delivered', value: project.delivered },
    { label: 'Impact', value: project.impact },
    { label: 'Tools used', value: project.tools },
  ]

  return (
    <article className="cs container">
      <header className="cs__head">
        <TextEffect as="h1" className="cs__title" text={project.title} per="word" trigger="appear" delay={0.3} />
        <motion.div
          className="cs-img cs-img--hero"
          initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease, delay: 0.5 }}
        >
          <Img src={project.hero} alt={project.title} />
        </motion.div>
      </header>

      <div className="cs__body">
        <aside className="cs__info">
          <TextEffect className="body" text={project.intro} per="line" trigger="inView" delay={0.2} />
          <dl className="cs__facts">
            {facts.map((f) => (
              <div key={f.label} className="cs__fact">
                <dt className="label label--muted">{f.label}</dt>
                <TextEffect as="dd" className="body" text={f.value} per="line" trigger="inView" delay={0.2} />
              </div>
            ))}
          </dl>
          <Link to="/contact" className="btn">Work with me</Link>
        </aside>

        <div className="cs__gallery">
          {project.gallery.map((row, i) => <Row key={i} row={row} alt={`${project.title} — image ${i + 1}`} />)}
        </div>
      </div>
    </article>
  )
}
