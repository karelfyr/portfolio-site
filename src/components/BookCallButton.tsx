import { useCallback, useState } from 'react'
import { BookingModal } from './booking/BookingModal'

/** "Book call" button that opens the booking popup. */
export function BookCallButton({ label = 'Book call', className = 'btn' }: { label?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <BookingModal open={open} onClose={close} />
    </>
  )
}
