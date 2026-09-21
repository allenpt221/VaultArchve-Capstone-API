'use client'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  studentName: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeleteConfirmModal({
  isOpen,
  studentName,
  loading,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white dark:bg-background border shadow-lg p-5 space-y-4"
        style={{ fontFamily: "'DM Sans', sans-serif", borderColor: 'rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#FDEAEA' }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />
            </div>
            <h2 className="text-base font-semibold leading-tight">
              Delete Student
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-medium text-foreground">{studentName}</span>?
          This action cannot be undone and will permanently remove this
          student's account.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-sm font-medium cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="text-sm font-medium text-white hover:opacity-90 cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif", background: '#DC2626' }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal