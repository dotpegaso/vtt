'use client'

import styles from './MoreMenu.module.css'

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
      <div onClick={onCloseAction} className={styles.backdrop} />
      <div className={styles.menu}>
        <button
          onClick={() => {
            onOpenHistoryAction()
            onCloseAction()
          }}
          className={styles.menuButton}
        >
          Roll history
        </button>
        <div className={styles.divider} />
        <button
          onClick={() => {
            onCloseRoomAction()
            onCloseAction()
          }}
          className={`${styles.menuButton} ${styles.menuButtonDanger}`}
        >
          Close room
        </button>
      </div>
    </>
  )
}
