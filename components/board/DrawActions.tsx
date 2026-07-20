'use client'

import { theme } from '@/lib/theme'

type DrawActionsProps = {
  visible: boolean
  onUndoAction: () => void
  onClearAction: () => void
}

export function DrawActions({ visible, onUndoAction, onClearAction }: DrawActionsProps) {
  if (!visible) return null

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 20, display: 'flex', gap: 8 }}>
      <button
        onClick={onUndoAction}
        aria-label="Undo last stroke"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: theme.container,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={theme.highlight} strokeWidth="2">
          <path d="M9 14 4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={onClearAction}
        aria-label="Clear my strokes"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: theme.container,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={theme.highlight} strokeWidth="2">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
