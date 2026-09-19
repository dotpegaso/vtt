'use client'

import { useState } from 'react'
import type { DiceConfig } from '@/hooks/useDiceRoll'
import styles from './DicePanel.module.css'

type DicePanelProps = {
  isOpen: boolean
  disabled: boolean
  onRollAction: (config: DiceConfig[]) => void
}

export const DIE_TYPES: (number | 'plot')[] = [4, 6, 8, 10, 12, 20, 100] //'plot']

export function dieLabel(sides: number | 'plot') {
  return sides === 'plot' ? 'Plot' : `d${sides}`
}

export function DicePanel({ isOpen, disabled, onRollAction }: DicePanelProps) {
  const [count, setCount] = useState(1)
  const [selectedDie, setSelectedDie] = useState<number | 'plot'>(20)

  if (!isOpen) return null

  function handleRoll() {
    onRollAction([{ sides: selectedDie, count }])
    setCount(1)
    setSelectedDie(20)
  }

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.controls}>
          <button
            disabled={disabled}
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className={styles.stepButton}
          >
            −
          </button>
          <div className={styles.count}>
            {count}
          </div>
          <button
            disabled={disabled}
            onClick={() => setCount((c) => c + 1)}
            className={styles.stepButton}
          >
            +
          </button>

          <div className={styles.divider} />

          <div className={styles.diceOptions}>
            {DIE_TYPES.map((sides) => {
              const isSelected = sides === selectedDie
              return (
                <button
                  key={sides}
                  disabled={disabled}
                  onClick={() => setSelectedDie(sides)}
                  className={isSelected ? `${styles.dieButton} ${styles.dieButtonSelected}` : styles.dieButton}
                >
                  {dieLabel(sides)}
                </button>
              )
            })}
          </div>
        </div>

        <button disabled={disabled} onClick={handleRoll} className={styles.rollButton}>
          Roll
        </button>
      </div>
      <div className={styles.pointer} />
    </>
  )
}
