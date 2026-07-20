'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        background: 'white',
        borderLeft: '1px solid #ddd',
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 12,
          borderBottom: '1px solid #eee',
        }}
      >
        <strong>Roll History</strong>
        <button onClick={onCloseAction}>Close</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {rolls.length === 0 && (
          <p style={{ color: '#999', fontSize: 14 }}>No rolls yet.</p>
        )}
        {rolls.map((roll) => (
          <div
            key={roll.id}
            style={{
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600 }}>{getRollerName(roll.roller_id)}</div>
            <div>{formatRoll(roll)}</div>
            <div style={{ color: '#999', fontSize: 11 }}>
              {new Date(roll.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
