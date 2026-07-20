'use client'

import styles from './DrawActions.module.css'

type DrawActionsProps = {
  visible: boolean
  onUndoAction: VoidFunction
  onClearAction: VoidFunction
}

export function DrawActions({ visible, onUndoAction, onClearAction }: DrawActionsProps) {
  if (!visible) return null

  return (
    <div className={styles.actions}>
      <button onClick={onUndoAction} aria-label="Undo last stroke" className={styles.actionButton}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
          <path d="M9 14 4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={onClearAction} aria-label="Clear my strokes" className={styles.actionButton}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
