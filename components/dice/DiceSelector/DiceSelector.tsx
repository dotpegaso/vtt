'use client'

import { useState } from 'react'
import type { DiceConfig } from '@/hooks/useDiceRoll'
import styles from './DiceSelector.module.css'

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
    <div className={styles.selector}>
      <div className={styles.diceGrid}>
        {DIE_TYPES.map((sides) => {
          const count = counts[sides] ?? 0
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
                d{sides} × {count}
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
