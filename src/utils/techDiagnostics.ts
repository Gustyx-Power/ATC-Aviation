import type { Aircraft, AircraftTechReport } from '../types/atc'

export const TECH_STANDARDS = {
  sysAPressure: { min: 2800, max: 3100, unit: 'PSI', label: 'Tekanan Hidrolik Sistem A' },
  sysBPressure: { min: 2800, max: 3100, unit: 'PSI', label: 'Tekanan Hidrolik Sistem B' },
  brakeAccumulator: { min: 2700, max: 3100, unit: 'PSI', label: 'Akumulator Cadangan Rem' },
  engine1Vibration: { min: 0.1, max: 1.5, unit: 'mils/s', label: 'Getaran Turbofan Mesin 1 (N1)' },
  engine2Vibration: { min: 0.1, max: 1.5, unit: 'mils/s', label: 'Getaran Turbofan Mesin 2 (N1)' },
  egtMarginDeg: { min: 25, max: 95, unit: '°C', label: 'Margin Termal EGT Turbin' },
  oilPressurePsi: { min: 45, max: 65, unit: 'PSI', label: 'Tekanan Oli Mesin' },
  noseGearPsi: { min: 165, max: 180, unit: 'PSI', label: 'Tekanan Roda Depan (Nose Gear)' },
  mainGearPsi: { min: 200, max: 215, unit: 'PSI', label: 'Tekanan Roda Utama (Main Gear)' },
  brakeWearPinMm: { min: 2.5, max: 12.0, unit: 'mm', label: 'Indikator Aus Kampas Rem (Wear Pin)' },
  pitotHeat: { nominal: 'OPERATIONAL', label: 'Pemanas Tabung Pitot-Statis' },
  transponderTCAS: { nominal: 'PASS', label: 'Transponder Mode-S & TCAS' },
  fuelWaterDrain: { nominal: 'CLEAR', label: 'Uji Drain Kontaminasi Air Avtur' },
  apuBleedPressure: { min: 35, max: 48, unit: 'PSI', label: 'Tekanan Pneumatik APU Bleed' },
}

const INSPECTORS = [
  'Eng. Bambang H. (Line Maintenance Lead)',
  'Eng. Aris W. (Avionics & Systems Specialist)',
  'Eng. Hendra K. (Powerplant Engineer)',
  'Eng. Dimas P. (Ground Support Team A)',
]

/**
 * Generate a realistic pre-flight walkaround and telemetry diagnostics report.
 * In ~25% of cases (or if technical health was already low), a subtle anomaly is present.
 * NOTE: The report provides raw numbers and reference values without declaring safe/unsafe.
 */
export function generateTechReport(aircraft: Aircraft): AircraftTechReport {
  const isHealthy = (aircraft.technicalHealth ?? 100) >= 90 && Math.random() >= 0.28
  const inspector = INSPECTORS[Math.floor(Math.random() * INSPECTORS.length)]
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false })

  if (isHealthy) {
    return {
      timestamp,
      inspector,
      sysAPressure: Math.floor(2960 + Math.random() * 110),
      sysBPressure: Math.floor(2970 + Math.random() * 100),
      brakeAccumulator: Math.floor(2860 + Math.random() * 120),
      engine1Vibration: +(0.6 + Math.random() * 0.5).toFixed(2),
      engine2Vibration: +(0.5 + Math.random() * 0.6).toFixed(2),
      egtMarginDeg: Math.floor(45 + Math.random() * 35),
      oilPressurePsi: Math.floor(51 + Math.random() * 8),
      noseGearPsi: Math.floor(169 + Math.random() * 8),
      mainGearPsi: Math.floor(205 + Math.random() * 8),
      brakeWearPinMm: +(5.5 + Math.random() * 3.5).toFixed(1),
      pitotHeat: 'OPERATIONAL',
      transponderTCAS: 'PASS',
      fuelWaterDrain: 'CLEAR',
      apuBleedPressure: Math.floor(40 + Math.random() * 5),
      inspectorNotes: `Pemeriksaan pra-terbang menyeluruh selesai dilakukan oleh ${inspector}. Data telemetri aktual ditransmisikan ke konsol ATC. Menunggu disposisi izin dari Pengawas Menara.`,
      isDefective: false,
    }
  }

  // Generate an anomaly in one of the systems
  const defectType = Math.floor(Math.random() * 6)
  let sysAPressure = Math.floor(2960 + Math.random() * 100)
  let sysBPressure = Math.floor(2970 + Math.random() * 90)
  let brakeAccumulator = Math.floor(2860 + Math.random() * 100)
  let engine1Vibration = +(0.6 + Math.random() * 0.4).toFixed(2)
  let engine2Vibration = +(0.5 + Math.random() * 0.5).toFixed(2)
  let egtMarginDeg = Math.floor(45 + Math.random() * 30)
  let oilPressurePsi = Math.floor(52 + Math.random() * 7)
  let noseGearPsi = Math.floor(170 + Math.random() * 7)
  let mainGearPsi = Math.floor(206 + Math.random() * 7)
  let brakeWearPinMm = +(5.0 + Math.random() * 3.0).toFixed(1)
  let pitotHeat: 'OPERATIONAL' | 'DEGRADED' = 'OPERATIONAL'
  let transponderTCAS: 'PASS' | 'INTERMITTENT' = 'PASS'
  let fuelWaterDrain: 'CLEAR' | 'CONTAMINATED' = 'CLEAR'
  let apuBleedPressure = Math.floor(40 + Math.random() * 5)
  let defectReason = ''

  switch (defectType) {
    case 0:
      // Hydraulic A leak
      sysAPressure = Math.floor(2120 + Math.random() * 140)
      defectReason = 'Tekanan Hidrolik Sistem A bocor (2120-2260 PSI di bawah standar 2800 PSI)'
      break
    case 1:
      // High turbofan vibration
      engine1Vibration = +(3.2 + Math.random() * 0.8).toFixed(2)
      defectReason = 'Getaran kipas turbofan mesin 1 berlebihan (>3.0 mils/s di atas batas 1.5 mils/s)'
      break
    case 2:
      // Worn brake pads
      brakeWearPinMm = +(1.4 + Math.random() * 0.6).toFixed(1)
      defectReason = 'Ketebalan kampas rem kritis (pin indikator < 2.0 mm di bawah standar min 2.5 mm)'
      break
    case 3:
      // Pitot probe heat degraded
      pitotHeat = 'DEGRADED'
      defectReason = 'Pemanas sensor tabung pitot-statis tidak berfungsi (bahaya pembekuan instrumen)'
      break
    case 4:
      // Water in fuel sump
      fuelWaterDrain = 'CONTAMINATED'
      defectReason = 'Uji drain tangki bahan bakar menemukan endapan air/kondensasi'
      break
    case 5:
    default:
      // Main gear under-inflation
      mainGearPsi = Math.floor(148 + Math.random() * 12)
      defectReason = 'Tekanan ban roda pendarat utama kempes (<160 PSI di bawah standar 200-215 PSI)'
      break
  }

  return {
    timestamp,
    inspector,
    sysAPressure,
    sysBPressure,
    brakeAccumulator,
    engine1Vibration,
    engine2Vibration,
    egtMarginDeg,
    oilPressurePsi,
    noseGearPsi,
    mainGearPsi,
    brakeWearPinMm,
    pitotHeat,
    transponderTCAS,
    fuelWaterDrain,
    apuBleedPressure,
    inspectorNotes: `Pemeriksaan pra-terbang menyeluruh selesai dicatat oleh ${inspector}. Nilai sensor aktual terunggah. Petugas ATC diinstruksikan meneliti lembar telemetri untuk menentukan kelaikan penerbangan.`,
    isDefective: true,
    defectReason,
  }
}
