import type { Aircraft } from '../types/atc'

const AIRLINES = [
  { prefix: 'GIA', name: 'Garuda Indonesia', type: 'B738' },
  { prefix: 'LNI', name: 'Lion Air', type: 'A320' },
  { prefix: 'CTV', name: 'Citilink', type: 'A320' },
  { prefix: 'BTK', name: 'Batik Air', type: 'B738' },
  { prefix: 'AWQ', name: 'AirAsia Indonesia', type: 'A320' },
  { prefix: 'SJV', name: 'Super Air Jet', type: 'A320' },
]

export function generateRandomAircraft(
  radarCenter: { x: number; y: number },
  radarRadius: number = 280,
  existingIds: string[] = []
): Aircraft {
  // Pick random airline
  const airlineInfo = AIRLINES[Math.floor(Math.random() * AIRLINES.length)]
  
  // Generate unique flight number
  let flightNum = Math.floor(100 + Math.random() * 899)
  let id = `${airlineInfo.prefix}${flightNum}`
  while (existingIds.includes(id)) {
    flightNum = Math.floor(100 + Math.random() * 899)
    id = `${airlineInfo.prefix}${flightNum}`
  }

  // Spawn on perimeter ring inside radar scope (0.94 of radarRadius so fully visible)
  const spawnRadius = radarRadius * 0.94
  const spawnAngle = Math.random() * Math.PI * 2 // 0 to 2PI

  const x = radarCenter.x + Math.cos(spawnAngle) * spawnRadius
  const y = radarCenter.y + Math.sin(spawnAngle) * spawnRadius

  // Heading pointed inward towards radar center with +/- 35 deg variation
  const angleToCenter = Math.atan2(radarCenter.x - x, -(radarCenter.y - y))
  let heading = ((angleToCenter * 180) / Math.PI + 360) % 360
  heading = (heading + (Math.random() * 70 - 35) + 360) % 360

  const altitude = Math.floor(40 + Math.random() * 35) * 100 // 4000 - 7500 ft
  const speed = 1.20 + Math.random() * 0.40 // 1.20 - 1.60 (120-160kt)
  const fuel = 70 + Math.floor(Math.random() * 25) // 70% - 95%
  const squawk = String(Math.floor(1000 + Math.random() * 6000))

  return {
    id,
    airline: airlineInfo.name,
    aircraftType: airlineInfo.type,
    squawk,
    x,
    y,
    speed,
    heading,
    targetHeading: heading,
    altitude,
    targetAltitude: altitude,
    fuel,
    waypoints: [],
    status: 'cruising',
    history: [{ x, y }],
  }
}
