'use client'

import type { OnlineParticipant } from '@/hooks/usePresence'
import styles from './PlayerList.module.css'

type PlayerListProps = {
  onlineParticipants: OnlineParticipant[]
  gmId: string | null
  userId: string
}

export function PlayerList({ onlineParticipants, gmId, userId }: PlayerListProps) {
  return (
    <div className={styles.playerList}>
      <div className={styles.heading}>Players</div>
      {onlineParticipants.map((p) => {
        const isGm = p.userId === gmId
        const isSelf = p.userId === userId
        return (
          <div key={p.userId} className={styles.playerRow}>
            <span className={isGm ? `${styles.statusDot} ${styles.statusDotGm}` : styles.statusDot} />
            <span className={isSelf ? `${styles.playerName} ${styles.playerNameSelf}` : styles.playerName}>
              {p.displayName}
              {isGm ? ' (dungeon master)' : ''}
              {isSelf ? ' (you)' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
