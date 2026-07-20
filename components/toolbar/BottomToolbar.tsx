"use client";

import { useState } from "react";
import { theme } from "@/lib/theme";
import { MoreMenu } from "./MoreMenu";

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
      <div
        style={{
          position: "fixed",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 150,
          background: theme.container,
          borderRadius: 14,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Select / draw toggle */}
        <div
          style={{
            display: "flex",
            background: theme.containerLight,
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
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
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: diceOpen ? theme.highlight : "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: diceDisabled ? 0.4 : 1,
            cursor: diceDisabled ? "not-allowed" : "pointer",
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke={diceOpen ? theme.container : theme.text}
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <circle
              cx="9"
              cy="9"
              r="1"
              fill={diceOpen ? theme.container : theme.text}
            />
            <circle
              cx="15"
              cy="9"
              r="1"
              fill={diceOpen ? theme.container : theme.text}
            />
            <circle
              cx="9"
              cy="15"
              r="1"
              fill={diceOpen ? theme.container : theme.text}
            />
            <circle
              cx="15"
              cy="15"
              r="1"
              fill={diceOpen ? theme.container : theme.text}
            />
          </svg>
        </button>

        {/* GM-only section */}
        {isGm && (
          <>
            <div
              style={{
                width: 1,
                height: 24,
                background: theme.divider,
                margin: "0 4px",
              }}
            />
            <ToolbarIcon
              onClick={onUploadClickAction}
              label="Upload image"
              bare
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </ToolbarIcon>
            <ToolbarIcon onClick={() => setMoreOpen(true)} label="More" bare>
              <circle cx="5" cy="12" r="1.5" fill={theme.text} />
              <circle cx="12" cy="12" r="1.5" fill={theme.text} />
              <circle cx="19" cy="12" r="1.5" fill={theme.text} />
            </ToolbarIcon>
          </>
        )}
      </div>

      <MoreMenu
        isOpen={moreOpen}
        onCloseAction={() => setMoreOpen(false)}
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
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: active ? theme.highlight : "transparent",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={bare ? "none" : "none"}
        stroke={active ? theme.container : theme.text}
        strokeWidth="2"
      >
        {children}
      </svg>
    </button>
  );
}
