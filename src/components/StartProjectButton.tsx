import { useCallback, useState } from 'react'
import { InquiryModal } from './inquiry/InquiryModal'

/** Opens the "How would you like to connect?" flow (project brief → calendar, or quick message). */
export function StartProjectButton({ label = 'Get in touch', className = 'btn' }: { label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <InquiryModal open={open} onClose={close} />
    </>
  )
}
