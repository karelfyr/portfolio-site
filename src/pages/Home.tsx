import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { TextEffect } from '../components/TextEffect'
import { BlurOnScroll } from '../components/BlurOnScroll'
import { ProjectCard } from '../components/ProjectCard'
import { Img } from '../components/Img'
import { useMobileSafeVh } from '../hooks/useMobileSafeVh'
import { projects } from '../data/projects'

const about = [
  { label: 'What I do', body: ['Finding what makes a brand different, and making it clear – through visuals, words, and intentional design.'] },
  { label: 'What I stand for', body: ['Fancy brand manuals do not save complicated products and unhappy employees. I design for the real world.'] },
  {
    label: 'What got me here',
    body: [
      "Bachelor's Computer Science",
      "Master's in UX Research",
      '6 month study program in Turkey',
      '6 month study program in the United States',
    ],
  },
]

const timeline = [
  { when: '2018 – now', what: 'Independent Designer' },
  { when: '2021 – now', what: 'Kiosk Interface Designer at POS Digital: Projects for KIA, Marriott or Decathlon.' },
  { when: '2025', what: 'UX Designer at Blackfish.co' },
  {
    when: 'May 2026',
    what: 'Moved to New York to meet founders and creatives, hit hackathons, and get a front-row seat to where creative technology is heading.',
  },
]

const reveal = {
  initial: { opacity: 0, y: 16, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 },
}

export function Home() {
  useMobileSafeVh()
  const featured = projects.filter((p) => p.featured)

  return (
    <>
      <section className="hero">
        <BlurOnScroll className="hero__content">
          <TextEffect as="h1" className="hero__title" text={'Really good\ndesigner'} per="word" trigger="appear" delay={0.6} />
          <TextEffect
            className="label hero__sub"
            text="My name is karel. I design brands, digital products and make videos about it."
            per="line"
            trigger="appear"
            delay={1.0}
          />
        </BlurOnScroll>
        <motion.div
          className="hero__cta"
          initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 1.3 }}
        >
          <Link to="/contact" className="btn">Work with me</Link>
        </motion.div>
      </section>

      <section className="section section--rule">
        <div className="container">
          <div className="section__head">
            <TextEffect as="h2" className="h2" text="Selected works" trigger="inView" per="line" delay={0.2} />
            <Link to="/works" className="label underline-link">See all works</Link>
          </div>
          {featured.length > 0 && (
            <div className="grid">
              {featured.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container about">
          <div className="about__main">
            <TextEffect as="h2" className="h2" text="Who you'll work with" trigger="inView" per="line" delay={0.2} />
            <dl className="about__rows">
              {about.map((row) => (
                <div className="about__row" key={row.label}>
                  <motion.dt className="label label--muted" {...reveal}>{row.label}</motion.dt>
                  <dd className="body">
                    {row.body.length === 1 ? (
                      <TextEffect text={row.body[0]} trigger="inView" per="line" delay={0.2} />
                    ) : (
                      row.body.map((line) => <motion.p key={line} {...reveal}>{line}</motion.p>)
                    )}
                  </dd>
                </div>
              ))}
              <div className="about__row">
                <motion.dt className="label label--muted" {...reveal}>7 years in design</motion.dt>
                <dd className="timeline">
                  {timeline.map((t) => (
                    <motion.div key={t.when + t.what} className="timeline__item" {...reveal}>
                      <p className="timeline__when">{t.when}</p>
                      <p className="body">{t.what}</p>
                    </motion.div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
          <motion.div
            className="about__photo"
            initial={{ opacity: 0, scale: 1.04, filter: 'blur(12px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Img alt="Karel Fyrbach" />
          </motion.div>
        </div>
      </section>
    </>
  )
}
