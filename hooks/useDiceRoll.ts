'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type DiceConfig = { sides: number; count: number }

export type DiceRollResult = {
  sides: number
  count: number
  values: number[]
}

export type DiceRoll = {
  id: string
  roomId: string
  rollerId: string
  config: DiceConfig[]
  results: DiceRollResult[] | null
  status: 'rolling' | 'done'
}

type UseDiceRollProps = {
  roomId: string
}

export function useDiceRoll({ roomId }: UseDiceRollProps) {
  const [activeRoll, setActiveRoll] = useState<DiceRoll | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function checkActiveRoll() {
      const { data } = await supabase
        .from('dice_rolls')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'rolling')
        .maybeSingle()

      if (mounted && data) {
        setActiveRoll({
          id: data.id,
          roomId: data.room_id,
          rollerId: data.roller_id,
          config: data.config,
          results: data.results,
          status: data.status,
        })
      }
    }

    checkActiveRoll()

    const channel = supabase
      .channel(`dice:${roomId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dice_rolls',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!mounted) return

          if (payload.eventType === 'INSERT') {
            const row = payload.new
            setActiveRoll({
              id: row.id,
              roomId: row.room_id,
              rollerId: row.roller_id,
              config: row.config,
              results: row.results,
              status: row.status,
            })
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new
            if (row.status === 'done') {
              // Small delay so the animation has a moment to finish visually
              // on clients that started slightly later than others
              setTimeout(() => setActiveRoll(null), 500)
            }
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      channel.unsubscribe()
    }
  }, [roomId])

  async function startRoll(config: DiceConfig[]) {
    setError(null)
    const supabase = createClient()
    const { error: rollError } = await supabase.rpc('start_roll', {
      p_room_id: roomId,
      p_config: config,
    })

    if (rollError) {
      if (rollError.message.includes('roll_in_progress')) {
        setError('Someone is already rolling — please wait.')
      } else {
        setError('Could not start roll: ' + rollError.message)
      }
    }
  }

  async function completeRoll(rollId: string) {
    const supabase = createClient()
    await supabase.rpc('complete_roll', { p_roll_id: rollId })
  }

  return { activeRoll, error, startRoll, completeRoll }
}
