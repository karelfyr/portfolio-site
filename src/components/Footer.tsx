import { TextEffect } from './TextEffect'
import { EmailMenu, LINKEDIN } from './EmailActions'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <TextEffect as="h2" className="h2" text="Reach out" trigger="inView" per="line" delay={0.2} />
        <div className="footer__row">
          <div className="footer__links">
            <EmailMenu />
            <a className="label link-hover" href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
          <p className="label">©2026</p>
        </div>
      </div>
    </footer>
  )
}
