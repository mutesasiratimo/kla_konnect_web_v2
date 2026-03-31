import React, { useEffect } from 'react'

type DashboardDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  titleId?: string
  wide?: boolean
  children: React.ReactNode
}

/**
 * Reusable modal for dashboard create/edit flows. Uses classes from Dashboard.css.
 */
export function DashboardDialog({
  open,
  onClose,
  title,
  titleId = 'dashboard-dialog-title',
  wide,
  children,
}: DashboardDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="dashboard-dialog-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`dashboard-dialog ${wide ? 'dashboard-dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dashboard-dialog-header-row">
          <h2 className="dashboard-dialog-title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="dashboard-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
