import React from 'react'
import { Tower3DView } from './components/Tower3DView'
import { TowerHUD } from './components/TowerHUD'
import { RadarCanvas } from './components/RadarCanvas'
import { useGameLoop } from './hooks/useGameLoop'
import { useGameStore } from './store/useGameStore'
import { X } from 'lucide-react'

export const App: React.FC = () => {
  // Run continuous simulation loop
  useGameLoop(true)

  const viewMode = useGameStore((state) => state.viewMode)
  const setViewMode = useGameStore((state) => state.setViewMode)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 1. Main 3D Tower Viewport (Three.js Airfield, Tower Cab, Aircraft) */}
      <main className="absolute inset-0 w-full h-full">
        <Tower3DView />
      </main>

      {/* 2. Professional ATC Tower HUD Overlay (Frequencies, Clearances, Pilot Audio) */}
      <TowerHUD />

      {/* 3. Optional 2D Approach Radar Modal */}
      {viewMode === 'radar2d' && (
        <div className="absolute top-16 left-4 z-40 w-[480px] h-[480px] bg-[#05080e]/95 border-2 border-cyan-400 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col pointer-events-auto backdrop-blur-md animate-fade-in font-mono">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#091522] border-b border-cyan-500/40 text-xs text-cyan-300">
            <span className="font-bold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ffaa] animate-ping" />
              TERMINAL RADAR 2D (APPROACH SCOPE)
            </span>
            <button
              onClick={() => setViewMode('tower')}
              className="p-1 hover:text-white text-gray-400 cursor-pointer"
              title="Tutup Radar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <RadarCanvas />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
