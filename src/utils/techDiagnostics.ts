import type { Aircraft, AircraftTechReport, TechAnomalyCategory } from '../types/atc'

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

export const ANOMALY_OPTIONS: { id: TechAnomalyCategory; label: string; desc: string; refStandard: string; icon: string }[] = [
  {
    id: 'hydraulic',
    label: 'Kebocoran / Tekanan Hidrolik Drop',
    desc: 'Tekanan Hidrolik Sistem A, B, atau Akumulator Rem di bawah standar aman (2800 PSI)',
    refStandard: '≥ 2800 PSI',
    icon: '💧',
  },
  {
    id: 'engine_vibe',
    label: 'Getaran Turbofan Mesin Berlebih',
    desc: 'Amplitudo getaran kipas N1 melebihi batas getar aman 1.5 mils/s',
    refStandard: '< 1.5 mils/s',
    icon: '🌀',
  },
  {
    id: 'egt_thermal',
    label: 'Margin Suhu EGT Turbin Terlalu Rendah',
    desc: 'Margin suhu gas buang turbin mepet batas overheating (< +25°C)',
    refStandard: '> +25 °C',
    icon: '🔥',
  },
  {
    id: 'oil_pressure',
    label: 'Tekanan Oli Pelumas Mesin Anjlok',
    desc: 'Tekanan pelumas mesin drop di bawah batas aman operasional 45 PSI',
    refStandard: '45 - 65 PSI',
    icon: '🛢️',
  },
  {
    id: 'landing_gear',
    label: 'Tekanan Ban Roda Pendarat Kempes',
    desc: 'Tekanan udara ban roda depan (<165 PSI) atau utama (<200 PSI) kempes',
    refStandard: 'Nose ≥ 165, Main ≥ 200 PSI',
    icon: '🛞',
  },
  {
    id: 'brakes',
    label: 'Kampas Rem Aus Kritis',
    desc: 'Pin indikator keausan rem lebih pendek dari batas minimal aman 2.5 mm',
    refStandard: '≥ 2.5 mm',
    icon: '🛑',
  },
  {
    id: 'pitot_heat',
    label: 'Pemanas Sensor Pitot-Statis Rusak',
    desc: 'Elemen pemanas probe pitot degraded/gagal fungsi (risiko icing instrumen kokpit)',
    refStandard: 'OPERATIONAL',
    icon: '🌡️',
  },
  {
    id: 'transponder',
    label: 'TCAS & Transponder Mode-S Bermasalah',
    desc: 'Self-test avionik TCAS gagal (INTERMITTENT), sinyal radar anti-tabrakan bermasalah',
    refStandard: 'PASS',
    icon: '📡',
  },
  {
    id: 'fuel_water',
    label: 'Kontaminasi Air pada Tangki Avtur',
    desc: 'Uji drainase sump tangki avtur menemukan endapan air/kondensasi (CONTAMINATED)',
    refStandard: 'CLEAR',
    icon: '⛽',
  },
  {
    id: 'apu_bleed',
    label: 'Tekanan Bleed Air APU Tidak Cukup',
    desc: 'Tekanan pneumatik APU bleed di bawah 35 PSI, tidak mampu menyuplai starter mesin',
    refStandard: '35 - 48 PSI',
    icon: '💨',
  },
  {
    id: 'unspecified_caution',
    label: 'Inspeksi Ulang Umum (Kehati-hatian)',
    desc: 'Hanya ingin pesawat diinvestigasi ulang secara acak tanpa mencurigai subsistem spesifik',
    refStandard: 'Toleransi Pabrikan',
    icon: '🔍',
  },
]

const DEFECT_POOL: TechAnomalyCategory[] = [
  'hydraulic',
  'engine_vibe',
  'egt_thermal',
  'oil_pressure',
  'landing_gear',
  'brakes',
  'pitot_heat',
  'transponder',
  'fuel_water',
  'apu_bleed',
]

const INSPECTORS = [
  'Eng. Bambang H. (Line Maintenance Lead)',
  'Eng. Aris W. (Avionics & Systems Specialist)',
  'Eng. Hendra K. (Powerplant Engineer)',
  'Eng. Dimas P. (Ground Support Team A)',
]

function applyDefect(category: TechAnomalyCategory, report: any): string {
  switch (category) {
    case 'hydraulic':
      report.sysAPressure = Math.floor(2120 + Math.random() * 140)
      return `Tekanan Hidrolik Sistem A bocor (${report.sysAPressure} PSI di bawah standar 2800 PSI)`
    case 'engine_vibe':
      report.engine1Vibration = +(3.2 + Math.random() * 0.8).toFixed(2)
      return `Getaran kipas turbofan mesin 1 berlebih (${report.engine1Vibration} mils/s di atas batas 1.5 mils/s)`
    case 'egt_thermal':
      report.egtMarginDeg = Math.floor(10 + Math.random() * 8)
      return `Margin termal EGT turbin kritis (hanya +${report.egtMarginDeg}°C di bawah standar +25°C)`
    case 'oil_pressure':
      report.oilPressurePsi = Math.floor(32 + Math.random() * 6)
      return `Tekanan oli pelumas mesin anjlok (${report.oilPressurePsi} PSI di bawah standar 45 PSI)`
    case 'landing_gear':
      report.mainGearPsi = Math.floor(148 + Math.random() * 12)
      return `Tekanan ban roda utama kempes (${report.mainGearPsi} PSI di bawah standar 200-215 PSI)`
    case 'brakes':
      report.brakeWearPinMm = +(1.3 + Math.random() * 0.5).toFixed(1)
      return `Kampas rem aus kritis (pin indikator ${report.brakeWearPinMm} mm di bawah standar min 2.5 mm)`
    case 'pitot_heat':
      report.pitotHeat = 'DEGRADED'
      return 'Pemanas sensor tabung pitot-statis rusak/degraded (risiko icing navigasi)'
    case 'transponder':
      report.transponderTCAS = 'INTERMITTENT'
      return 'Transponder Mode-S / TCAS gagal uji (sinyal anti-tabrakan putus-nyambung)'
    case 'fuel_water':
      report.fuelWaterDrain = 'CONTAMINATED'
      return 'Uji drainase tangki avtur menemukan kontaminasi endapan air'
    case 'apu_bleed':
      report.apuBleedPressure = Math.floor(24 + Math.random() * 6)
      return `Tekanan pneumatik APU bleed drop (${report.apuBleedPressure} PSI di bawah batas 35 PSI)`
    default:
      return 'Inspeksi umum subsistem'
  }
}

/**
 * Generate a realistic pre-flight walkaround and telemetry diagnostics report.
 * In ~30% of cases (or if technical health was already low), an anomaly is present.
 * In ~35% of defective cases, a secondary subtle anomaly is also present.
 * NOTE: The report provides raw numbers and reference values without declaring safe/unsafe.
 */
export function generateTechReport(aircraft: Aircraft): AircraftTechReport {
  const isHealthy = (aircraft.technicalHealth ?? 100) >= 90 && Math.random() >= 0.32
  const inspector = INSPECTORS[Math.floor(Math.random() * INSPECTORS.length)]
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false })

  const baseReport: any = {
    timestamp,
    inspector,
    sysAPressure: Math.floor(2960 + Math.random() * 100),
    sysBPressure: Math.floor(2970 + Math.random() * 90),
    brakeAccumulator: Math.floor(2860 + Math.random() * 100),
    engine1Vibration: +(0.6 + Math.random() * 0.4).toFixed(2),
    engine2Vibration: +(0.5 + Math.random() * 0.5).toFixed(2),
    egtMarginDeg: Math.floor(45 + Math.random() * 30),
    oilPressurePsi: Math.floor(52 + Math.random() * 7),
    noseGearPsi: Math.floor(170 + Math.random() * 7),
    mainGearPsi: Math.floor(206 + Math.random() * 7),
    brakeWearPinMm: +(5.0 + Math.random() * 3.0).toFixed(1),
    pitotHeat: 'OPERATIONAL' as const,
    transponderTCAS: 'PASS' as const,
    fuelWaterDrain: 'CLEAR' as const,
    apuBleedPressure: Math.floor(40 + Math.random() * 5),
    inspectorNotes: `Pemeriksaan pra-terbang menyeluruh selesai dicatat oleh ${inspector}. Nilai sensor aktual terunggah. Petugas ATC diinstruksikan meneliti lembar telemetri untuk menentukan kelaikan penerbangan.`,
    isDefective: false,
  }

  if (isHealthy) {
    return baseReport as AircraftTechReport
  }

  // Defective: pick primary defect
  baseReport.isDefective = true
  const primaryIdx = Math.floor(Math.random() * DEFECT_POOL.length)
  const primaryDefect = DEFECT_POOL[primaryIdx]
  baseReport.primaryDefect = primaryDefect
  baseReport.defectReason = applyDefect(primaryDefect, baseReport)

  // With 35% probability, generate a secondary subtle defect
  if (Math.random() < 0.35) {
    const remainingPool = DEFECT_POOL.filter((d) => d !== primaryDefect)
    const secondaryDefect = remainingPool[Math.floor(Math.random() * remainingPool.length)]
    baseReport.secondaryDefect = secondaryDefect
    baseReport.secondaryDefectReason = applyDefect(secondaryDefect, baseReport)
  }

  return baseReport as AircraftTechReport
}
