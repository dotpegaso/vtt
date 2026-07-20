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
        style={{ position: 'fixed', inset: 0, zIndex: 160 }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 76,
          right: 16,
          zIndex: 170,
          background: theme.container,
          borderRadius: 10,
          overflow: 'hidden',
          minWidth: 160,
          border: `1px solid ${theme.divider}`,
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
          }}
        >
          Close room
        </button>
      </div>
    </>
  )
}
