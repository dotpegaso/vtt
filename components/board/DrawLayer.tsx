'use client'

import { forwardRef, useImperativeHandle, useState } from 'react'
import { Layer, Line, Rect } from 'react-konva'
import type Konva from 'konva'

export type LocalStroke = {
  id: string
  points: number[]
}

export type RemoteStroke = LocalStroke & {
  participant_id: string
  created_at: string
}

export type DrawLayerHandle = {
  undoLast: () => void
  clearAll: () => void
}

type DrawLayerProps = {
  active: boolean
  strokes: RemoteStroke[]
  onStrokeComplete: (stroke: LocalStroke) => void
  onUndo: () => void
  onClear: () => void
}

export const DrawLayer = forwardRef<DrawLayerHandle, DrawLayerProps>(
  function DrawLayer({ active, strokes, onStrokeComplete, onUndo, onClear }, ref) {
    const [currentStroke, setCurrentStroke] = useState<LocalStroke | null>(null)

    function generateId(): string {
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    }

    function getPos(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      const stage = e.target.getStage()
      return stage?.getRelativePointerPosition() ?? null
    }

    function startStroke(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      if (!active) return
      const pos = getPos(e)
      if (!pos) return
      e.evt.preventDefault()
      e.evt.stopPropagation()
      setCurrentStroke({ id: generateId(), points: [pos.x, pos.y] })
    }

    function extendStroke(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      if (!active || !currentStroke) return
      const pos = getPos(e)
      if (!pos) return
      e.evt.preventDefault()
      e.evt.stopPropagation()
      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : prev
      )
    }

    function endStroke() {
      if (!currentStroke) return
      onStrokeComplete(currentStroke)
      setCurrentStroke(null)
    }

    useImperativeHandle(ref, () => ({
      undoLast: onUndo,
      clearAll: onClear,
    }))

    return (
      <Layer listening={active}>
        <Rect
          x={-5000}
          y={-5000}
          width={10000}
          height={10000}
          fill="transparent"
          onMouseDown={startStroke}
          onMouseMove={extendStroke}
          onMouseUp={endStroke}
          onTouchStart={startStroke}
          onTouchMove={extendStroke}
          onTouchEnd={endStroke}
        />

        {/* Remote strokes (everyone's, from Supabase) */}
        {strokes.map((stroke) => (
          <Line
            key={stroke.id}
            points={stroke.points}
            stroke="#000000"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            listening={false}
            tension={0}
          />
        ))}

        {/* Current in-progress stroke (local only, not yet persisted) */}
        {currentStroke && (
          <Line
            points={currentStroke.points}
            stroke="#000000"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        )}
      </Layer>
    )
  }
)
