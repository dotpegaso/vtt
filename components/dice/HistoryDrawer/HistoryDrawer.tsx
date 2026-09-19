'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './HistoryDrawer.module.css'

type HistoryRoll = {
  id: string
  config: { sides: number | 'plot'; count: number }[]
  results: { sides: number | 'plot'; count: number; values: number[] }[] | null
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
  onCloseAction: VoidFunction
}

function describePlotValue(v: number): string {
  switch (v) {
    case 1: return 'Opportunity (+2)'
    case 2: return 'Opportunity (+4)'
    case 3:
    case 4: return '—'
    case 5:
    case 6: return 'Heroic'
    default: return String(v)
  }
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
      .map((r) =>
        r.sides === 'plot'
          ? `Plot Die: [${r.values.map(describePlotValue).join(', ')}]`
          : `${r.count}d${r.sides}, result = ${r.values.join(', ')}`
      )
      .join(' + ')
  }

  function getRollerName(userId: string): string {
    return names[userId] ?? 'Unknown'
  }

  if (!isOpen) return null

  return (
    <>
      <div className={styles.overlay} onClick={onCloseAction} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <strong className={styles.title}>Roll History</strong>
          <button onClick={onCloseAction} aria-label="Close history" className={styles.closeButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.scrollArea}>
          {rolls.length === 0 && <p className={styles.emptyState}>No rolls yet.</p>}
          {rolls.map((roll) => (
            <div key={roll.id} className={styles.rollItem}>
              <div className={styles.rollerName}>{getRollerName(roll.roller_id)}</div>
              <div className={styles.rollText}>{formatRoll(roll)}</div>
              <div className={styles.timestamp}>{new Date(roll.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
