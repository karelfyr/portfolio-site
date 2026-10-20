import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'
import { BookCallButton } from '../components/BookCallButton'

const details = [
  { label: 'Length', value: '20 minutes' },
  { label: 'Where', value: 'Google Meet' },
  { label: 'What we cover', value: 'What you’re building, where design can help, and whether I’m the right fit.' },
]

/** Concept page: a single "Book call" action that opens the Cal.com scheduler. */
export function Book() {
  return (
    <section className="page container book">
      <TextEffect as="h1" className="page__title" text="Let’s talk" per="word" trigger="appear" delay={0.3} />
      <TextEffect
        className="body book__intro"
        text="Pick a time. The calendar invite and Google Meet link arrive straight away."
        per="line"
        trigger="appear"
        delay={0.5}
      />
      <dl className="book__details">
        {details.map((d) => (
          <Appear key={d.label} className="book__detail">
            <dt className="label label--muted">{d.label}</dt>
            <dd className="body">{d.value}</dd>
          </Appear>
        ))}
      </dl>
      <Appear delay={0.3}>
        <BookCallButton />
      </Appear>
    </section>
  )
}
