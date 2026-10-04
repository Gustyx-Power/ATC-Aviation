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
  Radio,
  AlertTriangle,
  Camera,
  Search,
  Eye,
  Radar,
  Play,
  Pause,
  Sun,
  Volume2,
  Mic,
  Activity,
  CheckCircle,
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { radioSound } from '../utils/audioEffects'

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
  const activeChannel = useGameStore((state) => state.activeChannel)
  const setActiveChannel = useGameStore((state) => state.setActiveChannel)
  const tutorialText = useGameStore((state) => state.tutorialText)
  const tutorialActive = useGameStore((state) => state.tutorialActive)
  const dismissTutorial = useGameStore((state) => state.dismissTutorial)
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)
  const spawnAircraft = useGameStore((state) => state.spawnAircraft)
  const weather = useGameStore((state) => state.weather)

  // Clearances
  const orderPushback = useGameStore((state) => state.orderPushback)
  const orderTaxi = useGameStore((state) => state.orderTaxi)
  const orderTakeoff = useGameStore((state) => state.orderTakeoff)
  const orderHold = useGameStore((state) => state.orderHold)
  const orderClearedToLand = useGameStore((state) => state.orderClearedToLand)
  const orderGoAround = useGameStore((state) => state.orderGoAround)

  // Voice Command hook
  const { transcript, micActive, toggleListening } = useVoiceCommand()

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    approach: true,
    tower: true,
    ground: true,
    stand: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedAircraft = aircrafts.find((a) => a.id === selectedAircraftId)

  // Group aircraft by frequency / operational phase
  const approachPlanes = aircrafts.filter((a) => a.status === 'approach' || a.status === 'cruising')
  const towerPlanes = aircrafts.filter((a) => a.status === 'holding' || a.status === 'takeoff' || a.status === 'landing')
  const groundPlanes = aircrafts.filter((a) => a.status === 'pushback' || a.status === 'taxiing')
  const standPlanes = aircrafts.filter((a) => a.status === 'at_gate')

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden font-mono">
      {/* ============================================================== */}
      {/* 1. PROFESSIONAL ATC TOP TELEMETRY BAR                          */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: ATC System & Telemetry */}
        <div className="flex items-center gap-2.5">
          {/* ATC Aviation Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071320]/90 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ffaa] animate-ping" />
            <span className="font-bold text-white tracking-wider text-xs">
              ATC AVIATION <span className="text-cyan-400">| TOWER 3D</span>
            </span>
          </div>

          {/* Air Miles Currency */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-amber-500/30 backdrop-blur-md text-white font-bold text-xs shadow-md">
            <span className="text-amber-400">🪙</span>
            <span className="text-amber-300 font-semibold">{airMiles} Mil Udara</span>
          </div>

          {/* Active Flights Counter + Add Traffic */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-cyan-500/30 backdrop-blur-md text-white font-bold text-xs shadow-md">
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-300">Trafik: <strong className="text-white">{aircrafts.length}/6</strong></span>
            <button
              onClick={spawnAircraft}
              className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-sm text-[10px]"
              title="Spawn Traffic Baru"
            >
              <Plus className="w-3 h-3 mr-0.5" /> TRAFFIC
            </button>
          </div>

          {/* Operations Score & Landed & Level */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071320]/85 border border-gray-700/50 backdrop-blur-md text-xs">
            <span className="text-gray-400">LANDED: <strong className="text-emerald-400">{landedCount}</strong></span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">SKOR: <strong className="text-cyan-400">{score}</strong></span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">LVL: <strong className="text-amber-400">{airportLevel}</strong></span>
          </div>
        </div>

        {/* Right: Airport Station Identity */}
        <div className="flex flex-col items-end pr-2">
          <div className="text-sm font-bold tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>SOEKARNO-HATTA TWR (WIII)</span>
          </div>
          <div className="text-[10px] text-gray-400 tracking-wide">
            FREQ: 118.200 MHz • ATIS INFO 'B' • RUNWAY 09
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. RIGHT ACCORDION PANEL (ATC FREQUENCY CHANNELS)              */}
      {/* ============================================================== */}
      <div className="absolute top-16 right-3 w-64 max-h-[75vh] flex flex-col gap-1.5 pointer-events-auto overflow-y-auto text-xs scrollbar-thin">
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
              <span className="font-bold text-cyan-300">PENDEKATAN</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-400">
              <span>130.30</span>
              {openSections.approach ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.approach && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {approachPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat</div>
              ) : (
                approachPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      ac.id === selectedAircraftId
                        ? 'bg-cyan-600/30 border border-cyan-400 text-white font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="text-white block font-bold">{ac.id}</span>
                      <span className="text-[9px] text-cyan-300">{ac.airline || 'Airliner'}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-cyan-400 block">FL0{Math.round(ac.altitude / 100)}</span>
                      <span className="text-gray-400 text-[9px] uppercase">{ac.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* MENARA (Tower 121.32) */}
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
              <span>121.32</span>
              {openSections.tower ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.tower && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {towerPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat</div>
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
                      <span className="text-[9px] text-red-300">Threshold 09</span>
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

        {/* TANAH (Ground 121.75) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-amber-500/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('ground')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900/60 cursor-pointer border-b border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
                <Truck className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-amber-300">TANAH (GROUND)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400">
              <span>121.75</span>
              {openSections.ground ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.ground && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {groundPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat</div>
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
                      <span className="text-[9px] text-amber-300">Taxiway Alpha</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-amber-400 block uppercase font-bold">{ac.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* DI STAND (Gate Stand Parked) */}
        <div className="rounded-lg bg-[#06101c]/90 border border-gray-600/40 backdrop-blur-md shadow-xl overflow-hidden">
          <div
            onClick={() => toggleSection('stand')}
            className="flex items-center justify-between px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-800/80 cursor-pointer border-b border-gray-700/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 flex items-center justify-center">
                <Compass className="w-2.5 h-2.5 text-black" />
              </div>
              <span className="font-bold text-gray-200">DI STAND (PARKIR)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>{standPlanes.length}</span>
              {openSections.stand ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </div>
          {openSections.stand && (
            <div className="p-1 flex flex-col gap-1 bg-[#050c15]">
              {standPlanes.length === 0 ? (
                <div className="text-[10px] text-gray-500 text-center py-1">Tidak ada pesawat</div>
              ) : (
                standPlanes.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => selectAircraft(ac.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      ac.id === selectedAircraftId
                        ? 'bg-blue-600/30 border border-blue-400 text-white font-bold shadow-[0_0_10px_rgba(0,150,255,0.3)]'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="text-white block font-bold">{ac.id}</span>
                      <span className="text-[9px] text-gray-400">{ac.gate || 'Stand 1'} • {ac.destination}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-emerald-400 block font-bold">READY PUSHBACK</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM AREA: REALISTIC PILOT TRANSMISSION & CLEARANCES      */}
      {/* ============================================================== */}
      <footer className="w-full flex flex-col gap-2.5 pointer-events-auto">
        {/* INTERACTIVE PILOT TRANSMISSION DIALOG BOX (REALISTIC AVIATOR AVATAR) */}
        {tutorialActive && (
          <div className="self-center max-w-xl w-full bg-[#071320]/95 border-2 border-cyan-400/80 rounded-xl p-3 px-4 backdrop-blur-md shadow-[0_4px_30px_rgba(0,229,255,0.35)] flex items-center gap-4 animate-bounce-subtle">
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
                    KAPTEN PILOT (VHF 118.200)
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
                    className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50 cursor-pointer text-[10px] flex items-center gap-1"
                    title="Dengarkan Suara Pilot"
                  >
                    <Volume2 className="w-3 h-3" /> SUARA
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

        {/* BOTTOM ROW: WEATHER & CAMERAS (LEFT) + ACTION TOOLBAR (CENTER) + PTT (RIGHT) */}
        <div className="flex items-end justify-between w-full gap-3">
          {/* Bottom Left: Weather & Camera Controls */}
          <div className="flex flex-col gap-2">
            {/* Weather Card */}
            <div className="p-2.5 rounded-lg bg-[#071320]/90 border border-gray-700/60 backdrop-blur-md text-white font-mono text-[11px] shadow-lg flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>CUACA: {weather.condition}</span>
              </div>
              <div className="text-[10px] text-gray-300">
                Suhu: {weather.temp}°C | Angin: {weather.wind}
              </div>
              <div className="text-[10px] text-gray-400">{weather.time} WIB • QNH 1012 hPa</div>
            </div>

            {/* Camera Presets & Speed */}
            <div className="flex items-center gap-1 p-1 bg-[#071320]/90 border border-cyan-500/30 rounded-lg backdrop-blur-md shadow-lg">
              <button
                onClick={() => setViewMode('tower')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'tower'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Pandangan Menara (Drag mouse untuk melihat sekeliling)"
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
                title="Teropong Menara (Zoom ke pesawat terpilih)"
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

              <button
                onClick={() => setViewMode('radar2d')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'radar2d'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Layar Radar 2D TRACON"
              >
                <Radar className="w-4 h-4" />
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
          {/* BOTTOM CENTER: PROFESSIONAL CLEARANCE TOOLBAR                  */}
          {/* ============================================================== */}
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#06101c]/95 border border-cyan-500/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            {/* 1. Ground Frequency */}
            <button
              onClick={() => setActiveChannel('ground')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                activeChannel === 'ground' ? 'bg-amber-500/25 border border-amber-400 text-amber-300' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Tanah</span>
            </button>

            {/* 2. Reposisi / Go Around */}
            <button
              onClick={() => selectedAircraft && orderGoAround(selectedAircraft.id)}
              disabled={!selectedAircraft}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Pergi Kesana</span>
            </button>

            {/* 3. Stand / Gate */}
            <button
              onClick={() => setActiveChannel('stand')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] transition-all cursor-pointer ${
                activeChannel === 'stand' ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Berdiri</span>
            </button>

            {/* 4. Dorongan Kembali (Pushback) */}
            <button
              onClick={() => selectedAircraft && orderPushback(selectedAircraft.id)}
              disabled={!selectedAircraft || selectedAircraft.status !== 'at_gate'}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[62px] bg-blue-600/35 hover:bg-blue-600/60 border border-blue-400/60 text-blue-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Izin Dorongan Kembali (Pushback)"
            >
              <Truck className="w-5 h-5 mb-0.5 text-blue-300" />
              <span className="text-[9px] font-bold text-center leading-none">Dorongan<br />kembali</span>
            </button>

            {/* 5. Taksi (Taxi to Holding Point) */}
            <button
              onClick={() => selectedAircraft && orderTaxi(selectedAircraft.id)}
              disabled={!selectedAircraft || (selectedAircraft.status !== 'pushback' && selectedAircraft.status !== 'at_gate')}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] bg-amber-600/35 hover:bg-amber-600/60 border border-amber-400/60 text-amber-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Taksi ke Titik Tunggu Runway 09"
            >
              <Plane className="w-5 h-5 mb-0.5 text-amber-300 rotate-45" />
              <span className="text-[9px] font-bold">Taksi</span>
            </button>

            {/* 6. Lepas Landas (Cleared for Takeoff) */}
            <button
              onClick={() => selectedAircraft && orderTakeoff(selectedAircraft.id)}
              disabled={!selectedAircraft || (selectedAircraft.status !== 'holding' && selectedAircraft.status !== 'taxiing')}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[62px] bg-emerald-600/35 hover:bg-emerald-600/60 border border-emerald-400/60 text-emerald-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Izin Lepas Landas Runway 09"
            >
              <Send className="w-5 h-5 mb-0.5 text-emerald-300 -rotate-45" />
              <span className="text-[9px] font-bold text-center leading-none">Lepas<br />landas</span>
            </button>

            {/* 6b. Izin Mendarat (Cleared to Land) */}
            <button
              onClick={() => selectedAircraft && orderClearedToLand(selectedAircraft.id)}
              disabled={!selectedAircraft || selectedAircraft.status !== 'approach'}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[62px] bg-cyan-600/35 hover:bg-cyan-600/60 border border-cyan-400/60 text-cyan-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Izin Mendarat Runway 09"
            >
              <CheckCircle className="w-5 h-5 mb-0.5 text-cyan-300" />
              <span className="text-[9px] font-bold text-center leading-none">Izin<br />Mendarat</span>
            </button>

            {/* 7. Tahan Posisi (Hold) */}
            <button
              onClick={() => selectedAircraft && orderHold(selectedAircraft.id)}
              disabled={!selectedAircraft}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] bg-red-600/35 hover:bg-red-600/60 border border-red-400/60 text-red-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Tahan Posisi / Stop"
            >
              <Octagon className="w-5 h-5 mb-0.5 text-red-400" />
              <span className="text-[9px] font-bold">Tahan</span>
            </button>

            {/* 8. Transfer Frequensi */}
            <button
              onClick={() => setActiveChannel('tower')}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Radio className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Transfer</span>
            </button>

            {/* 9. Darurat (Emergency Priority) */}
            <button
              onClick={() => {
                if (selectedAircraft) {
                  useGameStore.setState((state) => ({
                    aircrafts: state.aircrafts.map((a) =>
                      a.id === selectedAircraft.id ? { ...a, status: 'emergency' } : a
                    ),
                  }))
                }
              }}
              disabled={!selectedAircraft}
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[58px] text-red-400 hover:bg-red-600/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Darurat</span>
            </button>
          </div>

          {/* Bottom Right: Voice Mic & Drag Guide Hint */}
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

            {/* First-person Drag Guide badge */}
            <div className="px-2.5 py-1 rounded bg-[#071320]/80 border border-gray-700/60 text-[10px] text-gray-300 font-mono backdrop-blur-sm">
              🖱️ Drag mouse pada layar untuk memutar kamera Menara 3D
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
