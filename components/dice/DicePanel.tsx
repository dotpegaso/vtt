'use client'

import { useState } from 'react'
import { theme } from '@/lib/theme'
import type { DiceConfig } from '@/hooks/useDiceRoll'

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100]

type DicePanelProps = {
  isOpen: boolean
  disabled: boolean
  onRollAction: (config: DiceConfig[]) => void
}

export function DicePanel({ isOpen, disabled, onRollAction }: DicePanelProps) {
  const [count, setCount] = useState(1)
  const [selectedDie, setSelectedDie] = useState(20)

  if (!isOpen) return null

  function handleRoll() {
    onRollAction([{ sides: selectedDie, count }])
    setCount(1)
    setSelectedDie(20)
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          background: theme.container,
          border: `1px solid ${theme.highlight}`,
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 220,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            disabled={disabled}
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            style={{ width: 30, height: 30, borderRadius: 8, background: theme.containerLight, color: theme.text, border: 'none', fontSize: 15 }}
          >
            −
          </button>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: theme.containerLight,
              color: theme.highlight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {count}
          </div>
          <button
            disabled={disabled}
            onClick={() => setCount((c) => c + 1)}
            style={{ width: 30, height: 30, borderRadius: 8, background: theme.containerLight, color: theme.text, border: 'none', fontSize: 15 }}
          >
            +
          </button>

          <div style={{ width: 1, height: 22, background: theme.divider, margin: '0 4px' }} />

          <div style={{ display: 'flex', gap: 5 }}>
            {DIE_TYPES.map((sides) => {
              const isSelected = sides === selectedDie
              return (
                <button
                  key={sides}
                  disabled={disabled}
                  onClick={() => setSelectedDie(sides)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isSelected ? theme.highlight : theme.containerLight,
                    color: isSelected ? theme.container : theme.text,
                    fontWeight: isSelected ? 500 : 400,
                    border: 'none',
                    fontSize: 10,
                  }}
                >
                  d{sides}
                </button>
              )
            })}
          </div>
        </div>

        <button
          disabled={disabled}
          onClick={handleRoll}
          style={{
            background: theme.highlight,
            color: theme.container,
            border: 'none',
            borderRadius: 8,
            padding: 8,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Roll
        </button>
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: 12,
          background: theme.highlight,
          opacity: 0.6,
          zIndex: 150,
        }}
      />
    </>
  )
}
