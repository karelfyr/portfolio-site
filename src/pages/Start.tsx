import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { StartProjectButton } from '../components/StartProjectButton'

/** Concept page: one "Get in touch" action that opens the project / quick-inquiry flow. */
export function Start() {
  return (
    <section className="page container book">
      <TextEffect as="h1" className="page__title" text="Start a project" per="word" trigger="appear" delay={0.3} />
      <TextEffect
        className="body book__intro"
        text="Three short questions – about a minute. Then pick a time on my calendar, or just send a message."
        per="line"
        trigger="appear"
        delay={0.5}
      />
      <Appear delay={0.3}>
        <StartProjectButton />
      </Appear>
    </section>
  )
}
