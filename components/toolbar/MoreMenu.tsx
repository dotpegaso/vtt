'use client'

import { theme } from '@/lib/theme'

type MoreMenuProps = {
  isOpen: boolean
  onCloseAction: VoidFunction
  onOpenHistoryAction: VoidFunction
  onCloseRoomAction: VoidFunction
}

export function MoreMenu({ isOpen, onCloseAction, onOpenHistoryAction, onCloseRoomAction }: MoreMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Invisible backdrop to close the menu on outside tap */}
      <div
        onClick={onCloseAction}
        style={{ position: 'fixed', inset: 0, zIndex: 140 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          background: theme.container,
          border: `1px solid ${theme.highlight}`,
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 220,
        }}
      >
        <button
          onClick={() => {
            onOpenHistoryAction()
            onCloseAction()
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            color: theme.text,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Roll history
        </button>
        <div style={{ height: 1, background: theme.divider }} />
        <button
          onClick={() => {
            onCloseRoomAction()
            onCloseAction()
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            color: theme.highlight,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Close room
        </button>
      </div>
    </>
  )
}
