'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ADJECTIVES, ANIMALS } from '@/lib/slug-words'

function generateSlug(): string {
  const adjBytes = crypto.getRandomValues(new Uint8Array(1))
  const animalBytes = crypto.getRandomValues(new Uint8Array(1))
  const adj = ADJECTIVES[adjBytes[0] % ADJECTIVES.length]
  const animal = ANIMALS[animalBytes[0] % ANIMALS.length]
  return `${adj}-${animal}`
}

export async function createRoom() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userId = user?.id

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) {
      throw new Error('Could not start session: ' + error?.message)
    }
    userId = data.user.id
  }

  // Retry on slug collision — with only 1,024 combos, this WILL happen
  // occasionally once you have more than a handful of live rooms.
  const MAX_ATTEMPTS = 5
  let room = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slug = generateSlug()

    const { data, error } = await supabase
      .from('rooms')
      .insert({ slug, owner_id: userId, gm_id: userId })
      .select()
      .single()

    if (data) {
      room = data
      break
    }

    // 23505 = Postgres unique_violation. Anything else is a real error,
    // don't silently retry those.
    if (error && error.code !== '23505') {
      throw new Error('Could not create room: ' + error.message)
    }
  }

  if (!room) {
    throw new Error('Could not generate a unique room slug, please try again')
  }

  const { error: participantError } = await supabase
    .from('participants')
    .insert({
      room_id: room.id,
      user_id: userId,
      display_name: 'GM',
      is_owner: true,
    })

  if (participantError) {
    throw new Error('Could not join room: ' + participantError.message)
  }

  redirect(`/room/${room.slug}`)
}
