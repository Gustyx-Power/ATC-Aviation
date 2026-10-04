import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export const useGameLoop = (isRunning: boolean = true) => {
  const updateAircrafts = useGameStore((state) => state.updateAircrafts)
  const isPaused = useGameStore((state) => state.isPaused)
  const gameOver = useGameStore((state) => state.gameOver)

  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const frameCountRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(performance.now())
  const [fps, setFps] = useState<number>(60)

  useEffect(() => {
    if (!isRunning || isPaused || gameOver) {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
      return
    }

    const loop = (currentTime: number) => {
      if (previousTimeRef.current !== null) {
        // Update game state
        updateAircrafts()

        // Calculate real FPS
        frameCountRef.current += 1
        if (currentTime - lastFpsUpdateRef.current >= 500) {
          const calculatedFps = Math.round(
            (frameCountRef.current * 1000) / (currentTime - lastFpsUpdateRef.current)
          )
          setFps(calculatedFps)
          frameCountRef.current = 0
          lastFpsUpdateRef.current = currentTime
        }
      }

      previousTimeRef.current = currentTime
      requestRef.current = requestAnimationFrame(loop)
    }

    requestRef.current = requestAnimationFrame(loop)

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }
  }, [isRunning, isPaused, gameOver, updateAircrafts])

  return { fps }
}
