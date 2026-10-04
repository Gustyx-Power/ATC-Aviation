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

  // Spawn on circular perimeter around radar scope
  const spawnRadius = 360 + Math.random() * 40
  const spawnAngle = Math.random() * Math.PI * 2 // 0 to 2PI

  const x = radarCenter.x + Math.cos(spawnAngle) * spawnRadius
  const y = radarCenter.y + Math.sin(spawnAngle) * spawnRadius

  // Heading pointed inward towards radar center with +/- 30 deg variation
  const angleToCenter = Math.atan2(radarCenter.x - x, -(radarCenter.y - y))
  let heading = ((angleToCenter * 180) / Math.PI + 360) % 360
  heading = (heading + (Math.random() * 60 - 30) + 360) % 360

  const altitude = Math.floor(40 + Math.random() * 35) * 100 // 4000 - 7500 ft
  const speed = 1.25 + Math.random() * 0.45 // 1.25 - 1.70 px/frame (~125-170kt)
  const fuel = 65 + Math.floor(Math.random() * 30) // 65% - 95%
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
