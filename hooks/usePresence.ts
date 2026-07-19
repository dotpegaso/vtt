'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type OnlineParticipant = {
  userId: string
  displayName: string
}

type UsePresenceProps = {
  roomId: string
  userId: string
  displayName: string
}

export function usePresence({ roomId, userId, displayName }: UsePresenceProps) {
  const [onlineParticipants, setOnlineParticipants] = useState<OnlineParticipant[]>([])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: userId } },
    })

    channel.on('presence', { event: 'sync' }, async () => {
      if (!mounted) return

      const state = channel.presenceState<{ displayName: string }>()
      const online: OnlineParticipant[] = Object.entries(state).map(
        ([uid, presences]) => ({
          userId: uid,
          displayName: presences[0]?.displayName ?? 'Unknown',
        })
      )
      setOnlineParticipants(online)

      const onlineUserIds = online.map((p) => p.userId)
      const { error: reassignError } = await supabase.rpc('reassign_gm', {
        p_room_id: roomId,
        p_online_user_ids: onlineUserIds,
      })

      if (reassignError) {
        console.error('[reassign_gm] failed:', reassignError)
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ displayName })
      }
    })

    return () => {
      mounted = false
      channel.unsubscribe()
    }
  }, [roomId, userId, displayName])

  return { onlineParticipants }
}
