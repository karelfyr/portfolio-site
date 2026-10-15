import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'
import { Img } from './Img'
import { Appear } from './Appear'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Appear y={40} duration={1}>
      <Link to={`/works/${project.slug}`} className="card">
        <div className="card__media">
          {/* Thumbnails are small files: load them up front so none decode mid-scroll. */}
          <Img src={project.cover} alt={project.title} eager />
        </div>
        <div className="card__text">
          <h3 className="card__title">{project.title}</h3>
          <p className="card__tagline">{project.tagline}</p>
        </div>
      </Link>
    </Appear>
  )
}
