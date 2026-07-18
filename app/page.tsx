// path: vtt/app/page.tsx
import { createRoom } from '@/app/actions/create-room'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold">Virtual Tabletop</h1>
      <p className="text-sm text-neutral-500 max-w-xs">
        A shared whiteboard for your D&D sessions — drawing, images, and dice.
      </p>
      <form action={createRoom}>
        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-white font-medium"
        >
          Create Room
        </button>
      </form>
    </main>
  )
}
