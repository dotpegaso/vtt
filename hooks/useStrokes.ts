'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LocalStroke } from '@/components/board/DrawLayer'

type RemoteStroke = LocalStroke & {
  participant_id: string
  created_at: string
}

type UseStrokesProps = {
  roomId: string
  participantId: string
}

export function useStrokes({ roomId, participantId }: UseStrokesProps) {
  const [strokes, setStrokes] = useState<RemoteStroke[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadInitialStrokes() {
      const { data, error } = await supabase
        .from('strokes')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setStrokes(data)
      }
      setIsLoading(false)
    }

    loadInitialStrokes()

    // Subscribe to new/deleted strokes in real-time
    const subscription = supabase
      .channel(`room:${roomId}:strokes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strokes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStrokes((prev) => [...prev, payload.new as RemoteStroke])
          } else if (payload.eventType === 'DELETE') {
            setStrokes((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  async function addStroke(stroke: LocalStroke) {
    // Optimisticc draw
    setStrokes((prev) => [
      ...prev,
      {
        ...stroke,
        participant_id: participantId,
        created_at: new Date().toISOString(),
      },
    ])

    const supabase = createClient()
    const { error } = await supabase.from('strokes').insert({
      room_id: roomId,
      participant_id: participantId,
      points: stroke.points,
      color: '#000000',
      width: 3,
    })

    if (error) {
      console.error('Failed to save stroke:', error)
      // Could rollback here if desired, but for MVP, just log
    }
  }

  async function undoLast() {
    if (strokes.length === 0) return

    // Delete the most recent stroke by the current participant
    const lastMine = [...strokes]
      .reverse()
      .find((s) => s.participant_id === participantId)

    if (!lastMine) return

    const supabase = createClient()
    const { error } = await supabase.from('strokes').delete().eq('id', lastMine.id)

    if (error) {
      console.error('Failed to delete stroke:', error)
    }
  }

  async function clearMine() {
    const supabase = createClient()
    const { error } = await supabase
      .from('strokes')
      .delete()
      .eq('room_id', roomId)
      .eq('participant_id', participantId)

    if (error) {
      console.error('Failed to clear strokes:', error)
    }
  }

  return {
    strokes,
    isLoading,
    addStroke,
    undoLast,
    clearMine,
  }
}
