'use client'

import { theme } from '@/lib/theme'
import type { OnlineParticipant } from '@/hooks/usePresence'

type PlayerListProps = {
  onlineParticipants: OnlineParticipant[]
  gmId: string | null
  userId: string
}

export function PlayerList({ onlineParticipants, gmId, userId }: PlayerListProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 500, color: theme.container, opacity: 0.55, marginBottom: 6 }}>
        Players
      </div>
      {onlineParticipants.map((p) => {
        const isGm = p.userId === gmId
        const isSelf = p.userId === userId
        return (
          <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isGm ? theme.highlight : '#4ade80',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 12, color: theme.container, fontWeight: isSelf ? 500 : 400 }}>
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
