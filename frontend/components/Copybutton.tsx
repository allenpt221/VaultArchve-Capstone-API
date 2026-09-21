'use client'
import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for non-secure contexts / older browsers.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

interface CopyButtonProps {
  text: string
  /** Optional visible label; icon-only when omitted. */
  label?: string
  title?: string
}

export function CopyButton({ text, label, title = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied' : title}
      aria-label={copied ? 'Copied' : title}
      className="cursor-pointer inline-flex items-center gap-1 shrink-0 rounded-lg px-1.5 py-1 text-xs font-medium transition-colors hover:bg-black/5"
      style={{ color: copied ? '#3B6D11' : '#6B6A65' }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  )
}