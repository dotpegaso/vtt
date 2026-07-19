'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RoomState = {
  gmId: string | null
  ownerId: string | null
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomState>({ gmId: null, ownerId: null })

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function loadRoom() {
      const { data } = await supabase
        .from('rooms')
        .select('gm_id, owner_id')
        .eq('id', roomId)
        .single()

      if (mounted && data) {
        setRoom({ gmId: data.gm_id, ownerId: data.owner_id })
      }
    }

    loadRoom()

    const channel = supabase
      .channel(`room-meta:${roomId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (!mounted) return
          setRoom({ gmId: payload.new.gm_id, ownerId: payload.new.owner_id })
        }
      )
      .subscribe()

    return () => {
      mounted = false
      channel.unsubscribe()
    }
  }, [roomId])

  return room
}
