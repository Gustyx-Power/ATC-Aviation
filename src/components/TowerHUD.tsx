import React, { useState } from 'react'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Plane,
  Compass,
  ArrowRightLeft,
  Truck,
  Send,
  Octagon,
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
  CheckCircle,
  Users,
  Fuel,
  Wrench,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Cpu,
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { radioSound } from '../utils/audioEffects'
import type { WeatherCondition } from '../types/atc'

export const TowerHUD: React.FC = () => {
  const aircrafts = useGameStore((state) => state.aircrafts)
  const selectedAircraftId = useGameStore((state) => state.selectedAircraftId)
  const selectAircraft = useGameStore((state) => state.selectAircraft)
  const airMiles = useGameStore((state) => state.airMiles)
  const airportLevel = useGameStore((state) => state.airportLevel)
  const score = useGameStore((state) => state.score)
  const landedCount = useGameStore((state) => state.landedCount)
  const viewMode = useGameStore((state) => state.viewMode)
  const setViewMode = useGameStore((state) => state.setViewMode)
  const tutorialText = useGameStore((state) => state.tutorialText)
  const tutorialActive = useGameStore((state) => state.tutorialActive)
  const dismissTutorial = useGameStore((state) => state.dismissTutorial)
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)
  const spawnAircraft = useGameStore((state) => state.spawnAircraft)
  const weather = useGameStore((state) => state.weather)
  const setWeatherCondition = useGameStore((state) => state.setWeatherCondition)
  const simSpeed = useGameStore((state) => state.simSpeed)
  const setSimSpeed = useGameStore((state) => state.setSimSpeed)

  // Ground Turnaround, Hangar & Clearance Actions
  const assignDestination = useGameStore((state) => state.assignDestination)
  const startDeboarding = useGameStore((state) => state.startDeboarding)
  const startCabinService = useGameStore((state) => state.startCabinService)
  const startRefueling = useGameStore((state) => state.startRefueling)
  const startTechnicalCheck = useGameStore((state) => state.startTechnicalCheck)
  const startBoarding = useGameStore((state) => state.startBoarding)
  const orderPushback = useGameStore((state) => state.orderPushback)
  const orderTaxi = useGameStore((state) => state.orderTaxi)
  const orderTakeoff = useGameStore((state) => state.orderTakeoff)
  const orderHold = useGameStore((state) => state.orderHold)
  const orderClearedToLand = useGameStore((state) => state.orderClearedToLand)
  const orderGoAround = useGameStore((state) => state.orderGoAround)
  const orderHoldInAir = useGameStore((state) => state.orderHoldInAir)
  const orderExitHolding = useGameStore((state) => state.orderExitHolding)
  const startEngineOverhaul = useGameStore((state) => state.startEngineOverhaul)
  const startAvionicsCheck = useGameStore((state) => state.startAvionicsCheck)
  const startCCheck = useGameStore((state) => state.startCCheck)
  const releaseFromHangar = useGameStore((state) => state.releaseFromHangar)

  // Voice Command hook
  const { transcript, micActive, toggleListening } = useVoiceCommand()

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    approach: true,
    tower: true,
    ground: true,
    gates: true,
    hangar: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedAircraft = aircrafts.find((a) => a.id === selectedAircraftId)

  const ALL_GATES: ('Gate 1' | 'Gate 2' | 'Gate 3' | 'Gate 4' | 'Gate 5' | 'Gate 6')[] = [
    'Gate 1',
    'Gate 2',
    'Gate 3',
    'Gate 4',
    'Gate 5',
    'Gate 6',
  ]
  const ALL_HANGARS: ('Hangar 1' | 'Hangar 2')[] = ['Hangar 1', 'Hangar 2']

  // Group aircraft by operations section
  const approachPlanes = aircrafts.filter(
    (a) => a.status === 'approach' || a.status === 'cruising' || a.status === 'emergency' || a.status === 'holding_pattern'
  )
  const towerPlanes = aircrafts.filter((a) => a.status === 'holding' || a.status === 'takeoff' || a.status === 'landing')
  const groundPlanes = aircrafts.filter(
    (a) => a.status === 'pushback' || a.status === 'taxi_to_runway' || a.status === 'taxi_to_gate' || a.status === 'taxi_to_hangar'
  )
  const hangarPlanes = aircrafts.filter(
    (a) => a.status === 'in_hangar' || a.status === 'overhaul' || a.status === 'avionics_check' || a.status === 'c_check'
  )

  const occupiedGatesCount = ALL_GATES.filter((g) =>
    aircrafts.some(
      (a) =>
        (a.gate === g || (a.assignedGate === g && (a.status === 'taxi_to_gate' || a.status === 'landing'))) &&
        a.status !== 'takeoff' &&
        a.status !== 'approach' &&
        a.status !== 'holding_pattern'
    )
  ).length
  const allGatesOccupied = occupiedGatesCount >= 6

  const cycleWeather = () => {
    const list: WeatherCondition[] = ['Cerah', 'Hujan Badai', 'Kabut Tebal']
    const nextIdx = (list.indexOf(weather.condition) + 1) % list.length
    setWeatherCondition(list[nextIdx])
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-mono">
      {/* ============================================================== */}
      {/* 1. TOP TELEMETRY & SYSTEM BAR                                  */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Operations Telemetry */}
        <div className="flex items-center gap-2">
          {/* Station Beacon Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071320]/90 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ffaa] animate-ping" />
            <span className="font-bold text-white tracking-wider text-xs">
              SOEKARNO-HATTA TWR <span className="text-cyan-400">| CONTROL CAB</span>
            </span>
          </div>

          {/* Air Miles Currency */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-amber-500/30 backdrop-blur-md text-white font-bold text-xs shadow-md">
            <span className="text-amber-400">🪙</span>
            <span className="text-amber-300 font-semibold">{airMiles} Mil Udara</span>
          </div>

          {/* Flights Count + Add Traffic */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-cyan-500/30 backdrop-blur-md text-white font-bold text-xs shadow-md">
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-300">Trafik: <strong className="text-white">{aircrafts.length}/6</strong></span>
            <button
              onClick={spawnAircraft}
              className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-sm text-[10px]"
              title="Spawn Traffic Baru"
            >
              <Plus className="w-3 h-3 mr-0.5" /> INBOUND
            </button>
          </div>

          {/* Stats: Landed & Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-gray-700/50 backdrop-blur-md text-xs">
            <span className="text-gray-400">LANDED: <strong className="text-emerald-400">{landedCount}</strong></span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">SKOR: <strong className="text-cyan-400">{score}</strong></span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">LVL: <strong className="text-amber-400">{airportLevel}</strong></span>
          </div>

          {/* Interactive Weather Switcher Badge */}
          <button
            onClick={cycleWeather}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-bold transition-all cursor-pointer shadow-md ${
              weather.condition === 'Hujan Badai'
                ? 'bg-blue-950/90 border-blue-400 text-blue-300 animate-pulse'
                : weather.condition === 'Kabut Tebal'
                ? 'bg-slate-900/90 border-slate-400 text-slate-300'
                : 'bg-[#071320]/85 border-amber-500/40 text-amber-300'
            }`}
            title="Klik untuk ubah simulasi cuaca (Cerah / Hujan Badai / Kabut)"
          >
            {weather.condition === 'Hujan Badai' ? (
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            ) : weather.condition === 'Kabut Tebal' ? (
              <CloudFog className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>CUACA: {weather.condition.toUpperCase()}</span>
          </button>
        </div>

        {/* Right: Gate Capacity & Simulation Speed Controls */}
        <div className="flex items-center gap-2">
          {/* Gate Capacity Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-bold transition-all shadow-md ${
              allGatesOccupied
                ? 'bg-amber-950/90 border-amber-500/80 text-amber-300 animate-pulse'
                : 'bg-[#071320]/85 border-cyan-500/30 text-gray-300'
            }`}
            title={
              allGatesOccupied
                ? 'Semua Gate 1-6 terisi! Perintahkan pesawat inbound untuk Holding Pattern (Tahan di Udara).'
                : `${occupiedGatesCount} dari 6 Gate terisi`
            }
          >
            <Compass className={`w-3.5 h-3.5 ${allGatesOccupied ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span>
              GATE: <strong className={allGatesOccupied ? 'text-amber-300' : 'text-emerald-400'}>{occupiedGatesCount}/6</strong>
            </span>
            {allGatesOccupied && (
              <span className="px-1 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black tracking-wide">
                PENUH
              </span>
            )}
          </div>

          {/* Simulation Speed Controls */}
          <div className="flex items-center rounded-lg bg-[#071320]/85 border border-cyan-500/30 overflow-hidden text-xs">
            <span className="px-2 py-1 text-[10px] text-gray-400 font-bold border-r border-gray-700/60">KECEPATAN</span>
            <button
              onClick={() => setSimSpeed(1)}
              className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                simSpeed === 1 ? 'bg-cyan-500 text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Kecepatan Nyata (Realistis 1x)"
            >
              1x Real
            </button>
            <button
              onClick={() => setSimSpeed(2)}
              className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                simSpeed === 2 ? 'bg-cyan-500 text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Kecepatan Cepat (2x)"
            >
              2x
            </button>
            <button
              onClick={() => setSimSpeed(4)}
              className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-all ${
                simSpeed === 4 ? 'bg-cyan-500 text-black shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Kecepatan Ekspres (4x)"
            >
              4x
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. RIGHT ACCORDION PANEL (SECTIONS & GROUND STATUS)            */}
      {/* ============================================================== */}
      <div className="absolute top-16 right-3 w-68 max-h-[75vh] flex flex-col gap-1.5 pointer-events-auto overflow-y-auto text-xs scrollbar-thin">
        {/* PENDEKATAN (Approach 130.30) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-cyan-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('approach')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-cyan-950/70 hover:bg-cyan-900/60 cursor-pointer border-b border-cyan-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center">
                <Plane className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-cyan-300">PENDEKATAN (APPROACH)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-400">
              <span>{approachPlanes.length}</span>
              {openSections.approach ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.approach && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {approachPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat inbound</div>
              ) : (
                approachPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      ac.status === 'emergency'
                        ? 'bg-red-950/80 border border-red-500 text-white font-bold animate-pulse'
                        : ac.status === 'holding_pattern'
                        ? 'bg-amber-950/80 border border-amber-500 text-amber-200 font-bold'
                        : ac.id === selectedAircraftId
                        ? 'bg-cyan-600/30 border border-cyan-400 text-white font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white block font-bold">{ac.id}</span>
                        {ac.status === 'emergency' && (
                          <span className="px-1 rounded bg-red-600 text-[8px] text-white font-black animate-bounce">
                            MAYDAY
                          </span>
                        )}
                        {ac.status === 'holding_pattern' && (
                          <span className="px-1 rounded bg-amber-500/30 text-amber-300 border border-amber-500/60 text-[8px] font-black animate-pulse flex items-center gap-0.5">
                            <RotateCcw className="w-2.5 h-2.5" /> HOLDING
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-cyan-300">{ac.airline || 'Airliner'}</span>
                      <span className="text-[8px] text-gray-400 block">
                        {ac.status === 'holding_pattern'
                          ? 'Orbit ALPHA FL035'
                          : `Tujuan: ${ac.assignedGate || 'Menunggu Gate'}`}
                      </span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-cyan-400 block font-bold">ALT {ac.altitude} FT</span>
                      <span className="text-gray-400 text-[9px] uppercase">{ac.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* MENARA RUNWAY 09 */}
        <div className="rounded-lg bg-[#06101c]/90 border border-red-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('tower')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900/60 cursor-pointer border-b border-red-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center">
                <Octagon className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="font-bold text-red-300">MENARA (RUNWAY 09)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <span>{towerPlanes.length}</span>
              {openSections.tower ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.tower && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {towerPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Runway kosong</div>
              ) : (
                towerPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      ac.id === selectedAircraftId
                        ? 'bg-red-600/30 border border-red-400 text-white font-bold shadow-[0_0_10px_rgba(255,50,50,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="text-white block font-bold">{ac.id}</span>
                      <span className="text-[9px] text-red-300">{ac.destination}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-amber-400 block font-bold uppercase">{ac.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* TANAH (GROUND / TAXI & APRON) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-amber-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('ground')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900/60 cursor-pointer border-b border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
                <Truck className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-amber-300">TANAH (GROUND / TAXI)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400">
              <span>{groundPlanes.length}</span>
              {openSections.ground ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.ground && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {groundPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pergerakan darat</div>
              ) : (
                groundPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      ac.id === selectedAircraftId
                        ? 'bg-amber-600/30 border border-amber-400 text-white font-bold shadow-[0_0_10px_rgba(255,180,0,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="text-white block font-bold">{ac.id}</span>
                      <span className="text-[9px] text-amber-300">
                        {ac.status === 'pushback' ? '🚜 Pushback' : '🚕 Taksi'}
                      </span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-amber-400 block font-bold uppercase">{ac.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* TERMINAL & GATES (APRON TURNAROUND - 6 GATES) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-blue-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('gates')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-blue-950/70 hover:bg-blue-900/60 cursor-pointer border-b border-blue-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
                <Compass className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-blue-300">
                TERMINAL & GATES ({occupiedGatesCount}/6)
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-400">
              <span>{occupiedGatesCount}</span>
              {openSections.gates ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.gates && (
            <div className="p-1.5 flex flex-col gap-1.5 bg-[#050c15]">
              {allGatesOccupied && (
                <div className="p-2 bg-amber-950/90 border border-amber-500/80 rounded text-[9px] text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>SEMUA GATE TERISI (6/6)! Perintahkan pesawat inbound untuk Tahan di Udara (Holding).</span>
                </div>
              )}

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
                      className="flex items-center justify-between p-1.5 rounded bg-gray-900/30 border border-gray-800 text-gray-500 text-[10px]"
                    >
                      <span className="font-bold text-gray-400">{gateName}</span>
                      <span className="text-[9px] text-emerald-500 font-semibold">🟢 KOSONG (STANDBY)</span>
                    </div>
                  )
                }

                const isSelected = plane.id === selectedAircraftId
                const statusLabel =
                  plane.status === 'at_gate'
                    ? plane.turnaround?.boarded
                      ? 'Siap Pushback'
                      : 'Parkir di Gate'
                    : plane.status === 'deboarding'
                    ? `Turun Pax (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'cleaning'
                    ? `Pembersihan (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'refueling'
                    ? `Isi Avtur (${plane.fuel}%)`
                    : plane.status === 'maintenance_check'
                    ? `Cek Teknis (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'boarding'
                    ? `Boarding (${plane.passengers?.current || 0}/180)`
                    : plane.status === 'taxi_to_gate'
                    ? 'Taksi ke Gate'
                    : plane.status.replace(/_/g, ' ')

                return (
                  <div
                    key={gateName}
                    onClick={() => selectAircraft(plane.id)}
                    className={`flex flex-col p-1.5 rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-400 text-white font-bold shadow-[0_0_10px_rgba(0,150,255,0.3)]'
                        : 'bg-gray-900/70 hover:bg-gray-800/80 text-gray-300 border border-blue-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-[11px]">
                        {gateName} • {plane.id}
                      </span>
                      <span className="text-emerald-400 text-[9px] font-bold uppercase">{statusLabel}</span>
                    </div>
                    {plane.serviceProgress !== undefined &&
                      plane.serviceProgress > 0 &&
                      plane.serviceProgress < 100 && (
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-300"
                            style={{ width: `${plane.serviceProgress}%` }}
                          />
                        </div>
                      )}
                    <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>👥 {plane.passengers?.current || 0} pax</span>
                      <span>⛽ {plane.fuel}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* HANGAR PERAWATAN (2 BAYS) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-slate-600/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('hangar')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
                <Wrench className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-amber-300">HANGAR PERAWATAN (2 BAY)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{hangarPlanes.length}</span>
              {openSections.hangar ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.hangar && (
            <div className="p-1.5 flex flex-col gap-1.5 bg-[#050c15]">
              {ALL_HANGARS.map((hangarName) => {
                const plane = aircrafts.find(
                  (a) =>
                    a.gate === hangarName ||
                    (a.assignedGate === hangarName &&
                      (a.status === 'taxi_to_hangar' ||
                        a.status === 'in_hangar' ||
                        a.status === 'overhaul' ||
                        a.status === 'avionics_check' ||
                        a.status === 'c_check'))
                )

                if (!plane) {
                  return (
                    <div
                      key={hangarName}
                      className="flex items-center justify-between p-1.5 rounded bg-gray-900/30 border border-gray-800 text-gray-500 text-[10px]"
                    >
                      <span className="font-bold text-gray-400">{hangarName}</span>
                      <span className="text-[9px] text-emerald-500 font-semibold">🟢 KOSONG (Bay Terbuka)</span>
                    </div>
                  )
                }

                const isSelected = plane.id === selectedAircraftId
                const statusLabel =
                  plane.status === 'overhaul'
                    ? `Overhaul Mesin (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'avionics_check'
                    ? `Kalibrasi Avionik (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'c_check'
                    ? `Inspeksi C-Check (${Math.round(plane.serviceProgress || 0)}%)`
                    : plane.status === 'taxi_to_hangar'
                    ? 'Taksi ke Hangar'
                    : 'Standby Perawatan'

                return (
                  <div
                    key={hangarName}
                    onClick={() => selectAircraft(plane.id)}
                    className={`flex flex-col p-1.5 rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-700/60 border border-amber-400 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-800/60 hover:bg-slate-700/60 text-gray-200 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-[11px]">
                        {hangarName} • {plane.id}
                      </span>
                      <span className="text-amber-400 text-[9px] font-bold uppercase">{statusLabel}</span>
                    </div>
                    {plane.serviceProgress !== undefined &&
                      plane.serviceProgress > 0 &&
                      plane.serviceProgress < 100 && (
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${plane.serviceProgress}%` }}
                          />
                        </div>
                      )}
                    <div className="flex items-center gap-1.5 text-[8px] text-gray-300 mt-1">
                      <span className={plane.hangarService?.engineOverhauled ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                        {plane.hangarService?.engineOverhauled ? '✓' : '○'} Mesin
                      </span>
                      <span>•</span>
                      <span className={plane.hangarService?.avionicsCalibrated ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                        {plane.hangarService?.avionicsCalibrated ? '✓' : '○'} Avionik
                      </span>
                      <span>•</span>
                      <span className={plane.hangarService?.cCheckPassed ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                        {plane.hangarService?.cCheckPassed ? '✓' : '○'} C-Check
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM AREA: REALISTIC PILOT TRANSMISSION & OPERATIONS BAR  */}
      {/* ============================================================== */}
      <footer className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* INTERACTIVE PILOT & GROUND CREW AUDIO TRANSMISSION DIALOG */}
        {tutorialActive && (
          <div className="self-center max-w-2xl w-full bg-[#071320]/95 border-2 border-cyan-400/80 rounded-xl p-3 px-4 backdrop-blur-md shadow-[0_4px_30px_rgba(0,229,255,0.35)] flex items-center gap-4 animate-bounce-subtle">
            {/* Real Professional Pilot Avatar Photo */}
            <div className="relative shrink-0">
              <img
                src="/pilot_avatar.jpg"
                alt="Airline Captain Avatar"
                className="w-14 h-14 rounded-full border-2 border-cyan-300 object-cover shadow-[0_0_12px_rgba(0,229,255,0.5)]"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-black flex items-center justify-center text-[8px] text-white font-black">
                ✓
              </div>
            </div>

            {/* Audio Wave & Pilot Instruction */}
            <div className="flex-1">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-cyan-300">
                    TRANSMISI RADIO ATC (VHF 118.200 MHz)
                  </span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => radioSound.speakPilotVoice(tutorialText)}
                    className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50 cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                    title="Dengarkan Suara Pilot"
                  >
                    <Volume2 className="w-3 h-3" /> SUARA PILOT
                  </button>
                  <button
                    onClick={dismissTutorial}
                    className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-white leading-relaxed font-sans font-medium">
                {tutorialText}
              </p>
            </div>
          </div>
        )}

        {/* BOTTOM ROW: WEATHER & CAMERAS (LEFT) + REAL GROUND OPERATIONS (CENTER) + PTT (RIGHT) */}
        <div className="flex items-end justify-between w-full gap-3">
          {/* Bottom Left: Weather Card & Cameras */}
          <div className="flex flex-col gap-2">
            {/* Weather Card */}
            <div className="p-2.5 rounded-lg bg-[#071320]/90 border border-gray-700/60 backdrop-blur-md text-white font-mono text-[11px] shadow-lg flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                {weather.condition === 'Hujan Badai' ? (
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                ) : weather.condition === 'Kabut Tebal' ? (
                  <CloudFog className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>CUACA: {weather.condition.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-gray-300">
                Suhu: {weather.temp}°C | Angin: {weather.wind}
              </div>
              <div className="text-[10px] text-gray-400">{weather.time} WIB • Vis: {weather.visibility}m</div>
            </div>

            {/* Camera Switcher Buttons */}
            <div className="flex items-center gap-1 p-1 bg-[#071320]/90 border border-cyan-500/30 rounded-lg backdrop-blur-md shadow-lg">
              <button
                onClick={() => setViewMode('tower')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'tower'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Pandangan Menara (Drag mouse untuk melihat sekeliling bandara)"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('binoculars')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'binoculars'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Teropong Menara (Zoom fokus ke pesawat)"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('follow')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'follow'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Ikuti Pesawat (Chase Cam)"
              >
                <Eye className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-4 bg-gray-700 mx-0.5" />

              <button
                onClick={togglePause}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title={isPaused ? 'Lanjutkan' : 'Jeda'}
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BOTTOM CENTER: CONTEXT-SENSITIVE ATC OPERATIONS CENTER         */}
          {/* ============================================================== */}
          <div className="flex flex-col rounded-xl bg-[#06101c]/95 border border-cyan-500/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.85)] overflow-hidden max-w-3xl">
            {/* Header: Selected Flight Status Strip */}
            {selectedAircraft ? (
              <div className="flex items-center justify-between px-3 py-1 bg-[#091829] border-b border-cyan-500/30 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold tracking-wide">✈️ {selectedAircraft.id}</span>
                  <span className="text-cyan-400 text-[10px]">
                    ({selectedAircraft.airline} • {selectedAircraft.aircraftType})
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      selectedAircraft.status === 'holding_pattern'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                        : selectedAircraft.status === 'emergency'
                        ? 'bg-red-950 border-red-500 text-white animate-bounce'
                        : 'bg-cyan-900/60 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    {selectedAircraft.status.replace(/_/g, ' ')}
                  </span>
                  {selectedAircraft.gate && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[9px] font-bold border border-blue-500/30">
                      📍 {selectedAircraft.gate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-300">
                  <span>
                    ALT: <strong className="text-cyan-300">{selectedAircraft.altitude} FT</strong>
                  </span>
                  <span>
                    SPD: <strong className="text-cyan-300">{Math.round(selectedAircraft.speed * 120)} KTS</strong>
                  </span>
                  <span>
                    FUEL:{' '}
                    <strong className={selectedAircraft.fuel < 20 ? 'text-red-400 font-bold' : 'text-emerald-300'}>
                      {selectedAircraft.fuel}%
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-1 bg-[#091829]/80 border-b border-gray-700/50 text-[10px] text-gray-400 italic text-center">
                Pilih pesawat di radar atau daftar samping untuk memberikan instruksi kendali ATC
              </div>
            )}

            {/* Body: Two Column Operations (Left: Gate/Bay Assigner, Right: Context Actions) */}
            <div className="flex items-stretch gap-2 p-2">
              {/* Left Column: Gate & Hangar Destination Selector */}
              <div className="flex flex-col gap-1 border-r border-gray-700/60 pr-2 min-w-[170px]">
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold">
                  <span>TUJUAN APRON / HANGAR</span>
                  {allGatesOccupied && <span className="text-amber-400 font-black">GATE PENUH</span>}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {ALL_GATES.map((g) => {
                    const occupant = aircrafts.find(
                      (a) =>
                        a.id !== selectedAircraft?.id &&
                        (a.gate === g ||
                          (a.assignedGate === g &&
                            (a.status === 'taxi_to_gate' || a.status === 'landing'))) &&
                        a.status !== 'takeoff' &&
                        a.status !== 'approach' &&
                        a.status !== 'holding_pattern'
                    )
                    const isAssigned =
                      selectedAircraft?.assignedGate === g || selectedAircraft?.gate === g
                    return (
                      <button
                        key={g}
                        onClick={() => selectedAircraft && assignDestination(selectedAircraft.id, g)}
                        disabled={!selectedAircraft || !!occupant}
                        className={`px-1 py-1 rounded text-[8px] font-bold transition-all cursor-pointer ${
                          isAssigned
                            ? 'bg-blue-600 text-white border border-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            : occupant
                            ? 'bg-gray-900/40 text-red-400/60 border border-red-900/30 cursor-not-allowed line-through'
                            : 'bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-200'
                        }`}
                        title={occupant ? `${g} terisi oleh ${occupant.id}` : `Arahkan ke ${g}`}
                      >
                        {g}
                      </button>
                    )
                  })}
                  {ALL_HANGARS.map((h) => {
                    const occupant = aircrafts.find(
                      (a) =>
                        a.id !== selectedAircraft?.id &&
                        (a.gate === h || a.assignedGate === h) &&
                        (a.status === 'in_hangar' ||
                          a.status === 'overhaul' ||
                          a.status === 'avionics_check' ||
                          a.status === 'c_check' ||
                          a.status === 'taxi_to_hangar')
                    )
                    const isAssigned =
                      selectedAircraft?.assignedGate === h || selectedAircraft?.gate === h
                    return (
                      <button
                        key={h}
                        onClick={() => selectedAircraft && assignDestination(selectedAircraft.id, h)}
                        disabled={!selectedAircraft || !!occupant}
                        className={`px-1 py-1 rounded text-[8px] font-bold transition-all cursor-pointer ${
                          isAssigned
                            ? 'bg-amber-600 text-white border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : occupant
                            ? 'bg-gray-900/40 text-red-400/60 border border-red-900/30 cursor-not-allowed line-through'
                            : 'bg-slate-900 hover:bg-slate-800 border border-slate-500/40 text-amber-300'
                        }`}
                        title={occupant ? `${h} terisi oleh ${occupant.id}` : `Arahkan ke ${h}`}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Dynamic Context-Sensitive Command Buttons */}
              <div className="flex-1 flex items-center gap-1.5">
                {/* 1. HANGAR MAINTENANCE WORKFLOW */}
                {selectedAircraft &&
                  (selectedAircraft.status === 'in_hangar' ||
                    selectedAircraft.status === 'overhaul' ||
                    selectedAircraft.status === 'avionics_check' ||
                    selectedAircraft.status === 'c_check') && (
                    <div className="flex items-center gap-1.5 flex-1">
                      {/* Overhaul Mesin */}
                      {(() => {
                        const isOverhauling = selectedAircraft.status === 'overhaul'
                        const isDone = !!selectedAircraft.hangarService?.engineOverhauled
                        return (
                          <button
                            onClick={() => startEngineOverhaul(selectedAircraft.id)}
                            disabled={isOverhauling || isDone}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[70px] transition-all cursor-pointer ${
                              isOverhauling
                                ? 'bg-amber-900/90 border-2 border-amber-400 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-300'
                            }`}
                            title="Overhaul Mesin Turbofan & Penggantian Suku Cadang"
                          >
                            <Wrench className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-amber-400'}`} />
                            <span className="text-[8px] font-bold text-center leading-tight">
                              {isOverhauling ? (
                                <>
                                  Mesin...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ Mesin
                                  <br />
                                  Selesai
                                </span>
                              ) : (
                                <>
                                  Overhaul
                                  <br />
                                  Mesin
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Kalibrasi Avionik */}
                      {(() => {
                        const isAvionics = selectedAircraft.status === 'avionics_check'
                        const isDone = !!selectedAircraft.hangarService?.avionicsCalibrated
                        return (
                          <button
                            onClick={() => startAvionicsCheck(selectedAircraft.id)}
                            disabled={isAvionics || isDone}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[70px] transition-all cursor-pointer ${
                              isAvionics
                                ? 'bg-cyan-900/90 border-2 border-cyan-400 text-white animate-pulse shadow-[0_0_12px_rgba(0,229,255,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 text-cyan-300'
                            }`}
                            title="Kalibrasi Radar Cuaca, Autoland CAT III, dan Flight Computer"
                          >
                            <Cpu className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-cyan-400'}`} />
                            <span className="text-[8px] font-bold text-center leading-tight">
                              {isAvionics ? (
                                <>
                                  Avionik...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ Avionik
                                  <br />
                                  Selesai
                                </span>
                              ) : (
                                <>
                                  Kalibrasi
                                  <br />
                                  Avionik
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* C-Check Rangka */}
                      {(() => {
                        const isCCheck = selectedAircraft.status === 'c_check'
                        const isDone = !!selectedAircraft.hangarService?.cCheckPassed
                        return (
                          <button
                            onClick={() => startCCheck(selectedAircraft.id)}
                            disabled={isCCheck || isDone}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[70px] transition-all cursor-pointer ${
                              isCCheck
                                ? 'bg-purple-900/90 border-2 border-purple-400 text-white animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800 hover:bg-slate-700 border border-purple-500/50 text-purple-300'
                            }`}
                            title="Inspeksi Berat Rangka Fuselage & Hidraulik (Heavy C-Check)"
                          >
                            <Sparkles className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-purple-400'}`} />
                            <span className="text-[8px] font-bold text-center leading-tight">
                              {isCCheck ? (
                                <>
                                  C-Check...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ C-Check
                                  <br />
                                  Lulus
                                </span>
                              ) : (
                                <>
                                  Inspeksi
                                  <br />
                                  C-Check
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Rilis ke Gate Apron */}
                      <button
                        onClick={() => releaseFromHangar(selectedAircraft.id)}
                        disabled={
                          selectedAircraft.status === 'overhaul' ||
                          selectedAircraft.status === 'avionics_check' ||
                          selectedAircraft.status === 'c_check'
                        }
                        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[75px] bg-emerald-600/70 hover:bg-emerald-600 border border-emerald-400 text-white font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                        title="Rilis pesawat selesai perawatan kembali ke Gate Apron untuk jadwal penerbangan"
                      >
                        <Send className="w-4 h-4 mb-0.5 -rotate-45 text-emerald-200" />
                        <span className="text-[8px] font-bold text-center leading-tight">
                          Rilis ke
                          <br />
                          Gate Apron
                        </span>
                      </button>
                    </div>
                  )}

                {/* 2. AIRBORNE OPERATIONS: APPROACH, HOLDING PATTERN & EMERGENCY */}
                {selectedAircraft &&
                  (selectedAircraft.status === 'approach' ||
                    selectedAircraft.status === 'cruising' ||
                    selectedAircraft.status === 'emergency' ||
                    selectedAircraft.status === 'holding_pattern') && (
                    <div className="flex items-center gap-1.5 flex-1">
                      {/* Holding Pattern / Exit Holding */}
                      {selectedAircraft.status === 'holding_pattern' ? (
                        <button
                          onClick={() => orderExitHolding(selectedAircraft.id)}
                          className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[85px] bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white font-black animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)] cursor-pointer"
                          title="Keluar dari pola putar (holding) dan arahkan mendarat ke Runway 09"
                        >
                          <CheckCircle className="w-4 h-4 mb-0.5 text-white" />
                          <span className="text-[8px] font-black text-center leading-tight">
                            Keluar Holding
                            <br />
                            & Mendarat
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => orderHoldInAir(selectedAircraft.id)}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[85px] transition-all cursor-pointer ${
                            allGatesOccupied
                              ? 'bg-amber-600 hover:bg-amber-500 border-2 border-amber-300 text-black font-black animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                              : 'bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-200'
                          }`}
                          title={
                            allGatesOccupied
                              ? 'SEMUA GATE PENUH! Wajib perintahkan holding pattern agar tidak bertabrakan.'
                              : 'Perintahkan pesawat berputar di udara (Holding Orbit) menunggu gate kosong.'
                          }
                        >
                          <RotateCcw className="w-4 h-4 mb-0.5 text-amber-300" />
                          <span className="text-[8px] font-bold text-center leading-tight">
                            Tahan di Udara
                            <br />
                            (Holding)
                          </span>
                        </button>
                      )}

                      {/* Izin Mendarat */}
                      <button
                        onClick={() => orderClearedToLand(selectedAircraft.id)}
                        disabled={selectedAircraft.status === 'holding_pattern'}
                        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[75px] bg-cyan-600/40 hover:bg-cyan-600/70 border border-cyan-400 text-cyan-100 disabled:opacity-25 cursor-pointer"
                        title="Izin Mendarat Runway 09"
                      >
                        <Plane className="w-4 h-4 mb-0.5 text-cyan-300 rotate-90" />
                        <span className="text-[8px] font-bold text-center leading-tight">
                          Izin Mendarat
                          <br />
                          Runway 09
                        </span>
                      </button>

                      {/* Go Around */}
                      <button
                        onClick={() => orderGoAround(selectedAircraft.id)}
                        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[65px] bg-purple-950/60 hover:bg-purple-900 border border-purple-400/50 text-purple-200 cursor-pointer"
                        title="Batalkan Pendaratan / Putar Balik"
                      >
                        <ArrowRightLeft className="w-4 h-4 mb-0.5" />
                        <span className="text-[8px] font-bold text-center leading-tight">
                          Go
                          <br />
                          Around
                        </span>
                      </button>
                    </div>
                  )}

                {/* 3. GATE TURNAROUND WORKFLOW (MANUAL 1-BY-1 DIRECTED STEPS) */}
                {selectedAircraft &&
                  (selectedAircraft.status === 'at_gate' ||
                    selectedAircraft.status === 'deboarding' ||
                    selectedAircraft.status === 'cleaning' ||
                    selectedAircraft.status === 'refueling' ||
                    selectedAircraft.status === 'maintenance_check' ||
                    selectedAircraft.status === 'boarding' ||
                    selectedAircraft.status === 'ready_pushback') && (
                    <div className="flex items-center gap-1 flex-1">
                      {/* Step 1: Penurunan Penumpang */}
                      {(() => {
                        const isDeboarding = selectedAircraft.status === 'deboarding'
                        const isDone = !!selectedAircraft.turnaround?.deboarded
                        const canRun =
                          (selectedAircraft.status === 'at_gate' ||
                            selectedAircraft.status === 'ready_pushback') &&
                          !isDone &&
                          !isDeboarding
                        return (
                          <button
                            onClick={() => startDeboarding(selectedAircraft.id)}
                            disabled={!canRun}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              isDeboarding
                                ? 'bg-indigo-900/90 border-2 border-indigo-400 text-white animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 disabled:opacity-20'
                            }`}
                            title="Langkah 1: Penurunan Penumpang & Bagasi"
                          >
                            <Users className={`w-3.5 h-3.5 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              {isDeboarding ? (
                                <>
                                  Turun...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ Pax
                                  <br />
                                  Turun
                                </span>
                              ) : (
                                <>
                                  1. Turun
                                  <br />
                                  Pax
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Step 2: Cek & Rapih Kabin */}
                      {(() => {
                        const isCleaning = selectedAircraft.status === 'cleaning'
                        const isDone = !!selectedAircraft.turnaround?.cabinCleaned
                        const canRun =
                          !!selectedAircraft.turnaround?.deboarded && !isDone && !isCleaning
                        return (
                          <button
                            onClick={() => startCabinService(selectedAircraft.id)}
                            disabled={!canRun}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              isCleaning
                                ? 'bg-teal-900/90 border-2 border-teal-400 text-white animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-teal-950/70 hover:bg-teal-900 border border-teal-500/50 text-teal-300 disabled:opacity-20'
                            }`}
                            title="Langkah 2: Pembersihan & Katering Kabin (Aktif setelah pax turun)"
                          >
                            <Sparkles className={`w-3.5 h-3.5 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              {isCleaning ? (
                                <>
                                  Kabin...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ Kabin
                                  <br />
                                  Bersih
                                </span>
                              ) : (
                                <>
                                  2. Cek
                                  <br />
                                  Kabin
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Step 3: Pengisian Avtur */}
                      {(() => {
                        const isRefueling = selectedAircraft.status === 'refueling'
                        const isDone = !!selectedAircraft.turnaround?.refueled
                        const canRun =
                          !!selectedAircraft.turnaround?.cabinCleaned && !isDone && !isRefueling
                        return (
                          <button
                            onClick={() => startRefueling(selectedAircraft.id)}
                            disabled={!canRun}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              isRefueling
                                ? 'bg-amber-900/90 border-2 border-amber-400 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 disabled:opacity-20'
                            }`}
                            title="Langkah 3: Pengisian Bahan Bakar Avtur (Aktif setelah kabin bersih)"
                          >
                            <Fuel
                              className={`w-3.5 h-3.5 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-amber-400'}`}
                            />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              {isRefueling ? (
                                <>
                                  Isi...
                                  <br />
                                  <strong className="text-white">{selectedAircraft.fuel}%</strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ 100%
                                  <br />
                                  Avtur
                                </span>
                              ) : (
                                <>
                                  3. Isi
                                  <br />
                                  Avtur
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Step 4: Cek Teknis */}
                      {(() => {
                        const isChecking = selectedAircraft.status === 'maintenance_check'
                        const isDone = !!selectedAircraft.turnaround?.techInspected
                        const canRun =
                          !!selectedAircraft.turnaround?.refueled && !isDone && !isChecking
                        return (
                          <button
                            onClick={() => startTechnicalCheck(selectedAircraft.id)}
                            disabled={!canRun}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              isChecking
                                ? 'bg-orange-900/90 border-2 border-orange-400 text-white animate-pulse shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-orange-950/70 hover:bg-orange-900 border border-orange-500/50 text-orange-300 disabled:opacity-20'
                            }`}
                            title="Langkah 4: Pemeriksaan Walkaround Teknisi Bandara"
                          >
                            <Wrench className={`w-3.5 h-3.5 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              {isChecking ? (
                                <>
                                  Teknis...
                                  <br />
                                  <strong className="text-white">
                                    {Math.round(selectedAircraft.serviceProgress || 0)}%
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ Laik
                                  <br />
                                  Terbang
                                </span>
                              ) : (
                                <>
                                  4. Cek
                                  <br />
                                  Teknis
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Step 5: Naikkan Pax */}
                      {(() => {
                        const isBoarding = selectedAircraft.status === 'boarding'
                        const isDone = !!selectedAircraft.turnaround?.boarded
                        const canRun =
                          !!selectedAircraft.turnaround?.techInspected && !isDone && !isBoarding
                        return (
                          <button
                            onClick={() => startBoarding(selectedAircraft.id)}
                            disabled={!canRun}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              isBoarding
                                ? 'bg-emerald-900/90 border-2 border-emerald-400 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                : isDone
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                                : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 disabled:opacity-20'
                            }`}
                            title="Langkah 5: Boarding Penumpang Penerbangan Keluar"
                          >
                            <Users
                              className={`w-3.5 h-3.5 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-emerald-400'}`}
                            />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              {isBoarding ? (
                                <>
                                  Naik...
                                  <br />
                                  <strong className="text-white">
                                    {selectedAircraft.passengers?.current || 0}
                                  </strong>
                                </>
                              ) : isDone ? (
                                <span className="text-emerald-400">
                                  ✓ 180
                                  <br />
                                  Pax
                                </span>
                              ) : (
                                <>
                                  5. Naikkan
                                  <br />
                                  Pax
                                </>
                              )}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Step 6: Dorongan Kembali (Pushback) */}
                      {(() => {
                        const canPushback =
                          selectedAircraft.status === 'ready_pushback' ||
                          (selectedAircraft.status === 'at_gate' &&
                            !!selectedAircraft.turnaround?.boarded)
                        return (
                          <button
                            onClick={() => orderPushback(selectedAircraft.id)}
                            disabled={!canPushback}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] transition-all cursor-pointer ${
                              canPushback
                                ? 'bg-blue-600 hover:bg-blue-500 border border-blue-300 text-white font-black shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                : 'bg-blue-950/60 border border-blue-500/40 text-blue-300 disabled:opacity-20'
                            }`}
                            title="Langkah 6: Izin Dorongan Kembali (Pushback tug menuju taxiway)"
                          >
                            <Truck className="w-3.5 h-3.5 mb-0.5 text-blue-200" />
                            <span className="text-[7.5px] font-bold text-center leading-tight">
                              6. Dorong
                              <br />
                              Pushback
                            </span>
                          </button>
                        )
                      })()}
                    </div>
                  )}

                {/* 4. GROUND TAXI & RUNWAY TAKE-OFF CLEARANCES */}
                {selectedAircraft &&
                  (selectedAircraft.status === 'holding' ||
                    selectedAircraft.status === 'pushback' ||
                    selectedAircraft.status === 'taxi_to_runway' ||
                    selectedAircraft.status === 'taxi_to_gate' ||
                    selectedAircraft.status === 'taxi_to_hangar' ||
                    selectedAircraft.status === 'takeoff' ||
                    selectedAircraft.status === 'landing') && (
                    <div className="flex items-center gap-1.5 flex-1">
                      {/* Taksi ke Runway 09 */}
                      {(() => {
                        const isTaxiing = selectedAircraft.status === 'taxi_to_runway'
                        const canTaxi = selectedAircraft.status === 'holding' && !isTaxiing
                        return (
                          <button
                            onClick={() => orderTaxi(selectedAircraft.id)}
                            disabled={!canTaxi && !isTaxiing}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[65px] transition-all cursor-pointer ${
                              isTaxiing
                                ? 'bg-amber-900/90 border-2 border-amber-400 text-white animate-pulse'
                                : canTaxi
                                ? 'bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                : 'bg-amber-600/35 border border-amber-400/40 text-amber-200 disabled:opacity-20'
                            }`}
                            title="Instruksikan pesawat taksi ke titik tunggu Runway 09"
                          >
                            <Plane className="w-4 h-4 mb-0.5 text-amber-300 rotate-45" />
                            <span className="text-[8px] font-bold text-center leading-tight">
                              {isTaxiing ? 'Taksi...' : <>Taksi ke<br />Rwy 09</>}
                            </span>
                          </button>
                        )
                      })()}

                      {/* Lepas Landas (Takeoff) */}
                      {(() => {
                        const isTakeoff = selectedAircraft.status === 'takeoff'
                        const canTakeoff =
                          selectedAircraft.status === 'holding' &&
                          (selectedAircraft.pos3d?.x ?? 0) <= -550
                        return (
                          <button
                            onClick={() => orderTakeoff(selectedAircraft.id)}
                            disabled={!canTakeoff && !isTakeoff}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[70px] transition-all cursor-pointer ${
                              canTakeoff
                                ? 'bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white font-black animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                                : 'bg-emerald-600/35 border border-emerald-400/40 text-emerald-200 disabled:opacity-20'
                            }`}
                            title="Izin Lepas Landas Runway 09"
                          >
                            <Send className="w-4 h-4 mb-0.5 text-emerald-200 -rotate-45" />
                            <span className="text-[8px] font-bold text-center leading-tight">
                              Lepas
                              <br />
                              Landas
                            </span>
                          </button>
                        )
                      })()}

                      {/* Tahan Posisi (Hold) */}
                      <button
                        onClick={() => orderHold(selectedAircraft.id)}
                        className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[55px] bg-red-600/35 hover:bg-red-600/60 border border-red-400/60 text-red-200 cursor-pointer"
                        title="Tahan Posisi / Berhenti Segera"
                      >
                        <Octagon className="w-4 h-4 mb-0.5 text-red-400" />
                        <span className="text-[8px] font-bold">Tahan</span>
                      </button>
                    </div>
                  )}

                {!selectedAircraft && (
                  <div className="text-gray-400 text-xs italic py-2 px-3">
                    Klik pesawat untuk membuka opsi kendali operasional
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Right: Voice Mic & Guidance */}
          <div className="flex flex-col items-end gap-1.5">
            {/* Live Transcript Bubble */}
            {transcript && (
              <div className="px-3 py-1.5 rounded-lg bg-black/90 border border-cyan-400 text-cyan-300 font-mono text-xs shadow-lg max-w-xs animate-fade-in">
                🎙️ "{transcript}"
              </div>
            )}

            {/* PTT Spacebar Button */}
            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs font-bold transition-all shadow-lg cursor-pointer ${
                micActive
                  ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(255,50,50,0.6)] animate-pulse'
                  : 'bg-[#071320]/90 border-cyan-500/40 text-gray-300 hover:text-white hover:border-cyan-400'
              }`}
            >
              <Mic className={`w-4 h-4 ${micActive ? 'text-white' : 'text-cyan-400'}`} />
              <span>PTT MIC [SPACE]</span>
            </button>

            {/* Mouse Drag Hint */}
            <div className="px-2.5 py-1 rounded bg-[#071320]/80 border border-gray-700/60 text-[10px] text-gray-300 font-mono backdrop-blur-sm">
              🖱️ Drag mouse untuk memutar pandangan Menara 3D
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
