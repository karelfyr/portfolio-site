import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { LogoBracket } from '../components/LogoBracket'
import { LogoMarquee } from '../components/LogoMarquee'
import { logos } from '../data/logos'

export function Logos() {
  return (
    <section className="page">
      <div className="container">
        <TextEffect as="h1" className="page__title" text="Logos" per="word" trigger="appear" delay={0.3} />
        <div className="brackets">
          {logos.map((l) => <LogoBracket key={l.name} logo={l} />)}
        </div>
      </div>
      <Appear className="logos__marquee" delay={0.2}>
        <LogoMarquee logos={logos} />
      </Appear>
    </section>
  )
}
