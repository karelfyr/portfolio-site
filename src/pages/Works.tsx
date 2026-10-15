import { useState } from 'react'
import { TextEffect } from '../components/TextEffect'
import { ProjectCard } from '../components/ProjectCard'
import { Appear } from '../components/Appear'
import { LogoMarquee } from '../components/LogoMarquee'
import { logos } from '../data/logos'
import { projects, type Category } from '../data/projects'

const filters: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All works' },
  { id: 'brands-products', label: 'Brands & Products' },
  { id: 'visuals-interfaces', label: 'Visuals & Interfaces' },
  { id: 'photography', label: 'Selected Photography' },
]

export function Works() {
  const [active, setActive] = useState<Category | 'all'>('all')
  const shown = active === 'all' ? projects : projects.filter((p) => p.categories.includes(active))

  return (
    <section className="page container">
      <TextEffect as="h1" className="page__title" text="Works" per="word" trigger="appear" delay={0.3} />

      <Appear className="works__logos" delay={0.4}>
        <LogoMarquee logos={logos} />
      </Appear>

      <Appear className="filters" delay={0.5}>
        {filters.map((f) => (
          <button
            key={f.id}
            className={`label filter${active === f.id ? ' filter--active' : ''}`}
            onClick={() => setActive(f.id)}
            aria-pressed={active === f.id}
          >
            {f.label}
          </button>
        ))}
      </Appear>

      {shown.length > 0 ? (
        // Re-keyed per filter so the cards cascade in again when the filter changes.
        <div className="grid grid--works" key={active}>
          {shown.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      ) : (
        <Appear as="p" className="body works__empty" key={active}>No works matching this filter</Appear>
      )}
    </section>
  )
}
