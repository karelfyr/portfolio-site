import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { Project } from '../data/projects'
import { Img } from './Img'

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 * index }}
    >
      <Link to={`/works/${project.slug}`} className="card">
        <div className="card__media">
          <Img src={project.cover} alt={project.title} />
        </div>
        <div className="card__text">
          <h3 className="card__title">{project.title}</h3>
          <p className="card__tagline">{project.tagline}</p>
        </div>
      </Link>
    </motion.div>
  )
}
