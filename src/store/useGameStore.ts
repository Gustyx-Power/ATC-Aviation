import { create } from 'zustand'
import type { Aircraft, CommLogItem, GameState, RadioChannel, ViewMode, Waypoint } from '../types/atc'
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
    x: center.x - 60,
    y: center.y + 40,
    speed: 1.2,
    heading: 0,
    targetHeading: 0,
    altitude: 0,
    targetAltitude: 0,
    fuel: 98,
    waypoints: [],
    status: 'at_gate',
    gate: 'Stand 1',
    destination: 'DPS / Bali',
    pos3d: { x: -140, y: 0.1, z: -48 },
    rot3d: { pitch: 0, yaw: 0, roll: 0 },
    phaseProgress: 0,
    history: [],
    conflictWith: [],
  },
  {
    id: 'LNI456',
    airline: 'Lion Air',
    aircraftType: 'A320',
    squawk: '5124',
    x: center.x - 140,
    y: center.y - 20,
    speed: 1.1,
    heading: 270,
    targetHeading: 270,
    altitude: 0,
    targetAltitude: 0,
    fuel: 94,
    waypoints: [],
    status: 'taxiing',
    gate: 'Stand 2',
    destination: 'SUB / Surabaya',
    pos3d: { x: -340, y: 0.1, z: -120 },
    rot3d: { pitch: 0, yaw: Math.PI / 2, roll: 0 },
    phaseProgress: 0.4,
    history: [],
    conflictWith: [],
  },
  {
    id: 'CTV789',
    airline: 'Citilink',
    aircraftType: 'A320',
    squawk: '3110',
    x: center.x - radius * 0.7,
    y: center.y,
    speed: 1.4,
    heading: 90,
    targetHeading: 90,
    altitude: 1200,
    targetAltitude: 0,
    fuel: 88,
    waypoints: [],
    status: 'approach',
    destination: 'Inbound Runway 09',
    pos3d: { x: -850, y: 80, z: -240 },
    rot3d: { pitch: 0.05, yaw: -Math.PI / 2, roll: 0 },
    phaseProgress: 0,
    history: [],
    conflictWith: [],
  },
]

let frameCounter = 0

// Pilot Voice readback helper using Web Speech API & VHF Radio FX
function pilotReadback(text: string) {
  radioSound.speakPilotVoice(text)
}

export const useGameStore = create<GameState>((set) => ({
  aircrafts: getInitialAircrafts(DEFAULT_CENTER, DEFAULT_RADIUS),
  score: 0,
  landedCount: 0,
  airMiles: 15,
  airportLevel: 1,
  survivalTime: 0,
  gameOver: false,
  gameOverReason: undefined,
  collisionPoint: null,
  radarCenter: DEFAULT_CENTER,
  radarRadius: DEFAULT_RADIUS,
  isPaused: false,
  selectedAircraftId: 'GIA123',
  micActive: false,

  // 3D Tower & Roblox HUD state
  viewMode: 'tower',
  activeChannel: 'ground',
  tutorialActive: true,
  tutorialText: 'GIA123 sedang menunggu izin dorongan kembali (Pushback). Klik tombol [Dorongan kembali] di toolbar bawah!',
  weather: {
    condition: 'Cerah',
    temp: 28,
    wind: '270° 05KT',
    time: '14:00',
  },

  commsLog: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'SYSTEM',
      message: 'ATC TOWER SIMULATOR ONLINE. RUNWAY 09 ACTIVE. WIND 270/05KT.',
      type: 'info',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: 'GIA123',
      message: 'Jakarta Ground, Garuda 123 Stand 1 ready for pushback to Bali.',
      type: 'ack',
    },
  ],

  setRadarDimensions: (center: { x: number; y: number }, radius: number) =>
    set({ radarCenter: center, radarRadius: radius }),

  setRadarCenter: (center: { x: number; y: number }) =>
    set({ radarCenter: center }),

  spawnAircraft: () =>
    set((state) => {
      const center = state.radarCenter || DEFAULT_CENTER
      const radius = state.radarRadius || DEFAULT_RADIUS
      const existingIds = state.aircrafts.map((a) => a.id)
      const newAircraft = generateRandomAircraft(center, radius, existingIds)

      // Randomly assign to approach or stand
      const spawnType = Math.random() > 0.5 ? 'approach' : 'at_gate'
      const standNumber = Math.floor(1 + Math.random() * 3)

      if (spawnType === 'at_gate') {
        const standX = standNumber === 1 ? -140 : standNumber === 2 ? -60 : 20
        newAircraft.status = 'at_gate'
        newAircraft.gate = `Stand ${standNumber}`
        newAircraft.pos3d = { x: standX, y: 0.1, z: -48 }
        newAircraft.altitude = 0
        newAircraft.heading = 0
      } else {
        newAircraft.status = 'approach'
        newAircraft.pos3d = { x: -950, y: 110, z: -240 }
        newAircraft.altitude = 1800
        newAircraft.heading = 90
      }

      const spawnMsg: CommLogItem = {
        id: `spawn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        sender: 'PILOT',
        callsign: newAircraft.id,
        message:
          spawnType === 'at_gate'
            ? `Jakarta Ground, ${newAircraft.airline} ${newAircraft.id.replace(/\D/g, '')} at Stand ${standNumber}, ready.`
            : `Jakarta Approach, ${newAircraft.airline} ${newAircraft.id.replace(/\D/g, '')} inbound Runway 09.`,
        type: 'info',
      }

      return {
        aircrafts: [...state.aircrafts, newAircraft],
        commsLog: [...state.commsLog, spawnMsg].slice(-50),
      }
    }),

  addAircraft: (aircraft: Aircraft) =>
    set((state) => ({ aircrafts: [...state.aircrafts, aircraft] })),

  // ------------------------------------------------------------------
  // ROBLOX ATC TOWER CLEARANCE ACTIONS
  // ------------------------------------------------------------------
  orderPushback: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, pushback approved, face west onto Taxiway Alpha.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Pushback approved, facing west, ${id}.`,
      type: 'ack',
    }
    pilotReadback(`Pushback disetujui, hadap barat, ${id}`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'pushback', phaseProgress: 0 } : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'ground',
      tutorialText: 'Bagus! Pesawat sedang didorong mundur. Setelah selesai, klik [Taksi] untuk mengarahkannya ke Runway 09!',
    }))
  },

  orderTaxi: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, taxi to holding point Runway 09 via Taxiway Alpha.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Taxi to holding point Runway 09 via Alpha, ${id}.`,
      type: 'ack',
    }
    pilotReadback(`Taksi ke titik tunggu Runway 09 via Alpha, ${id}`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'taxiing',
              heading: 270,
              pos3d: ac.pos3d ? { ...ac.pos3d, z: -120 } : { x: -140, y: 0.1, z: -120 },
            }
          : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'ground',
      tutorialText: 'Pesawat sedang taksi ke titik tunggu Runway 09. Saat tiba di garis kuning runway, klik [Lepas landas]!',
    }))
  },

  orderTakeoff: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, wind 270 at 05 knots, Runway 09 cleared for takeoff!`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Cleared for takeoff Runway 09, ${id}, rolling!`,
      type: 'ack',
    }
    pilotReadback(`Cleared for takeoff Runway 09, ${id}, rolling!`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'takeoff',
              heading: 90,
              phaseProgress: 0,
              pos3d: { x: -620, y: 0.1, z: -240 },
            }
          : ac
      ),
      airMiles: state.airMiles + 5,
      score: state.score + 200,
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
      tutorialText: 'Luar biasa! Pesawat sedang berakselerasi dan lepas landas (+5 Mil Udara). Anda menguasai menara ATC!',
    }))
  },

  orderHold: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, hold position immediately.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Holding position, ${id}.`,
      type: 'ack',
    }
    pilotReadback(`Holding position, ${id}`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'holding' } : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
    }))
  },

  orderClearedToLand: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, wind 270 at 05 knots, Runway 09 cleared to land.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Cleared to land Runway 09, ${id}.`,
      type: 'ack',
    }
    pilotReadback(`Cleared to land Runway 09, ${id}`)

    set((state) => ({
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
    }))
  },

  orderGoAround: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, go around immediately, climb 2500ft, contact Departure.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Going around, climb 2500ft, ${id}.`,
      type: 'ack',
    }
    pilotReadback(`Going around, ${id}`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'airborne',
              altitude: 2500,
              pos3d: ac.pos3d ? { ...ac.pos3d, y: 150 } : undefined,
            }
          : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
    }))
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setActiveChannel: (channel: RadioChannel) => set({ activeChannel: channel }),
  dismissTutorial: () => set({ tutorialActive: false }),

  // ------------------------------------------------------------------
  // 3D SIMULATION LOOP PHYSICS & LIFE CYCLE
  // ------------------------------------------------------------------
  updateAircrafts: () =>
    set((state) => {
      if (state.gameOver || state.isPaused) return state

      frameCounter++
      let awardedMiles = 0
      let landedThisTick = 0
      let updatedComms = state.commsLog

      const updatedAircrafts = state.aircrafts
        .map((ac) => {
          let pos = ac.pos3d || { x: 0, y: 0.1, z: 0 }
          let heading = ac.heading
          let status = ac.status
          let altitude = ac.altitude
          let progress = ac.phaseProgress || 0

          // Phase: AT GATE
          if (status === 'at_gate') {
            // Stationary at parking stand
            return ac
          }

          // Phase: PUSHBACK
          if (status === 'pushback') {
            progress += 0.0035
            // Push back from gate Z = -48 towards taxiway Z = -120
            pos = {
              x: pos.x,
              y: 0.1,
              z: -48 - progress * 72,
            }
            // Rotate from 0 to 270 deg (facing West)
            heading = progress * 270

            if (progress >= 1) {
              status = 'taxiing'
              progress = 0
              pos.z = -120
              heading = 270
            }
            return {
              ...ac,
              status,
              heading,
              pos3d: pos,
              phaseProgress: progress,
            }
          }

          // Phase: TAXIING
          if (status === 'taxiing') {
            // Roll along Taxiway Alpha (Z = -120) towards West Runway 09 holding point (X = -620)
            const targetHoldX = -620
            if (pos.x > targetHoldX) {
              pos = {
                ...pos,
                x: pos.x - 0.75, // Ground taxi speed ~15 knots
                z: -120,
              }
              heading = 270
            } else {
              // Reached holding point Runway 09!
              status = 'holding'
              pos.x = targetHoldX
            }
            return {
              ...ac,
              status,
              heading,
              pos3d: pos,
            }
          }

          // Phase: HOLDING
          if (status === 'holding') {
            // Stopped at holding point waiting for takeoff clearance
            return ac
          }

          // Phase: TAKEOFF ROLL & CLIMB
          if (status === 'takeoff') {
            progress += 0.003
            // Accelerate down Runway 09 (from X = -620 to X = 700)
            const newX = pos.x + 2.8 + progress * 6.5
            let newY = 0.1
            let pitch = 0

            // Rotate / lift off once past mid-field (X > -100)
            if (newX > -100) {
              const climbFactor = Math.min(1, (newX + 100) / 700)
              newY = 0.1 + climbFactor * 220
              pitch = -0.22 // Pitch nose up
              altitude = Math.round(climbFactor * 3000)
            }

            pos = { x: newX, y: newY, z: -240 }

            if (newX > 800) {
              status = 'airborne'
            }

            return {
              ...ac,
              status,
              altitude,
              pos3d: pos,
              rot3d: { pitch, yaw: -Math.PI / 2, roll: 0 },
              phaseProgress: progress,
            }
          }

          // Phase: AIRBORNE DEPARTURE
          if (status === 'airborne') {
            pos = {
              x: pos.x + 4.5,
              y: pos.y + 0.8,
              z: -240,
            }
            altitude += 25
            return {
              ...ac,
              altitude,
              pos3d: pos,
            }
          }

          // Phase: FINAL APPROACH
          if (status === 'approach') {
            // Descend towards Runway 09 threshold (X = -600, Y = 0.2, Z = -240)
            const speed = 2.4
            const targetTouchdownX = -600
            const newX = pos.x + speed
            const distToTouchdown = Math.max(0, targetTouchdownX - newX)
            const newY = Math.max(0.2, distToTouchdown * 0.28)
            altitude = Math.round(newY * 25)

            pos = {
              x: newX,
              y: newY,
              z: -240,
            }

            if (newX >= targetTouchdownX) {
              status = 'landing'
              radioSound.playTouchdown()
              landedThisTick += 1
              awardedMiles += 5
              const touchdownMsg: CommLogItem = {
                id: `touchdown-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'SYSTEM',
                message: `TOUCHDOWN: ${ac.id} landed smoothly on Runway 09 (+5 Mil Udara).`,
                type: 'info',
              }
              updatedComms = [...updatedComms, touchdownMsg]
            }

            return {
              ...ac,
              status,
              altitude,
              pos3d: pos,
            }
          }

          // Phase: LANDING ROLLOUT
          if (status === 'landing') {
            // Decelerate down runway
            pos = {
              ...pos,
              x: pos.x + 1.2,
              y: 0.2,
            }
            // Once slowed down at exit Charlie (X = 0), turn onto taxiway to gate
            if (pos.x >= 0) {
              status = 'at_gate'
              pos = { x: -60, y: 0.1, z: -48 }
              heading = 0
            }
            return {
              ...ac,
              status,
              pos3d: pos,
              heading,
            }
          }

          return ac
        })
        .filter((ac) => {
          // Remove aircraft that flew far away out of sector
          if (ac.pos3d && ac.pos3d.x > 1800) return false
          return true
        })

      return {
        aircrafts: updatedAircrafts,
        survivalTime: state.survivalTime + 1 / 60,
        airMiles: state.airMiles + awardedMiles,
        landedCount: state.landedCount + landedThisTick,
        score: state.score + landedThisTick * 250,
        commsLog: updatedComms.slice(-50),
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
        ac.id === id ? { ...ac, heading: (heading + 360) % 360 } : ac
      ),
    })),

  setAircraftSpeed: (id: string, speed: number) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, speed } : ac
      ),
    })),

  setAircraftAltitude: (id: string, altitude: number) =>
    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, altitude } : ac
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

  setMicActive: (active: boolean) => set({ micActive: active }),

  resetGame: () => {
    frameCounter = 0
    set((state) => ({
      aircrafts: getInitialAircrafts(state.radarCenter, state.radarRadius),
      score: 0,
      landedCount: 0,
      airMiles: 15,
      survivalTime: 0,
      gameOver: false,
      gameOverReason: undefined,
      collisionPoint: null,
      isPaused: false,
      selectedAircraftId: 'GIA123',
      viewMode: 'tower',
      activeChannel: 'ground',
      tutorialActive: true,
      tutorialText: 'GIA123 sedang menunggu izin dorongan kembali (Pushback). Klik tombol [Dorongan kembali] di toolbar bawah!',
      commsLog: [
        {
          id: 'reset-1',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM',
          message: 'ATC TOWER SIMULATOR REINITIALIZED. RUNWAY 09 ACTIVE.',
          type: 'info',
        },
      ],
    }))
  },
}))
