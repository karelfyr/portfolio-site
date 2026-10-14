import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { Img } from '../components/Img'

export function Contact() {
  return (
    <section className="page container contact">
      <div className="contact__main">
        <TextEffect as="h1" className="page__title" text="Contact" per="word" trigger="appear" delay={0.3} />
        <div className="contact__row">
          <TextEffect
            className="body contact__intro"
            text="Let’s create something meaningful together. I’d love to hear about your project, big or small."
            per="line"
            trigger="inView"
            delay={0.2}
          />
          <div className="contact__details">
            <Appear as="p" className="label label--muted" blur>Email &amp; phone</Appear>
            <Appear blur>
              <a className="body link-hover" href="mailto:karelfyrbach@gmail.com">karelfyrbach@gmail.com</a>
            </Appear>
          </div>
        </div>
      </div>
      <Appear className="contact__photo" y={24} duration={1.1}>
        <Img alt="Karel Fyrbach" />
      </Appear>
    </section>
  )
}
