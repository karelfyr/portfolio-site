import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { Img } from '../components/Img'
import { EmailReveal, LinkedInLink } from '../components/EmailActions'

export function Contact() {
  return (
    <section className="page container contact">
      <div className="contact__main">
        <TextEffect as="h1" className="page__title" text="Contact" per="word" trigger="appear" delay={0.3} />
        <div className="contact__row">
          <TextEffect
            className="body contact__intro"
            text="Let’s create something meaningful."
            per="line"
            trigger="inView"
            delay={0.2}
          />
          <div className="contact__details">
            <Appear className="contact__item" blur>
              <p className="label label--muted">Email</p>
              <EmailReveal />
            </Appear>
            <Appear className="contact__item" blur>
              <p className="label label--muted">LinkedIn</p>
              <LinkedInLink>Karel Fyrbach</LinkedInLink>
            </Appear>
          </div>
        </div>
      </div>
      <Appear className="contact__photo" y={24} duration={1.1}>
        <Img src="/images/Profilovka/pp.webp" alt="Karel Fyrbach" />
      </Appear>
    </section>
  )
}
