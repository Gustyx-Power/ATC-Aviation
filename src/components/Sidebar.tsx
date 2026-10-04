import React, { useEffect, useRef, useState } from 'react'
import {
  Plane,
  Radio,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Trophy,
  Mic,
  Send,
  HelpCircle,
  X,
  Volume2,
  Plus,
  AlertTriangle,
} from 'lucide-react'

import { useGameStore } from '../store/useGameStore'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { radioSound } from '../utils/audioEffects'

interface SidebarProps {
  fps: number
}

export const Sidebar: React.FC<SidebarProps> = ({ fps }) => {
  const aircrafts = useGameStore((state) => state.aircrafts)
  const selectedAircraftId = useGameStore((state) => state.selectedAircraftId)
  const selectAircraft = useGameStore((state) => state.selectAircraft)
  const score = useGameStore((state) => state.score)
  const landedCount = useGameStore((state) => state.landedCount)
  const survivalTime = useGameStore((state) => state.survivalTime)
  const isPaused = useGameStore((state) => state.isPaused)
  const togglePause = useGameStore((state) => state.togglePause)
  const resetGame = useGameStore((state) => state.resetGame)
  const commsLog = useGameStore((state) => state.commsLog)
  const setAircraftHeading = useGameStore((state) => state.setAircraftHeading)
  const setAircraftSpeed = useGameStore((state) => state.setAircraftSpeed)
  const setWaypoints = useGameStore((state) => state.setWaypoints)
  const spawnAircraft = useGameStore((state) => state.spawnAircraft)
  const gameOver = useGameStore((state) => state.gameOver)

  // Voice Command Hook (Phase 3)
  const {
    transcript,
    isSupported,
    micActive,
    toggleListening,
    processManualCommand,
  } = useVoiceCommand()

  const [cliInput, setCliInput] = useState<string>('')
  const [showVoiceHelp, setShowVoiceHelp] = useState<boolean>(false)
  const commsEndRef = useRef<HTMLDivElement | null>(null)

  const selectedAircraft = aircrafts.find((ac) => ac.id === selectedAircraftId)

  // Auto-scroll comms log to bottom on new message
  useEffect(() => {
    commsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [commsLog, transcript])

  // Zulu time clock
  const [zuluTime, setZuluTime] = useState<string>('')
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setZuluTime(now.toISOString().substring(11, 19) + 'Z')
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format survival time in mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Handle CLI text submission
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliInput.trim()) return
    processManualCommand(cliInput)
    setCliInput('')
  }

  return (
    <aside className="w-full h-full bg-[#080e18] border-l border-[#00e5ff]/20 flex flex-col text-xs font-mono select-none overflow-hidden shadow-2xl relative">
      {/* 1. Header Bar: System telemetry */}
      <div className="p-3 bg-[#0a1424] border-b border-[#00e5ff]/25 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/40 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-[#00e5ff]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white">ATC AVIATION</h1>
            <p className="text-[10px] text-[#00ffaa]">TERMINAL RADAR CONTROL</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowVoiceHelp(true)}
            className="p-1.5 rounded bg-gray-800/80 hover:bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 transition-colors"
            title="Voice Commands Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => radioSound.playRogerBeep()}
            className="p-1.5 rounded bg-gray-800/80 hover:bg-[#00ffaa]/20 text-[#00ffaa] border border-gray-700 transition-colors"
            title="Test VHF Radio Squelch & Roger Beep"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <div className="px-2 py-0.5 rounded bg-black/40 border border-gray-800 text-[10px] text-gray-300">
            {fps} FPS

          </div>
          <button
            onClick={togglePause}
            className={`p-1.5 rounded border transition-colors ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 hover:bg-emerald-500/30'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Telemetry HUD row */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-[#060b13] border-b border-gray-800/80 text-center">
        <div className="p-1 bg-[#0a1524] rounded border border-gray-800">
          <div className="text-[9px] text-gray-400 flex items-center justify-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-[#00e5ff]" /> SURVIVAL
          </div>
          <div className="text-xs font-bold text-white mt-0.5">{formatTime(survivalTime)}</div>
        </div>
        <div className="p-1 bg-[#0a1524] rounded border border-gray-800">
          <div className="text-[9px] text-gray-400 flex items-center justify-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> LANDED
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-0.5">{landedCount}</div>
        </div>
        <div className="p-1 bg-[#0a1524] rounded border border-gray-800">
          <div className="text-[9px] text-gray-400 flex items-center justify-center gap-0.5">
            <Trophy className="w-2.5 h-2.5 text-amber-400" /> SCORE
          </div>
          <div className="text-xs font-bold text-amber-400 mt-0.5">{score}</div>
        </div>
        <button
          onClick={toggleListening}
          className={`p-1 rounded border transition-all ${
            micActive
              ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_10px_rgba(255,50,50,0.4)]'
              : 'bg-[#0a1524] border-gray-800 text-cyan-400 hover:border-[#00e5ff]/50'
          }`}
          title="Click to toggle mic or hold SPACEBAR"
        >
          <div className="text-[9px] text-gray-400 flex items-center justify-center gap-0.5">
            {micActive ? (
              <Mic className="w-2.5 h-2.5 text-red-400 animate-pulse" />
            ) : (
              <Radio className="w-2.5 h-2.5 text-cyan-400" />
            )}
            <span>PTT MIC</span>
          </div>
          <div className="text-[10px] font-bold mt-0.5 flex items-center justify-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                micActive ? 'bg-red-500 animate-ping' : 'bg-gray-600'
              }`}
            />
            <span className={micActive ? 'text-red-400 font-bold' : 'text-gray-400'}>
              {micActive ? 'TRANSMITTING' : 'PUSH [SPACE]'}
            </span>
          </div>
        </button>
      </div>

      {/* 3. Middle: Flight Strips Section */}
      <div className="flex-1 min-h-0 flex flex-col border-b border-[#00e5ff]/20">
        <div className="px-3 py-1.5 bg-[#0a1320] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00e5ff]">
            <Plane className="w-3.5 h-3.5" />
            <span>ACTIVE FLIGHT STRIPS ({aircrafts.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={spawnAircraft}
              disabled={gameOver || aircrafts.length >= 6}
              className="px-2 py-0.5 rounded bg-[#00e5ff]/15 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
              title="Spawn new random inbound flight"
            >
              <Plus className="w-3 h-3" />
              <span>TRAFFIC</span>
            </button>
            <span className="text-[10px] text-gray-400">ZULU: {zuluTime}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {aircrafts.map((ac) => {
            const isSelected = ac.id === selectedAircraftId
            const hasConflict = ac.conflictWith && ac.conflictWith.length > 0
            const isLowFuel = ac.fuel <= 25

            return (
              <div
                key={ac.id}
                onClick={() => selectAircraft(ac.id)}
                className={`cursor-pointer rounded border p-2.5 transition-all ${
                  hasConflict
                    ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(255,50,50,0.35)] animate-pulse'
                    : isSelected
                    ? 'bg-[#0b2030] border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                    : 'bg-[#091522]/90 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Strip Top Row */}
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">{ac.id}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30">
                      {ac.aircraftType || 'B738'}
                    </span>
                    <span className="text-[10px] text-gray-400">SQ {ac.squawk || '1200'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasConflict && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white flex items-center gap-0.5 animate-bounce">
                        <AlertTriangle className="w-2.5 h-2.5" /> SEPARATION RISK
                      </span>
                    )}
                    {isLowFuel && !hasConflict && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500">
                        LOW FUEL
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        ac.status === 'landing'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : ac.status === 'emergency'
                          ? 'bg-red-950 text-red-400 border border-red-700 animate-pulse'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {ac.status}
                    </span>
                  </div>
                </div>

                {/* Strip Telemetry Data */}
                <div className="grid grid-cols-4 gap-1 text-[11px] text-gray-300">
                  <div>
                    <span className="text-[9px] text-gray-500 block">HDG</span>
                    <span className="font-bold text-white">
                      {String(Math.round(ac.heading)).padStart(3, '0')}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">ALT</span>
                    <span className="font-bold text-white">
                      FL{String(Math.round(ac.altitude / 100)).padStart(3, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">SPD</span>
                    <span className="font-bold text-white">{Math.round(ac.speed * 100)}kt</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">FUEL</span>
                    <span
                      className={`font-bold ${
                        ac.fuel < 25 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {Math.round(ac.fuel)}%
                    </span>
                  </div>
                </div>

                {/* Fuel gauge mini bar */}
                <div className="w-full bg-gray-950 h-1 rounded-full mt-2 overflow-hidden border border-gray-800">
                  <div
                    className={`h-full transition-all ${
                      ac.fuel < 25 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${ac.fuel}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Tactical Quick Vector Control Panel */}
      {selectedAircraft && (
        <div className="p-2.5 bg-[#091522] border-b border-gray-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">VECTOR {selectedAircraft.id}</span>
            <span className="text-[#00e5ff] font-bold">
              HDG {String(Math.round(selectedAircraft.heading)).padStart(3, '0')}° |{' '}
              {Math.round(selectedAircraft.speed * 100)}KT
            </span>
          </div>

          {/* Heading Adjust Buttons */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() =>
                setAircraftHeading(selectedAircraft.id, selectedAircraft.heading - 30)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00e5ff]/20 text-gray-200 hover:text-[#00e5ff] rounded border border-gray-700 transition-colors"
            >
              -30°
            </button>
            <button
              onClick={() =>
                setAircraftHeading(selectedAircraft.id, selectedAircraft.heading - 10)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00e5ff]/20 text-gray-200 hover:text-[#00e5ff] rounded border border-gray-700 transition-colors"
            >
              -10°
            </button>
            <button
              onClick={() =>
                setAircraftHeading(selectedAircraft.id, selectedAircraft.heading + 10)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00e5ff]/20 text-gray-200 hover:text-[#00e5ff] rounded border border-gray-700 transition-colors"
            >
              +10°
            </button>
            <button
              onClick={() =>
                setAircraftHeading(selectedAircraft.id, selectedAircraft.heading + 30)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00e5ff]/20 text-gray-200 hover:text-[#00e5ff] rounded border border-gray-700 transition-colors"
            >
              +30°
            </button>
          </div>

          {/* Speed Adjust Buttons */}
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-800">
            <button
              onClick={() =>
                setAircraftSpeed(selectedAircraft.id, selectedAircraft.speed - 0.2)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00ffaa]/20 text-gray-200 hover:text-[#00ffaa] rounded border border-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              SPD -20 KT
            </button>
            <button
              onClick={() =>
                setAircraftSpeed(selectedAircraft.id, selectedAircraft.speed + 0.2)
              }
              className="px-1.5 py-1 bg-gray-800/80 hover:bg-[#00ffaa]/20 text-gray-200 hover:text-[#00ffaa] rounded border border-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              SPD +20 KT
            </button>
          </div>

          {/* Active Waypoints indicator & Cancel Path button */}
          {selectedAircraft.waypoints.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-[10px]">
              <span className="text-[#ffe066] font-bold">
                ROUTE: {selectedAircraft.waypoints.length} WPT ACTIVE
              </span>
              <button
                onClick={() => setWaypoints(selectedAircraft.id, [])}
                className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded transition-colors"
              >
                CANCEL PATH
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Comms Log Terminal & Voice Input (Phase 3) */}
      <div className="h-56 flex flex-col bg-[#05090f] border-t border-gray-800">
        <div className="px-3 py-1 bg-[#09121c] border-b border-gray-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Radio className="w-3 h-3 text-[#00ffaa]" />
            <span className="font-bold">ATC COMMS LOG (FREQ 124.85)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            {micActive ? (
              <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> REC ON AIR
              </span>
            ) : (
              <span className="text-gray-500">PTT: [SPACE]</span>
            )}
          </div>
        </div>

        {/* Live speech transcription ticker if mic active */}
        {micActive && (
          <div className="bg-red-950/50 border-b border-red-800/80 px-3 py-1 flex items-center gap-2 text-[10px] text-red-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold">LIVE SPEECH:</span>
            <span className="italic text-white">
              {transcript || 'Listening for ATC voice command...'}
            </span>
          </div>
        )}

        {/* Log messages scroll area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
          {commsLog.map((log) => (
            <div key={log.id} className="leading-tight">
              <span className="text-gray-600 mr-1.5">[{log.timestamp}]</span>
              <span
                className={`font-bold mr-1.5 ${
                  log.sender === 'ATC'
                    ? 'text-[#00e5ff]'
                    : log.sender === 'PILOT'
                    ? 'text-amber-400'
                    : 'text-gray-400'
                }`}
              >
                {log.sender}:
              </span>
              <span
                className={
                  log.type === 'alert'
                    ? 'text-red-400 font-bold'
                    : log.type === 'ack'
                    ? 'text-emerald-300'
                    : 'text-gray-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          <div ref={commsEndRef} />
        </div>

        {/* Quick Voice Command Chips */}
        <div className="px-2 py-1 bg-[#060b13] border-t border-gray-800 flex items-center gap-1 overflow-x-auto text-[9px] text-gray-400">
          <span className="text-gray-500 shrink-0">QUICK:</span>
          <button
            onClick={() => processManualCommand('Garuda 123 heading 270')}
            className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-[#00e5ff]/20 hover:text-[#00e5ff] shrink-0 border border-gray-700"
          >
            GIA123 HDG 270
          </button>
          <button
            onClick={() => processManualCommand('Lion 456 heading 090')}
            className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-[#00e5ff]/20 hover:text-[#00e5ff] shrink-0 border border-gray-700"
          >
            LNI456 HDG 090
          </button>
          <button
            onClick={() => processManualCommand('GIA123 speed 180')}
            className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-[#00ffaa]/20 hover:text-[#00ffaa] shrink-0 border border-gray-700"
          >
            GIA123 SPD 180
          </button>
          <button
            onClick={() => processManualCommand('Garuda 123 cleared to land')}
            className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-emerald-500/20 hover:text-emerald-300 shrink-0 border border-gray-700"
          >
            LAND RWY 09
          </button>
        </div>

        {/* CLI Command Line Input (For testing voice commands via text fallback) */}
        <form onSubmit={handleCliSubmit} className="p-1.5 bg-[#0a1424] border-t border-gray-800 flex items-center gap-1.5">
          <span className="text-[#00e5ff] font-bold text-[10px] pl-1">ATC&gt;</span>
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder={
              isSupported
                ? 'Type or Hold Space to Speak (e.g., "GIA123 heading 270")'
                : 'Type command (e.g. "GIA123 heading 270")'
            }
            className="flex-1 bg-black/60 border border-gray-700 focus:border-[#00e5ff] rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none font-mono"
          />
          <button
            type="submit"
            className="p-1.5 rounded bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 transition-colors"
            title="Transmit Command"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Voice Commands Phraseology Help Modal */}
      {showVoiceHelp && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex flex-col justify-between text-gray-200 font-mono animate-fade-in">
          <div>
            <div className="flex items-center justify-between border-b border-[#00e5ff]/40 pb-2 mb-3">
              <div className="flex items-center gap-2 text-[#00e5ff] font-bold text-sm">
                <Radio className="w-4 h-4" />
                <span>ATC VOICE PHRASEOLOGY GUIDE</span>
              </div>
              <button
                onClick={() => setShowVoiceHelp(false)}
                className="p-1 hover:text-white rounded hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mb-3">
              Hold <strong className="text-white bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">[SPACEBAR]</strong> while speaking, or type in the CLI input. Supported in both English & Bahasa Indonesia:
            </p>

            <div className="space-y-2.5 text-[11px]">
              <div className="p-2 rounded bg-[#091522] border border-gray-800">
                <div className="text-[#00e5ff] font-bold">1. HEADING COMMAND</div>
                <div className="text-gray-300 mt-0.5">🇮🇩 "Garuda satu dua tiga, heading dua tujuh nol"</div>
                <div className="text-gray-400">🇬🇧 "Garuda 123, turn heading 270" / "LNI456 heading 090"</div>
              </div>

              <div className="p-2 rounded bg-[#091522] border border-gray-800">
                <div className="text-[#00e5ff] font-bold">2. SPEED COMMAND</div>
                <div className="text-gray-300 mt-0.5">🇮🇩 "Lion empat lima enam, kecepatan seratus delapan puluh"</div>
                <div className="text-gray-400">🇬🇧 "Garuda 123, speed 160 knots"</div>
              </div>

              <div className="p-2 rounded bg-[#091522] border border-gray-800">
                <div className="text-[#00e5ff] font-bold">3. ALTITUDE COMMAND</div>
                <div className="text-gray-300 mt-0.5">🇮🇩 "Garuda satu dua tiga, turun ke tiga ribu kaki"</div>
                <div className="text-gray-400">🇬🇧 "GIA123, descend to 3000 feet" / "Flight level 40"</div>
              </div>

              <div className="p-2 rounded bg-[#091522] border border-gray-800">
                <div className="text-[#00e5ff] font-bold">4. CLEARED TO LAND</div>
                <div className="text-gray-300 mt-0.5">🇮🇩 "Garuda satu dua tiga, diizinkan mendarat runway 09"</div>
                <div className="text-gray-400">🇬🇧 "Garuda 123, cleared to land runway 09"</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowVoiceHelp(false)}
            className="w-full py-1.5 rounded bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/50 font-bold transition-colors text-center"
          >
            RETURN TO RADAR
          </button>
        </div>
      )}
    </aside>
  )
}
