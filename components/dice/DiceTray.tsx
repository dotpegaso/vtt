"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiceRoll } from "@/hooks/useDiceRoll";

type DiceBoxInstance = {
  initialize: () => Promise<void>
  roll: (notation: string) => Promise<unknown>
  add: (notation: string) => Promise<unknown>
}

type DiceTrayProps = {
  userId: string;
  activeRoll: DiceRoll | null;
  isManuallyOpen: boolean;
  onCloseAction: () => void;
  onRollCompleteAction: (rollId: string) => void;
  onReadyChangeAction: (ready: boolean) => void;
};

export function DiceTray({
  userId,
  activeRoll,
  isManuallyOpen,
  onCloseAction,
  onRollCompleteAction,
  onReadyChangeAction,
}: DiceTrayProps) {
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const initializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const isVisible = isManuallyOpen || !!activeRoll;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function initDiceBox() {
      try {
        const mod = await import("@3d-dice/dice-box-threejs");
        const DiceBox = mod.default as new (
          selector: string,
          options: Record<string, unknown>,
        ) => DiceBoxInstance;

        const box = new DiceBox("#dice-box-container", {
          assetPath: "/assets/dice-box/",
          theme_colorset: "white",
          sounds: false,
          framerate: 1 / 30,
          shadows: false,
          strength: 3,
        });

        await box.initialize();

        diceBoxRef.current = box;
        setIsReady(true);
        onReadyChangeAction(true);
      } catch (err) {
        console.error("[dice] initialization failed:", err);
      }
    }

    initDiceBox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildSingleGroupNotation = useCallback(
    (result: DiceRoll["results"] extends (infer U)[] | null ? U : never): string => {
      return `${result.count}d${result.sides}@${result.values.join(",")}`
    },
    []
  )

  useEffect(() => {
    if (!activeRoll || !isReady || !diceBoxRef.current) return
    if (!activeRoll.results || activeRoll.results.length === 0) return

    const roll = activeRoll
    const box = diceBoxRef.current as DiceBoxInstance & {
      add: (notation: string) => Promise<unknown>
    }

    async function rollAllGroups() {
      const [first, ...rest] = roll.results!

      await box.roll(buildSingleGroupNotation(first))

      for (const group of rest) {
        await box.add(buildSingleGroupNotation(group))
      }

      if (roll.rollerId === userId) {
        onRollCompleteAction(roll.id)
      }
    }

    rollAllGroups().catch((err) => {
      console.error("[dice] roll sequence failed:", err)
    })
  }, [activeRoll, isReady, userId, onRollCompleteAction, buildSingleGroupNotation])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 101 }}>
        <button style={{ background: "black" }} onClick={onCloseAction}>
          Close
        </button>
      </div>

      <div id="dice-box-container" style={{ flex: 1 }} />
    </div>
  );
}
