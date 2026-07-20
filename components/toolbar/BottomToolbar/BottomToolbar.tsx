"use client";

import { useState } from "react";
import { MoreMenu } from "../MoreMenu";
import styles from "./BottomToolbar.module.css";

type BottomToolbarProps = {
  mode: "select" | "draw";
  onModeChangeAction: (mode: "select" | "draw") => void;
  onDiceToggleAction: VoidFunction;
  diceOpen: boolean;
  diceDisabled: boolean;
  isGm: boolean;
  onUploadClickAction: VoidFunction;
  onOpenHistoryAction: VoidFunction;
  onCloseRoomAction: VoidFunction;
};

export function BottomToolbar({
  mode,
  onModeChangeAction,
  onDiceToggleAction,
  diceOpen,
  diceDisabled,
  isGm,
  onUploadClickAction,
  onOpenHistoryAction,
  onCloseRoomAction,
}: BottomToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className={styles.toolbar}>
        {/* Select / draw toggle */}
        <div className={styles.toggleGroup}>
          <ToolbarIcon
            active={mode === "select"}
            onClick={() => onModeChangeAction("select")}
            label="Select"
          >
            <path d="M4 4l7 17 2-7 7-2z" strokeLinejoin="round" />
          </ToolbarIcon>
          <ToolbarIcon
            active={mode === "draw"}
            onClick={() => onModeChangeAction("draw")}
            label="Draw"
          >
            <path
              d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </ToolbarIcon>
        </div>

        {/* Dice */}
        <button
          onClick={onDiceToggleAction}
          disabled={diceDisabled}
          aria-label="Dice"
          className={diceOpen ? `${styles.diceButton} ${styles.diceButtonOpen}` : styles.diceButton}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={styles.icon}
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
            <circle cx="9" cy="15" r="1" fill="currentColor" />
            <circle cx="15" cy="15" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* GM-only section */}
        {isGm && (
          <>
            <div className={styles.divider} />
            <ToolbarIcon
              onClick={onUploadClickAction}
              label="Upload image"
              bare
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </ToolbarIcon>
            <ToolbarIcon onClick={() => setMoreOpen((v) => !v)} label="More" bare>
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
            </ToolbarIcon>
          </>
        )}
      </div>

      <MoreMenu
        isOpen={moreOpen}
        onCloseAction={() => setMoreOpen((v) => !v)}
        onOpenHistoryAction={onOpenHistoryAction}
        onCloseRoomAction={onCloseRoomAction}
      />
    </>
  );
}

function ToolbarIcon({
  active,
  onClick,
  label,
  bare,
  children,
}: {
  active?: boolean;
  onClick: VoidFunction;
  label: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={active ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={bare ? "none" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        className={styles.icon}
      >
        {children}
      </svg>
    </button>
  );
}
