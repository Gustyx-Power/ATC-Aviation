import { create } from 'zustand'
import type { Aircraft, AircraftStatus, CommLogItem, GameState, RadioChannel, ViewMode, Waypoint, WeatherCondition } from '../types/atc'
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
    pos3d: { x: -230, y: 0.1, z: -55 },
    rot3d: { pitch: 0, yaw: 0, roll: 0 },
    phaseProgress: 0,
    serviceProgress: 0,
    passengers: { current: 175, max: 180 },
    technicalHealth: 98,
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
    heading: 270,
    targetHeading: 270,
    altitude: 0,
    targetAltitude: 0,
    fuel: 85,
    waypoints: [],
    status: 'holding',
    gate: 'Gate 2',
    destination: 'SUB / Surabaya',
    pos3d: { x: -600, y: 0.1, z: -205 },
    rot3d: { pitch: 0, yaw: Math.PI / 2, roll: 0 },
    phaseProgress: 0,
    serviceProgress: 100,
    passengers: { current: 180, max: 180 },
    technicalHealth: 100,
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
    fuel: 35,
    waypoints: [],
    status: 'approach',
    destination: 'Inbound Runway 09',
    pos3d: { x: -850, y: 80, z: -260 },
    rot3d: { pitch: 0.05, yaw: -Math.PI / 2, roll: 0 },
    phaseProgress: 0,
    serviceProgress: 0,
    passengers: { current: 160, max: 160 },
    technicalHealth: 95,
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
]

let frameCounter = 0

// Pilot & Crew Voice readback helper using Web Audio API + Speech Synthesis
function pilotReadback(text: string) {
  radioSound.speakPilotVoice(text)
}

export const useGameStore = create<GameState>((set) => ({
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
  micActive: false,

  // 3D Tower & Operations state
  viewMode: 'tower',
  activeChannel: 'ground',
  tutorialActive: true,
  tutorialText: 'GIA123 baru saja mendarat di Gate 1. Klik [👥 Turunkan Penumpang] untuk memulai siklus layanan pesawat!',
  weather: {
    condition: 'Cerah',
    temp: 28,
    wind: '270° 05KT',
    rainIntensity: 0,
    visibility: 10000,
    time: '14:00',
  },
  emergencyServicesActive: false,

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
      const center = state.radarCenter || DEFAULT_CENTER
      const radius = state.radarRadius || DEFAULT_RADIUS
      const existingIds = state.aircrafts.map((a) => a.id)
      const newAircraft = generateRandomAircraft(center, radius, existingIds)

      // Inbound flight on final approach
      newAircraft.status = 'approach'
      newAircraft.pos3d = { x: -950, y: 110, z: -260 }
      newAircraft.altitude = 1600
      newAircraft.heading = 90
      newAircraft.destination = 'Inbound Runway 09'
      newAircraft.passengers = { current: 165, max: 180 }
      newAircraft.fuel = 40 + Math.floor(Math.random() * 30)

      const spawnMsg: CommLogItem = {
        id: `spawn-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        sender: 'PILOT',
        callsign: newAircraft.id,
        message: `Jakarta Tower, ${newAircraft.airline} ${newAircraft.id.replace(/\D/g, '')} established localizer Runway 09, requesting landing clearance.`,
        type: 'info',
      }

      pilotReadback(`${newAircraft.id}, established localizer Runway nol sembilan, minta izin mendarat`)

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
  assignDestination: (id: string, destination: 'Gate 1' | 'Gate 2' | 'Gate 3' | 'Hangar') => {
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
    pilotReadback(`Taksi menuju ${destination} via Alpha, ${id}`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) => {
        if (ac.id !== id) return ac
        const targetStatus = destination === 'Hangar' ? 'taxi_to_hangar' : 'taxi_to_gate'
        return {
          ...ac,
          assignedGate: destination,
          status: targetStatus,
          phaseProgress: 0,
        }
      }),
      commsLog: [...state.commsLog, msg, ack].slice(-50),
      tutorialText: `${id} sedang taksi menuju ${destination}. Setelah merapat, lakukan layanan darat!`,
    }))
  },

  startDeboarding: (id: string) => {
    radioSound.playRogerBeep()
    pilotReadback(`${id}, jembatan garbarata terhubung. Memulai penurunan penumpang dan bagasi.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'deboarding', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
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
    pilotReadback(`${id}, kru kebersihan masuk ke kabin. Pengecekan dan perapihan interior kabin dimulai.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'cleaning', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
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
    pilotReadback(`${id}, truk tangki avtur terhubung ke sayap. Memulai pengisian bahan bakar hingga seratus persen.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'refueling', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
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
    pilotReadback(`${id}, tim teknisi melakukan walkaround inspection, pengecekan roda, mesin, dan flight controls.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'maintenance_check', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
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
    pilotReadback(`${id}, boarding penumpang penerbangan berikutnya dimulai. Pintu kabin siap ditutup.`)

    set((state) => ({
      aircrafts: state.aircrafts.map((ac) =>
        ac.id === id ? { ...ac, status: 'boarding', serviceProgress: 0 } : ac
      ),
      commsLog: [
        ...state.commsLog,
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
    pilotReadback(`Pushback disetujui, hadap barat, ${id}`)

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
    pilotReadback(`Taksi ke titik tunggu Runway nol sembilan via Alpha, ${id}`)

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
    pilotReadback(`Cleared for takeoff Runway nol sembilan, ${id}, rolling!`)

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
    pilotReadback(`Cleared to land Runway nol sembilan, ${id}`)

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
    pilotReadback(`Going around, climb dua ribu lima ratus kaki, ${id}`)

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

      pilotReadback(`MAYDAY MAYDAY MAYDAY! ${target.id} mengalami kebakaran mesin nomor satu! Meminta pendaratan darurat prioritas tertinggi di Runway nol sembilan!`)

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
    pilotReadback(`Armada pemadam kebakaran bandara dan ambulans disiagakan di tepi Runway nol sembilan untuk ${id}.`)

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

      const GATE_COORDS: Record<string, { x: number; z: number }> = {
        'Gate 1': { x: -230, z: -55 },
        'Gate 2': { x: -150, z: -55 },
        'Gate 3': { x: -70, z: -55 },
        'Hangar': { x: 120, z: -25 },
      }

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

          // Turnaround Stage: DEBOARDING
          if (status === 'deboarding') {
            const stepRate = 0.08 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              passengers = {
                ...passengers,
                current: Math.max(0, Math.round(passengers.max * (1 - serviceProg / 100))),
              }
              return { ...ac, serviceProgress: serviceProg, passengers }
            } else {
              // FINISHED: Deboarding complete, STOP and wait for ATC/Ground command
              status = 'at_gate'
              serviceProg = 100
              passengers = { ...passengers, current: 0 }
              const turnaround = {
                ...(ac.turnaround || {}),
                deboarded: true,
              }
              radioSound.playRogerBeep()
              pilotReadback(`${ac.id}, penurunan seluruh penumpang dan bagasi selesai. Kabin kosong. Menunggu izin pembersihan kabin.`)
              const logMsg: CommLogItem = {
                id: `deb-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'GROUND_CREW' as const,
                callsign: ac.id,
                message: `Deboarding completed for ${ac.id}. 0 pax on board. Ready for cabin cleaning.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return { ...ac, status, serviceProgress: 100, passengers, turnaround }
            }
          }

          // Turnaround Stage: CLEANING
          if (status === 'cleaning') {
            const stepRate = 0.09 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              return { ...ac, serviceProgress: serviceProg }
            } else {
              // FINISHED: Cleaning complete, STOP and wait for ATC/Ground command
              status = 'at_gate'
              serviceProg = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                cabinCleaned: true,
              }
              radioSound.playRogerBeep()
              pilotReadback(`${ac.id}, kru kabin selesai membersihkan dan merapikan interior. Katering terisi. Menunggu izin pengisian avtur.`)
              const logMsg: CommLogItem = {
                id: `clean-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'GROUND_CREW' as const,
                callsign: ac.id,
                message: `Cabin service completed for ${ac.id}. Cabin sanitized & catering restocked. Ready for refueling.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return { ...ac, status, serviceProgress: 100, turnaround }
            }
          }

          // Turnaround Stage: REFUELING
          if (status === 'refueling') {
            const stepRate = 0.07 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              fuel = Math.min(100, Math.round(30 + (70 * serviceProg) / 100))
              return { ...ac, serviceProgress: serviceProg, fuel }
            } else {
              // FINISHED: Refueling complete, STOP and wait for ATC/Ground command
              status = 'at_gate'
              serviceProg = 100
              fuel = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                refueled: true,
              }
              radioSound.playRogerBeep()
              pilotReadback(`${ac.id}, pengisian avtur selesai seratus persen. Selang truk tangki telah dilepas. Menunggu izin pemeriksaan teknis.`)
              const logMsg: CommLogItem = {
                id: `fuel-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'GROUND_CREW' as const,
                callsign: ac.id,
                message: `Refueling completed for ${ac.id}. Fuel at 100% capacity. Hose disconnected. Ready for technical check.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return { ...ac, status, serviceProgress: 100, fuel: 100, turnaround }
            }
          }

          // Turnaround Stage: TECHNICAL CHECK
          if (status === 'maintenance_check') {
            const stepRate = 0.08 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              return { ...ac, serviceProgress: serviceProg, technicalHealth: 100 }
            } else {
              // FINISHED: Tech check complete, STOP and wait for ATC/Ground command
              status = 'at_gate'
              serviceProg = 100
              const turnaround = {
                ...(ac.turnaround || {}),
                techInspected: true,
              }
              radioSound.playRogerBeep()
              pilotReadback(`${ac.id}, walkaround inspection teknisi selesai. Roda, hidrolik, dan mesin laik terbang. Menunggu izin boarding penumpang.`)
              const logMsg: CommLogItem = {
                id: `tech-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'GROUND_CREW' as const,
                callsign: ac.id,
                message: `Pre-flight walkaround completed on ${ac.id}. Technical health 100% (Airworthy). Ready for boarding.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return { ...ac, status, serviceProgress: 100, technicalHealth: 100, turnaround }
            }
          }

          // Turnaround Stage: BOARDING
          if (status === 'boarding') {
            const stepRate = 0.08 * (state.simSpeed || 1)
            if (serviceProg < 100) {
              serviceProg = Math.min(100, serviceProg + stepRate)
              passengers = {
                ...passengers,
                current: Math.min(passengers.max, Math.round((passengers.max * serviceProg) / 100)),
              }
              return { ...ac, serviceProgress: serviceProg, passengers }
            } else {
              // FINISHED: Boarding complete! Aircraft is ready for pushback, WAITING FOR ATC CLEARANCE
              status = 'ready_pushback'
              serviceProg = 100
              passengers = { ...passengers, current: passengers.max }
              const turnaround = {
                ...(ac.turnaround || {}),
                boarded: true,
              }
              radioSound.playRogerBeep()
              pilotReadback(`${ac.id}, boarding selesai. Seratus delapan puluh penumpang di dalam kabin, pintu ditutup. Meminta izin dorongan kembali (Pushback).`)
              const logMsg: CommLogItem = {
                id: `board-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                sender: 'PILOT' as const,
                callsign: ac.id,
                message: `${ac.id}: Boarding completed (180/180 pax). Cabin secured. Requesting pushback clearance.`,
                type: 'info' as const,
              }
              updatedComms = [...updatedComms, logMsg]
              return { ...ac, status: 'ready_pushback', serviceProgress: 100, passengers, turnaround }
            }
          }

          // Phase: TAXI TO GATE OR HANGAR
          if (status === 'taxi_to_gate' || status === 'taxi_to_hangar') {
            const destName = ac.assignedGate || (status === 'taxi_to_hangar' ? 'Hangar' : 'Gate 1')
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
              status = destName === 'Hangar' ? 'in_hangar' : 'at_gate'
              pos = { x: targetPos.x, y: 0.1, z: targetPos.z }
              heading = destName === 'Hangar' ? 180 : 0
            }

            return { ...ac, status, pos3d: pos, heading }
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
            }
            return { ...ac, status, heading, pos3d: pos, phaseProgress: progress }
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
            }
            return { ...ac, status, heading, pos3d: pos }
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
            const speed = status === 'emergency' ? 3.0 : 2.5
            const targetTouchdownX = -580
            const newX = pos.x + speed
            const distToTouchdown = Math.max(0, targetTouchdownX - newX)
            const newY = Math.max(0.2, distToTouchdown * 0.26)
            altitude = Math.round(newY * 25)

            pos = {
              x: newX,
              y: newY,
              z: -260,
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

            return { ...ac, status, altitude, pos3d: pos }
          }

          // Phase: LANDING ROLLOUT
          if (status === 'landing') {
            pos = {
              ...pos,
              x: pos.x + 1.2,
              y: 0.2,
            }
            // Decelerated at exit Bravo (X = -80)
            if (pos.x >= -80) {
              status = 'taxi_to_gate'
              ac.assignedGate = 'Gate 1'
              pos = { x: -80, y: 0.1, z: -195 }
              heading = 0
            }
            return { ...ac, status, pos3d: pos, heading }
          }

          return ac
        })
        .filter((ac) => {
          if (ac.pos3d && ac.pos3d.x > 2200) return false
          return true
        })

      return {
        aircrafts: updatedAircrafts,
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
      viewMode: 'tower',
      activeChannel: 'ground',
      tutorialActive: true,
      tutorialText: 'GIA123 baru saja mendarat di Gate 1. Klik [👥 Turunkan Penumpang] untuk memulai siklus layanan pesawat!',
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
