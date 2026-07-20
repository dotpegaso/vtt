'use client'

import { useState } from 'react'
import type { DiceConfig } from '@/hooks/useDiceRoll'

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100]

type DiceSelectorProps = {
  disabled: boolean
  onRollAction: (config: DiceConfig[]) => void
}

export function DiceSelector({ disabled, onRollAction }: DiceSelectorProps) {
  const [counts, setCounts] = useState<Record<number, number>>({})

  function adjustCount(sides: number, delta: number) {
    setCounts((prev) => {
      const next = Math.max(0, (prev[sides] ?? 0) + delta)
      return { ...prev, [sides]: next }
    })
  }

  function handleRoll() {
    const config: DiceConfig[] = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([sides, count]) => ({ sides: Number(sides), count }))

    if (config.length === 0) return

    onRollAction(config)
    setCounts({})
  }

  const totalDiceSelected = Object.values(counts).reduce((sum, c) => sum + c, 0)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 0,
        right: 0,
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {DIE_TYPES.map((sides) => {
          const count = counts[sides] ?? 0
          const isActive = count > 0

          return (
            <div
              key={sides}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: isActive ? '#111' : 'white',
                borderRadius: 8,
                padding: '6px 10px',
                border: '1px solid #333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              <button
                disabled={disabled}
                onClick={() => adjustCount(sides, -1)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: '1px solid #333',
                  background: isActive ? '#333' : '#f0f0f0',
                  color: isActive ? 'white' : '#111',
                  fontWeight: 700,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                −
              </button>
              <span
                style={{
                  minWidth: 48,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: isActive ? 'white' : '#111',
                }}
              >
                d{sides} × {count}
              </span>
              <button
                disabled={disabled}
                onClick={() => adjustCount(sides, 1)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: '1px solid #333',
                  background: isActive ? '#333' : '#f0f0f0',
                  color: isActive ? 'white' : '#111',
                  fontWeight: 700,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                +
              </button>
            </div>
          )
        })}
      </div>

      <button
        disabled={disabled || totalDiceSelected === 0}
        onClick={handleRoll}
        style={{
          padding: '10px 32px',
          background: disabled || totalDiceSelected === 0 ? '#999' : 'black',
          color: 'white',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          border: 'none',
          cursor: disabled || totalDiceSelected === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Roll {totalDiceSelected > 0 ? `(${totalDiceSelected})` : ''}
      </button>
    </div>
  )
}
