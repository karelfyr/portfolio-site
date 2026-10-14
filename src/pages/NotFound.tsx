import { Link } from 'react-router-dom'
import { TextEffect } from '../components/TextEffect'
import { Appear } from '../components/Appear'

export function NotFound() {
  return (
    <section className="page container">
      <TextEffect as="h1" className="page__title" text="Page not found" per="word" trigger="appear" delay={0.3} />
      <Appear className="notfound__back" delay={0.5}>
        <Link to="/" className="label underline-link">Back to home</Link>
      </Appear>
    </section>
  )
}
