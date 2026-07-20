"use client";

import { useEffect } from "react";

type ShortcutHandlers = {
  onDraw: VoidFunction;
  onSelect: VoidFunction;
  onRollD20: VoidFunction;
  onToggleHistory: VoidFunction;
  onToggleDiceMenu: VoidFunction;
  diceDisabled: boolean;
};

export function useKeyboardShortcuts({
  onDraw,
  onSelect,
  onRollD20,
  onToggleHistory,
  onToggleDiceMenu,
  diceDisabled,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't hijack shortcuts while the user is typing in an input/textarea
      // (e.g. the display-name field, or any future text input)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "d":
          onDraw();
          break;
        case "r":
          onToggleDiceMenu();
          break;
        case "v":
          onSelect();
          break;
        case "h":
          onToggleHistory();
          break;
        case " ":
          e.preventDefault(); // stop page from scrolling on Space
          if (!diceDisabled) onRollD20();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDraw, onSelect, onRollD20, onToggleHistory, onToggleDiceMenu, diceDisabled]);
}
