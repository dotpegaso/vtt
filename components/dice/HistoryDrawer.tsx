'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { theme } from '@/lib/theme'

type HistoryRoll = {
  id: string
  config: { sides: number; count: number }[]
  results: { sides: number; count: number; values: number[] }[] | null
  roller_id: string
  created_at: string
}

type ParticipantName = {
  user_id: string
  display_name: string
}

type HistoryDrawerProps = {
  roomId: string
  isOpen: boolean
  onCloseAction: () => void
}

export function HistoryDrawer({ roomId, isOpen, onCloseAction }: HistoryDrawerProps) {
  const [rolls, setRolls] = useState<HistoryRoll[]>([])
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return

    const supabase = createClient()

    async function loadHistory() {
      const [rollsResult, participantsResult] = await Promise.all([
        supabase
          .from('dice_rolls')
          .select('id, config, results, roller_id, created_at')
          .eq('room_id', roomId)
          .eq('status', 'done')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('participants')
          .select('user_id, display_name')
          .eq('room_id', roomId),
      ])

      if (rollsResult.data) setRolls(rollsResult.data)

      if (participantsResult.data) {
        const nameMap: Record<string, string> = {}
        for (const p of participantsResult.data as ParticipantName[]) {
          nameMap[p.user_id] = p.display_name
        }
        setNames(nameMap)
      }
    }

    loadHistory()
  }, [isOpen, roomId])

  function formatRoll(roll: HistoryRoll): string {
    if (!roll.results) return '—'
    return roll.results
      .map((r) => `${r.count}d${r.sides}: [${r.values.join(', ')}]`)
      .join(' + ')
  }

  function getRollerName(userId: string): string {
    return names[userId] ?? 'Unknown'
  }

  if (!isOpen) return null

  return (
    <>
      <div
        onClick={onCloseAction}
        style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(0,0,0,0.3)' }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          background: theme.container,
          zIndex: 250,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 14,
            borderBottom: `1px solid ${theme.divider}`,
          }}
        >
          <strong style={{ color: theme.text, fontSize: 14, fontWeight: 500 }}>
            Roll history
          </strong>
          <button
            onClick={onCloseAction}
            aria-label="Close history"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: theme.containerLight,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {rolls.length === 0 && (
            <p style={{ color: theme.divider, fontSize: 13 }}>No rolls yet.</p>
          )}
          {rolls.map((roll) => (
            <div
              key={roll.id}
              style={{
                padding: '10px 0',
                borderBottom: `1px solid ${theme.divider}`,
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 13, color: theme.highlight }}>
                {getRollerName(roll.roller_id)}
              </div>
              <div style={{ fontSize: 13, color: theme.text, marginTop: 2 }}>
                {formatRoll(roll)}
              </div>
              <div style={{ color: theme.divider, fontSize: 11, marginTop: 2 }}>
                {new Date(roll.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
