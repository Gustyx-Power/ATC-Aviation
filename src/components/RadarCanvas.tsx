import React, { useEffect, useRef, useState } from 'react'
import { AlertOctagon, RotateCcw, Trophy, CheckCircle, Clock } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import type { Waypoint } from '../types/atc'

export const RadarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const aircrafts = useGameStore((state) => state.aircrafts)
  const selectedAircraftId = useGameStore((state) => state.selectedAircraftId)
  const selectAircraft = useGameStore((state) => state.selectAircraft)
  const setWaypoints = useGameStore((state) => state.setWaypoints)
  const addCommLog = useGameStore((state) => state.addCommLog)
  const setRadarCenter = useGameStore((state) => state.setRadarCenter)
  const gameOver = useGameStore((state) => state.gameOver)
  const gameOverReason = useGameStore((state) => state.gameOverReason)
  const collisionPoint = useGameStore((state) => state.collisionPoint)
  const resetGame = useGameStore((state) => state.resetGame)
  const score = useGameStore((state) => state.score)
  const landedCount = useGameStore((state) => state.landedCount)
  const survivalTime = useGameStore((state) => state.survivalTime)

  // Rotating radar sweep beam angle
  const sweepAngleRef = useRef<number>(0)

  // Draw Path State
  const isDrawingRef = useRef<boolean>(false)
  const drawingAircraftIdRef = useRef<string | null>(null)
  const drawnPointsRef = useRef<Waypoint[]>([])
  const cursorRef = useRef<{ x: number; y: number } | null>(null)

  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null)
  const [waypointCount, setWaypointCount] = useState<number>(0)

  // Format survival time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getCanvasCoords = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // Handle canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const radarRadius = Math.min(centerX, centerY) * 0.9

      // Clear with dark cockpit radar background
      ctx.fillStyle = '#060c15'
      ctx.fillRect(0, 0, width, height)

      // 1. Radar Scope Base (dark circular glass)
      const scopeGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radarRadius * 0.1,
        centerX,
        centerY,
        radarRadius
      )
      scopeGradient.addColorStop(0, '#091522')
      scopeGradient.addColorStop(0.7, '#07101b')
      scopeGradient.addColorStop(1, '#050a12')

      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2)
      ctx.fillStyle = scopeGradient
      ctx.fill()
      ctx.clip() // Clip radar elements to scope

      // 2. Concentric Range Rings (4 rings: 5NM, 10NM, 15NM, 20NM)
      const ringCount = 4
      for (let i = 1; i <= ringCount; i++) {
        const r = (radarRadius / ringCount) * i
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.strokeStyle = i === ringCount ? 'rgba(0, 255, 170, 0.4)' : 'rgba(0, 230, 160, 0.14)'
        ctx.lineWidth = i === ringCount ? 2 : 1
        if (i < ringCount) {
          ctx.setLineDash([4, 4])
        } else {
          ctx.setLineDash([])
        }
        ctx.stroke()

        // Distance Labels
        ctx.fillStyle = 'rgba(0, 255, 170, 0.45)'
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.fillText(`${i * 5} NM`, centerX + 6, centerY - r + 14)
      }
      ctx.setLineDash([])

      // 3. Radial Crosshairs & Spokes (every 30 degrees)
      ctx.strokeStyle = 'rgba(0, 230, 160, 0.12)'
      ctx.lineWidth = 1
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180
        const x1 = centerX + Math.cos(rad) * (radarRadius * 0.1)
        const y1 = centerY + Math.sin(rad) * (radarRadius * 0.1)
        const x2 = centerX + Math.cos(rad) * radarRadius
        const y2 = centerY + Math.sin(rad) * radarRadius

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Main Crosshairs
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.22)'
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - radarRadius)
      ctx.lineTo(centerX, centerY + radarRadius)
      ctx.moveTo(centerX - radarRadius, centerY)
      ctx.lineTo(centerX + radarRadius, centerY)
      ctx.stroke()

      // 4. Center Airport & Runway (Runway 09/27)
      const rwyLength = 140
      const rwyWidth = 14
      ctx.save()
      ctx.translate(centerX, centerY)

      // Approach Corridor / Glide Slope cones for Runway 09
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.25)'
      ctx.setLineDash([4, 6])
      // West approach funnel
      ctx.beginPath()
      ctx.moveTo(-rwyLength / 2, -rwyWidth / 2)
      ctx.lineTo(-rwyLength / 2 - 200, -45)
      ctx.moveTo(-rwyLength / 2, rwyWidth / 2)
      ctx.lineTo(-rwyLength / 2 - 200, 45)
      ctx.stroke()

      // Extended Centerline with distance ticks
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.4)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(-rwyLength / 2 - 260, 0)
      ctx.lineTo(-rwyLength / 2, 0)
      ctx.stroke()
      ctx.setLineDash([])

      // Touchdown target box (Runway 09 Entrance)
      ctx.fillStyle = 'rgba(0, 255, 200, 0.08)'
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(-rwyLength / 2 - 12, -rwyWidth / 2 - 4, 30, rwyWidth + 8)

      // Runway surface
      ctx.fillStyle = '#0d1824'
      ctx.strokeStyle = '#00ffcc'
      ctx.lineWidth = 1.5
      ctx.fillRect(-rwyLength / 2, -rwyWidth / 2, rwyLength, rwyWidth)
      ctx.strokeRect(-rwyLength / 2, -rwyWidth / 2, rwyLength, rwyWidth)

      // Centerline dashes
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.moveTo(-rwyLength / 2 + 10, 0)
      ctx.lineTo(rwyLength / 2 - 10, 0)
      ctx.stroke()
      ctx.setLineDash([])

      // Threshold piano keys
      ctx.fillStyle = '#ffffff'
      for (let offset = -4; offset <= 4; offset += 3) {
        ctx.fillRect(-rwyLength / 2 + 3, offset, 6, 1.5)
        ctx.fillRect(rwyLength / 2 - 9, offset, 6, 1.5)
      }

      // Runway designations
      ctx.font = 'bold 9px "JetBrains Mono", monospace'
      ctx.fillStyle = '#00ffcc'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('09', -rwyLength / 2 + 20, 0)
      ctx.fillText('27', rwyLength / 2 - 20, 0)

      ctx.restore()

      // 5. Rotating Radar Sweep Beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.015) % (Math.PI * 2)
      const sweepAngle = sweepAngleRef.current

      const sweepSector = Math.PI / 4
      const sweepGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radarRadius
      )
      sweepGrad.addColorStop(0, 'rgba(0, 255, 170, 0.25)')
      sweepGrad.addColorStop(1, 'rgba(0, 255, 170, 0.03)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radarRadius, sweepAngle - sweepSector, sweepAngle, false)
      ctx.closePath()
      ctx.fillStyle = sweepGrad
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * radarRadius,
        centerY + Math.sin(sweepAngle) * radarRadius
      )
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.65)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // 6. Draw Committed Waypoints for All Aircraft
      aircrafts.forEach((ac) => {
        if (ac.waypoints && ac.waypoints.length > 0) {
          const isSelected = ac.id === selectedAircraftId
          const strokeColor = isSelected ? '#00e5ff' : 'rgba(0, 255, 170, 0.75)'
          const dotColor = isSelected ? '#00e5ff' : '#00ffaa'

          ctx.save()
          ctx.beginPath()
          ctx.setLineDash([4, 4])
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = isSelected ? 2 : 1.5
          ctx.moveTo(ac.x, ac.y)
          ac.waypoints.forEach((wp) => {
            ctx.lineTo(wp.x, wp.y)
          })
          ctx.stroke()
          ctx.setLineDash([])

          ac.waypoints.forEach((wp, index) => {
            const isNext = index === 0

            ctx.save()
            ctx.translate(wp.x, wp.y)
            ctx.rotate(Math.PI / 4)
            ctx.fillStyle = isNext ? '#ffb700' : dotColor
            ctx.strokeStyle = '#050a12'
            ctx.lineWidth = 1
            const size = isNext ? 6 : 4
            ctx.fillRect(-size / 2, -size / 2, size, size)
            ctx.strokeRect(-size / 2, -size / 2, size, size)
            ctx.restore()

            if (isSelected) {
              ctx.font = '8px "JetBrains Mono", monospace'
              ctx.fillStyle = isNext ? '#ffb700' : 'rgba(0, 229, 255, 0.8)'
              ctx.textAlign = 'left'
              ctx.fillText(`W${index + 1}`, wp.x + 6, wp.y - 4)
            }
          })

          ctx.restore()
        }
      })

      // 7. Active Drawing Path
      if (isDrawingRef.current && drawnPointsRef.current.length > 0) {
        ctx.save()
        const points = drawnPointsRef.current

        ctx.strokeStyle = '#ffe066'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#ffe066'
        ctx.shadowBlur = 8

        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y)
        }

        if (cursorRef.current) {
          ctx.lineTo(cursorRef.current.x, cursorRef.current.y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0

        points.forEach((pt, i) => {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, i === 0 ? 4 : 3, 0, Math.PI * 2)
          ctx.fillStyle = i === 0 ? '#00e5ff' : '#ffe066'
          ctx.fill()
          ctx.strokeStyle = '#050a12'
          ctx.lineWidth = 1
          ctx.stroke()
        })

        if (cursorRef.current) {
          const cx = cursorRef.current.x
          const cy = cursorRef.current.y

          ctx.strokeStyle = '#ffe066'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(cx, cy, 8, 0, Math.PI * 2)
          ctx.moveTo(cx - 12, cy)
          ctx.lineTo(cx + 12, cy)
          ctx.moveTo(cx, cy - 12)
          ctx.lineTo(cx, cy + 12)
          ctx.stroke()

          ctx.fillStyle = 'rgba(10, 20, 32, 0.9)'
          ctx.strokeStyle = '#ffe066'
          ctx.lineWidth = 1
          const tagW = 100
          const tagH = 22
          ctx.fillRect(cx + 12, cy + 12, tagW, tagH)
          ctx.strokeRect(cx + 12, cy + 12, tagW, tagH)

          ctx.fillStyle = '#ffe066'
          ctx.font = 'bold 9px "JetBrains Mono", monospace'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(`VECTOR: ${points.length} WPT`, cx + 18, cy + 12 + tagH / 2)
        }

        ctx.restore()
      }

      // 8. Aircraft Rendering & Conflict Alerts (Phase 4)
      const flashState = Math.sin(Date.now() / 120) > 0

      aircrafts.forEach((ac) => {
        const isSelected = ac.id === selectedAircraftId
        const hasConflict = ac.conflictWith && ac.conflictWith.length > 0
        const isEmergency = ac.status === 'emergency'
        const isLanding = ac.status === 'landing'
        const acX = ac.x
        const acY = ac.y

        // Phosphor history trail
        if (ac.history && ac.history.length > 0) {
          ac.history.forEach((pt, index) => {
            const alpha = ((index + 1) / ac.history!.length) * 0.45
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
            ctx.fillStyle = isEmergency
              ? `rgba(255, 60, 60, ${alpha})`
              : `rgba(0, 255, 170, ${alpha})`
            ctx.fill()
          })
        }

        // CONFLICT ALERT: Loss of separation warning rings (Phase 4)
        if (hasConflict) {
          ctx.beginPath()
          ctx.arc(acX, acY, 28, 0, Math.PI * 2)
          ctx.strokeStyle = flashState ? '#ff2244' : 'rgba(255, 180, 0, 0.7)'
          ctx.lineWidth = 2
          ctx.stroke()

          // Separation violation distance ring
          ctx.beginPath()
          ctx.arc(acX, acY, 45, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)'
          ctx.setLineDash([2, 4])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Selection highlight ring
        if (isSelected && !hasConflict) {
          ctx.beginPath()
          ctx.arc(acX, acY, 20, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])

          ctx.beginPath()
          ctx.arc(acX, acY, 35, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 180, 0, 0.25)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Velocity Vector Leader
        const rad = (ac.heading * Math.PI) / 180
        const vectorLength = ac.speed * 30
        const vx = acX + Math.sin(rad) * vectorLength
        const vy = acY - Math.cos(rad) * vectorLength

        ctx.strokeStyle = hasConflict
          ? '#ff3344'
          : isSelected
          ? '#00f0ff'
          : 'rgba(0, 255, 170, 0.7)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(acX, acY)
        ctx.lineTo(vx, vy)
        ctx.stroke()

        // Aircraft Silhouette
        ctx.save()
        ctx.translate(acX, acY)
        ctx.rotate(rad)

        ctx.fillStyle = hasConflict
          ? flashState
            ? '#ff2244'
            : '#ffffff'
          : isEmergency
          ? '#ffaa00'
          : isLanding
          ? '#00ffcc'
          : isSelected
          ? '#00f0ff'
          : '#00ffaa'
        ctx.strokeStyle = '#050a12'
        ctx.lineWidth = 1

        ctx.beginPath()
        ctx.moveTo(0, -9)
        ctx.lineTo(2, -4)
        ctx.lineTo(9, 2)
        ctx.lineTo(9, 4)
        ctx.lineTo(2, 2)
        ctx.lineTo(2, 6)
        ctx.lineTo(5, 9)
        ctx.lineTo(5, 10)
        ctx.lineTo(0, 8)
        ctx.lineTo(-5, 10)
        ctx.lineTo(-5, 9)
        ctx.lineTo(-2, 6)
        ctx.lineTo(-2, 2)
        ctx.lineTo(-9, 4)
        ctx.lineTo(-9, 2)
        ctx.lineTo(-2, -4)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.restore()

        // Central target blip
        ctx.beginPath()
        ctx.arc(acX, acY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Tactical Data Block
        const tagOffsetX = 24
        const tagOffsetY = -24
        const tagX = acX + tagOffsetX
        const tagY = acY + tagOffsetY

        ctx.strokeStyle = hasConflict
          ? '#ff2244'
          : isSelected
          ? 'rgba(0, 240, 255, 0.6)'
          : 'rgba(0, 255, 170, 0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(acX, acY)
        ctx.lineTo(acX + 12, acY - 12)
        ctx.lineTo(tagX, tagY)
        ctx.stroke()

        ctx.fillStyle = hasConflict && flashState ? 'rgba(50, 10, 15, 0.95)' : 'rgba(7, 18, 28, 0.88)'
        ctx.strokeStyle = hasConflict
          ? '#ff2244'
          : isSelected
          ? '#00f0ff'
          : 'rgba(0, 255, 170, 0.4)'
        ctx.lineWidth = 1
        const tagW = 82
        const tagH = 36
        ctx.fillRect(tagX, tagY - tagH, tagW, tagH)
        ctx.strokeRect(tagX, tagY - tagH, tagW, tagH)

        // Callsign / Conflict Alert text
        ctx.fillStyle = hasConflict
          ? '#ff3344'
          : isEmergency
          ? '#ffaa00'
          : isSelected
          ? '#00f0ff'
          : '#00ffaa'
        ctx.font = 'bold 10px "JetBrains Mono", monospace'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(
          hasConflict ? `⚠️ ${ac.id}` : ac.id,
          tagX + 4,
          tagY - tagH + 3
        )

        // Telemetry line (Altitude & Speed)
        const altStr = `FL${String(Math.round(ac.altitude / 100)).padStart(3, '0')}`
        const spdStr = `${Math.round(ac.speed * 100)}KT`
        ctx.font = '9px "JetBrains Mono", monospace'
        ctx.fillStyle = '#a0ffd0'
        ctx.fillText(`${altStr}  ${spdStr}`, tagX + 4, tagY - tagH + 15)

        // Fuel & Status badge in data block
        ctx.font = '8px "JetBrains Mono", monospace'
        ctx.fillStyle = ac.fuel < 25 ? '#ff4444' : '#88aa99'
        ctx.fillText(`F:${Math.round(ac.fuel)}% [${ac.status.toUpperCase()}]`, tagX + 4, tagY - tagH + 25)
      })

      // 9. Collision Fireball & Blast Rings (Phase 4)
      if (gameOver && collisionPoint) {
        const timeOffset = Date.now() / 80
        const blastRadius = 35 + Math.sin(timeOffset) * 12

        ctx.save()
        // Outer blast shockwave
        ctx.beginPath()
        ctx.arc(collisionPoint.x, collisionPoint.y, blastRadius * 1.5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 60, 30, 0.7)'
        ctx.lineWidth = 3
        ctx.stroke()

        // Inner glowing fireball
        const fireGrad = ctx.createRadialGradient(
          collisionPoint.x,
          collisionPoint.y,
          0,
          collisionPoint.x,
          collisionPoint.y,
          blastRadius
        )
        fireGrad.addColorStop(0, '#ffffff')
        fireGrad.addColorStop(0.3, '#ffcc00')
        fireGrad.addColorStop(0.7, '#ff3300')
        fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(collisionPoint.x, collisionPoint.y, blastRadius, 0, Math.PI * 2)
        ctx.fillStyle = fireGrad
        ctx.fill()

        ctx.restore()
      }

      ctx.restore() // End of scope clipping

      // 10. Outer Compass Bezel
      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2)
      ctx.strokeStyle = '#00e5ff'
      ctx.lineWidth = 2
      ctx.stroke()

      for (let deg = 0; deg < 360; deg += 5) {
        const rad = (deg * Math.PI) / 180
        const isMajor = deg % 30 === 0
        const isSemi = deg % 10 === 0
        const tickLength = isMajor ? 12 : isSemi ? 7 : 4

        const x1 = centerX + Math.cos(rad) * (radarRadius - tickLength)
        const y1 = centerY + Math.sin(rad) * (radarRadius - tickLength)
        const x2 = centerX + Math.cos(rad) * radarRadius
        const y2 = centerY + Math.sin(rad) * radarRadius

        ctx.strokeStyle = isMajor ? '#00f0ff' : 'rgba(0, 230, 160, 0.4)'
        ctx.lineWidth = isMajor ? 2 : 1
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        if (isMajor) {
          const textRadius = radarRadius - 20
          const tx = centerX + Math.cos(rad) * textRadius
          const ty = centerY + Math.sin(rad) * textRadius
          ctx.fillStyle = '#00f0ff'
          ctx.font = 'bold 9px "JetBrains Mono", monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const degStr = String(deg).padStart(3, '0')
          ctx.fillText(degStr, tx, ty)
        }
      }
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [aircrafts, selectedAircraftId, gameOver, collisionPoint])

  // Resize handler: updates canvas & syncs radar center to store
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      setRadarCenter({ x: rect.width / 2, y: rect.height / 2 })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setRadarCenter])

  // Draw Path Pointer Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameOver) return
    const coords = getCanvasCoords(clientX, clientY)
    if (!coords) return

    const clickedAircraft = aircrafts.find((ac) => {
      const dist = Math.hypot(ac.x - coords.x, ac.y - coords.y)
      return dist <= 32
    })

    if (clickedAircraft) {
      selectAircraft(clickedAircraft.id)
      isDrawingRef.current = true
      drawingAircraftIdRef.current = clickedAircraft.id
      drawnPointsRef.current = [{ x: clickedAircraft.x, y: clickedAircraft.y }]
      cursorRef.current = { x: coords.x, y: coords.y }

      setActiveDrawingId(clickedAircraft.id)
      setWaypointCount(1)
    } else {
      selectAircraft(null)
    }
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (gameOver) return
    const coords = getCanvasCoords(clientX, clientY)
    if (!coords) return

    cursorRef.current = { x: coords.x, y: coords.y }

    if (isDrawingRef.current && drawingAircraftIdRef.current) {
      const points = drawnPointsRef.current
      const lastPoint = points[points.length - 1]

      const distFromLast = Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y)
      if (distFromLast >= 14) {
        points.push({ x: coords.x, y: coords.y })
        setWaypointCount(points.length)
      }
    }
  }

  const handlePointerUp = () => {
    if (isDrawingRef.current && drawingAircraftIdRef.current) {
      const targetId = drawingAircraftIdRef.current
      const points = drawnPointsRef.current

      if (points.length >= 2) {
        const finalWaypoints = points.slice(1)
        setWaypoints(targetId, finalWaypoints)

        addCommLog({
          sender: 'ATC',
          callsign: targetId,
          message: `${targetId}, follow drawn vector route (${finalWaypoints.length} waypoints).`,
          type: 'command',
        })
        addCommLog({
          sender: 'PILOT',
          callsign: targetId,
          message: `Wilco, following vector route, ${targetId}.`,
          type: 'ack',
        })
      }

      isDrawingRef.current = false
      drawingAircraftIdRef.current = null
      drawnPointsRef.current = []
      setActiveDrawingId(null)
      setWaypointCount(0)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#05080e] overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        onTouchEnd={handlePointerUp}
        className="block cursor-crosshair crt-vignette touch-none"
      />

      {/* Top Left Compass & System Header Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 font-mono text-xs">
        <div className="flex items-center gap-2 bg-[#091522]/85 border border-[#00e5ff]/30 px-3 py-1.5 rounded backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-[#00ffaa] animate-ping" />
          <span className="text-[#00e5ff] font-bold tracking-wider">RADAR ACTIVE</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300">WIIZ_APP (124.850)</span>
          <span className="text-gray-400">|</span>
          <span className="text-[#00ffaa]">SWEEP 24 RPM</span>
        </div>
        <div className="text-[10px] text-gray-400 pl-1 flex items-center gap-2">
          <span>RANGE: 20 NM</span>
          <span>•</span>
          <span>PRIMARY TARGET: <strong className="text-[#00e5ff]">{selectedAircraftId || 'NONE'}</strong></span>
        </div>
      </div>

      {/* Drawing Mode Active Overlay Banner */}
      {activeDrawingId && !gameOver && (
        <div className="absolute top-4 right-4 pointer-events-none bg-amber-500/15 border border-amber-400/60 px-3 py-1.5 rounded backdrop-blur-md flex items-center gap-2 text-xs font-mono text-amber-300 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>DRAWING VECTOR: {activeDrawingId} ({waypointCount} WPT)</span>
        </div>
      )}

      {/* Quick Instructional Hint at Bottom Left */}
      <div className="absolute bottom-4 left-4 pointer-events-none bg-black/60 border border-gray-800 px-3 py-1.5 rounded text-[11px] text-gray-400 font-mono backdrop-blur-sm flex items-center gap-2">
        <span className="text-[#00e5ff] font-bold">PRIMARY CONTROL:</span>
        <span>Drag mouse from aircraft to draw vector path to Runway 09</span>
      </div>

      {/* CRT Scanline effect over canvas */}
      <div className="absolute inset-0 crt-overlay pointer-events-none" />

      {/* GAME OVER MODAL (Phase 4) */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-[#091522] border-2 border-red-500 rounded-lg p-6 shadow-[0_0_50px_rgba(255,50,50,0.5)] font-mono text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-500 animate-bounce">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-red-500 tracking-wider">CRITICAL INCIDENT</h2>
              <p className="text-xs text-red-300 uppercase tracking-widest mt-0.5">
                RADAR CONTROL TERMINATED
              </p>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded w-full text-xs text-gray-200 text-left">
              <strong className="text-red-400 block mb-1">FAILURE CAUSE:</strong>
              {gameOverReason || 'Loss of aircraft separation or fuel exhaustion.'}
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 w-full text-center">
              <div className="p-2 bg-[#060b13] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-[#00e5ff]" /> SURVIVAL
                </div>
                <div className="text-sm font-bold text-white mt-1">{formatTime(survivalTime)}</div>
              </div>
              <div className="p-2 bg-[#060b13] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> LANDED
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{landedCount}</div>
              </div>
              <div className="p-2 bg-[#060b13] border border-gray-800 rounded">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> SCORE
                </div>
                <div className="text-sm font-bold text-amber-400 mt-1">{score}</div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REINITIALIZE RADAR SIMULATION</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
