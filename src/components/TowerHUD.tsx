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
  ShieldAlert,
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

  // Ground Turnaround & Clearance Actions
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
  const triggerEmergency = useGameStore((state) => state.triggerEmergency)

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

  // Group aircraft by operations section
  const approachPlanes = aircrafts.filter((a) => a.status === 'approach' || a.status === 'cruising' || a.status === 'emergency')
  const towerPlanes = aircrafts.filter((a) => a.status === 'holding' || a.status === 'takeoff' || a.status === 'landing')
  const groundPlanes = aircrafts.filter((a) => a.status === 'pushback' || a.status === 'taxi_to_runway' || a.status === 'taxi_to_gate' || a.status === 'taxi_to_hangar')
  const gatePlanes = aircrafts.filter((a) => a.status === 'at_gate' || a.status === 'deboarding' || a.status === 'cleaning' || a.status === 'refueling' || a.status === 'maintenance_check' || a.status === 'boarding')
  const hangarPlanes = aircrafts.filter((a) => a.status === 'in_hangar')

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

        {/* Right: Emergency Simulation Trigger & Runway Status */}
        <div className="flex items-center gap-2">
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

          {/* In-Flight Mayday Emergency Simulator Button */}
          <button
            onClick={() => triggerEmergency()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 text-xs font-bold shadow-[0_0_15px_rgba(255,50,50,0.4)] transition-all cursor-pointer"
            title="Panggil Skenario Pendaratan Darurat (Mayday)"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
            <span>SIMULASI DARURAT</span>
          </button>
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
                      </div>
                      <span className="text-[9px] text-cyan-300">{ac.airline || 'Airliner'}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-cyan-400 block font-bold">ALT {ac.altitude} FT</span>
                      <span className="text-gray-400 text-[9px] uppercase">{ac.status}</span>
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

        {/* TERMINAL & GATES (APRON TURNAROUND) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-blue-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('gates')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-blue-950/70 hover:bg-blue-900/60 cursor-pointer border-b border-blue-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
                <Compass className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-blue-300">TERMINAL & GATES (APRON)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-400">
              <span>{gatePlanes.length}</span>
              {openSections.gates ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.gates && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {gatePlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Semua Gate Kosong</div>
              ) : (
                gatePlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex flex-col p-1.5 rounded cursor-pointer transition-all ${
                      ac.id === selectedAircraftId
                        ? 'bg-blue-600/30 border border-blue-400 text-white font-bold shadow-[0_0_10px_rgba(0,150,255,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{ac.id} • {ac.gate || 'Gate 1'}</span>
                      <span className="text-emerald-400 text-[9px] font-bold uppercase">{ac.status.replace(/_/g, ' ')}</span>
                    </div>
                    {/* Turnaround Progress Bar if actively servicing */}
                    {ac.serviceProgress !== undefined && ac.serviceProgress > 0 && ac.serviceProgress < 100 && (
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${ac.serviceProgress}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>👥 {ac.passengers?.current || 0} pax</span>
                      <span>⛽ {ac.fuel}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* HANGAR PERAWATAN */}
        <div className="rounded-lg bg-[#06101c]/90 border border-slate-600/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('hangar')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-400 flex items-center justify-center">
                <Wrench className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-slate-200">HANGAR PERAWATAN</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{hangarPlanes.length}</span>
              {openSections.hangar ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.hangar && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {hangarPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat di hangar</div>
              ) : (
                hangarPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-gray-200 cursor-pointer"
                  >
                    <div>
                      <span className="text-white block font-bold">{ac.id}</span>
                      <span className="text-[9px] text-amber-300">Pemeriksaan Berkala</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold">PERBAIKAN</span>
                  </div>
                ))
              )}
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
          {/* BOTTOM CENTER: COMPREHENSIVE GROUND & FLIGHT OPERATIONS BAR    */}
          {/* ============================================================== */}
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#06101c]/95 border border-cyan-500/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
            {/* 1. Arahkan ke Gate / Hangar */}
            <div className="flex items-center gap-1 border-r border-gray-700/60 pr-2">
              <button
                onClick={() => selectedAircraft && assignDestination(selectedAircraft.id, 'Gate 1')}
                disabled={!selectedAircraft || (selectedAircraft.status !== 'at_gate' && selectedAircraft.status !== 'taxi_to_gate' && selectedAircraft.status !== 'landing')}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[50px] bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-300 disabled:opacity-20 cursor-pointer"
                title="Arahkan ke Gate 1"
              >
                <Compass className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">Gate 1</span>
              </button>
              <button
                onClick={() => selectedAircraft && assignDestination(selectedAircraft.id, 'Gate 2')}
                disabled={!selectedAircraft || (selectedAircraft.status !== 'at_gate' && selectedAircraft.status !== 'taxi_to_gate' && selectedAircraft.status !== 'landing')}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[50px] bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-300 disabled:opacity-20 cursor-pointer"
                title="Arahkan ke Gate 2"
              >
                <Compass className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">Gate 2</span>
              </button>
              <button
                onClick={() => selectedAircraft && assignDestination(selectedAircraft.id, 'Hangar')}
                disabled={!selectedAircraft}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[52px] bg-slate-900 hover:bg-slate-800 border border-slate-500/40 text-slate-300 disabled:opacity-20 cursor-pointer"
                title="Arahkan ke Hangar Perawatan"
              >
                <Wrench className="w-4 h-4 mb-0.5 text-amber-400" />
                <span className="text-[8px] font-bold">Hangar</span>
              </button>
            </div>

            {/* 2. Turnaround Service Operations (Step-by-Step Manual Clearances) */}
            <div className="flex items-center gap-1 border-r border-gray-700/60 pr-2">
              {/* Penurunan Penumpang */}
              {(() => {
                const isDeboarding = selectedAircraft?.status === 'deboarding'
                const isDone = !!selectedAircraft?.turnaround?.deboarded
                const canRun = !!selectedAircraft && (selectedAircraft.status === 'at_gate' || selectedAircraft.status === 'taxi_to_gate') && !isDone && !isDeboarding

                return (
                  <button
                    onClick={() => selectedAircraft && startDeboarding(selectedAircraft.id)}
                    disabled={!canRun}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isDeboarding
                        ? 'bg-indigo-900/90 border-2 border-indigo-400 text-white animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 disabled:opacity-20'
                    }`}
                    title={isDone ? 'Penurunan penumpang selesai' : 'Mulai Penurunan Penumpang & Bagasi'}
                  >
                    <Users className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                    <span className="text-[8px] font-bold text-center leading-tight">
                      {isDeboarding ? (
                        <>Turun...<br /><strong className="text-white">{Math.round(selectedAircraft?.serviceProgress || 0)}%</strong></>
                      ) : isDone ? (
                        <span className="text-emerald-400">✓ Pax<br />Turun</span>
                      ) : (
                        <>Turunkan<br />Pax</>
                      )}
                    </span>
                  </button>
                )
              })()}

              {/* Bersihkan & Cek Kabin */}
              {(() => {
                const isCleaning = selectedAircraft?.status === 'cleaning'
                const isDone = !!selectedAircraft?.turnaround?.cabinCleaned
                const canRun = !!selectedAircraft && !!selectedAircraft?.turnaround?.deboarded && !isDone && !isCleaning

                return (
                  <button
                    onClick={() => selectedAircraft && startCabinService(selectedAircraft.id)}
                    disabled={!canRun}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isCleaning
                        ? 'bg-teal-900/90 border-2 border-teal-400 text-white animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-teal-950/70 hover:bg-teal-900 border border-teal-500/50 text-teal-300 disabled:opacity-20'
                    }`}
                    title={isDone ? 'Kabin bersih dan katering terisi' : 'Pembersihan & Cek Kabin (Setelah pax turun)'}
                  >
                    <Sparkles className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                    <span className="text-[8px] font-bold text-center leading-tight">
                      {isCleaning ? (
                        <>Kabin...<br /><strong className="text-white">{Math.round(selectedAircraft?.serviceProgress || 0)}%</strong></>
                      ) : isDone ? (
                        <span className="text-emerald-400">✓ Kabin<br />Bersih</span>
                      ) : (
                        <>Cek & Rapih<br />Kabin</>
                      )}
                    </span>
                  </button>
                )
              })()}

              {/* Pengisian Bahan Bakar Avtur */}
              {(() => {
                const isRefueling = selectedAircraft?.status === 'refueling'
                const isDone = !!selectedAircraft?.turnaround?.refueled
                const canRun = !!selectedAircraft && !!selectedAircraft?.turnaround?.cabinCleaned && !isDone && !isRefueling

                return (
                  <button
                    onClick={() => selectedAircraft && startRefueling(selectedAircraft.id)}
                    disabled={!canRun}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isRefueling
                        ? 'bg-amber-900/90 border-2 border-amber-400 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 disabled:opacity-20'
                    }`}
                    title={isDone ? 'Avtur 100% penuh' : 'Truk Tangki Mengisi Bahan Bakar Avtur'}
                  >
                    <Fuel className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-[8px] font-bold text-center leading-tight">
                      {isRefueling ? (
                        <>Isi...<br /><strong className="text-white">{selectedAircraft?.fuel}%</strong></>
                      ) : isDone ? (
                        <span className="text-emerald-400">✓ 100%<br />Avtur</span>
                      ) : (
                        <>Isi<br />Avtur</>
                      )}
                    </span>
                  </button>
                )
              })()}

              {/* Pengecekan Teknis Pesawat */}
              {(() => {
                const isChecking = selectedAircraft?.status === 'maintenance_check'
                const isDone = !!selectedAircraft?.turnaround?.techInspected
                const canRun = !!selectedAircraft && !!selectedAircraft?.turnaround?.refueled && !isDone && !isChecking

                return (
                  <button
                    onClick={() => selectedAircraft && startTechnicalCheck(selectedAircraft.id)}
                    disabled={!canRun}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isChecking
                        ? 'bg-orange-900/90 border-2 border-orange-400 text-white animate-pulse shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-orange-950/70 hover:bg-orange-900 border border-orange-500/50 text-orange-300 disabled:opacity-20'
                    }`}
                    title={isDone ? 'Pemeriksaan teknis selesai, laik terbang' : 'Pemeriksaan Teknis Walkaround Teknisi'}
                  >
                    <Wrench className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : ''}`} />
                    <span className="text-[8px] font-bold text-center leading-tight">
                      {isChecking ? (
                        <>Teknis...<br /><strong className="text-white">{Math.round(selectedAircraft?.serviceProgress || 0)}%</strong></>
                      ) : isDone ? (
                        <span className="text-emerald-400">✓ Laik<br />Terbang</span>
                      ) : (
                        <>Cek<br />Teknis</>
                      )}
                    </span>
                  </button>
                )
              })()}

              {/* Penaikan Penumpang (Boarding) */}
              {(() => {
                const isBoarding = selectedAircraft?.status === 'boarding'
                const isDone = !!selectedAircraft?.turnaround?.boarded
                const canRun = !!selectedAircraft && !!selectedAircraft?.turnaround?.techInspected && !isDone && !isBoarding

                return (
                  <button
                    onClick={() => selectedAircraft && startBoarding(selectedAircraft.id)}
                    disabled={!canRun}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isBoarding
                        ? 'bg-emerald-900/90 border-2 border-emerald-400 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 disabled:opacity-20'
                    }`}
                    title={isDone ? 'Boarding 180 pax selesai' : 'Boarding Penumpang Penerbangan Baru'}
                  >
                    <Users className={`w-4 h-4 mb-0.5 ${isDone ? 'text-emerald-400' : 'text-emerald-400'}`} />
                    <span className="text-[8px] font-bold text-center leading-tight">
                      {isBoarding ? (
                        <>Naik...<br /><strong className="text-white">{selectedAircraft?.passengers?.current || 0} pax</strong></>
                      ) : isDone ? (
                        <span className="text-emerald-400">✓ 180<br />Pax</span>
                      ) : (
                        <>Naikkan<br />Pax</>
                      )}
                    </span>
                  </button>
                )
              })()}
            </div>

            {/* 3. Flight Clearances (Pushback, Taxi, Takeoff, Land) */}
            <div className="flex items-center gap-1">
              {/* Dorongan Kembali (Pushback) */}
              {(() => {
                const isPushback = selectedAircraft?.status === 'pushback'
                const canPushback = !!selectedAircraft && (selectedAircraft.status === 'ready_pushback' || (selectedAircraft.status === 'at_gate' && !!selectedAircraft.turnaround?.boarded)) && !isPushback

                return (
                  <button
                    onClick={() => selectedAircraft && orderPushback(selectedAircraft.id)}
                    disabled={!canPushback && !isPushback}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      isPushback
                        ? 'bg-blue-900/90 border-2 border-blue-400 text-white animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : canPushback
                        ? 'bg-blue-600/50 hover:bg-blue-600/80 border border-blue-400 text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                        : 'bg-blue-600/35 border border-blue-400/40 text-blue-200 disabled:opacity-20'
                    }`}
                    title="Izin Dorongan Kembali (Pushback)"
                  >
                    <Truck className="w-4 h-4 mb-0.5 text-blue-300" />
                    <span className="text-[8px] font-bold text-center leading-none">
                      {isPushback ? 'Mendorong...' : <>Dorongan<br />kembali</>}
                    </span>
                  </button>
                )
              })()}

              {/* Taksi ke Runway 09 */}
              {(() => {
                const isTaxiing = selectedAircraft?.status === 'taxi_to_runway'
                const canTaxi = !!selectedAircraft && selectedAircraft.status === 'holding' && !isTaxiing

                return (
                  <button
                    onClick={() => selectedAircraft && orderTaxi(selectedAircraft.id)}
                    disabled={!canTaxi && !isTaxiing}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[56px] transition-all cursor-pointer ${
                      isTaxiing
                        ? 'bg-amber-900/90 border-2 border-amber-400 text-white animate-pulse'
                        : canTaxi
                        ? 'bg-amber-600/50 hover:bg-amber-600/80 border border-amber-400 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'bg-amber-600/35 border border-amber-400/40 text-amber-200 disabled:opacity-20'
                    }`}
                    title="Taksi ke Titik Tunggu Runway 09"
                  >
                    <Plane className="w-4 h-4 mb-0.5 text-amber-300 rotate-45" />
                    <span className="text-[8px] font-bold">{isTaxiing ? 'Taksi...' : 'Taksi'}</span>
                  </button>
                )
              })()}

              {/* Izin Lepas Landas (Takeoff) */}
              {(() => {
                const isTakeoff = selectedAircraft?.status === 'takeoff'
                const canTakeoff = !!selectedAircraft && selectedAircraft.status === 'holding' && (selectedAircraft.pos3d?.x ?? 0) <= -550

                return (
                  <button
                    onClick={() => selectedAircraft && orderTakeoff(selectedAircraft.id)}
                    disabled={!canTakeoff && !isTakeoff}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                      canTakeoff
                        ? 'bg-emerald-600/70 hover:bg-emerald-600 border-2 border-emerald-400 text-white font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                        : 'bg-emerald-600/35 border border-emerald-400/40 text-emerald-200 disabled:opacity-20'
                    }`}
                    title="Izin Lepas Landas Runway 09"
                  >
                    <Send className="w-4 h-4 mb-0.5 text-emerald-300 -rotate-45" />
                    <span className="text-[8px] font-bold text-center leading-none">Lepas<br />landas</span>
                  </button>
                )
              })()}

              {/* Izin Mendarat (Cleared to Land) */}
              <button
                onClick={() => selectedAircraft && orderClearedToLand(selectedAircraft.id)}
                disabled={!selectedAircraft || (selectedAircraft.status !== 'approach' && selectedAircraft.status !== 'emergency')}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[58px] bg-cyan-600/35 hover:bg-cyan-600/60 border border-cyan-400/60 text-cyan-200 disabled:opacity-20 cursor-pointer"
                title="Izin Mendarat Runway 09"
              >
                <CheckCircle className="w-4 h-4 mb-0.5 text-cyan-300" />
                <span className="text-[8px] font-bold text-center leading-none">Izin<br />Mendarat</span>
              </button>

              {/* Tahan Posisi (Hold) */}
              <button
                onClick={() => selectedAircraft && orderHold(selectedAircraft.id)}
                disabled={!selectedAircraft}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] bg-red-600/35 hover:bg-red-600/60 border border-red-400/60 text-red-200 disabled:opacity-20 cursor-pointer"
                title="Tahan Posisi / Berhenti"
              >
                <Octagon className="w-4 h-4 mb-0.5 text-red-400" />
                <span className="text-[8px] font-bold">Tahan</span>
              </button>

              {/* Go Around */}
              <button
                onClick={() => selectedAircraft && orderGoAround(selectedAircraft.id)}
                disabled={!selectedAircraft || selectedAircraft.status !== 'approach'}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] bg-purple-950/60 hover:bg-purple-900 border border-purple-400/50 text-purple-200 disabled:opacity-20 cursor-pointer"
                title="Batalkan Pendaratan / Putar Balik"
              >
                <ArrowRightLeft className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold text-center leading-none">Go<br />Around</span>
              </button>
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
