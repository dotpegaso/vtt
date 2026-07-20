"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiceRoll } from "@/hooks/useDiceRoll";
import styles from "./DiceTray.module.css";

type DiceBoxInstance = {
  initialize: () => Promise<void>;
  roll: (notation: string) => Promise<unknown>;
  add: (notation: string) => Promise<unknown>;
  clearDice: VoidFunction;
};

type DiceTrayProps = {
  userId: string;
  activeRoll: DiceRoll | null;
  isManuallyOpen: boolean;
  onCloseAction?: VoidFunction;
  onRollCompleteAction: (rollId: string) => void;
  onReadyChangeAction: (ready: boolean) => void;
};

export function DiceTray({
  userId,
  activeRoll,
  isManuallyOpen,
  onRollCompleteAction,
  onReadyChangeAction,
}: DiceTrayProps) {
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const initializedRef = useRef(false);
  const lastHandledRollId = useRef<string | null>(null);
  const prevActiveRollRef = useRef<DiceRoll | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isVisible = isManuallyOpen || !!activeRoll;

  useEffect(() => {
    // Detect the moment activeRoll goes from "something" to null — i.e. the
    // roll just finished and the tray is about to auto-hide. Clear the 3D
    // scene now so a stale settled-dice frame doesn't silently reappear the
    // next time the tray becomes visible again.
    if (prevActiveRollRef.current && !activeRoll && diceBoxRef.current) {
      diceBoxRef.current.clearDice();
    }
    prevActiveRollRef.current = activeRoll;
  }, [activeRoll]);

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
          theme_material: "plastic",
          sounds: false,
          framerate: 1 / 30,
          strength: 2.6,
          gravity_multiplier: 220,
          theme_surface: "green-felt",
          baseScale: 80,
          light_intensity: 0.8,
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
    (
      result: DiceRoll["results"] extends (infer U)[] | null ? U : never,
    ): string => {
      return `${result.count}d${result.sides}@${result.values.join(",")}`;
    },
    [],
  );

  useEffect(() => {
    if (!activeRoll || !isReady || !diceBoxRef.current) return;
    if (!activeRoll.results || activeRoll.results.length === 0) return;

    // Guard: never replay a roll we've already animated, even if this effect
    // re-fires due to an unrelated prop/callback identity change (e.g. the
    // parent re-rendering while the dice panel is toggled open/closed).
    if (lastHandledRollId.current === activeRoll.id) return;
    lastHandledRollId.current = activeRoll.id;

    const roll = activeRoll;
    const box = diceBoxRef.current as DiceBoxInstance & {
      add: (notation: string) => Promise<unknown>;
    };

    async function rollAllGroups() {
      const [first, ...rest] = roll.results!;
      await box.roll(buildSingleGroupNotation(first));
      for (const group of rest) {
        await box.add(buildSingleGroupNotation(group));
      }
      if (roll.rollerId === userId) {
        onRollCompleteAction(roll.id);
      }
    }

    rollAllGroups().catch((err) => {
      console.error("[dice] roll sequence failed:", err);
    });
  }, [
    activeRoll,
    isReady,
    userId,
    onRollCompleteAction,
    buildSingleGroupNotation,
  ]);

  return (
    <div className={isVisible ? `${styles.tray} ${styles.visible}` : `${styles.tray} ${styles.hidden}`}>
      <div id="dice-box-container" className={styles.container} />
    </div>
  );
}
