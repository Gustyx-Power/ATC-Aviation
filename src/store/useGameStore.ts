import { create } from 'zustand'
import type { Aircraft, CommLogItem, GameState, Waypoint } from '../types/atc'
import { generateRandomAircraft } from '../utils/aircraftSpawner'
import { radioSound } from '../utils/audioEffects'

const DEFAULT_CENTER = { x: 450, y: 350 }
const DEFAULT_RADIUS = 280

export const getInitialAircrafts = (
  center = DEFAULT_CENTER,
  radius = DEFAULT_RADIUS
): Aircraft[] => [
  {
    id: 'GIA123',
    airline: 'Garuda Indonesia',
    aircraftType: 'B738',
    squawk: '4201',
    x: center.x - radius * 0.65,
    y: center.y - radius * 0.20,
    speed: 1.30,
    heading: 105,
    targetHeading: 105,
    altitude: 5000,
    targetAltitude: 5000,
    fuel: 98,
    waypoints: [],
    status: 'cruising',
    conflictWith: [],
    history: [
      { x: center.x - radius * 0.70, y: center.y - radius * 0.22 },
      { x: center.x - radius * 0.65, y: center.y - radius * 0.20 },
    ],
  },
  {
    id: 'LNI456',
    airline: 'Lion Air',
    aircraftType: 'A320',
    squawk: '5124',
    x: center.x + radius * 0.55,
    y: center.y + radius * 0.35,
    speed: 1.25,
    heading: 315,
    targetHeading: 315,
    altitude: 7000,
    targetAltitude: 7000,
    fuel: 94,
    waypoints: [],
    status: 'cruising',
    conflictWith: [],
    history: [
      { x: center.x + radius * 0.60, y: center.y + radius * 0.40 },
      { x: center.x + radius * 0.55, y: center.y + radius * 0.35 },
    ],
  },
]

let frameCounter = 0
let lastConflictSoundTime = 0

export const useGameStore = create<GameState>((set) => ({
  aircrafts: getInitialAircrafts(DEFAULT_CENTER, DEFAULT_RADIUS),
  score: 0,
  landedCount: 0,
  survivalTime: 0,
  gameOver: false,
  gameOverReason: undefined,
  collisionPoint: null,
  radarCenter: DEFAULT_CENTER,
  radarRadius: DEFAULT_RADIUS,
  isPaused: false,
  selectedAircraftId: 'GIA123',
  micActive: false,
  commsLog: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'SYSTEM',
      message: 'ATC RADAR ONLINE. SEPARATION MINIMA: 28 PX. RUNWAY 09 ACTIVE.',
      type: 'info',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: 'GIA123',
      message: 'Jakarta Radar, Garuda 123 with you FL050 heading 105.',
      type: 'ack',
    },
  ],

  setRadarDimensions: (center: { x: number; y: number }, radius: number) =>
    set((state) => {
      const prevCenter = state.radarCenter
      const dx = center.x - prevCenter.x
      const dy = center.y - prevCenter.y

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const adjustedAircrafts = state.aircrafts.map((ac) => ({
          ...ac,
          x: ac.x + dx,
          y: ac.y + dy,
          history: (ac.history || []).map((h) => ({ x: h.x + dx, y: h.y + dy })),
          waypoints: ac.waypoints.map((wp) => ({ x: wp.x + dx, y: wp.y + dy })),
        }))
        return { radarCenter: center, radarRadius: radius, aircrafts: adjustedAircrafts }
      }
      return { radarCenter: center, radarRadius: radius }
    }),

  setRadarCenter: (center: { x: number; y: number }) =>
    set((state) => {
      const prevCenter = state.radarCenter
      const dx = center.x - prevCenter.x
      const dy = center.y - prevCenter.y

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const adjustedAircrafts = state.aircrafts.map((ac) => ({
          ...ac,
          x: ac.x + dx,
          y: ac.y + dy,
          history: (ac.history || []).map((h) => ({ x: h.x + dx, y: h.y + dy })),
          waypoints: ac.waypoints.map((wp) => ({ x: wp.x + dx, y: wp.y + dy })),
        }))
        return { radarCenter: center, aircrafts: adjustedAircrafts }
      }
      return { radarCenter: center }
    }),

  spawnAircraft: () =>
    set((state) => {
      const center = state.radarCenter || DEFAULT_CENTER
      const radius = state.radarRadius || DEFAULT_RADIUS
      const existingIds = state.aircrafts.map((a) => a.id)
      const newAircraft = generateRandomAircraft(center, radius, existingIds)

      const spawnMsg: CommLogItem = {
        id: `spawn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        sender: 'PILOT',
        callsign: newAircraft.id,
        message: `Jakarta Radar, ${newAircraft.airline} ${newAircraft.id.replace(/\D/g, '')} inbound, passing FL0${Math.round(newAircraft.altitude / 100)}.`,
        type: 'info',
      }

      return {
        aircrafts: [...state.aircrafts, newAircraft],
        commsLog: [...state.commsLog, spawnMsg].slice(-50),
      }
    }),

  addAircraft: (aircraft: Aircraft) =>
    set((state) => ({ aircrafts: [...state.aircrafts, aircraft] })),

  updateAircrafts: () =>
    set((state) => {
      if (state.gameOver || state.isPaused) return state

      frameCounter++
      const center = state.radarCenter || DEFAULT_CENTER
      const radarRadius = state.radarRadius || DEFAULT_RADIUS
      const rwyThresholdX = center.x - 70 // West threshold for Runway 09
      const rwyThresholdY = center.y

      // 1. Move and update waypoints & fuel for each aircraft
      const updatedAircrafts: Aircraft[] = state.aircrafts.map((ac) => {
        let currentHeading = ac.heading
        let currentSpeed = ac.speed
        let currentAlt = ac.altitude
        let currentStatus = ac.status
        let waypoints = [...ac.waypoints]

        // Fuel Depletion (Phase 4): ~1% every 15-20 seconds
        const fuelConsumption = 0.02 * (currentSpeed / 1.4)
        const newFuel = Math.max(0, ac.fuel - fuelConsumption)

        if (newFuel <= 25 && currentStatus === 'cruising') {
          currentStatus = 'emergency'
        }

        // Landing Rollout behavior on Runway 09
        if (currentStatus === 'landing') {
          currentHeading = 90
          currentAlt = Math.max(0, currentAlt - 50)
          currentSpeed = Math.max(0, currentSpeed * 0.985)
        } else {
          // Standard Waypoint Navigation
          if (waypoints.length > 0) {
            const targetWp = waypoints[0]
            const distX = targetWp.x - ac.x
            const distY = targetWp.y - ac.y
            const distance = Math.hypot(distX, distY)

            const reachRadius = Math.max(12, currentSpeed * 8)
            if (distance <= reachRadius) {
              waypoints.shift()
            } else {
              const targetRad = Math.atan2(distX, -distY)
              const desiredHeading = ((targetRad * 180) / Math.PI + 360) % 360

              const turnRate = 3.0
              const diff = (((desiredHeading - currentHeading) + 540) % 360) - 180

              if (Math.abs(diff) <= turnRate) {
                currentHeading = desiredHeading
              } else {
                currentHeading = (currentHeading + Math.sign(diff) * turnRate + 360) % 360
              }
            }
          }

          // Runway 09 Touchdown Zone Detection (Approach from West)
          const distToThreshold = Math.hypot(ac.x - rwyThresholdX, ac.y - rwyThresholdY)
          const headingDiffFromRwy = Math.abs((((currentHeading - 90) + 540) % 360) - 180)

          if (
            distToThreshold <= 32 &&
            headingDiffFromRwy <= 35 &&
            currentSpeed <= 2.2 &&
            ac.x <= rwyThresholdX + 15
          ) {
            currentStatus = 'landing'
            waypoints = []
          }
        }

        // Forward motion along heading (scaled for smooth, realistic radar pacing)
        const motionSpeed = currentSpeed * 0.50
        const rad = (currentHeading * Math.PI) / 180
        const dx = Math.sin(rad) * motionSpeed
        const dy = -Math.cos(rad) * motionSpeed

        let newX = ac.x + dx
        let newY = ac.y + dy

        // In cruising, gently wrap around radar scope boundary
        if (currentStatus !== 'landing') {
          const distFromCenter = Math.hypot(newX - center.x, newY - center.y)
          if (distFromCenter > radarRadius * 0.98) {
            const angle = Math.atan2(newY - center.y, newX - center.x)
            const enterRadius = radarRadius * 0.92
            newX = center.x - Math.cos(angle) * enterRadius
            newY = center.y - Math.sin(angle) * enterRadius
            // Re-point heading towards center airport
            const inboundAngle = Math.atan2(center.x - newX, -(center.y - newY))
            currentHeading = ((inboundAngle * 180) / Math.PI + 360) % 360
            waypoints = []
          }
        }

        // History trail for radar phosphor persistence
        const history = [...(ac.history || [])]
        const lastPt = history[history.length - 1]
        if (!lastPt || Math.hypot(newX - lastPt.x, newY - lastPt.y) > 16) {
          history.push({ x: newX, y: newY })
          if (history.length > 12) history.shift()
        }

        return {
          ...ac,
          x: newX,
          y: newY,
          speed: currentSpeed,
          heading: currentHeading,
          altitude: currentAlt,
          fuel: newFuel,
          status: currentStatus,
          waypoints,
          history,
          conflictWith: [] as string[],
        }
      })

      // 2. Check Fuel Exhaustion (Failure Condition)
      const outOfFuelAircraft = updatedAircrafts.find((ac) => ac.fuel <= 0)
      if (outOfFuelAircraft) {
        radioSound.playExplosion()
        const fuelAlert: CommLogItem = {
          id: `fuel-crash-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM',
          message: `MAYDAY: FLIGHT ${outOfFuelAircraft.id} CRASHED DUE TO FUEL EXHAUSTION!`,
          type: 'alert',
        }

        return {
          aircrafts: updatedAircrafts,
          gameOver: true,
          gameOverReason: `FUEL DEPLETION: ${outOfFuelAircraft.id} ran out of fuel before reaching the runway!`,
          collisionPoint: { x: outOfFuelAircraft.x, y: outOfFuelAircraft.y },
          commsLog: [...state.commsLog, fuelAlert].slice(-50),
        }
      }

      // 3. Collision Detection (Euclidean Distance Separation Loss)
      const SEPARATION_LOSS_MIN = 28
      const CONFLICT_WARNING_MIN = 55
      let collisionDetected = false
      let collisionPair: [Aircraft, Aircraft] | null = null
      let hasConflictWarning = false

      for (let i = 0; i < updatedAircrafts.length; i++) {
        for (let j = i + 1; j < updatedAircrafts.length; j++) {
          const ac1 = updatedAircrafts[i]
          const ac2 = updatedAircrafts[j]

          if (ac1.status === 'landing' && ac1.speed < 0.4) continue
          if (ac2.status === 'landing' && ac2.speed < 0.4) continue

          const dist = Math.hypot(ac1.x - ac2.x, ac1.y - ac2.y)
          const altDiff = Math.abs(ac1.altitude - ac2.altitude)

          // ICAO Standards: Collision requires BOTH horizontal proximity (< 28px) AND vertical overlap (< 1000 ft)
          // Plus 3-second grace period on startup
          if (dist < SEPARATION_LOSS_MIN && altDiff < 1000 && frameCounter > 180) {
            collisionDetected = true
            collisionPair = [ac1, ac2]
            break
          } else if (dist < CONFLICT_WARNING_MIN && altDiff < 1000) {
            ac1.conflictWith = [...(ac1.conflictWith || []), ac2.id]
            ac2.conflictWith = [...(ac2.conflictWith || []), ac1.id]
            hasConflictWarning = true
          }
        }
        if (collisionDetected) break
      }

      // Trigger conflict audio alarm at most once every 3 seconds
      const now = Date.now()
      if (hasConflictWarning && now - lastConflictSoundTime > 3000) {
        lastConflictSoundTime = now
        radioSound.playConflictAlert()
      }

      // Handle Collision Game Over
      if (collisionDetected && collisionPair) {
        const [a1, a2] = collisionPair
        radioSound.playExplosion()
        const colX = (a1.x + a2.x) / 2
        const colY = (a1.y + a2.y) / 2

        const collisionAlert: CommLogItem = {
          id: `collision-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM',
          message: `EMERGENCY: MID-AIR COLLISION BETWEEN ${a1.id} AND ${a2.id}! SIMULATION TERMINATED.`,
          type: 'alert',
        }

        return {
          aircrafts: updatedAircrafts,
          gameOver: true,
          gameOverReason: `SEPARATION LOSS (MID-AIR COLLISION): ${a1.id} collided with ${a2.id}!`,
          collisionPoint: { x: colX, y: colY },
          commsLog: [...state.commsLog, collisionAlert].slice(-50),
        }
      }

      // 4. Completed Landings (Aircraft rolls down Runway 09 and vacates)
      let landedThisFrame = 0
      const remainingAircrafts: Aircraft[] = []

      updatedAircrafts.forEach((ac) => {
        if (ac.status === 'landing' && (ac.speed < 0.35 || ac.x >= center.x + 60)) {
          landedThisFrame++
          radioSound.playTouchdown()
        } else {
          remainingAircrafts.push(ac)
        }
      })

      let newComms = state.commsLog
      if (landedThisFrame > 0) {
        const landedMsg: CommLogItem = {
          id: `landed-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'PILOT',
          message: `Runway 09 vacated via Bravo. Excellent vectoring, Jakarta Radar!`,
          type: 'ack',
        }
        newComms = [...state.commsLog, landedMsg].slice(-50)
      }

      // 5. Periodic Traffic Spawning (Every ~25s or when traffic is low)
      let finalAircrafts = remainingAircrafts
      if (
        (frameCounter % 1500 === 0 && finalAircrafts.length < 5) ||
        finalAircrafts.length < 2
      ) {
        const existingIds = finalAircrafts.map((a) => a.id)
        const incomingAc = generateRandomAircraft(center, radarRadius, existingIds)
        finalAircrafts = [...finalAircrafts, incomingAc]
      }

      return {
        aircrafts: finalAircrafts,
        survivalTime: state.survivalTime + 1 / 60,
        score: state.score + landedThisFrame * 150 + (frameCounter % 60 === 0 ? 1 : 0),
        landedCount: state.landedCount + landedThisFrame,
        commsLog: newComms,
      }
    }),

  setWaypoints: (id: string, path: Waypoint[]) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, waypoints: path } : ac
      ),
    })),

  selectAircraft: (id: string | null) =>
    set(() => ({ selectedAircraftId: id })),

  setAircraftHeading: (id: string, heading: number) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              heading: (heading + 360) % 360,
              targetHeading: (heading + 360) % 360,
              waypoints: [],
            }
          : ac
      ),
    })),

  setAircraftSpeed: (id: string, speed: number) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, speed: Math.max(0.6, Math.min(3.5, speed)) } : ac
      ),
    })),

  setAircraftAltitude: (id: string, altitude: number) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, altitude: Math.max(0, altitude) } : ac
      ),
    })),

  addCommLog: (item: Omit<CommLogItem, 'id' | 'timestamp'>) =>
    set((state) => ({
      commsLog: [
        ...state.commsLog,
        {
          ...item,
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        },
      ].slice(-50),
    })),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setMicActive: (active: boolean) => set(() => ({ micActive: active })),

  resetGame: () => {
    frameCounter = 0
    set((state) => ({
      aircrafts: getInitialAircrafts(state.radarCenter, state.radarRadius),
      score: 0,
      landedCount: 0,
      survivalTime: 0,
      gameOver: false,
      gameOverReason: undefined,
      collisionPoint: null,
      isPaused: false,
      selectedAircraftId: 'GIA123',
      commsLog: [
        {
          id: 'reset-1',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM',
          message: 'SIMULATION RESET. RADAR REINITIALIZED.',
          type: 'info',
        },
      ],
    }))
  },
}))
