import { useState } from 'react'
import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { Img } from '../components/Img'
import { EMAIL, EmailButtons, Icon, LINKEDIN } from '../components/EmailActions'

export function Contact() {
  // After copying, the buttons stay up (showing "Copied") a while, even if the mouse has left.
  const [holding, setHolding] = useState(false)
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
            <Appear className={`contact__email${holding ? ' is-holding' : ''}`} blur>
              <p className="label label--muted">Email</p>
              {/* Hover / focus: the buttons take the address's place */}
              <div className="contact__email-line">
                <p className="body contact__address">{EMAIL}</p>
                <EmailButtons onCopied={setHolding} />
              </div>
            </Appear>
            <Appear className="contact__linkedin" blur>
              <p className="label label--muted">LinkedIn</p>
              <a className="body contact__link" href={LINKEDIN} target="_blank" rel="noreferrer">
                Karel Fyrbach <Icon name="out" />
              </a>
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
