import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import '@fontsource/host-grotesk/500.css'
import '@fontsource/host-grotesk/600.css'
import '@fontsource/host-grotesk/700.css'
import '@fontsource/schibsted-grotesk/500.css'
import '@fontsource/schibsted-grotesk/600.css'
import './golfdren-edges.css'

/*
 * "Artificial Edges, Enhanced Protection" — 1:1 port of Figma frame 176:14621.
 * Built at the design's native 1900 × 2700 and scaled to fit, so every px value matches.
 * Motion comes from the frame's Figma timeline: each element fades/rises/un-blurs
 * over 1.86s on ease [0.16, 1, 0.3, 1], staggered by the start times below.
 */

const W = 1900
const H = 2700
const ease = [0.16, 1, 0.3, 1] as const
const duration = 1.86

type AnimProps = {
  delay: number
  x?: number
  y?: number
  blur?: boolean
  className?: string
  children: ReactNode
}

function Anim({ delay, x = 0, y = 0, blur = true, className, children }: AnimProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, x, y, filter: blur ? 'blur(16px)' : 'blur(0px)' },
        shown: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)', transition: { duration, ease, delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

const legend = [
  { label: 'Turf Sod', swatch: 'linear-gradient(180deg, #167F42 1.91%, #083200 118.51%)', delay: 0.336 },
  { label: 'Sand', swatch: 'linear-gradient(180deg, #D7C877 3.125%, #99703B 96.875%)', delay: 0.363 },
  { label: 'Separation Solution', swatch: '#915822', delay: 0.39 },
  { label: 'Bunker Bottom, Substrate', swatch: '#311F00', delay: 0.417 },
  { label: 'Artificial Turf Edge', swatch: '#F0B75C', delay: 0.444 },
]

export function GolfdrenEdges() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="ge" style={{ aspectRatio: `${W} / ${H}` }}>
      <motion.div
        className="ge__frame"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        initial={reduce ? false : 'hidden'}
        whileInView="shown"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="ge__card">
          <div className="ge__container">
            <div className="ge__title">
              <Anim delay={0} y={16.25} blur={false} className="ge__tagline">
                <p>Installation Variants</p>
              </Anim>
              <Anim delay={0.048} y={20.893}>
                <h3 className="ge__heading">Artificial Edges,<br />Enhanced Protection</h3>
              </Anim>
              <Anim delay={0.099} y={18.572}>
                <p className="ge__text">
                  Bunkers can take various forms. The best results come from solutions with artificial turf edges.
                </p>
              </Anim>
            </div>

            <div className="ge__group">
              <Anim delay={0.183} y={13.929} className="ge__tabs">
                <div className="ge__tab ge__tab--active">
                  <span className="ge__chip">We Recommend</span>
                  <span>Artificial Turf Edge</span>
                </div>
                <div className="ge__tab">Standard Solution</div>
              </Anim>

              <Anim delay={0.249} y={20.893} className="ge__panel">
                <div className="ge__advantages">
                  <Anim delay={0.294} x={25.536} className="ge__adv-inner">
                    <p className="ge__adv-title">Advantages of Artificial Edges</p>
                    <ul className="ge__list">
                      <li>Provide complete protection from all sides</li>
                      <li>Stay in excellent condition for up to 20 years</li>
                      <li>Require no additional maintenance costs</li>
                    </ul>
                  </Anim>
                </div>
                <div className="ge__legend-wrap">
                  <div className="ge__legend-row">
                    <Anim delay={0.312} y={9.286}>
                      <p className="ge__legend-title">Cut Legend</p>
                    </Anim>
                    <div className="ge__legend">
                      {legend.map((l) => (
                        <Anim key={l.label} delay={l.delay} y={11.607} className="ge__legend-item">
                          <span className="ge__swatch" style={{ background: l.swatch }} />
                          <span>{l.label}</span>
                        </Anim>
                      ))}
                    </div>
                  </div>
                </div>
              </Anim>
            </div>
          </div>

          <div className="ge__variants">
            <div className="ge__variants-row">
              {/* Animation sits on a wrapper so its blur doesn't replace the card's drop-shadow filter. */}
              <Anim delay={0.486} x={32.5} className="ge__variant-anim">
                <div className="ge__variant">
                  <p className="ge__variant-title">Designer Artificial Edge</p>
                  <div className="ge__variant-img">
                    <img
                      src="/images/golfdren/bunker-designer-edge.png"
                      alt="Cross-section of a bunker with a designer artificial edge"
                      style={{ position: 'absolute', left: 0, top: '15.76%', width: '100%', height: '64.14%' }}
                    />
                  </div>
                </div>
              </Anim>
              <Anim delay={0.541} x={32.5} className="ge__variant-anim">
                <div className="ge__variant">
                  <p className="ge__variant-title">Artificial Edge Hidden in the Ground</p>
                  <div className="ge__variant-img">
                    <img
                      src="/images/golfdren/bunker-hidden-edge.png"
                      alt="Cross-section of a bunker with an artificial edge hidden in the ground"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
