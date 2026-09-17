'use client'
import React, { useEffect, useRef, useState } from 'react'

function buildDefaultContent(title: string) {
  return `
    <h1 style="text-align:center; font-size: 20px; margin-bottom: 4px;">${title || 'Title of the Study'}</h1>
    <p style="text-align:center; color:#555; margin-top:0;">A Research Paper Presented to [Institution / Department]</p>

    <h2>Abstract</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h2>Chapter 1: Introduction</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h3>Statement of the Problem</h3>
    <p style="min-height: 1.6em;"><br></p>

    <h3>Objectives of the Study</h3>
    <p style="min-height: 1.6em;"><br></p>

    <h3>Significance of the Study</h3>
    <p style="min-height: 1.6em;"><br></p>

    <h3>Scope and Limitations</h3>
    <p style="min-height: 1.6em;"><br></p>

    <h2>Chapter 2: Review of Related Literature</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h2>Chapter 3: Methodology</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h2>Chapter 4: Results and Discussion</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h2>Chapter 5: Summary, Conclusion, and Recommendations</h2>
    <p style="min-height: 1.6em;"><br></p>

    <h2>References</h2>
    <p style="min-height: 1.6em;"><br></p>
  `
}

const BLANK_PAGE = `<p style="min-height: 1.6em;"><br></p>`

interface PageData {
  id: number
  initialHtml: string
}

interface WordDocumentProps {
  initialTitle?: string
}

function WordDocument({ initialTitle = '' }: WordDocumentProps) {
  const nextIdRef = useRef(2)
  const [pages, setPages] = useState<PageData[]>([{ id: 1, initialHtml: buildDefaultContent(initialTitle) }])
  const [wordCounts, setWordCounts] = useState<Record<number, number>>({ 1: 0 })
  const [activeFont, setActiveFont] = useState('Arial')
  const containerRef = useRef<HTMLDivElement>(null)

  // If the incoming title changes before the user has typed anything on Page 1,
  // refresh that page's default content to reflect it.
  const untouchedRef = useRef(true)
  useEffect(() => {
    if (pages.length === 1 && untouchedRef.current) {
      setPages([{ id: 1, initialHtml: buildDefaultContent(initialTitle) }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTitle])

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const handlePageInput = (id: number, text: string) => {
    untouchedRef.current = false
    const words = text.trim().split(/\s+/).filter(Boolean)
    setWordCounts(prev => ({ ...prev, [id]: text.trim() ? words.length : 0 }))
  }

  const addNewPage = () => {
    const id = nextIdRef.current++
    setPages(prev => [...prev, { id, initialHtml: BLANK_PAGE }])
    setWordCounts(prev => ({ ...prev, [id]: 0 }))
    // Scroll to the bottom so the new page is visible, after it renders
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
  }

  const removePage = (id: number) => {
    if (pages.length <= 1) return
    const confirmRemove = window.confirm('Delete this page? This cannot be undone.')
    if (!confirmRemove) return
    setPages(prev => prev.filter(p => p.id !== id))
    setWordCounts(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const totalWordCount = Object.values(wordCounts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f0f0f0', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Toolbar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#fff',
          borderBottom: '1px solid #d0d0d0',
          padding: '10px 20px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <select
          onChange={e => {
            setActiveFont(e.target.value)
            applyFormat('fontName', e.target.value)
          }}
          value={activeFont}
          onMouseDown={e => e.stopPropagation()}
          style={selectStyle}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>

        <select
          onChange={e => applyFormat('fontSize', e.target.value)}
          defaultValue="3"
          onMouseDown={e => e.stopPropagation()}
          style={selectStyle}
        >
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Medium</option>
          <option value="5">Large</option>
          <option value="6">Huge</option>
        </select>

        <div style={{ width: 1, height: 24, background: '#d0d0d0' }} />

        <ToolbarButton label="B" style={{ fontWeight: 'bold' }} onClick={() => applyFormat('bold')} />
        <ToolbarButton label="I" style={{ fontStyle: 'italic' }} onClick={() => applyFormat('italic')} />
        <ToolbarButton label="U" style={{ textDecoration: 'underline' }} onClick={() => applyFormat('underline')} />

        <div style={{ width: 1, height: 24, background: '#d0d0d0' }} />

        <ToolbarButton label="⬅" onClick={() => applyFormat('justifyLeft')} />
        <ToolbarButton label="⬌" onClick={() => applyFormat('justifyCenter')} />
        <ToolbarButton label="➡" onClick={() => applyFormat('justifyRight')} />

        <div style={{ width: 1, height: 24, background: '#d0d0d0' }} />

        <ToolbarButton label="• List" onClick={() => applyFormat('insertUnorderedList')} />
        <ToolbarButton label="1. List" onClick={() => applyFormat('insertOrderedList')} />

        <div style={{ width: 1, height: 24, background: '#d0d0d0' }} />

        <ToolbarButton label="+ New Paper" onClick={addNewPage} />
      </div>

      {/* Pages, stacked vertically like Google Docs */}
      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 30 }}>
        {pages.map((page, index) => (
          <PageEditor
            key={page.id}
            pageNumber={index + 1}
            initialHtml={page.initialHtml}
            onInput={text => handlePageInput(page.id, text)}
            onDelete={pages.length > 1 ? () => removePage(page.id) : undefined}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#777', fontSize: 13, marginTop: 12 }}>
        {pages.length} page{pages.length !== 1 ? 's' : ''} · {totalWordCount} word{totalWordCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function PageEditor({
  pageNumber,
  initialHtml,
  onInput,
  onDelete,
}: {
  pageNumber: number
  initialHtml: string
  onInput: (text: string) => void
  onDelete?: () => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Set initial content once on mount only — never overwrite on re-render,
  // or the caret jumps and typing appears to "not work".
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: 0,
          fontSize: 12,
          color: '#888',
        }}
      >
        Page {pageNumber}
      </div>

      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete this page"
          style={{
            position: 'absolute',
            top: -26,
            right: 0,
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ✕ Delete page
        </button>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onInput(editorRef.current?.innerText || '')}
        style={{
          width: '8.5in',
          minHeight: '11in',
          maxWidth: '90vw',
          background: '#fff',
          boxShadow: '0 0 8px rgba(0,0,0,0.15)',
          padding: '1in',
          boxSizing: 'border-box',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#222',
          outline: 'none',
        }}
      />
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  style,
}: {
  label: string
  onClick: () => void
  style?: React.CSSProperties
}) {
  return (
    <button
      // Prevent the button from stealing focus from the editor before the
      // click fires — otherwise the text selection is lost and execCommand
      // silently does nothing (this was the "formatting doesn't work" bug).
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      style={{
        border: '1px solid #d0d0d0',
        background: '#fff',
        borderRadius: 4,
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: 13,
        ...style,
      }}
    >
      {label}
    </button>
  )
}

const selectStyle: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 13,
  background: '#fff',
}

export default WordDocument