"use client";

import { useTransition } from "react";
import { createRoom } from "@/app/actions/create-room";
import FullScreenMessage from "@/components/board/FullscreenMessage";

export default function Home() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      await createRoom();
    });
  }

  if (isPending) {
    return <FullScreenMessage>Creating room…</FullScreenMessage>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold">Dot&apos;s Virtual Tabletop</h1>
      <p className="text-sm text-neutral-500 max-w-xs">
        A shared whiteboard for your D&D sessions — drawing, images, and dice.
      </p>
      <form action={handleSubmit}>
        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-white font-medium cursor-pointer"
        >
          Create Room
        </button>
      </form>
    </main>
  );
}
