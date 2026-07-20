'use client'

import { useState } from 'react'
import type { DiceConfig } from '@/hooks/useDiceRoll'
import styles from './DicePanel.module.css'

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
                  d{sides}
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
