import { TextEffect } from './TextEffect'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <TextEffect as="h2" className="h2" text="Reach out" trigger="inView" per="line" delay={0.2} />
        <div className="footer__row">
          <div className="footer__links">
            <a className="label link-hover" href="mailto:karelfyrbach@gmail.com">Email</a>
            <a className="label link-hover" href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
          <p className="label">©2026</p>
        </div>
      </div>
    </footer>
  )
}
