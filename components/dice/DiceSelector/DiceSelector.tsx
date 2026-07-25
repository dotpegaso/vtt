'use client'

import { useState } from 'react'
import type { DiceConfig } from '@/hooks/useDiceRoll'
import styles from './DiceSelector.module.css'
import { DIE_TYPES, dieLabel } from '../DicePanel/DicePanel'

type DiceSelectorProps = {
  disabled: boolean
  onRollAction: (config: DiceConfig[]) => void
}

export function DiceSelector({ disabled, onRollAction }: DiceSelectorProps) {
  const [counts, setCounts] = useState<Record<string, number>>({})

  function adjustCount(sides: number | 'plot', delta: number) {
    setCounts((prev) => {
      const key = String(sides)
      const next = Math.max(0, (prev[key] ?? 0) + delta)
      return { ...prev, [key]: next }
    })
  }

  function handleRoll() {
    const config: DiceConfig[] = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({
        sides: key === 'plot' ? 'plot' : Number(key),
        count,
      }))

    if (config.length === 0) return
    onRollAction(config)
    setCounts({})
  }

  const totalDiceSelected = Object.values(counts).reduce((sum, c) => sum + c, 0)

  return (
    <div className={styles.selector}>
      <div className={styles.diceGrid}>
        {DIE_TYPES.map((sides) => {
          const count = counts[String(sides)] ?? 0
          const isActive = count > 0

          return (
            <div key={sides} className={isActive ? `${styles.dieCard} ${styles.dieCardActive}` : styles.dieCard}>
              <button
                disabled={disabled}
                onClick={() => adjustCount(sides, -1)}
                className={isActive ? `${styles.adjustButton} ${styles.adjustButtonActive}` : styles.adjustButton}
              >
                −
              </button>
              <span className={isActive ? `${styles.label} ${styles.labelActive}` : styles.label}>
                {dieLabel(sides)} × {count}
              </span>
              <button
                disabled={disabled}
                onClick={() => adjustCount(sides, 1)}
                className={isActive ? `${styles.adjustButton} ${styles.adjustButtonActive}` : styles.adjustButton}
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
        className={disabled || totalDiceSelected === 0 ? styles.rollButton : `${styles.rollButton} ${styles.rollButtonEnabled}`}
      >
        Roll {totalDiceSelected > 0 ? `(${totalDiceSelected})` : ''}
      </button>
    </div>
  )
}
