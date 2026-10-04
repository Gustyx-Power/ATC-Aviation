import type { Aircraft } from '../types/atc'

export interface ParsedVoiceCommand {
  rawText: string
  normalizedText: string
  targetAircraftId: string | null
  command: 'HEADING' | 'SPEED' | 'ALTITUDE' | 'LAND' | 'CANCEL' | null
  value?: number
  pilotReadback: string
  isSuccess: boolean
  errorReason?: string
}

// Indonesian & English word-to-digit dictionary
const WORD_TO_DIGIT: Record<string, string> = {
  // Indonesian
  nol: '0',
  kosong: '0',
  satu: '1',
  dua: '2',
  tiga: '3',
  empat: '4',
  lima: '5',
  enam: '6',
  tujuh: '7',
  delapan: '8',
  sembilan: '9',

  // English / Aviation NATO phonetic numbers
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  tree: '3',
  four: '4',
  fower: '4',
  five: '5',
  fife: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ait: '8',
  nine: '9',
  niner: '9',
}

/**
 * Normalizes input speech text:
 * Converts spoken number words ("dua tujuh nol" / "two seven zero") into digits ("270")
 */
export function normalizeSpokenNumbers(text: string): string {
  let cleaned = text.toLowerCase().trim()

  // Replace compound Indonesian spoken numbers
  cleaned = cleaned
    .replace(/\bdua ratus tujuh puluh\b/g, '270')
    .replace(/\bseratus delapan puluh\b/g, '180')
    .replace(/\bsembilan puluh\b/g, '090')
    .replace(/\btiga ratus enam puluh\b/g, '360')
    .replace(/\bdua ratus\b/g, '200')
    .replace(/\bseratus lima puluh\b/g, '150')
    .replace(/\bseratus\b/g, '100')
    .replace(/\btiga ribu\b/g, '3000')
    .replace(/\bempat ribu\b/g, '4000')
    .replace(/\blima ribu\b/g, '5000')
    .replace(/\benam ribu\b/g, '6000')

  // Split tokens and replace individual digits
  const tokens = cleaned.split(/\s+/)
  const convertedTokens: string[] = []

  let consecutiveDigits = ''

  for (const token of tokens) {
    const digit = WORD_TO_DIGIT[token]
    if (digit !== undefined) {
      consecutiveDigits += digit
    } else {
      if (consecutiveDigits.length > 0) {
        convertedTokens.push(consecutiveDigits)
        consecutiveDigits = ''
      }
      convertedTokens.push(token)
    }
  }

  if (consecutiveDigits.length > 0) {
    convertedTokens.push(consecutiveDigits)
  }

  return convertedTokens.join(' ')
}

/**
 * Parse callsign from text and match against active aircraft in simulation
 */
export function matchAircraftCallsign(
  text: string,
  aircrafts: Aircraft[],
  selectedId: string | null
): { aircraftId: string | null; cleanedText: string } {
  const lower = text.toLowerCase()

  // 1. Direct match with aircraft ID (e.g. "gia123", "lni456")
  for (const ac of aircrafts) {
    const acIdLower = ac.id.toLowerCase()
    if (lower.includes(acIdLower)) {
      return { aircraftId: ac.id, cleanedText: lower.replace(acIdLower, '').trim() }
    }
  }

  // 2. Airline alias match (Garuda -> GIA, Lion -> LNI, Citilink -> CTV)
  const airlinePrefixes: Record<string, string> = {
    garuda: 'GIA',
    gia: 'GIA',
    lion: 'LNI',
    lni: 'LNI',
    citilink: 'CTV',
    ctv: 'CTV',
    batik: 'BTK',
    btk: 'BTK',
    airasia: 'AWQ',
  }

  for (const [alias, prefix] of Object.entries(airlinePrefixes)) {
    if (lower.includes(alias)) {
      // Find following number
      const regex = new RegExp(`${alias}\\s*([0-9]{2,4})`, 'i')
      const match = lower.match(regex)
      if (match) {
        const fullId = `${prefix}${match[1]}`
        const foundAc = aircrafts.find((a) => a.id.toLowerCase() === fullId.toLowerCase())
        if (foundAc) {
          return { aircraftId: foundAc.id, cleanedText: lower.replace(match[0], '').trim() }
        }
      }
      // If just airline name spoken and only one aircraft of that airline exists
      const matchingAc = aircrafts.filter((a) => a.id.startsWith(prefix))
      if (matchingAc.length === 1) {
        return { aircraftId: matchingAc[0].id, cleanedText: lower.replace(alias, '').trim() }
      }
    }
  }

  // 3. Just number match (e.g. "123")
  for (const ac of aircrafts) {
    const numericPart = ac.id.replace(/\D/g, '')
    if (numericPart && lower.includes(numericPart)) {
      return { aircraftId: ac.id, cleanedText: lower.replace(numericPart, '').trim() }
    }
  }

  // 4. Fallback to currently selected aircraft if no callsign was explicitly stated
  if (selectedId) {
    const selectedAc = aircrafts.find((a) => a.id === selectedId)
    if (selectedAc) {
      return { aircraftId: selectedAc.id, cleanedText: lower }
    }
  }

  // 5. If only 1 aircraft in simulation, default to it
  if (aircrafts.length === 1) {
    return { aircraftId: aircrafts[0].id, cleanedText: lower }
  }

  return { aircraftId: null, cleanedText: lower }
}

/**
 * Main Voice Command Parser Engine
 */
export function parseVoiceCommand(
  rawTranscript: string,
  aircrafts: Aircraft[],
  selectedAircraftId: string | null
): ParsedVoiceCommand {
  const normalized = normalizeSpokenNumbers(rawTranscript)
  const { aircraftId, cleanedText } = matchAircraftCallsign(normalized, aircrafts, selectedAircraftId)

  if (!aircraftId) {
    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: null,
      command: null,
      pilotReadback: 'Station calling, callsign not copied, say again.',
      isSuccess: false,
      errorReason: 'Callsign not identified or aircraft not found.',
    }
  }

  const callsignSpoken = aircraftId

  // --- 1. HEADING COMMAND ---
  // e.g. "heading 270", "turn left 090", "belok kanan 180", "fly heading 360"
  const headingMatch = cleanedText.match(
    /(?:heading|belok|turn(?:\s+(?:left|right))?|arah)\s*(?:ke|to)?\s*([0-9]{1,3})/i
  )
  if (headingMatch) {
    let headingVal = parseInt(headingMatch[1], 10)
    // Handle 2-digit heading e.g. "09" -> 90 or "27" -> 270
    if (headingVal <= 36) {
      headingVal = headingVal * 10
    }
    headingVal = (headingVal + 360) % 360

    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: aircraftId,
      command: 'HEADING',
      value: headingVal,
      pilotReadback: `Roger, heading ${String(headingVal).padStart(3, '0')}, ${callsignSpoken}.`,
      isSuccess: true,
    }
  }

  // --- 2. SPEED COMMAND ---
  // e.g. "speed 180", "kecepatan 200", "reduce speed 160", "maintain 220 knots"
  const speedMatch = cleanedText.match(
    /(?:speed|kecepatan|spd|reduce speed to|increase speed to)\s*([0-9]{2,3})/i
  )
  if (speedMatch) {
    const speedVal = parseInt(speedMatch[1], 10)
    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: aircraftId,
      command: 'SPEED',
      value: Math.max(120, Math.min(320, speedVal)),
      pilotReadback: `Speed ${speedVal} knots, ${callsignSpoken}.`,
      isSuccess: true,
    }
  }

  // --- 3. ALTITUDE COMMAND ---
  // e.g. "climb 6000", "descend 3000", "altitude 4000", "flight level 50"
  const altMatch = cleanedText.match(
    /(?:altitude|alt|ketinggian|climb to|descend to|turun ke|naik ke|flight level|fl)\s*([0-9]{2,5})/i
  )
  if (altMatch) {
    let altVal = parseInt(altMatch[1], 10)
    if (altVal < 100) altVal = altVal * 100 // FL50 -> 5000ft

    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: aircraftId,
      command: 'ALTITUDE',
      value: altVal,
      pilotReadback: `Descend and maintain ${altVal} feet, ${callsignSpoken}.`,
      isSuccess: true,
    }
  }

  // --- 4. CLEARED TO LAND COMMAND ---
  // e.g. "cleared to land", "cleared runway 09", "land runway 09", "mendarat"
  if (
    cleanedText.includes('land') ||
    cleanedText.includes('mendarat') ||
    cleanedText.includes('cleared') ||
    cleanedText.includes('runway')
  ) {
    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: aircraftId,
      command: 'LAND',
      pilotReadback: `Cleared to land runway zero niner, ${callsignSpoken}.`,
      isSuccess: true,
    }
  }

  // --- 5. CANCEL ROUTE / VECTOR COMMAND ---
  if (cleanedText.includes('cancel') || cleanedText.includes('hold') || cleanedText.includes('batal')) {
    return {
      rawText: rawTranscript,
      normalizedText: normalized,
      targetAircraftId: aircraftId,
      command: 'CANCEL',
      pilotReadback: `Cancelling route, holding present heading, ${callsignSpoken}.`,
      isSuccess: true,
    }
  }

  return {
    rawText: rawTranscript,
    normalizedText: normalized,
    targetAircraftId: aircraftId,
    command: null,
    pilotReadback: `Say again instructions, ${callsignSpoken}.`,
    isSuccess: false,
    errorReason: `Unrecognized command in: "${cleanedText}"`,
  }
}
