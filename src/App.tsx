import React from 'react'
import { RadarCanvas } from './components/RadarCanvas'
import { Sidebar } from './components/Sidebar'
import { useGameLoop } from './hooks/useGameLoop'

export const App: React.FC = () => {
  const { fps } = useGameLoop(true)

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-[#05080e] overflow-hidden text-gray-100 font-mono">
      {/* 70% Viewport: Main Radar Canvas */}
      <main className="w-full md:w-[70%] h-[60vh] md:h-full relative overflow-hidden">
        <RadarCanvas />
      </main>

      {/* 30% Viewport: Right Sidebar (Flight Strips, Comms Log, Score) */}
      <aside className="w-full md:w-[30%] h-[40vh] md:h-full relative overflow-hidden">
        <Sidebar fps={fps} />
      </aside>
    </div>
  )
}

export default App
