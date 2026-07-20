"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocalStroke } from "@/components/board/DrawLayer";

type RemoteStroke = LocalStroke & {
  participant_id: string;
  created_at: string;
};

type UseStrokesProps = {
  roomId: string;
  participantId: string;
};

export function useStrokes({ roomId, participantId }: UseStrokesProps) {
  const [strokes, setStrokes] = useState<RemoteStroke[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // path: vtt/hooks/useStrokes.ts
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadInitialStrokes() {
      const { data, error } = await supabase
        .from("strokes")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (mounted && !error && data) {
        setStrokes(data);
      }
      setIsLoading(false);
    }

    loadInitialStrokes();

    const channel = supabase
      .channel(`strokes:${roomId}:${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "strokes",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!mounted) return;

          if (payload.eventType === "INSERT") {
            setStrokes((prev) => {
              if (prev.some((s) => s.id === payload.new.id)) return prev;
              return [...prev, payload.new as RemoteStroke];
            });
          } else if (payload.eventType === "DELETE") {
            setStrokes((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId]);

  // path: vtt/hooks/useStrokes.ts
  // replace addStroke():

  async function addStroke(stroke: LocalStroke) {
    setStrokes((prev) => [
      ...prev,
      {
        ...stroke,
        participant_id: participantId,
        created_at: new Date().toISOString(),
      },
    ])

    const supabase = createClient()
    const { error } = await supabase.rpc('insert_stroke', {
      p_room_id: roomId,
      p_id: stroke.id,
      p_participant_id: participantId,
      p_points: stroke.points,
      p_color: '#000000',
      p_width: 3,
    })

    if (error) {
      if (error.message.includes('stroke_limit_reached')) {
        console.error('Stroke limit reached (2000 max) — roll back the optimistic add')
        setStrokes((prev) => prev.filter((s) => s.id !== stroke.id))
      } else {
        console.error('Failed to save stroke:', error)
      }
    }
  }

  async function undoLast() {
    if (strokes.length === 0) return;

    const lastMine = [...strokes]
      .reverse()
      .find((s) => s.participant_id === participantId);

    if (!lastMine) return;

    const supabase = createClient();
    await supabase
      .from("strokes")
      .delete()
      .eq("id", lastMine.id);
  }

  async function clearMine() {
    const supabase = createClient();
    const { error } = await supabase
      .from("strokes")
      .delete()
      .eq("room_id", roomId)
      .eq("participant_id", participantId);

    if (error) {
      console.error("Failed to clear strokes:", error);
    }
  }

  return {
    strokes,
    isLoading,
    addStroke,
    undoLast,
    clearMine,
  };
}
