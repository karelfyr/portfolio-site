import { api } from './api'

/** Project inquiries: sent to the server (server/api.ts), which emails them to you. */

export const ROLES = ['Founder / Owner', 'Operator / Product Lead', 'Employee / IC', 'Agency / Partner', 'Creator'] as const
export const SERVICES = ['Product Design (UX/UI)', 'Design Systems', 'Web Platform / App', 'Brand & Identity', 'Other'] as const
export const STAGES = ['Just starting', 'Bootstrapped', 'Raising Now / Soon', 'Has Revenue'] as const
export const BUDGETS = ['< $10k / Bootstrapped', '$10k – $30k', '$30k – $75k', 'Raised $500k – $1M+', 'Enterprise / Established'] as const
export const TIMELINES = ['Immediately (1–2 wks)', 'Next 1–2 months', 'Flexible / Exploring'] as const

export type ProjectInquiry = {
  kind: 'project'
  role: string
  services: string[]
  stages: string[]
  budget: string
  timeline: string
  name: string
  email: string
  context: string
  wantsCall: boolean
}

export type QuickInquiry = { kind: 'quick'; name: string; email: string; message: string }

export function submitInquiry(inquiry: (ProjectInquiry | QuickInquiry) & { website?: string }) {
  return api<{ ok: true }>('/api/inquiry', inquiry)
}

/** One-paragraph summary of a project inquiry, attached to the calendar booking. */
export function summarise(p: ProjectInquiry) {
  return [
    `Role: ${p.role}`,
    `Needs: ${p.services.join(', ')}`,
    `Stage: ${p.stages.join(', ')}`,
    `Budget: ${p.budget}`,
    `Timeline: ${p.timeline}`,
    p.context && `Context: ${p.context}`,
  ]
    .filter(Boolean)
    .join('\n')
}
