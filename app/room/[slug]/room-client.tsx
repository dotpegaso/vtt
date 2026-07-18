'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BoardStage } from '@/components/board/BoardStage'

type JoinState =
  | { status: 'checking' }
  | { status: 'needs_name' }
  | { status: 'error'; message: string }
  | { status: 'joined'; roomId: string; participantId: string }

export function RoomClient({ slug }: { slug: string }) {
  const [state, setState] = useState<JoinState>({ status: 'checking' })
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          setState({ status: 'error', message: error.message })
          return
        }
      }

      setState({ status: 'needs_name' })
    }

    bootstrap()
  }, [])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return

    const supabase = createClient()
    const { data, error } = await supabase.rpc('join_room', {
      p_slug: slug,
      p_display_name: nameInput.trim().slice(0, 24),
    })

    if (error) {
      const message =
        error.message.includes('room_full') ? 'This room is full (8 players max).' :
        error.message.includes('room_not_found') ? 'This room no longer exists.' :
        'Could not join room: ' + error.message
      setState({ status: 'error', message })
      return
    }

    setState({
      status: 'joined',
      roomId: data[0].out_room_id,
      participantId: data[0].out_participant_id
    })
  }

  if (state.status === 'checking') {
    return <FullScreenMessage>Loading…</FullScreenMessage>
  }

  if (state.status === 'error') {
    return <FullScreenMessage>{state.message}</FullScreenMessage>
  }

  if (state.status === 'needs_name') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Join room</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-3 w-full max-w-xs">
          <input
            autoFocus
            maxLength={24}
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="border rounded-lg px-4 py-3"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white font-medium"
          >
            Join
          </button>
        </form>
      </main>
    )
  }

  // state.status === 'joined'
  return <BoardStage roomId={state.roomId} participantId={state.participantId} />
}

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center text-neutral-500">
      {children}
    </main>
  )
}
