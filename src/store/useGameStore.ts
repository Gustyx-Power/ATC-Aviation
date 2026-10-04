import { create } from 'zustand'
import type { Aircraft, AircraftStatus, CommLogItem, GameState, RadioChannel, ViewMode, Waypoint, WeatherCondition } from '../types/atc'
import { generateRandomAircraft } from '../utils/aircraftSpawner'
import { radioSound } from '../utils/audioEffects'

const DEFAULT_CENTER = { x: 450, y: 350 }
const DEFAULT_RADIUS = 280

export const GATE_COORDS: Record<string, { x: number; z: number }> = {
  'Gate 1': { x: -330, z: -55 },
  'Gate 2': { x: -260, z: -55 },
  'Gate 3': { x: -190, z: -55 },
  'Gate 4': { x: -120, z: -55 },
  'Gate 5': { x: -50, z: -55 },
  'Gate 6': { x: 20, z: -55 },
  'Hangar 1': { x: 120, z: -25 },
  'Hangar 2': { x: 180, z: -25 },
}

export const getInitialAircrafts = (
  center = DEFAULT_CENTER,
  _radius = DEFAULT_RADIUS
): Aircraft[] => [
  {
    id: 'GIA123',
    airline: 'Garuda Indonesia',
    aircraftType: 'B738',
    squawk: '4201',
    x: center.x - 70,
    y: center.y + 40,
    speed: 1.2,
    heading: 0,
    targetHeading: 0,
    altitude: 0,
    targetAltitude: 0,
    fuel: 45,
    waypoints: [],
    status: 'at_gate',
    gate: 'Gate 1',
    assignedGate: 'Gate 1',
    destination: 'DPS / Bali',
    pos3d: { x: -330, y: 0.1, z: -55 },
    rot3d: { pitch: 0, yaw: 0, roll: 0 },
    phaseProgress: 0,
    serviceProgress: 0,
    passengers: { current: 175, max: 180 },
    technicalHealth: 98,
    pendingClearance: 'deboarding',
    pendingClearanceTitle: 'Izin Penurunan Penumpang (Deboarding)',
    turnaround: {
      deboarded: false,
      cabinCleaned: false,
      refueled: false,
      techInspected: false,
      boarded: false,
    },
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
    heading: 0,
    targetHeading: 0,
    altitude: 0,
    targetAltitude: 0,
    fuel: 85,
    waypoints: [],
    status: 'at_gate',
    gate: 'Gate 3',
    assignedGate: 'Gate 3',
    destination: 'SUB / Surabaya',
    pos3d: { x: -190, y: 0.1, z: -55 },
    rot3d: { pitch: 0, yaw: 0, roll: 0 },
    phaseProgress: 0,
    serviceProgress: 100,
    passengers: { current: 180, max: 180 },
    technicalHealth: 100,
    pendingClearance: 'pushback',
    pendingClearanceTitle: 'Izin Dorongan Mundur (Pushback)',
    turnaround: {
      deboarded: true,
      cabinCleaned: true,
      refueled: true,
      techInspected: true,
      boarded: true,
    },
    history: [],
    conflictWith: [],
  },
]

let frameCounter = 0
let lastInboundSpawnTime = Date.now()

// ATC Controller (Female Voice) & Pilot/Crew (Male Voice) Voice transmission helpers
function atcInstruction(text: string) {
  radioSound.speakAtcVoice(text)
}

function pilotReadback(text: string) {
  radioSound.speakPilotVoice(text)
}

export const useGameStore = create<GameState>((set, get) => ({
  aircrafts: getInitialAircrafts(DEFAULT_CENTER, DEFAULT_RADIUS),
  score: 0,
  landedCount: 0,
  airMiles: 25,
  airportLevel: 1,
  survivalTime: 0,
  gameOver: false,
  gameOverReason: undefined,
  collisionPoint: null,
  radarCenter: DEFAULT_CENTER,
  radarRadius: DEFAULT_RADIUS,
  isPaused: false,
  simSpeed: 1,
  setSimSpeed: (speed: number) => set({ simSpeed: speed }),
  selectedAircraftId: 'GIA123',
  focusedFlightId: 'GIA123',
  setFocusedFlightId: (id: string | null) => set({ focusedFlightId: id, selectedAircraftId: id }),
  micActive: false,

  // 3D Tower & Operations state
  viewMode: 'tower',
  activeChannel: 'ground',
  tutorialActive: true,
  tutorialText: 'GIA123 baru saja mendarat di Gate 1. Klik [✓ SETUJUI IJIN] untuk memulai siklus layanan pesawat!',
  weather: {
    condition: 'Cerah',
    temp: 28,
    wind: '270° 05KT',
    rainIntensity: 0,
    visibility: 10000,
    time: '14:00',
  },
  emergencyServicesActive: false,

  approveClearance: (id: string) => {
    const ac = get().aircrafts.find((a) => a.id === id)
    if (!ac || !ac.pendingClearance) return

    radioSound.playRogerBeep()
    const clearance = ac.pendingClearance

    if (clearance === 'deboarding') {
      get().startDeboarding(id)
    } else if (clearance === 'cleaning') {
      get().startCabinService(id)
    } else if (clearance === 'refueling') {
      get().startRefueling(id)
    } else if (clearance === 'maintenance_check') {
      get().startTechnicalCheck(id)
    } else if (clearance === 'boarding') {
      get().startBoarding(id)
    } else if (clearance === 'pushback') {
      get().orderPushback(id)
    } else if (clearance === 'taxi_to_runway') {
      get().orderTaxi(id)
    } else if (clearance === 'takeoff') {
      get().orderTakeoff(id)
    } else if (clearance === 'landing') {
      get().orderClearedToLand(id)
    } else if (clearance === 'taxi_to_gate') {
      const occupied = new Set(
        get().aircrafts
          .filter((a) => a.id !== id && a.status !== 'takeoff' && a.status !== 'airborne')
          .map((a) => a.assignedGate || a.gate)
          .filter(Boolean)
      )
      const vacant = (['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6'] as const).find((g) => !occupied.has(g)) || 'Gate 1'
      get().assignDestination(id, vacant)
    } else if (clearance === 'overhaul') {
      get().startEngineOverhaul(id)
    } else if (clearance === 'avionics_check') {
      get().startAvionicsCheck(id)
    } else if (clearance === 'c_check') {
      get().startCCheck(id)
    }

    set((s) => ({
      aircrafts: s.aircrafts.map((a) =>
        a.id === id ? { ...a, pendingClearance: undefined, pendingClearanceTitle: undefined } : a
      ),
    }))
  },

  denyClearance: (id: string) => {
    const ac = get().aircrafts.find((a) => a.id === id)
    if (!ac) return
    radioSound.playRogerBeep()
    if (ac.status === 'approach' || ac.pendingClearance === 'landing') {
      get().orderHoldInAir(id)
    } else {
      atcInstruction(`${id}, negative clearance at this time, maintain current position.`)
      pilotReadback(`${id}, clearance denied by ATC, holding position, standing by.`)
      set((s) => ({
        commsLog: [
          ...s.commsLog,
          {
            id: `deny-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            sender: 'ATC' as const,
            callsign: id,
            message: `${id}, negative clearance at this time, maintain current position.`,
            type: 'command' as const,
          },
        ].slice(-50),
      }))
    }
  },

  commsLog: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'SYSTEM',
      message: 'ATC TOWER & GROUND OPERATIONS ONLINE. RUNWAY 09 ACTIVE.',
      type: 'info',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: 'GIA123',
      message: 'Jakarta Ground, Garuda 123 parked at Gate 1, engines shutdown, ready for deboarding.',
      type: 'ack',
    },
  ],

  setRadarDimensions: (center: { x: number; y: number }, radius: number) =>
    set({ radarCenter: center, radarRadius: radius }),

  setRadarCenter: (center: { x: number; y: number }) =>
    set({ radarCenter: center }),

  spawnAircraft: () =>
    set((state) => {
      lastInboundSpawnTime = Date.now()
      const center = state.radarCenter || DEFAULT_CENTER
      const radius = state.radarRadius || DEFAULT_RADIUS
      const existingIds = state.aircrafts.map((a) => a.id)
      const newAircraft = generateRandomAircraft(center, radius, existingIds)

      // Inbound flight on final approach
      newAircraft.status = 'approach'
      newAircraft.pos3d = { x: -1800, y: 165, z: -260 }
      newAircraft.altitude = 3000
      newAircraft.heading = 90
      newAircraft.destination = 'Inbound Runway 09'
      newAircraft.passengers = { current: 165, max: 180 }
      newAircraft.fuel = 40 + Math.floor(Math.random() * 30)
      newAircraft.isClearedToLand = false
      newAircraft.pendingClearance = 'landing'
      newAircraft.pendingClearanceTitle = 'Izin Mendarat Runway 09'

      const spawnMsg: CommLogItem = {
        id: `spawn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        sender: 'PILOT',
        callsign: newAircraft.id,
        message: `Jakarta Tower, ${newAircraft.airline} ${newAircraft.id.replace(/\D/g, '')} established localizer Runway 09, requesting landing clearance.`,
        type: 'info',
      }

      pilotReadback(`${newAircraft.id}, established localizer Runway 09, requesting landing clearance.`)

      return {
        aircrafts: [...state.aircrafts, newAircraft],
        commsLog: [...state.commsLog, spawnMsg].slice(-50),
      }
    }),

  addAircraft: (aircraft: Aircraft) =>
    set((state) => ({ aircrafts: [...state.aircrafts, aircraft] })),

  // ------------------------------------------------------------------
  // GROUND TURNAROUND & APRON MANAGEMENT OPERATIONS
  // ------------------------------------------------------------------
  assignDestination: (id: string, destination: 'Gate 1' | 'Gate 2' | 'Gate 3' | 'Gate 4' | 'Gate 5' | 'Gate 6' | 'Hangar 1' | 'Hangar 2') => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, taxi via Alpha to ${destination}.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Taxiing to ${destination} via Alpha, ${id}.`,
      type: 'ack',
    }
    atcInstruction(`${id}, taxi via Alpha to ${destination}.`)
    pilotReadback(`Taxiing to ${destination} via Alpha, ${id}, roger.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) => {
        if (ac.id !== id) return ac
        const isHangar = destination === 'Hangar 1' || destination === 'Hangar 2'
        const targetStatus = isHangar ? 'taxi_to_hangar' : 'taxi_to_gate'
        return {
          ...ac,
          assignedGate: destination,
          gate: destination,
          status: targetStatus,
          pendingClearance: undefined,
          pendingClearanceTitle: undefined,
          phaseProgress: 0,
        }
      }),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      tutorialText: `${id} sedang taksi menuju ${destination}. Setelah merapat, lakukan operasional!`,
    }))
  },

  startDeboarding: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, deboarding clearance approved, connect passenger jetway.`)
    pilotReadback(`${id}, jetway connected, commencing passenger deboarding.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'deboarding', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `cmd-deb-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'ATC' as const,
          callsign: id,
          message: `${id}, deboarding approved, connect jetway.`,
          type: 'command' as const,
        },
        {
          id: `deb-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Ground crew connected jetway at ${id}. Deboarding passengers and baggage in progress.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Penumpang dan bagasi ${id} sedang diturunkan. Tunggu hingga selesai, lalu klik [🧹 Bersihkan Kabin]!`,
    }))
  },

  startCabinService: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, cabin turnaround service approved.`)
    pilotReadback(`${id}, cleaning crew on board, cabin turnaround underway.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'cleaning', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `cmd-clean-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'ATC' as const,
          callsign: id,
          message: `${id}, cabin service approved.`,
          type: 'command' as const,
        },
        {
          id: `clean-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Cabin crew servicing ${id}. Vacuuming, sanitizing, and restocking catering.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Kabin ${id} sedang dibersihkan. Tunggu hingga selesai, lalu klik [⛽ Isi Avtur]!`,
    }))
  },

  startRefueling: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, refueling approved, fuel truck cleared to connect.`)
    pilotReadback(`${id}, fuel truck connected, fueling in progress.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'refueling', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `cmd-fuel-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'ATC' as const,
          callsign: id,
          message: `${id}, refueling approved.`,
          type: 'command' as const,
        },
        {
          id: `fuel-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Hydrant fuel truck fueling ${id}. Target quantity: 100% capacity.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Truk bahan bakar sedang mengisi avtur ${id}. Tunggu hingga 100%, lalu klik [🔧 Cek Teknis]!`,
    }))
  },

  startTechnicalCheck: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, maintenance walkaround inspection approved.`)
    pilotReadback(`${id}, ground engineers conducting pre-flight inspection and maintenance checks.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'maintenance_check', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `cmd-tech-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'ATC' as const,
          callsign: id,
          message: `${id}, maintenance inspection approved.`,
          type: 'command' as const,
        },
        {
          id: `tech-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Aircraft technicians conducting pre-flight walkaround on ${id}.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Pengecekan teknis ${id} sedang berlangsung. Setelah lolos, klik [🚶 Naikkan Penumpang]!`,
    }))
  },

  startBoarding: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, passenger boarding approved.`)
    pilotReadback(`${id}, boarding passengers, preparing for departure.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'boarding', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `cmd-board-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'ATC' as const,
          callsign: id,
          message: `${id}, passenger boarding approved.`,
          type: 'command' as const,
        },
        {
          id: `board-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Boarding call announced for ${id}. 180 passengers boarding.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Boarding ${id} sedang berlangsung. Setelah 180 pax naik, berikan izin [🚜 Dorongan Kembali (Pushback)]!`,
    }))
  },

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
    atcInstruction(`${id}, pushback approved, face west onto Taxiway Alpha.`)
    pilotReadback(`Pushback approved, facing west onto Alpha, ${id}.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'pushback', phaseProgress: 0 } : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'ground',
      tutorialText: `Bagus! ${id} sedang didorong mundur. Setelah selesai di taxiway, klik [🚖 Taksi ke Runway]!`,
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
    atcInstruction(`${id}, taxi to holding point Runway 09 via Taxiway Alpha.`)
    pilotReadback(`Taxi to holding point Runway 09 via Alpha, ${id}.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'taxi_to_runway',
              heading: 270,
              pos3d: ac.pos3d ? { ...ac.pos3d, z: -135 } : { x: -140, y: 0.1, z: -135 },
            }
          : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'ground',
      tutorialText: `${id} sedang taksi menuju Runway 09. Saat berhenti di garis kuning holding point, klik [🛫 Lepas Landas]!`,
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
    atcInstruction(`${id}, wind 270 at 05 knots, Runway 09 cleared for takeoff!`)
    pilotReadback(`Cleared for takeoff Runway 09, ${id}, rolling!`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'takeoff',
              heading: 90,
              phaseProgress: 0,
              pos3d: { x: -600, y: 0.1, z: -260 },
            }
          : ac
      ),
      airMiles: state.airMiles + 15,
      score: state.score + 350,
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
      tutorialText: `Luar biasa! ${id} telah lepas landas (+15 Mil Udara). Siklus operasional bandara berhasil sempurna!`,
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
    atcInstruction(`${id}, hold position immediately.`)
    pilotReadback(`Holding position, ${id}.`)

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
    atcInstruction(`${id}, wind 270 at 05 knots, Runway 09 cleared to land.`)
    pilotReadback(`Cleared to land Runway 09, ${id}, roger.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) => {
        if (ac.id !== id) return ac
        const wasInHolding = ac.status === 'holding_pattern'
        return {
          ...ac,
          status: 'approach',
          isClearedToLand: true,
          pendingClearance: undefined,
          pendingClearanceTitle: undefined,
          heading: 90,
          targetHeading: 90,
          pos3d: wasInHolding ? { x: -1500, y: 140, z: -260 } : ac.pos3d,
          altitude: wasInHolding ? 2600 : ac.altitude,
        }
      }),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
      tutorialText: `${id} telah menerima izin mendarat Runway 09. Pantau glideslope dan pendaratan!`,
    }))
  },

  orderHoldInAir: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, abort approach, climb and maintain FL035, enter holding pattern over airport.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Aborting approach, climbing to FL035 holding pattern, ${id}.`,
      type: 'ack',
    }
    atcInstruction(`${id}, abort approach, climb and maintain FL035, enter holding pattern.`)
    pilotReadback(`Aborting approach, climbing to FL035, entering holding pattern, ${id}.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'holding_pattern',
              holdingReason: 'atc_order',
              altitude: 3500,
              orbitAngle: 0,
              isClearedToLand: false,
              pendingClearance: 'landing',
              pendingClearanceTitle: 'Izin Mendarat Runway 09',
              pos3d: { x: -500, y: 95, z: -260 },
            }
          : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
      tutorialText: `${id} berputar di holding pattern. Berikan [Izin Mendarat] saat runway aman!`,
    }))
  },

  orderExitHolding: (id: string) => {
    radioSound.playRogerBeep()
    const msg: CommLogItem = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'ATC',
      callsign: id,
      message: `${id}, leave holding pattern, turn heading 090, intercept localizer, Runway 09 cleared to land.`,
      type: 'command',
    }
    const ack: CommLogItem = {
      id: `ack-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'PILOT',
      callsign: id,
      message: `Leaving holding, heading 090, cleared to land Runway 09, ${id}.`,
      type: 'ack',
    }
    atcInstruction(`${id}, leave holding pattern, turn heading 090, intercept localizer, Runway 09 cleared to land.`)
    pilotReadback(`Leaving holding, heading 090, intercepting Runway 09, cleared to land, ${id}.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'approach',
              isClearedToLand: true,
              pendingClearance: undefined,
              pendingClearanceTitle: undefined,
              heading: 90,
              targetHeading: 90,
              altitude: 2600,
              pos3d: { x: -1500, y: 140, z: -260 },
            }
          : ac
      ),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      activeChannel: 'tower',
      tutorialText: `${id} keluar holding dan intercept Runway 09. Izin mendarat telah disetujui!`,
    }))
  },

  startEngineOverhaul: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, engine overhaul approved in Hangar 1.`)
    pilotReadback(`${id}, hangar maintenance commencing turbofan engine overhaul.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'overhaul', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `overhaul-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Hangar engineering team started engine core teardown and turbine overhaul on ${id}.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Mesin ${id} sedang di-overhaul di hangar. Tunggu teknisi menyelesaikan pengetesan turbin!`,
    }))
  },

  startAvionicsCheck: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, avionics inspection approved in Hangar 2.`)
    pilotReadback(`${id}, calibrating avionics, transponder, and flight guidance systems.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'avionics_check', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `avionics-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Avionics calibration and TCAS radar diagnostics in progress on ${id}.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `Avionik ${id} sedang dikalibrasi di hangar. Tunggu diagnosa instrumen selesai!`,
    }))
  },

  startCCheck: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, heavy C-Check inspection approved in hangar.`)
    pilotReadback(`${id}, commencing heavy C-Check structural and hydraulic inspection.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'c_check', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `ccheck-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `Heavy maintenance C-Check inspection, landing gear hydraulic actuator test on ${id}.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `C-Check ${id} sedang berjalan. Struktur dan hidrolik pesawat sedang diuji tekanan!`,
    }))
  },

  releaseFromHangar: (id: string, targetGate?: 'Gate 1' | 'Gate 2' | 'Gate 3' | 'Gate 4' | 'Gate 5' | 'Gate 6') => {
    radioSound.playRogerBeep()
    const gate = targetGate || 'Gate 3'
    atcInstruction(`${id}, hangar release approved, taxi via Alpha to ${gate}.`)
    pilotReadback(`${id}, hangar service complete, aircraft airworthy, taxiing to ${gate}.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id
          ? {
              ...ac,
              status: 'taxi_to_gate',
              assignedGate: gate,
              gate: gate,
              technicalHealth: 100,
              fuel: 100,
              turnaround: {
                deboarded: true,
                cabinCleaned: true,
                refueled: true,
                techInspected: true,
                boarded: false,
              },
            }
          : ac
      ),
      commsLog: [
        ...state.commsLog,
        {
          id: `release-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'GROUND_CREW' as const,
          callsign: id,
          message: `${id} released from maintenance hangar with 100% airworthiness certificate. Taxiing to ${gate}.`,
          type: 'info' as const,
        },
      ].slice(-50),
      tutorialText: `${id} telah dirilis dari hangar dan taksi ke ${gate}. Siap untuk boarding penumpang!`,
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
    atcInstruction(`${id}, go around immediately, climb 2500ft.`)
    pilotReadback(`Going around, climbing to 2,500 feet, ${id}.`)

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

  // ------------------------------------------------------------------
  // IN-FLIGHT EMERGENCY & DISPATCH PROTOCOLS
  // ------------------------------------------------------------------
  triggerEmergency: (id?: string) => {
    radioSound.playConflictAlert()

    set((state) => {
      const target = id ? state.aircrafts.find((a) => a.id === id) : state.aircrafts.find((a) => a.status === 'approach') || state.aircrafts[0]
      if (!target) return state

      const emergencyMsg: CommLogItem = {
        id: `mayday-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        sender: 'PILOT',
        callsign: target.id,
        message: `MAYDAY MAYDAY MAYDAY! ${target.id}, engine fire on engine number one, cabin smoke! Requesting priority emergency landing on Runway 09!`,
        type: 'alert',
      }

      pilotReadback(`MAYDAY MAYDAY MAYDAY! ${target.id}, engine fire number one! Requesting immediate priority landing Runway 09!`)

      return {
        aircrafts: state.aircrafts.map((ac) =>
          ac.id === target.id
            ? {
                ...ac,
                status: 'emergency',
                emergencyReason: 'Kebakaran Mesin 1 & Asap Kabin',
                technicalHealth: 30,
              }
            : ac
        ),
        emergencyServicesActive: true,
        commsLog: [...state.commsLog, emergencyMsg].slice(-50),
        tutorialText: `🚨 PERINGATAN DARURAT: ${target.id} menyatakan MAYDAY! Armada pemadam kebakaran meluncur ke runway. Segera beri [Izin Mendarat] prioritas!`,
      }
    })
  },

  dispatchEmergencyServices: (id: string) => {
    radioSound.playRogerBeep()
    atcInstruction(`${id}, emergency ARFF fire rescue deployed and on standby along Runway 09.`)
    pilotReadback(`Airport ARFF fire tenders standing by along Runway 09 for ${id}.`)

    set((state) => ({
      emergencyServicesActive: true,
      commsLog: [
        ...state.commsLog,
        {
          id: `gse-fire-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM' as const,
          message: `AIRPORT RESCUE & FIRE FIGHTING (ARFF) deployed to Runway 09 standby for ${id}.`,
          type: 'alert' as const,
        },
      ].slice(-50),
    }))
  },

  setWeatherCondition: (condition: WeatherCondition) => {
    radioSound.playMicClick()
    const isStorm = condition === 'Hujan Badai'
    const isFog = condition === 'Kabut Tebal'

    const weatherMsg: CommLogItem = {
      id: `wx-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      sender: 'SYSTEM',
      message: `ATIS WEATHER UPDATE: ${condition.toUpperCase()}. Wind: ${isStorm ? '280/25KT GUST 35' : '270/05KT'}. Visibility: ${isFog ? '400m' : '10km'}.`,
      type: 'info',
    }

    set({
      weather: {
        condition,
        temp: isStorm ? 22 : isFog ? 20 : 28,
        wind: isStorm ? '280° 25KT GUST' : '270° 05KT',
        rainIntensity: isStorm ? 0.9 : 0,
        visibility: isFog ? 400 : 10000,
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 5),
      },
      commsLog: (state: GameState) => [...state.commsLog, weatherMsg].slice(-50),
    } as unknown as Partial<GameState>)
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

      const ALL_GATES = ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6'] as const
      const GATE_COORDS: Record<string, { x: number; z: number }> = {
        'Gate 1': { x: -330, z: -55 },
        'Gate 2': { x: -260, z: -55 },
        'Gate 3': { x: -190, z: -55 },
        'Gate 4': { x: -120, z: -55 },
        'Gate 5': { x: -50, z: -55 },
        'Gate 6': { x: 20, z: -55 },
        'Hangar 1': { x: 120, z: -25 },
        'Hangar 2': { x: 180, z: -25 },
      }

      // Check current gate saturation
      const occupiedGatesSet = new Set(
        state.aircrafts
          .filter(
            (a) =>
              a.status !== 'takeoff' &&
              a.status !== 'airborne' &&
              a.status !== 'holding_pattern' &&
              a.status !== 'approach'
          )
          .map((a) => a.assignedGate || a.gate)
          .filter(Boolean)
      )
      const isGateFull = ALL_GATES.every((g) => occupiedGatesSet.has(g))

      const updatedAircrafts: Aircraft[] = state.aircrafts
        .map((ac): Aircraft => {
          let pos = ac.pos3d || { x: 0, y: 0.1, z: 0 }
          let heading = ac.heading
          let status: AircraftStatus = ac.status
          let altitude = ac.altitude
          let progress = ac.phaseProgress || 0
          let serviceProg = ac.serviceProgress || 0
          let passengers = ac.passengers || { current: 180, max: 180 }
          let fuel = ac.fuel
          let pendingClearance = ac.pendingClearance
          let pendingClearanceTitle = ac.pendingClearanceTitle
          let isClearedToLand = ac.isClearedToLand

          // Turnaround Stage 1: DEBOARDING (Calm, realistic duration ~37 seconds)
          if (status === 'deboarding') {
            const stepRate = 0.045 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              passengers = {
                ...passengers,
                current: Math.max(0, Math.round(passengers.max * (1 - serviceProg / 100))),
              }
              return { ...ac, serviceProgress: serviceProg, passengers }
            } else {
              // FINISHED: Deboarding complete, STOP at 100% and request cleaning clearance
              status = 'at_gate'
              serviceProg = 100
              passengers = { ...passengers, current: 0 }
              const turnaround = {
                ...(ac.turnaround || {}),
                deboarded: true,
              }
              pendingClearance = 'cleaning'
              pendingClearanceTitle = 'Izin Pembersihan Kabin'
              radioSound.playRogerBeep()
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, deboarding completed, cabin clear, requesting cabin service clearance.`)
              }
              const logMsg: CommLogItem = {
                id: `deb-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Deboarding 100% completed. Cabin empty. Requesting clearance for cabin cleaning.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status,
                serviceProgress: 100,
                passengers,
                turnaround,
                pendingClearance,
                pendingClearanceTitle,
              }
            }
          }

          // Turnaround Stage 2: CLEANING (~37 seconds)
          if (status === 'cleaning') {
            const stepRate = 0.045 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              return { ...ac, serviceProgress: serviceProg }
            } else {
              // FINISHED: Cleaning complete, STOP at 100% and request refueling clearance
              status = 'at_gate'
              serviceProg = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                cabinCleaned: true,
              }
              pendingClearance = 'refueling'
              pendingClearanceTitle = 'Izin Pengisian Avtur'
              radioSound.playRogerBeep()
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, cabin cleaning completed, requesting refueling clearance.`)
              }
              const logMsg: CommLogItem = {
                id: `clean-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Cabin cleaning 100% completed. Catering restocked. Requesting clearance for refueling.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status,
                serviceProgress: 100,
                turnaround,
                pendingClearance,
                pendingClearanceTitle,
              }
            }
          }

          // Turnaround Stage 3: REFUELING (~42 seconds)
          if (status === 'refueling') {
            const stepRate = 0.040 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              fuel = Math.min(100, Math.round(30 + (70 * serviceProg) / 100))
              return { ...ac, serviceProgress: serviceProg, fuel }
            } else {
              // FINISHED: Refueling complete, STOP at 100% and request technical check clearance
              status = 'at_gate'
              serviceProg = 100
              fuel = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                refueled: true,
              }
              pendingClearance = 'maintenance_check'
              pendingClearanceTitle = 'Izin Pemeriksaan Teknis'
              radioSound.playRogerBeep()
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, refueling completed, tanks full, requesting maintenance walkaround check.`)
              }
              const logMsg: CommLogItem = {
                id: `fuel-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Refueling 100% completed. Fuel capacity full. Requesting clearance for pre-flight technical check.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status,
                serviceProgress: 100,
                fuel: 100,
                turnaround,
                pendingClearance,
                pendingClearanceTitle,
              }
            }
          }

          // Turnaround Stage 4: TECHNICAL CHECK (~42 seconds)
          if (status === 'maintenance_check') {
            const stepRate = 0.040 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              return { ...ac, serviceProgress: serviceProg, technicalHealth: 100 }
            } else {
              // FINISHED: Tech check complete, STOP at 100% and request boarding clearance
              status = 'at_gate'
              serviceProg = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                techInspected: true,
              }
              pendingClearance = 'boarding'
              pendingClearanceTitle = 'Izin Boarding Penumpang'
              radioSound.playRogerBeep()
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, technical check completed, aircraft airworthy, requesting passenger boarding.`)
              }
              const logMsg: CommLogItem = {
                id: `tech-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Technical walkaround completed 100%. Airworthiness certified. Requesting clearance for passenger boarding.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status,
                serviceProgress: 100,
                technicalHealth: 100,
                turnaround,
                pendingClearance,
                pendingClearanceTitle,
              }
            }
          }

          // Turnaround Stage 5: BOARDING (~37 seconds)
          if (status === 'boarding') {
            const stepRate = 0.045 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              passengers = {
                ...passengers,
                current: Math.min(passengers.max, Math.round((passengers.max * serviceProg) / 100)),
              }
              return { ...ac, serviceProgress: serviceProg, passengers }
            } else {
              // FINISHED: Boarding complete! Aircraft is ready for pushback, requesting ATC clearance
              status = 'ready_pushback'
              serviceProg = 100
              passengers = { ...passengers, current: passengers.max }
              const turnaround = {
                ...(ac.turnaround || {}),
                boarded: true,
              }
              pendingClearance = 'pushback'
              pendingClearanceTitle = 'Izin Dorongan Mundur (Pushback)'
              radioSound.playRogerBeep()
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, boarding completed, cabin doors closed, ready for pushback.`)
              }
              const logMsg: CommLogItem = {
                id: `board-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Boarding completed (180/180 pax). Cabin doors closed. Requesting pushback clearance.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status: 'ready_pushback',
                serviceProgress: 100,
                passengers,
                turnaround,
                pendingClearance,
                pendingClearanceTitle,
              }
            }
          }

          // Phase: HOLDING PATTERN (Circling at FL035 above Airport)
          if (status === 'holding_pattern') {
            let orbit = (ac.orbitAngle || 0) + 0.010 * (state.simSpeed || 1)
            if (orbit > Math.PI * 2) orbit -= Math.PI * 2
            const orbitX = -500 + Math.cos(orbit) * 190
            const orbitZ = -260 + Math.sin(orbit) * 90
            const orbitHeading =
              Math.round((Math.atan2(-Math.sin(orbit) * 90, Math.cos(orbit) * 190) * 180) / Math.PI + 360) % 360
            return {
              ...ac,
              orbitAngle: orbit,
              heading: orbitHeading,
              altitude: 3500,
              pos3d: { x: orbitX, y: 95, z: orbitZ },
            }
          }

          // Hangar Maintenance Stages: OVERHAUL, AVIONICS, C_CHECK (~42 seconds)
          if (status === 'overhaul' || status === 'avionics_check' || status === 'c_check') {
            const stepRate = 0.040 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              return { ...ac, serviceProgress: serviceProg }
            } else {
              const completedService = status
              status = 'in_hangar'
              const turnaround = {
                ...(ac.turnaround || {}),
                engineOverhauled: completedService === 'overhaul' ? true : ac.turnaround?.engineOverhauled,
                avionicsCalibrated: completedService === 'avionics_check' ? true : ac.turnaround?.avionicsCalibrated,
                cCheckPassed: completedService === 'c_check' ? true : ac.turnaround?.cCheckPassed,
              }
              radioSound.playRogerBeep()
              const stepName =
                completedService === 'overhaul'
                  ? 'Engine overhaul'
                  : completedService === 'avionics_check'
                  ? 'Avionics calibration'
                  : 'C-Check inspection'
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, ${stepName.toLowerCase()} completed, systems nominal and certified airworthy.`)
              }
              const logMsg: CommLogItem = {
                id: `hangar-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'GROUND_CREW' as const,
                callsign: ac.id,
                message: `${stepName} completed on ${ac.id}. Systems verified 100% operational.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return {
                ...ac,
                status: 'in_hangar',
                serviceProgress: 100,
                technicalHealth: 100,
                turnaround,
                pendingClearance: undefined,
                pendingClearanceTitle: undefined,
              }
            }
          }

          // Phase: TAXI TO GATE OR HANGAR
          if (status === 'taxi_to_gate' || status === 'taxi_to_hangar') {
            const isHangar = status === 'taxi_to_hangar' || (ac.assignedGate && ac.assignedGate.startsWith('Hangar'))
            const destName = ac.assignedGate || (isHangar ? 'Hangar 1' : 'Gate 1')
            const targetPos = GATE_COORDS[destName] || GATE_COORDS['Gate 1']

            // 1. Move along taxiway towards target X
            if (Math.abs(pos.x - targetPos.x) > 2) {
              const dir = targetPos.x > pos.x ? 1 : -1
              pos = {
                ...pos,
                x: pos.x + dir * 0.9,
                z: -135,
              }
              heading = dir > 0 ? 90 : 270
            } else if (pos.z < targetPos.z) {
              // 2. Turn into gate/hangar
              pos = {
                ...pos,
                z: pos.z + 0.6,
              }
              heading = 180
            } else {
              // Arrived at Gate or Hangar!
              status = isHangar ? 'in_hangar' : 'at_gate'
              pos = { x: targetPos.x, y: 0.1, z: targetPos.z }
              heading = isHangar ? 180 : 0
              if (!isHangar) {
                // Request Deboarding clearance when parked at gate!
                pendingClearance = 'deboarding'
                pendingClearanceTitle = 'Izin Penurunan Penumpang (Deboarding)'
                if (ac.id === state.focusedFlightId) {
                  pilotReadback(`${ac.id}, on blocks at ${destName}, engines shutdown, requesting deboarding clearance.`)
                }
                const arriveMsg: CommLogItem = {
                  id: `dock-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                  sender: 'PILOT' as const,
                  callsign: ac.id,
                  message: `${ac.id}: Docked at ${destName}, engines shutdown. Requesting deboarding clearance.`,
                  type: 'info' as const,
                }
                updatedComms = [...updatedComms, arriveMsg]
              }
            }

            return {
              ...ac,
              status,
              pos3d: pos,
              heading,
              gate: destName,
              pendingClearance,
              pendingClearanceTitle,
            }
          }

          // Phase: PUSHBACK
          if (status === 'pushback') {
            progress += 0.0035
            pos = {
              x: pos.x,
              y: 0.1,
              z: -55 - progress * 80,
            }
            heading = progress * 270

            if (progress >= 1) {
              status = 'holding'
              progress = 0
              pos.z = -135
              heading = 270
              pendingClearance = 'taxi_to_runway'
              pendingClearanceTitle = 'Izin Taksi ke Runway 09'
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, pushback completed on Taxiway Alpha, parking brake set, requesting taxi to Runway 09.`)
              }
              const pbMsg: CommLogItem = {
                id: `pb-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Pushback completed onto Taxiway Alpha. Requesting taxi clearance to Runway 09 holding point.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, pbMsg]
            }
            return {
              ...ac,
              status,
              heading,
              pos3d: pos,
              phaseProgress: progress,
              pendingClearance,
              pendingClearanceTitle,
            }
          }

          // Phase: TAXI TO RUNWAY
          if (status === 'taxi_to_runway') {
            const targetHoldX = -600
            if (pos.x > targetHoldX) {
              pos = {
                ...pos,
                x: pos.x - 0.85,
                z: -135,
              }
              heading = 270
            } else {
              status = 'holding'
              pos.x = targetHoldX
              pendingClearance = 'takeoff'
              pendingClearanceTitle = 'Izin Lepas Landas Runway 09'
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, holding short Runway 09, ready for departure.`)
              }
              const holdMsg: CommLogItem = {
                id: `hold-rwy-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Holding short Runway 09, ready for departure. Requesting takeoff clearance.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, holdMsg]
            }
            return {
              ...ac,
              status,
              heading,
              pos3d: pos,
              pendingClearance,
              pendingClearanceTitle,
            }
          }

          // Phase: TAKEOFF ROLL & CLIMB
          if (status === 'takeoff') {
            progress += 0.003
            const newX = pos.x + 2.8 + progress * 7.5
            let newY = 0.1
            let pitch = 0

            if (newX > -80) {
              const climbFactor = Math.min(1, (newX + 80) / 750)
              newY = 0.1 + climbFactor * 260
              pitch = -0.22
              altitude = Math.round(climbFactor * 3500)
            }

            pos = { x: newX, y: newY, z: -260 }

            if (newX > 850) {
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

          // Phase: AIRBORNE
          if (status === 'airborne') {
            pos = {
              x: pos.x + 5.0,
              y: pos.y + 0.9,
              z: -260,
            }
            altitude += 30
            return { ...ac, altitude, pos3d: pos }
          }

          // Phase: FINAL APPROACH OR EMERGENCY LANDING
          if (status === 'approach' || status === 'emergency') {
            const speed = status === 'emergency' ? 2.2 : 1.3
            const targetTouchdownX = -580
            const newX = pos.x + speed
            const distToTouchdown = Math.max(0, targetTouchdownX - newX)
            const newY = Math.max(0.2, distToTouchdown * 0.15)
            altitude = Math.round(newY * 20)

            pos = {
              x: newX,
              y: newY,
              z: -260,
            }

            // CRITICAL CHECK: Approach without ATC Landing Clearance -> PULL UP TO HOLDING!
            // Occurs only if reaching near runway threshold (newX >= -650) without ATC clearance!
            if (!isClearedToLand && status !== 'emergency' && newX >= -650) {
              radioSound.playConflictAlert()
              pilotReadback(`${ac.id}, no landing clearance received! Aborting approach, climbing to FL035 holding pattern.`)
              const goAroundMsg: CommLogItem = {
                id: `hold-pullup-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Approaching threshold with NO landing clearance! Aborting landing, entering holding pattern at FL035.`,
                type: 'alert' as const,
              }
              updatedComms = [...updatedComms, goAroundMsg]
              return {
                ...ac,
                status: 'holding_pattern',
                holdingReason: 'atc_order',
                altitude: 3500,
                orbitAngle: 0,
                isClearedToLand: false,
                pendingClearance: 'landing',
                pendingClearanceTitle: 'Izin Mendarat Runway 09',
                pos3d: { x: -500, y: 95, z: -260 },
              }
            }

            if (newX >= targetTouchdownX) {
              const wasEmergency = ac.status === 'emergency'
              status = 'landing'
              radioSound.playTouchdown()
              landedThisTick += 1
              awardedMiles += wasEmergency ? 50 : 10

              const touchdownMsg: CommLogItem = {
                id: `touchdown-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'SYSTEM' as const,
                message:
                  wasEmergency
                    ? `EMERGENCY LANDING SUCCESSFUL: ${ac.id} landed safely on Runway 09! ARFF fire tenders standing by (+50 Mil Udara).`
                    : `TOUCHDOWN: ${ac.id} landed safely on Runway 09 (+10 Mil Udara).`,
                type: wasEmergency ? ('alert' as const) : ('info' as const),
              }
              updatedComms = [...updatedComms, touchdownMsg]
            }

            return { ...ac, status, altitude, pos3d: pos, isClearedToLand }
          }

          // Phase: LANDING ROLLOUT
          if (status === 'landing') {
            pos = {
              ...pos,
              x: pos.x + 1.2,
              y: 0.2,
            }
            // Decelerated at exit Bravo (X = -80) -> VACATE RUNWAY & TAXI TO VACANT GATE!
            if (pos.x >= -80) {
              const occupied = new Set(
                state.aircrafts
                  .filter((a) => a.id !== ac.id && a.status !== 'takeoff' && a.status !== 'airborne')
                  .map((a) => a.assignedGate || a.gate)
                  .filter(Boolean)
              )
              const vacantGate =
                (['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6'] as const).find(
                  (g) => !occupied.has(g)
                ) || 'Gate 2'

              status = 'taxi_to_gate'
              pos = { x: -80, y: 0.1, z: -135 }
              heading = 0
              if (ac.id === state.focusedFlightId) {
                pilotReadback(`${ac.id}, Runway 09 vacated at Bravo, taxiing to ${vacantGate} via Alpha.`)
              }
              const vacateMsg: CommLogItem = {
                id: `vacate-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Runway 09 vacated at Taxiway Bravo. Taxiing to ${vacantGate} via Alpha.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, vacateMsg]
              return {
                ...ac,
                status: 'taxi_to_gate',
                assignedGate: vacantGate,
                gate: vacantGate,
                pos3d: pos,
                heading,
                isClearedToLand: false,
                pendingClearance: undefined,
                pendingClearanceTitle: undefined,
              }
            }
            return { ...ac, status, pos3d: pos, heading }
          }

          return ac
        })
        .filter((ac) => {
          if (ac.pos3d && ac.pos3d.x > 1400) return false
          return true
        })

      // Check if any holding plane can now request descent because a gate freed up
      if (!isGateFull) {
        const candidateGates = ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6'] as const
        const currentOccupied = new Set(
          updatedAircrafts
            .filter(
              (a) =>
                a.status !== 'takeoff' &&
                a.status !== 'airborne' &&
                a.status !== 'holding_pattern' &&
                a.status !== 'approach'
            )
            .map((a) => a.assignedGate || a.gate)
            .filter(Boolean)
        )
        const firstFreeGate = candidateGates.find((g) => !currentOccupied.has(g))

        if (firstFreeGate) {
          const waitingHoldingPlane = updatedAircrafts.find(
            (a) => a.status === 'holding_pattern' && a.holdingReason === 'gates_full' && !a.pendingClearance
          )
          if (waitingHoldingPlane) {
            waitingHoldingPlane.holdingReason = undefined
            waitingHoldingPlane.pendingClearance = 'landing'
            waitingHoldingPlane.pendingClearanceTitle = `Izin Mendarat (${firstFreeGate} Kosong)`
            pilotReadback(`${waitingHoldingPlane.id}, holding at FL035, copying ${firstFreeGate} vacant, requesting clearance to leave holding and land Runway 09.`)
            const exitReqMsg: CommLogItem = {
              id: `exit-req-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
              sender: 'PILOT',
              callsign: waitingHoldingPlane.id,
              message: `${waitingHoldingPlane.id}: Holding FL035. ${firstFreeGate} is now vacant. Requesting descent and landing clearance Runway 09.`,
              type: 'info',
            }
            updatedComms = [...updatedComms, exitReqMsg]
          }
        }
      }

      // Continuous Realistic Inbound Traffic Generator (Every ~2.5 - 3 minutes, calm & non-overwhelming)
      const inboundPlanes = updatedAircrafts.filter(
        (a) => a.status === 'approach' || a.status === 'holding_pattern'
      )
      const now = Date.now()
      const INBOUND_INTERVAL_MS = 160000 // 160 seconds (2m 40s) interval between auto arrivals
      if (
        now - lastInboundSpawnTime >= INBOUND_INTERVAL_MS &&
        updatedAircrafts.length < 4 &&
        inboundPlanes.length === 0 &&
        !isGateFull
      ) {
        lastInboundSpawnTime = now
        const center = state.radarCenter || DEFAULT_CENTER
        const radius = state.radarRadius || DEFAULT_RADIUS
        const existingIds = updatedAircrafts.map((a) => a.id)
        const incoming = generateRandomAircraft(center, radius, existingIds)
        incoming.passengers = { current: 155, max: 180 }
        incoming.fuel = 45 + Math.floor(Math.random() * 25)

        // APPROACH - REQUIRES ATC CLEARANCE TO LAND!
        incoming.status = 'approach'
        incoming.pos3d = { x: -1800, y: 165, z: -260 }
        incoming.altitude = 3000
        incoming.heading = 90
        incoming.destination = 'Inbound Runway 09'
        incoming.isClearedToLand = false
        incoming.pendingClearance = 'landing'
        incoming.pendingClearanceTitle = 'Izin Mendarat Runway 09'
        pilotReadback(`${incoming.id}, inbound passing 3,000 feet, established localizer, requesting landing clearance Runway 09.`)
        const checkInMsg: CommLogItem = {
          id: `inbound-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'PILOT',
          callsign: incoming.id,
          message: `Jakarta Tower, ${incoming.airline} ${incoming.id.replace(/\D/g, '')} inbound, passing 3,000ft, requesting landing clearance.`,
          type: 'info',
        }
        updatedComms = [...updatedComms, checkInMsg]

        updatedAircrafts.push(incoming)
      }

      // Natural Random Weather Transitions (Every ~45-60s = ~2700-3600 frames at 60fps)
      let nextWeather = state.weather
      if (frameCounter % 3000 === 0 && Math.random() < 0.75) {
        const rand = Math.random()
        let newCond: WeatherCondition = 'Cerah'
        let temp = 28
        let wind = '270° 06KT'
        let rainIntensity = 0
        let visibility = 10000

        if (rand < 0.25) {
          newCond = 'Hujan Badai'
          temp = 23
          wind = '280° 24KT GUST 32KT'
          rainIntensity = 0.85
          visibility = 1800
        } else if (rand < 0.45) {
          newCond = 'Kabut Tebal'
          temp = 21
          wind = '350° 03KT'
          rainIntensity = 0
          visibility = 500
        } else {
          newCond = 'Cerah'
          temp = 29
          wind = '260° 08KT'
          rainIntensity = 0
          visibility = 10000
        }

        if (newCond !== state.weather.condition) {
          radioSound.playMicClick()
          nextWeather = {
            condition: newCond,
            temp,
            wind,
            rainIntensity,
            visibility,
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 5),
          }
          const wxMsg: CommLogItem = {
            id: `atis-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            sender: 'SYSTEM',
            message: `ATIS INFO BROADCAST: Weather updated to ${newCond.toUpperCase()}. Wind ${wind}, Vis ${visibility}m, Temp ${temp}°C.`,
            type: 'info',
          }
          updatedComms = [...updatedComms, wxMsg]
        }
      }

      const stillValid = updatedAircrafts.some((a) => a.id === state.focusedFlightId)
      const nextFocusedId = stillValid ? state.focusedFlightId : updatedAircrafts[0]?.id || null
      const nextSelectedId = stillValid ? state.selectedAircraftId : updatedAircrafts[0]?.id || null

      return {
        aircrafts: updatedAircrafts,
        focusedFlightId: nextFocusedId,
        selectedAircraftId: nextSelectedId,
        weather: nextWeather,
        survivalTime: state.survivalTime + 1 / 60,
        airMiles: state.airMiles + awardedMiles,
        landedCount: state.landedCount + landedThisTick,
        score: state.score + landedThisTick * 300,
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
      airMiles: 25,
      survivalTime: 0,
      gameOver: false,
      gameOverReason: undefined,
      collisionPoint: null,
      isPaused: false,
      selectedAircraftId: 'GIA123',
      focusedFlightId: 'GIA123',
      viewMode: 'tower',
      activeChannel: 'ground',
      tutorialActive: true,
      tutorialText: 'GIA123 baru saja mendarat di Gate 1. Klik [✓ SETUJUI IJIN] untuk memulai penurunan penumpang!',
      commsLog: [
        {
          id: 'reset-1',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          sender: 'SYSTEM',
          message: 'SIMULATION RESET. AIRPORT & TOWER REINITIALIZED.',
          type: 'info',
        },
      ],
    }))
  },
}))
