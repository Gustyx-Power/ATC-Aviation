import React, { useState, useEffect } from 'react'
import {
  Plane,
  Compass,
  Camera,
  Search,
  Eye,
  Play,
  Pause,
  Sun,
  CloudRain,
  CloudFog,
  Volume2,
  Mic,
  Wrench,
  RotateCcw,
  Clock,
  Radio,
  Check,
  X,
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { radioSound } from '../utils/audioEffects'

export const TowerHUD: React.FC = () => {
  const aircrafts = useGameStore((state) => state.aircrafts)
  const selectedAircraftId = useGameStore((state) => state.selectedAircraftId)
  const selectAircraft = useGameStore((state) => state.selectAircraft)
  const focusedFlightId = useGameStore((state) => state.focusedFlightId)
  const setFocusedFlightId = useGameStore((state) => state.setFocusedFlightId)
  const approveClearance = useGameStore((state) => state.approveClearance)
  const denyClearance = useGameStore((state) => state.denyClearance)
  const airMiles = useGameStore((state) => state.airMiles)
  const airportLevel = useGameStore((state) => state.airportLevel)
  const score = useGameStore((state) => state.score)
  const landedCount = useGameStore((state) => state.landedCount)
  const viewMode = useGameStore((state) => state.viewMode)
  const setViewMode = useGameStore((state) => state.setViewMode)
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)
  const spawnAircraft = useGameStore((state) => state.spawnAircraft)
  const weather = useGameStore((state) => state.weather)
  const commsLog = useGameStore((state) => state.commsLog)

  const orderClearedToLand = useGameStore((state) => state.orderClearedToLand)
  const orderExitHolding = useGameStore((state) => state.orderExitHolding)

  // Voice Command hook
  const { transcript, micActive, toggleListening } = useVoiceCommand()

  // Live real-time clock ticking every second
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour12: false })
  )
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('id-ID', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Collapsible accordion for flight strips bays
  const [openBays, setOpenBays] = useState<Record<string, boolean>>({
    airspace: true,
    apron: true,
    hangar: false,
  })
  const toggleBay = (bay: string) => {
    setOpenBays((prev) => ({ ...prev, [bay]: !prev[bay] }))
  }

  const ALL_GATES = ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6'] as const
  const ALL_HANGARS = ['Hangar 1', 'Hangar 2'] as const

  // Filter groups
  const approachPlanes = aircrafts.filter(
    (a) =>
      a.status === 'approach' ||
      a.status === 'holding_pattern' ||
      a.status === 'emergency'
  )
  const hangarPlanes = aircrafts.filter(
    (a) =>
      a.status === 'in_hangar' ||
      a.status === 'overhaul' ||
      a.status === 'avionics_check' ||
      a.status === 'c_check'
  )

  // Calculate gate saturation
  const occupiedGatesCount = ALL_GATES.filter((g) =>
    aircrafts.some(
      (a) =>
        (a.gate === g ||
          (a.assignedGate === g &&
            (a.status === 'taxi_to_gate' || a.status === 'landing'))) &&
        a.status !== 'takeoff' &&
        a.status !== 'airborne' &&
        a.status !== 'approach' &&
        a.status !== 'holding_pattern'
    )
  ).length
  const allGatesOccupied = occupiedGatesCount >= 6

  // Selected aircraft and active focused aircraft
  const selectedAircraft = aircrafts.find((a) => a.id === selectedAircraftId)
  const focusedAircraft =
    aircrafts.find((a) => a.id === focusedFlightId) || selectedAircraft || aircrafts[0]

  // Find any flight that currently has a pending clearance request (prioritize focused aircraft)
  const activePendingAircraft =
    (focusedAircraft?.pendingClearance ? focusedAircraft : null) ||
    aircrafts.find((a) => a.pendingClearance)

  // 2-Way Live Radio Dialogue: extract latest ATC and Pilot transmissions
  const reversedComms = [...commsLog].reverse()
  const latestAtcMsg = reversedComms.find((m) => m.sender === 'ATC')
  const latestPilotMsg =
    reversedComms.find((m) => m.sender === 'PILOT' || m.sender === 'GROUND_CREW') ||
    commsLog[commsLog.length - 1]
  const lastMsg = commsLog[commsLog.length - 1]
  const isAtcSpeaking = lastMsg?.sender === 'ATC'
  const isPilotSpeaking =
    lastMsg?.sender === 'PILOT' || lastMsg?.sender === 'GROUND_CREW' || Boolean(activePendingAircraft)

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-sans text-zinc-100">
      {/* ============================================================== */}
      {/* 1. TOP ATC CONSOLE HEADER BAR (METAR, REAL-TIME CLOCK, ATIS)  */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between w-full pointer-events-auto bg-zinc-950/95 border border-zinc-800 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-md">
        {/* Left: Station Identity & Live Real-Time Clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-xs tracking-wider text-zinc-100">
              WIII | SOEKARNO-HATTA TWR
            </span>
            <span className="text-[10px] font-mono text-zinc-500 hidden md:inline">
              (118.200 MHz)
            </span>
          </div>

          {/* Real-time Clock (Second by second in WIB) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{clock} WIB</span>
          </div>

          {/* Active Runway */}
          <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500 font-semibold">RWY:</span>
            <span className="font-bold text-zinc-200">09 (ILS CAT II)</span>
          </div>
        </div>

        {/* Center: Natural ATIS Weather METAR (Randomly Updated by ATIS Engine) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
          {weather.condition === 'Hujan Badai' ? (
            <CloudRain className="w-4 h-4 text-sky-400" />
          ) : weather.condition === 'Kabut Tebal' ? (
            <CloudFog className="w-4 h-4 text-zinc-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-zinc-300 font-semibold">
            ATIS: <strong className="text-zinc-100">{weather.condition.toUpperCase()}</strong>
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">T: {weather.temp}°C</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">WIND: {weather.wind}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">VIS: {weather.visibility}m</span>
        </div>

        {/* Right: Gate Capacity & Airspace Telemetry */}
        <div className="flex items-center gap-2">
          {/* Gate Occupancy Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-bold transition-all ${
              allGatesOccupied
                ? 'bg-amber-950/80 border-amber-600/80 text-amber-300 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
            title={
              allGatesOccupied
                ? 'Semua 6 gate penuh! Pesawat inbound otomatis berputar di holding pattern FL035.'
                : `${occupiedGatesCount} dari 6 gate terisi.`
            }
          >
            <Compass className={`w-3.5 h-3.5 ${allGatesOccupied ? 'text-amber-400' : 'text-sky-400'}`} />
            <span>
              GATE: <strong className={allGatesOccupied ? 'text-amber-300' : 'text-emerald-400'}>{occupiedGatesCount}/6</strong>
            </span>
            {allGatesOccupied && (
              <span className="px-1 py-0.2 bg-amber-500 text-zinc-950 rounded text-[9px] font-black">
                PENUH (HOLDING)
              </span>
            )}
          </div>

          {/* Air Miles, Level & Score */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">
              NM: <strong className="text-sky-400">{airMiles}</strong>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              LVL: <strong className="text-amber-400">{airportLevel}</strong>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              SKOR: <strong className="text-emerald-400">{score}</strong>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              LAND: <strong className="text-emerald-400">{landedCount}</strong>
            </span>
          </div>

          {/* Manual Spawn Button */}
          <button
            onClick={spawnAircraft}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
            title="Panggil Pesawat Inbound Tambahan"
          >
            <Plane className="w-3.5 h-3.5 rotate-45 text-sky-400" />
            <span>+ INBOUND</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. RIGHT-SIDE ELECTRONIC FLIGHT STRIP (EFS) BAYS               */}
      {/* ============================================================== */}
      <aside className="absolute top-16 right-3 w-80 max-h-[75vh] flex flex-col gap-2 pointer-events-auto overflow-y-auto text-xs font-mono scrollbar-thin">
        {/* BAY 1: RUANG UDARA (AIRSPACE - HOLDING & APPROACH) */}
        <section className="bg-zinc-950/95 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <div
            onClick={() => toggleBay('airspace')}
            className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 cursor-pointer border-b border-zinc-800"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-200">
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>RUANG UDARA (APPROACH / HOLDING)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-sky-400 text-[10px] font-bold">
              {approachPlanes.length}
            </span>
          </div>

          {openBays.airspace && (
            <div className="p-2 flex flex-col gap-1.5">
              {approachPlanes.length === 0 ? (
                <div className="text-[11px] text-zinc-600 text-center py-2 italic font-mono">
                  Tidak ada pesawat di ruang udara
                </div>
              ) : (
                approachPlanes.map((ac) => {
                  const isSelected = ac.id === selectedAircraftId
                  const isHolding = ac.status === 'holding_pattern'
                  const isMayday = ac.status === 'emergency'

                  return (
                    <div
                      key={ac.id}
                      onClick={() => {
                        selectAircraft(ac.id)
                        setFocusedFlightId(ac.id)
                      }}
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        isMayday
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : isHolding
                          ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                          : isSelected
                          ? 'bg-sky-950/60 border-sky-500 text-sky-100 shadow-md'
                          : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-100">{ac.id}</span>
                          <span className="text-[10px] text-zinc-400">({ac.aircraftType})</span>
                          {isHolding && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/30 border border-amber-500 text-amber-300 text-[9px] font-bold flex items-center gap-0.5 animate-pulse">
                              <RotateCcw className="w-2.5 h-2.5" /> HOLDING FL035
                            </span>
                          )}
                          {isMayday && (
                            <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">
                              MAYDAY
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400">ALT {ac.altitude} FT</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                        <span>{ac.airline}</span>
                        <span>{ac.destination}</span>
                      </div>

                      {/* Clearance Action Button */}
                      {isHolding ? (
                        <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                          <span className="text-[9px] text-amber-300 font-semibold">
                            {ac.holdingReason === 'gates_full'
                              ? 'Menunggu Gate Kosong'
                              : 'Menunggu Izin ATC'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              orderExitHolding(ac.id)
                            }}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Keluar & Mendarat
                          </button>
                        </div>
                      ) : ac.status === 'approach' && !ac.isClearedToLand ? (
                        <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                          <span className="text-[9px] text-amber-400 font-semibold animate-pulse">
                            ⚠️ Belum Ada Izin Mendarat
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              orderClearedToLand(ac.id)
                            }}
                            className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Izin Mendarat
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        {/* BAY 2: APRON GATES (GATE 1 SAMPAI GATE 6 RACK) */}
        <section className="bg-zinc-950/95 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <div
            onClick={() => toggleBay('apron')}
            className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 cursor-pointer border-b border-zinc-800"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-200">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>APRON GATES ({occupiedGatesCount}/6)</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                allGatesOccupied
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-emerald-400'
              }`}
            >
              {allGatesOccupied ? 'PENUH' : `${occupiedGatesCount}/6`}
            </span>
          </div>

          {openBays.apron && (
            <div className="p-2 flex flex-col gap-1.5">
              {ALL_GATES.map((gateName) => {
                const plane = aircrafts.find(
                  (a) =>
                    (a.gate === gateName ||
                      (a.assignedGate === gateName &&
                        (a.status === 'taxi_to_gate' || a.status === 'landing'))) &&
                    a.status !== 'takeoff' &&
                    a.status !== 'approach' &&
                    a.status !== 'holding_pattern'
                )

                if (!plane) {
                  return (
                    <div
                      key={gateName}
                      className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-850 text-zinc-500 text-[10px]"
                    >
                      <span className="font-bold text-zinc-400">{gateName}</span>
                      <span className="text-emerald-500/80 font-mono">🟢 KOSONG (STANDBY)</span>
                    </div>
                  )
                }

                const isFocused = plane.id === focusedAircraft?.id
                const hasPending = !!plane.pendingClearance
                const progressVal = Math.round(plane.serviceProgress || 0)

                return (
                  <div
                    key={gateName}
                    onClick={() => {
                      selectAircraft(plane.id)
                      setFocusedFlightId(plane.id)
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      hasPending
                        ? 'bg-amber-950/30 border-amber-500/80 text-amber-200'
                        : isFocused
                        ? 'bg-zinc-850 border-sky-500 text-zinc-100 shadow-md'
                        : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-100">
                          {gateName} • {plane.id}
                        </span>
                        {isFocused && (
                          <span className="px-1 py-0.2 rounded bg-sky-500 text-zinc-950 text-[9px] font-black">
                            FOKUS
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase ${
                          hasPending ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        {plane.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Progress Bar (Persistent from 0% to 100%) */}
                    {plane.serviceProgress !== undefined && plane.serviceProgress > 0 && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5 font-mono">
                          <span>Progress Layanan</span>
                          <span
                            className={
                              progressVal >= 100
                                ? 'text-emerald-400 font-bold'
                                : 'text-zinc-300'
                            }
                          >
                            {progressVal >= 100 ? '100% SELESAI' : `${progressVal}%`}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressVal >= 100 ? 'bg-emerald-400' : 'bg-sky-400'
                            }`}
                            style={{ width: `${plane.serviceProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Pending Request Indicator */}
                    {plane.pendingClearance && (
                      <div className="mt-1.5 pt-1 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[9px] text-amber-300 font-bold truncate">
                          ⏳ {plane.pendingClearanceTitle || 'Menunggu Persetujuan ATC'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            approveClearance(plane.id)
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1 font-mono">
                      <span>Pax: {plane.passengers?.current || 0}/180</span>
                      <span>Fuel: {plane.fuel}%</span>
                      <span>Teknis: {plane.technicalHealth}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* BAY 3: HANGAR PEMELIHARAAN (2 BAYS) */}
        <section className="bg-zinc-950/95 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <div
            onClick={() => toggleBay('hangar')}
            className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 cursor-pointer border-b border-zinc-800"
          >
            <div className="flex items-center gap-2 font-bold text-zinc-200">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>HANGAR PEMELIHARAAN (2 BAY)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold">
              {hangarPlanes.length}
            </span>
          </div>

          {openBays.hangar && (
            <div className="p-2 flex flex-col gap-1.5">
              {ALL_HANGARS.map((hangarName) => {
                const plane = aircrafts.find(
                  (a) =>
                    a.gate === hangarName ||
                    (a.assignedGate === hangarName &&
                      (a.status === 'in_hangar' ||
                        a.status === 'overhaul' ||
                        a.status === 'avionics_check' ||
                        a.status === 'c_check' ||
                        a.status === 'taxi_to_hangar'))
                )

                if (!plane) {
                  return (
                    <div
                      key={hangarName}
                      className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-850 text-zinc-500 text-[10px]"
                    >
                      <span className="font-bold text-zinc-400">{hangarName}</span>
                      <span className="text-zinc-500 font-mono">🟢 BAY TERBUKA</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={hangarName}
                    onClick={() => {
                      selectAircraft(plane.id)
                      setFocusedFlightId(plane.id)
                    }}
                    className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold text-zinc-100">
                      <span>{hangarName} • {plane.id}</span>
                      <span className="text-amber-400 text-[9px] uppercase">
                        {plane.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {plane.serviceProgress !== undefined && plane.serviceProgress > 0 && (
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${plane.serviceProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </aside>

      {/* ============================================================== */}
      {/* 3. CENTER / BOTTOM: ACTIVE 2-WAY VHF TRANSCEIVER & CLEARANCES  */}
      {/* ============================================================== */}
      <footer className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* 2-WAY VHF RADIO DIALOGUE & SUBTITLE CONSOLE */}
        <div className="self-center max-w-4xl w-full bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md">
          {/* Header: Radio Frequency & Live Status */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-zinc-200 tracking-wider">
                VHF TWO-WAY RADIO • 118.200 MHz TOWER SUBTITLES
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE AIRBAND
              </span>
            </div>

            <div className="flex items-center gap-2">
              {latestPilotMsg && (
                <button
                  onClick={() => radioSound.speakPilotVoice(latestPilotMsg.message)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                  title="Dengarkan Kembali Transmisi Radio Pilot"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>REPLAY PILOT</span>
                </button>
              )}
            </div>
          </div>

          {/* Dialogue Subtitle Body: 2 Avatars (ATC on Left, Pilot on Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
            {/* LEFT: ATC CONTROLLER (You) */}
            <div
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                isAtcSpeaking
                  ? 'bg-sky-950/40 border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'bg-zinc-900/60 border-zinc-800/80'
              }`}
            >
              {/* ATC Avatar */}
              <div className="relative shrink-0">
                <img
                  src="/atc_avatar.jpg"
                  alt="ATC Tower Controller"
                  className={`w-12 h-12 rounded-full object-cover shadow-md transition-all ${
                    isAtcSpeaking
                      ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-zinc-950 scale-105'
                      : 'border-2 border-zinc-700 opacity-90'
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-mono font-black border ${
                    isAtcSpeaking
                      ? 'bg-sky-500 text-zinc-950 border-sky-300 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  ATC
                </div>
              </div>

              {/* ATC Subtitle Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono font-bold text-sky-300 flex items-center gap-1.5">
                    <span>JAKARTA TOWER (ATC)</span>
                    {isAtcSpeaking && (
                      <span className="flex items-center gap-0.5 text-[8px] text-sky-400 font-normal">
                        <span className="inline-block w-1 h-2 bg-sky-400 animate-bounce" />
                        <span className="inline-block w-1 h-3 bg-sky-400 animate-bounce [animation-delay:0.1s]" />
                        <span className="inline-block w-1 h-1.5 bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                        TX
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {latestAtcMsg?.timestamp || 'ONLINE'}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-mono leading-relaxed bg-zinc-950/70 p-2 rounded border border-zinc-800/80">
                  {latestAtcMsg?.message ||
                    'Jakarta Tower monitor frequency 118.200 MHz. Standing by for traffic.'}
                </p>
              </div>
            </div>

            {/* RIGHT: PILOT / AIRLINE CAPTAIN */}
            <div
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                isPilotSpeaking || activePendingAircraft
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-zinc-900/60 border-zinc-800/80'
              }`}
            >
              {/* Pilot Subtitle Text */}
              <div className="flex-1 min-w-0 order-2 md:order-1 text-right md:text-left">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>
                      PILOT • {activePendingAircraft?.id || latestPilotMsg?.callsign || 'AIRCRAFT'}
                    </span>
                    {isPilotSpeaking && (
                      <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-normal">
                        <span className="inline-block w-1 h-2 bg-emerald-400 animate-bounce" />
                        <span className="inline-block w-1 h-3 bg-emerald-400 animate-bounce [animation-delay:0.1s]" />
                        <span className="inline-block w-1 h-1.5 bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                        RX
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {latestPilotMsg?.timestamp || 'READY'}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-mono leading-relaxed bg-zinc-950/70 p-2 rounded border border-zinc-800/80">
                  {activePendingAircraft ? (
                    <span>
                      <strong className="text-amber-400 font-bold">
                        [{activePendingAircraft.id}]:
                      </strong>{' '}
                      {latestPilotMsg?.message || activePendingAircraft.pendingClearanceTitle}
                    </span>
                  ) : latestPilotMsg ? (
                    <span>{latestPilotMsg.message}</span>
                  ) : (
                    <span className="text-zinc-500 italic">
                      All aircraft standing by on frequency.
                    </span>
                  )}
                </p>
              </div>

              {/* Pilot Avatar */}
              <div className="relative shrink-0 order-1 md:order-2">
                <img
                  src="/pilot_avatar.jpg"
                  alt="Airline Captain"
                  className={`w-12 h-12 rounded-full object-cover shadow-md transition-all ${
                    isPilotSpeaking || activePendingAircraft
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 scale-105'
                      : 'border-2 border-zinc-700 opacity-90'
                  }`}
                />
                <div
                  className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-mono font-black border ${
                    isPilotSpeaking || activePendingAircraft
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-300 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  PILOT
                </div>
              </div>
            </div>
          </div>

          {/* Action Clearance Bar (Positioned directly under dialogue) */}
          {activePendingAircraft?.pendingClearance && (
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => approveClearance(activePendingAircraft.id)}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  SETUJUI: {activePendingAircraft.pendingClearanceTitle || 'IZIN OPERASIONAL'}
                </span>
              </button>

              <button
                onClick={() => denyClearance(activePendingAircraft.id)}
                className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs border border-zinc-700 cursor-pointer transition-all flex items-center gap-1.5"
                title="Tahan posisi pesawat dan batalkan instruksi"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>TAHAN</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM RACK: CAMERAS (LEFT) + 1-BY-1 TURNAROUND FOCUSED STRIP (CENTER) + PTT (RIGHT) */}
        <div className="flex items-end justify-between w-full gap-3">
          {/* Bottom Left: Camera Switcher Controls */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-lg">
            <button
              onClick={() => setViewMode('tower')}
              className={`p-2 rounded cursor-pointer transition-all ${
                viewMode === 'tower'
                  ? 'bg-zinc-800 text-emerald-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Kamera Menara Kontrol (Drag mouse untuk melihat sekeliling bandara)"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('binoculars')}
              className={`p-2 rounded cursor-pointer transition-all ${
                viewMode === 'binoculars'
                  ? 'bg-zinc-800 text-emerald-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Teropong Menara (Zoom fokus pesawat)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('follow')}
              className={`p-2 rounded cursor-pointer transition-all ${
                viewMode === 'follow'
                  ? 'bg-zinc-800 text-emerald-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Kamera Pengejar (Chase Cam)"
            >
              <Eye className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />
            <button
              onClick={togglePause}
              className="p-2 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer transition-all"
              title={isPaused ? 'Lanjutkan Simulasi' : 'Jeda Simulasi'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom Center: SYSTEMATIC 1-BY-1 TURNAROUND FLIGHT CONTROLLER */}
          {focusedAircraft ? (
            <div className="flex-1 max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-lg p-2.5 shadow-xl font-mono text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100">
                    ✈️ {focusedAircraft.id} ({focusedAircraft.airline})
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-sky-400 text-[10px] font-bold">
                    {focusedAircraft.assignedGate || focusedAircraft.gate || 'Airborne'}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase">
                    Status: {focusedAircraft.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Fokus Kontrol ATC 1-per-1
                </div>
              </div>

              {/* Turnaround Sequence Steps Bar (1 through 8) */}
              <div className="grid grid-cols-8 gap-1 text-center text-[9px]">
                {/* 1. Deboarding */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.turnaround?.deboarded
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : focusedAircraft.status === 'deboarding'
                      ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">1. Turun Pax</span>
                  <span>{focusedAircraft.turnaround?.deboarded ? '✓' : '○'}</span>
                </div>

                {/* 2. Cleaning */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.turnaround?.cabinCleaned
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : focusedAircraft.status === 'cleaning'
                      ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">2. Kabin</span>
                  <span>{focusedAircraft.turnaround?.cabinCleaned ? '✓' : '○'}</span>
                </div>

                {/* 3. Refueling */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.turnaround?.refueled
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : focusedAircraft.status === 'refueling'
                      ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">3. Avtur</span>
                  <span>{focusedAircraft.turnaround?.refueled ? '✓' : '○'}</span>
                </div>

                {/* 4. Tech Check */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.turnaround?.techInspected
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : focusedAircraft.status === 'maintenance_check'
                      ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">4. Teknis</span>
                  <span>{focusedAircraft.turnaround?.techInspected ? '✓' : '○'}</span>
                </div>

                {/* 5. Boarding */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.turnaround?.boarded
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : focusedAircraft.status === 'boarding'
                      ? 'bg-sky-950/60 border-sky-400 text-sky-200 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">5. Boarding</span>
                  <span>{focusedAircraft.turnaround?.boarded ? '✓' : '○'}</span>
                </div>

                {/* 6. Pushback */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.status === 'pushback' ||
                    focusedAircraft.status === 'taxi_to_runway' ||
                    focusedAircraft.status === 'takeoff' ||
                    focusedAircraft.status === 'airborne'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">6. Pushback</span>
                  <span>
                    {focusedAircraft.status === 'taxi_to_runway' ||
                    focusedAircraft.status === 'takeoff' ||
                    focusedAircraft.status === 'airborne'
                      ? '✓'
                      : '○'}
                  </span>
                </div>

                {/* 7. Taxi to Rwy */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.status === 'taxi_to_runway' ||
                    focusedAircraft.status === 'takeoff' ||
                    focusedAircraft.status === 'airborne'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">7. Taksi Rwy</span>
                  <span>
                    {focusedAircraft.status === 'takeoff' || focusedAircraft.status === 'airborne'
                      ? '✓'
                      : '○'}
                  </span>
                </div>

                {/* 8. Takeoff */}
                <div
                  className={`p-1 rounded border ${
                    focusedAircraft.status === 'takeoff' || focusedAircraft.status === 'airborne'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="block font-bold">8. Lepas</span>
                  <span>{focusedAircraft.status === 'airborne' ? '✓' : '○'}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Bottom Right: Voice PTT Spacebar & Info */}
          <div className="flex flex-col items-end gap-1">
            {transcript && (
              <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono max-w-xs shadow-md">
                🎙️ "{transcript}"
              </div>
            )}

            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
                micActive
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
            >
              <Mic className={`w-4 h-4 ${micActive ? 'text-white' : 'text-sky-400'}`} />
              <span>PTT MIC [SPACE]</span>
            </button>

            <div className="text-[10px] text-zinc-500 font-mono">
              🖱️ Drag mouse untuk rotasi 3D Menara
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
