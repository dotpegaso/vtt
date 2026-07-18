'use client'

import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Line } from 'react-konva'
import type Konva from 'konva'

const MIN_SCALE = 0.2
const MAX_SCALE = 4

export function BoardStage() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const stageRef = useRef<Konva.Stage>(null)
  const lastCenter = useRef<{ x: number; y: number } | null>(null)
  const lastDist = useRef(0)

  // Full-viewport canvas, resizing with the window (mobile rotation, etc.)
  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // Zoom centered on the pointer, not the stage origin — this is what
    // makes trackpad/mouse-wheel zoom feel natural instead of jumping around.
    const mousePointTo = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = clamp(
      direction > 0 ? oldScale * 1.05 : oldScale / 1.05,
      MIN_SCALE,
      MAX_SCALE
    )

    setScale(newScale)
    setPos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  function getCenter(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }

  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current
    if (!stage) return

    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    // One finger: let Konva's built-in `draggable` handle panning, do nothing here.
    if (touch1 && !touch2) return

    // Two fingers: pinch-zoom, and disable Konva's drag so it doesn't fight us.
    if (touch1 && touch2) {
      e.evt.preventDefault()
      stage.draggable(false)

      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }

      const newCenter = getCenter(p1, p2)
      const dist = getDistance(p1, p2)

      if (!lastCenter.current) {
        lastCenter.current = newCenter
        lastDist.current = dist
        return
      }

      const oldScale = stage.scaleX()
      const pointTo = {
        x: (newCenter.x - stage.x()) / oldScale,
        y: (newCenter.y - stage.y()) / oldScale,
      }

      const newScale = clamp(oldScale * (dist / lastDist.current), MIN_SCALE, MAX_SCALE)

      setScale(newScale)
      setPos({
        x: newCenter.x - pointTo.x * newScale,
        y: newCenter.y - pointTo.y * newScale,
      })

      lastDist.current = dist
      lastCenter.current = newCenter
    }
  }

  function handleTouchEnd() {
    lastCenter.current = null
    lastDist.current = 0
    stageRef.current?.draggable(true) // re-enable one-finger pan
  }

  return (
    <Stage
      ref={stageRef}
      width={size.width}
      height={size.height}
      scaleX={scale}
      scaleY={scale}
      x={pos.x}
      y={pos.y}
      draggable
      onWheel={handleWheel}
      onDragEnd={(e) => setPos({ x: e.target.x(), y: e.target.y() })}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Layer>
        {/* Fixed white background so the board reads correctly regardless of
            page/dark-mode CSS behind it */}
        <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#ffffff" />

        {/* Temporary reference grid — only so we can visually confirm pan/zoom
            is working. We'll remove this once strokes/images give us something
            real to look at. */}
        {Array.from({ length: 41 }, (_, i) => (i - 20) * 100).map((n) => (
          <Line key={`v-${n}`} points={[n, -2000, n, 2000]} stroke="#eee" strokeWidth={1} />
        ))}
        {Array.from({ length: 41 }, (_, i) => (i - 20) * 100).map((n) => (
          <Line key={`h-${n}`} points={[-2000, n, 2000, n]} stroke="#eee" strokeWidth={1} />
        ))}
      </Layer>
    </Stage>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
