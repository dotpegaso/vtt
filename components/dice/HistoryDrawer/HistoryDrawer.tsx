'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './HistoryDrawer.module.css'

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
  onCloseAction: VoidFunction
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
      <div className={styles.overlay} onClick={onCloseAction} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <strong className={styles.title}>Roll history</strong>
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
