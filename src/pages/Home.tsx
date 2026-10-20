import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { TextEffect } from '../components/TextEffect'
import { BlurOnScroll } from '../components/BlurOnScroll'
import { ProjectCard } from '../components/ProjectCard'
import { Img } from '../components/Img'
import { useMobileSafeVh } from '../hooks/useMobileSafeVh'
import { getProject } from '../data/projects'
import { Appear } from '../components/Appear'
import { IntroVideo } from '../components/IntroVideo'
import { LogoBracket } from '../components/LogoBracket'
import { logos } from '../data/logos'

// Projects shown in "Selected works", in this order.
const selectedWorks = ['float', 'pos-digital', 'golfdren']

const about = [
  { label: 'My focus', body: ['Removing friction and creating beautiful experiences through systems and design.'] },
  { label: 'Manifesto', body: ['Design is how we do everything. Product, marketing, sales. The way we live.'] },
  {
    label: 'Education',
    body: [
      "Bachelor's Computer Science",
      "Master's in UX Research",
      '6 month Erasmus at Koç University, Turkey',
      '6 month Erasmus+ at ASU, Arizona',
    ],
  },
]

const timeline = [
  { when: '2020 – now', what: 'Freelance Design Engineer' },
  { when: 'May 2026', what: 'Moved to New York to learn about trends in product building through meeting founders and attending events and hackathons.' },
  { when: '2024', what: 'UX designer at Blackfish – Czech digital product studio' },
  { when: '2021 – now', what: 'Digital Kiosk Designer at POS Digital (designed for KIA, Marriott, Decathlon and more)' },
]

export function Home() {
  useMobileSafeVh()
  const featured = selectedWorks.map((slug) => getProject(slug)).filter((p) => p !== undefined)

  return (
    <>
      <section className="hero">
        <BlurOnScroll className="hero__content">
          <TextEffect as="h1" className="hero__title" text={'Engineer [video] with\ndesigner’s eye'}
            inserts={{ '[video]': <IntroVideo /> }} per="word" trigger="appear" delay={0.6} />
          <TextEffect
            className="label hero__sub"
            text="I’m Karel, once a kid who loved photography, now building software and brands."
            per="line"
            trigger="appear"
            delay={1.0}
          />
          {/* Phones: the intro video gets its own, bigger still between the title and the subtitle */}
          <motion.div
            className="hero__video"
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
          >
            <IntroVideo variant="block" />
          </motion.div>
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
              {featured.map((p) => <ProjectCard key={p.slug} project={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Clients, right under the work */}
      <section className="section section--clients">
        <div className="container">
          {/* A quieter label, not a big section title — the logos do the talking. */}
          <TextEffect as="h2" className="label label--muted" text="Trusted by industry leaders" trigger="inView" per="line" delay={0.2} />
          <div className="brackets">
            {logos.map((l) => <LogoBracket key={l.name} logo={l} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about">
          <div className="about__main">
            <TextEffect as="h2" className="h2" text={'Glad you are here!\nA bit about me.'} trigger="inView" per="line" delay={0.2} />
            <dl className="about__rows">
              {about.map((row) => (
                <div className="about__row" key={row.label}>
                  <Appear as="dt" className="label label--muted" blur>{row.label}</Appear>
                  <dd className="body">
                    {row.body.length === 1 ? (
                      <TextEffect text={row.body[0]} trigger="inView" per="line" delay={0.2} />
                    ) : (
                      row.body.map((line) => <Appear as="p" key={line} blur>{line}</Appear>)
                    )}
                  </dd>
                </div>
              ))}
              <div className="about__row">
                <Appear as="dt" className="label label--muted" blur>Experience</Appear>
                <dd className="timeline">
                  {timeline.map((t) => (
                    <Appear key={t.when + t.what} className="timeline__item" blur>
                      <p className="timeline__when">{t.when}</p>
                      <p className="body">{t.what}</p>
                    </Appear>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
          <Appear className="about__photo" y={24} duration={1.1}>
            <Img src="/images/Profilovka/pp.webp" alt="Karel Fyrbach" />
          </Appear>
        </div>
      </section>
    </>
  )
}
