'use client'
import { useEffect } from 'react'
import { X, History, Trash2, Loader2, Check } from 'lucide-react'

type HistoryItem = Record<string, any>

export interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  items: HistoryItem[]
  loading?: boolean
  selectedId?: string | number | null
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  hasMore?: boolean
  onLoadMore?: () => void
  emptyMessage?: string
}

const getId = (item: HistoryItem): string => String(item.id ?? item._id ?? '')
const getTitle = (item: HistoryItem) =>
  item.topic ??
  item.title ??
  item.idea ??
  item.name ??
  item.conceptStatement ??
  item.fileName ??
  item.filename ??
  item.originalName ??
  'Untitled'
const getSubtitle = (item: HistoryItem) => {
  const raw = item.createdAt ?? item.created_at ?? item.updatedAt ?? item.date
  if (!raw) return ''
  const d = new Date(raw)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function HistoryModal({
  isOpen,
  onClose,
  title,
  items,
  loading = false,
  selectedId,
  onSelect,
  onDelete,
  hasMore = false,
  onLoadMore,
  emptyMessage = 'Nothing saved yet.',
}: HistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11, 28, 51, 0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-xl"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: '#BA7517' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#0B1C33' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: '#6B6A65' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">{emptyMessage}</p>
          ) : (
            items.map((item, idx) => {
              const id = getId(item)
              const isSelected = selectedId != null && id === String(selectedId)
              const subtitle = getSubtitle(item)
              return (
                <div
                  key={id || idx}
                  className="group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors"
                  style={{
                    borderColor: isSelected ? '#BA7517' : 'rgba(0,0,0,0.08)',
                    background: isSelected ? '#FBF3E7' : '#FFFFFF',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(id)
                      onClose()
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <p className="text-xs font-medium truncate" style={{ color: '#0B1C33' }}>
                      {getTitle(item)}
                    </p>
                    {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
                  </button>

                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#3B6D11' }} />}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(id)}
                      className="p-1.5 rounded-full opacity-60 hover:opacity-100 hover:bg-red-50 cursor-pointer"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#B42318' }} />
                    </button>
                  )}
                </div>
              )
            })
          )}

          {hasMore && onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full rounded-xl border py-2 text-xs font-medium cursor-pointer disabled:opacity-50"
              style={{ borderColor: 'rgba(0,0,0,0.08)', color: '#0B1C33' }}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}