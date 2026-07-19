"use client";

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";

import { DrawLayer, DrawLayerHandle } from "./DrawLayer";
import { ImageLayer } from "./ImageLayer";

import { useStrokes } from '@/hooks/useStrokes'
import { useImages } from '@/hooks/useImages'
import { usePresence } from "@/hooks/usePresence";
import { useRoom } from '@/hooks/useRoom'

import type Konva from "konva";

type BoardStageProps = {
  roomId: string
  participantId: string
  userId: string
  displayName: string
}


const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

export function BoardStage({ roomId, participantId, userId, displayName }: BoardStageProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<"select" | "draw">("select");

  const stageRef = useRef<Konva.Stage>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef(0);
  const drawLayerRef = useRef<DrawLayerHandle>(null)

  const { strokes, addStroke, undoLast, clearMine } = useStrokes({ roomId, participantId })
  const { images, uploadImage } = useImages({ roomId })
  const { onlineParticipants } = usePresence({ roomId, userId, displayName })
  const { gmId } = useRoom(roomId)
  console.log('[gm check] gmId:', gmId, 'userId:', userId, 'onlineParticipants:', onlineParticipants)


  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = clamp(
      direction > 0 ? oldScale * 1.05 : oldScale / 1.05,
      MIN_SCALE,
      MAX_SCALE,
    );

    setScale(newScale);
    setPos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }

  function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  function getCenter(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;

    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && !touch2) return;

    if (touch1 && touch2) {
      e.evt.preventDefault();
      stage.draggable(false);

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const newCenter = getCenter(p1, p2);
      const dist = getDistance(p1, p2);

      if (!lastCenter.current) {
        lastCenter.current = newCenter;
        lastDist.current = dist;
        return;
      }

      const oldScale = stage.scaleX();
      const pointTo = {
        x: (newCenter.x - stage.x()) / oldScale,
        y: (newCenter.y - stage.y()) / oldScale,
      };

      const newScale = clamp(oldScale * (dist / lastDist.current), MIN_SCALE, MAX_SCALE);

      setScale(newScale);
      setPos({
        x: newCenter.x - pointTo.x * newScale,
        y: newCenter.y - pointTo.y * newScale,
      });

      lastDist.current = dist;
      lastCenter.current = newCenter;
    }
  }

  function handleTouchEnd() {
    lastCenter.current = null;
    lastDist.current = 0;
    stageRef.current?.draggable(true);
  }

  console.log({onlineParticipants})

  return (
    <>
      <div style={{ position: 'fixed', top: 60, left: 12, zIndex: 10, padding: 8, fontSize: 12, background: 'gray' }}>
        {onlineParticipants.map((p) => (
          <div key={p.userId}>
            {p.displayName} {p.userId === gmId ? '(GM)' : ''} {p.userId === userId ? '(you)' : ''}
          </div>
        ))}
      </div>
      <button
        onClick={() => setMode((m) => (m === "select" ? "draw" : "select"))}
        style={{ position: "fixed", top: 12, left: 12, zIndex: 10, padding: "8px 16px", background: 'gray' }}
      >
        Mode: {mode}
      </button>
      <button
        onClick={() => drawLayerRef.current?.undoLast()}
        style={{ position: 'fixed', top: 12, left: 140, zIndex: 10, padding: '8px 16px', background: 'gray' }}
      >
        Undo
      </button>
      <button
        onClick={() => drawLayerRef.current?.clearAll()}
        style={{ position: 'fixed', top: 12, left: 220, zIndex: 10, padding: '8px 16px', background: 'gray' }}
      >
        Clear
      </button>
      <button
        onClick={() => document.getElementById('image-upload')?.click()}
        style={{ position: 'fixed', top: 12, left: 300, zIndex: 10, padding: '8px 16px', background: 'gray' }}
      >
        Upload image
      </button>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable={mode === 'select'}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          // Guard needed: image drag-end events bubble up to the Stage too,
          // but their e.target is the image, not the Stage — without this
          // check, dropping an image would incorrectly re-position the board.
          if (e.target === e.target.getStage()) {
            setPos({ x: e.target.x(), y: e.target.y() })
          }
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer>
          <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#ffffff" />

          {Array.from({ length: 41 }, (_, i) => (i - 20) * 100).map((n) => (
            <Line key={`v-${n}`} points={[n, -2000, n, 2000]} stroke="#eee" strokeWidth={1} />
          ))}
          {Array.from({ length: 41 }, (_, i) => (i - 20) * 100).map((n) => (
            <Line key={`h-${n}`} points={[-2000, n, 2000, n]} stroke="#eee" strokeWidth={1} />
          ))}
        </Layer>
        <ImageLayer
          images={images}
          active={mode === 'select'}
          roomId={roomId}
        />
        <DrawLayer
           ref={drawLayerRef}
           active={mode === 'draw'}
           strokes={strokes}
           onStrokeComplete={addStroke}
           onUndo={undoLast}
           onClear={clearMine}
        />
      </Stage>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) {
            const stage = stageRef.current
            const pos = stage?.getPointerPosition() ?? { x: 0, y: 0 }
            uploadImage(file, pos.x, pos.y)
          }
        }}
      />
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
