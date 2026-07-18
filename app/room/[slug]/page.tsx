import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RoomClient } from './room-client'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, slug')
    .eq('slug', slug)
    .eq('closed', false)
    .maybeSingle()

  if (!room) {
    notFound()
  }

  return <RoomClient slug={slug} />
}
