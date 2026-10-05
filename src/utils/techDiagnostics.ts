import type { Aircraft, AircraftTechReport, TechAnomalyCategory } from '../types/atc'

export const TECH_STANDARDS = {
  sysAPressure: {
    min: 2800,
    max: 3100,
    unit: 'PSI',
    label: 'Tekanan Hidrolik Sistem A',
    labelId: 'Tekanan Hidrolik Sistem A',
    labelEn: 'Hydraulic System A Pressure',
  },
  sysBPressure: {
    min: 2800,
    max: 3100,
    unit: 'PSI',
    label: 'Tekanan Hidrolik Sistem B',
    labelId: 'Tekanan Hidrolik Sistem B',
    labelEn: 'Hydraulic System B Pressure',
  },
  brakeAccumulator: {
    min: 2700,
    max: 3100,
    unit: 'PSI',
    label: 'Akumulator Cadangan Rem',
    labelId: 'Akumulator Cadangan Rem',
    labelEn: 'Brake Reserve Accumulator',
  },
  engine1Vibration: {
    min: 0.1,
    max: 1.5,
    unit: 'mils/s',
    label: 'Getaran Turbofan Mesin 1 (N1)',
    labelId: 'Getaran Turbofan Mesin 1 (N1)',
    labelEn: 'Engine 1 Fan Vibration (N1)',
  },
  engine2Vibration: {
    min: 0.1,
    max: 1.5,
    unit: 'mils/s',
    label: 'Getaran Turbofan Mesin 2 (N1)',
    labelId: 'Getaran Turbofan Mesin 2 (N1)',
    labelEn: 'Engine 2 Fan Vibration (N1)',
  },
  egtMarginDeg: {
    min: 25,
    max: 95,
    unit: '°C',
    label: 'Margin Termal EGT Turbin',
    labelId: 'Margin Termal EGT Turbin',
    labelEn: 'Turbine EGT Thermal Margin',
  },
  oilPressurePsi: {
    min: 45,
    max: 65,
    unit: 'PSI',
    label: 'Tekanan Oli Mesin',
    labelId: 'Tekanan Oli Mesin',
    labelEn: 'Engine Oil Pressure',
  },
  noseGearPsi: {
    min: 165,
    max: 180,
    unit: 'PSI',
    label: 'Tekanan Roda Depan (Nose Gear)',
    labelId: 'Tekanan Roda Depan (Nose Gear)',
    labelEn: 'Nose Gear Tire Pressure',
  },
  mainGearPsi: {
    min: 200,
    max: 215,
    unit: 'PSI',
    label: 'Tekanan Roda Utama (Main Gear)',
    labelId: 'Tekanan Roda Utama (Main Gear)',
    labelEn: 'Main Gear Tire Pressure',
  },
  brakeWearPinMm: {
    min: 2.5,
    max: 12.0,
    unit: 'mm',
    label: 'Indikator Aus Kampas Rem (Wear Pin)',
    labelId: 'Indikator Aus Kampas Rem (Wear Pin)',
    labelEn: 'Brake Wear Pin Depth',
  },
  pitotHeat: {
    nominal: 'OPERATIONAL',
    label: 'Pemanas Tabung Pitot-Statis',
    labelId: 'Pemanas Tabung Pitot-Statis',
    labelEn: 'Pitot-Static Probe Heating',
  },
  transponderTCAS: {
    nominal: 'PASS',
    label: 'Transponder Mode-S & TCAS',
    labelId: 'Transponder Mode-S & TCAS',
    labelEn: 'Mode-S Transponder & TCAS',
  },
  fuelWaterDrain: {
    nominal: 'CLEAR',
    label: 'Uji Drain Kontaminasi Air Avtur',
    labelId: 'Uji Drain Kontaminasi Air Avtur',
    labelEn: 'Fuel Sump Water Drain Test',
  },
  apuBleedPressure: {
    min: 35,
    max: 48,
    unit: 'PSI',
    label: 'Tekanan Pneumatik APU Bleed',
    labelId: 'Tekanan Pneumatik APU Bleed',
    labelEn: 'APU Pneumatic Bleed Pressure',
  },
}

export type AnomalyIconKey =
  | 'droplets'
  | 'activity'
  | 'flame'
  | 'gauge'
  | 'circle-dot'
  | 'disc'
  | 'thermometer'
  | 'radio'
  | 'fuel'
  | 'wind'
  | 'search'

export interface AnomalyOption {
  id: TechAnomalyCategory
  nameEn: string
  nameId: string
  label: string
  labelId: string
  labelEn: string
  desc: string
  descId: string
  descEn: string
  refStandard: string
  refStandardId: string
  refStandardEn: string
  iconKey: AnomalyIconKey
}

export const ANOMALY_OPTIONS: AnomalyOption[] = [
  {
    id: 'hydraulic',
    nameEn: 'hydraulic pressure system',
    nameId: 'sistem hidrolik',
    label: 'Kebocoran / Tekanan Hidrolik Drop',
    labelId: 'Kebocoran / Tekanan Hidrolik Drop',
    labelEn: 'Hydraulic Pressure Drop / Leak',
    desc: 'Tekanan Hidrolik Sistem A, B, atau Akumulator Rem di bawah standar aman (2800 PSI)',
    descId: 'Tekanan Hidrolik Sistem A, B, atau Akumulator Rem di bawah standar aman (2800 PSI)',
    descEn: 'System A, B, or brake reserve accumulator below 2800 PSI operating threshold',
    refStandard: '≥ 2800 PSI',
    refStandardId: '≥ 2800 PSI',
    refStandardEn: '≥ 2800 PSI',
    iconKey: 'droplets',
  },
  {
    id: 'engine_vibe',
    nameEn: 'turbofan N1 vibration',
    nameId: 'getaran kipas turbofan mesin',
    label: 'Getaran Turbofan Mesin Berlebih',
    labelId: 'Getaran Turbofan Mesin Berlebih',
    labelEn: 'Excessive Turbofan Vibration',
    desc: 'Amplitudo getaran kipas N1 melebihi batas getar aman 1.5 mils/s',
    descId: 'Amplitudo getaran kipas N1 melebihi batas getar aman 1.5 mils/s',
    descEn: 'Fan rotor N1 vibration exceeds 1.5 mils/s continuous safe limit',
    refStandard: '< 1.5 mils/s',
    refStandardId: '< 1.5 mils/s',
    refStandardEn: '< 1.5 mils/s',
    iconKey: 'activity',
  },
  {
    id: 'egt_thermal',
    nameEn: 'exhaust gas temperature margin',
    nameId: 'margin termal suhu turbin',
    label: 'Margin Suhu EGT Turbin Terlalu Rendah',
    labelId: 'Margin Suhu EGT Turbin Terlalu Rendah',
    labelEn: 'Low EGT Thermal Margin',
    desc: 'Margin suhu gas buang turbin mepet batas overheating (< +25°C)',
    descId: 'Margin suhu gas buang turbin mepet batas overheating (< +25°C)',
    descEn: 'Turbine exhaust gas temperature margin below +25°C minimum safety limit',
    refStandard: '> +25 °C',
    refStandardId: '> +25 °C',
    refStandardEn: '> +25 °C',
    iconKey: 'flame',
  },
  {
    id: 'oil_pressure',
    nameEn: 'engine oil pressure',
    nameId: 'tekanan oli pelumas mesin',
    label: 'Tekanan Oli Pelumas Mesin Anjlok',
    labelId: 'Tekanan Oli Pelumas Mesin Anjlok',
    labelEn: 'Low Engine Oil Pressure',
    desc: 'Tekanan pelumas mesin drop di bawah batas aman operasional 45 PSI',
    descId: 'Tekanan pelumas mesin drop di bawah batas aman operasional 45 PSI',
    descEn: 'Main engine lubrication pressure dropped below 45 PSI operational limit',
    refStandard: '45 - 65 PSI',
    refStandardId: '45 - 65 PSI',
    refStandardEn: '45 - 65 PSI',
    iconKey: 'gauge',
  },
  {
    id: 'landing_gear',
    nameEn: 'landing gear tire pressure',
    nameId: 'tekanan ban roda pendarat',
    label: 'Tekanan Ban Roda Pendarat Kempes',
    labelId: 'Tekanan Ban Roda Pendarat Kempes',
    labelEn: 'Landing Gear Low Tire Pressure',
    desc: 'Tekanan udara ban roda depan (<165 PSI) atau utama (<200 PSI) kempes',
    descId: 'Tekanan udara ban roda depan (<165 PSI) atau utama (<200 PSI) kempes',
    descEn: 'Nose gear (<165 PSI) or main gear (<200 PSI) tire pressure below dispatch limits',
    refStandard: 'Nose ≥ 165, Main ≥ 200 PSI',
    refStandardId: 'Nose ≥ 165, Main ≥ 200 PSI',
    refStandardEn: 'Nose ≥ 165, Main ≥ 200 PSI',
    iconKey: 'circle-dot',
  },
  {
    id: 'brakes',
    nameEn: 'wheel brake wear pins',
    nameId: 'keausan kampas rem roda utama',
    label: 'Kampas Rem Aus Kritis',
    labelId: 'Kampas Rem Aus Kritis',
    labelEn: 'Brake Pin Wear Exceeded',
    desc: 'Pin indikator keausan rem lebih pendek dari batas minimal aman 2.5 mm',
    descId: 'Pin indikator keausan rem lebih pendek dari batas minimal aman 2.5 mm',
    descEn: 'Main wheel brake assembly wear indicator pin below 2.5 mm minimum limit',
    refStandard: '≥ 2.5 mm',
    refStandardId: '≥ 2.5 mm',
    refStandardEn: '≥ 2.5 mm',
    iconKey: 'disc',
  },
  {
    id: 'pitot_heat',
    nameEn: 'pitot-static probe heating',
    nameId: 'pemanas sensor tabung pitot',
    label: 'Pemanas Sensor Pitot-Statis Rusak',
    labelId: 'Pemanas Sensor Pitot-Statis Rusak',
    labelEn: 'Pitot Probe Heating Degraded',
    desc: 'Elemen pemanas probe pitot degraded/gagal fungsi (risiko icing instrumen kokpit)',
    descId: 'Elemen pemanas probe pitot degraded/gagal fungsi (risiko icing instrumen kokpit)',
    descEn: 'Pitot-static heating element degraded, hazard of instrument freezing in flight',
    refStandard: 'OPERATIONAL',
    refStandardId: 'OPERATIONAL',
    refStandardEn: 'OPERATIONAL',
    iconKey: 'thermometer',
  },
  {
    id: 'transponder',
    nameEn: 'transponder and TCAS avionics',
    nameId: 'transponder dan radar TCAS',
    label: 'TCAS & Transponder Mode-S Bermasalah',
    labelId: 'TCAS & Transponder Mode-S Bermasalah',
    labelEn: 'TCAS & Transponder Malfunction',
    desc: 'Self-test avionik TCAS gagal (INTERMITTENT), sinyal radar anti-tabrakan bermasalah',
    descId: 'Self-test avionik TCAS gagal (INTERMITTENT), sinyal radar anti-tabrakan bermasalah',
    descEn: 'TCAS collision avoidance and Mode-S reply test intermittent',
    refStandard: 'PASS',
    refStandardId: 'PASS',
    refStandardEn: 'PASS',
    iconKey: 'radio',
  },
  {
    id: 'fuel_water',
    nameEn: 'fuel tank sump water drain',
    nameId: 'kontaminasi air pada tangki avtur',
    label: 'Kontaminasi Air pada Tangki Avtur',
    labelId: 'Kontaminasi Air pada Tangki Avtur',
    labelEn: 'Fuel Sump Water Contamination',
    desc: 'Uji drainase sump tangki avtur menemukan endapan air/kondensasi (CONTAMINATED)',
    descId: 'Uji drainase sump tangki avtur menemukan endapan air/kondensasi (CONTAMINATED)',
    descEn: 'Lower sump water drain test contaminated with water sediments',
    refStandard: 'CLEAR',
    refStandardId: 'CLEAR',
    refStandardEn: 'CLEAR',
    iconKey: 'fuel',
  },
  {
    id: 'apu_bleed',
    nameEn: 'APU pneumatic bleed air',
    nameId: 'tekanan bleed pneumatik APU',
    label: 'Tekanan Bleed Air APU Tidak Cukup',
    labelId: 'Tekanan Bleed Air APU Tidak Cukup',
    labelEn: 'Low APU Bleed Air Pressure',
    desc: 'Tekanan pneumatik APU bleed di bawah 35 PSI, tidak mampu menyuplai starter mesin',
    descId: 'Tekanan pneumatik APU bleed di bawah 35 PSI, tidak mampu menyuplai starter mesin',
    descEn: 'Auxiliary power unit pneumatic pressure below 35 PSI engine start requirement',
    refStandard: '35 - 48 PSI',
    refStandardId: '35 - 48 PSI',
    refStandardEn: '35 - 48 PSI',
    iconKey: 'wind',
  },
  {
    id: 'unspecified_caution',
    nameEn: 'secondary pre-flight systems',
    nameId: 'pemeriksaan sistem umum',
    label: 'Inspeksi Ulang Umum (Kehati-hatian)',
    labelId: 'Inspeksi Ulang Umum (Kehati-hatian)',
    labelEn: 'General Precautionary Check',
    desc: 'Hanya ingin pesawat diinvestigasi ulang secara acak tanpa mencurigai subsistem spesifik',
    descId: 'Hanya ingin pesawat diinvestigasi ulang secara acak tanpa mencurigai subsistem spesifik',
    descEn: 'Precautionary hangar inspection without pointing to a single specific subassembly',
    refStandard: 'Toleransi Pabrikan',
    refStandardId: 'Toleransi Pabrikan',
    refStandardEn: 'Factory Tolerance',
    iconKey: 'search',
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
  'Eng. Aris W. (Avionics Specialist)',
  'Eng. Hendra K. (Powerplant Engineer)',
  'Eng. Dimas P. (Ground Support Lead)',
]

function applyDefect(category: TechAnomalyCategory, report: any): { reasonId: string; reasonEn: string } {
  switch (category) {
    case 'hydraulic': {
      report.sysAPressure = Math.floor(2120 + Math.random() * 140)
      return {
        reasonId: `Tekanan Hidrolik Sistem A bocor (${report.sysAPressure} PSI di bawah standar 2800 PSI)`,
        reasonEn: `Hydraulic System A pressure low at ${report.sysAPressure} PSI below 2800 PSI`,
      }
    }
    case 'engine_vibe': {
      report.engine1Vibration = +(3.2 + Math.random() * 0.8).toFixed(2)
      return {
        reasonId: `Getaran kipas turbofan mesin 1 berlebih (${report.engine1Vibration} mils/s di atas batas 1.5 mils/s)`,
        reasonEn: `Turbofan engine 1 vibration at ${report.engine1Vibration} mils/s exceeding 1.5 mils/s limit`,
      }
    }
    case 'egt_thermal': {
      report.egtMarginDeg = Math.floor(10 + Math.random() * 8)
      return {
        reasonId: `Margin termal EGT turbin kritis (hanya +${report.egtMarginDeg}°C di bawah standar +25°C)`,
        reasonEn: `Critical EGT turbine margin at only +${report.egtMarginDeg}°C below +25°C limit`,
      }
    }
    case 'oil_pressure': {
      report.oilPressurePsi = Math.floor(32 + Math.random() * 6)
      return {
        reasonId: `Tekanan oli pelumas mesin anjlok (${report.oilPressurePsi} PSI di bawah standar 45 PSI)`,
        reasonEn: `Engine oil pressure dropped to ${report.oilPressurePsi} PSI below 45 PSI minimum`,
      }
    }
    case 'landing_gear': {
      report.mainGearPsi = Math.floor(148 + Math.random() * 12)
      return {
        reasonId: `Tekanan ban roda utama kempes (${report.mainGearPsi} PSI di bawah standar 200-215 PSI)`,
        reasonEn: `Main gear tire pressure low at ${report.mainGearPsi} PSI below 200-215 PSI limit`,
      }
    }
    case 'brakes': {
      report.brakeWearPinMm = +(1.3 + Math.random() * 0.5).toFixed(1)
      return {
        reasonId: `Kampas rem aus kritis (pin indikator ${report.brakeWearPinMm} mm di bawah standar min 2.5 mm)`,
        reasonEn: `Brake wear pin depth at ${report.brakeWearPinMm} mm below 2.5 mm safety limit`,
      }
    }
    case 'pitot_heat': {
      report.pitotHeat = 'DEGRADED'
      return {
        reasonId: 'Pemanas sensor tabung pitot-statis rusak/degraded (risiko icing navigasi)',
        reasonEn: 'Pitot-static probe heating degraded, risk of flight instrument freezing',
      }
    }
    case 'transponder': {
      report.transponderTCAS = 'INTERMITTENT'
      return {
        reasonId: 'Transponder Mode-S / TCAS gagal uji (sinyal anti-tabrakan putus-nyambung)',
        reasonEn: 'Transponder Mode-S / TCAS self-test intermittent, collision radar degraded',
      }
    }
    case 'fuel_water': {
      report.fuelWaterDrain = 'CONTAMINATED'
      return {
        reasonId: 'Uji drainase tangki avtur menemukan kontaminasi endapan air',
        reasonEn: 'Fuel sump water drain test contaminated with water sediments',
      }
    }
    case 'apu_bleed': {
      report.apuBleedPressure = Math.floor(24 + Math.random() * 6)
      return {
        reasonId: `Tekanan pneumatik APU bleed drop (${report.apuBleedPressure} PSI di bawah batas 35 PSI)`,
        reasonEn: `APU pneumatic bleed pressure low at ${report.apuBleedPressure} PSI below 35 PSI`,
      }
    }
    default: {
      return {
        reasonId: 'Inspeksi umum subsistem mekanikal',
        reasonEn: 'General mechanical subsystem inspection',
      }
    }
  }
}

/**
 * Generate a realistic pre-flight walkaround and telemetry diagnostics report.
 */
export function generateTechReport(aircraft: Aircraft): AircraftTechReport {
  const isHealthy = (aircraft.technicalHealth ?? 100) >= 90 && Math.random() >= 0.32
  const inspector = INSPECTORS[Math.floor(Math.random() * INSPECTORS.length)]
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false })

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
    inspectorNotesId: `Pemeriksaan pra-terbang menyeluruh selesai dicatat oleh ${inspector}. Nilai sensor aktual terunggah. Petugas ATC diinstruksikan meneliti lembar telemetri untuk menentukan kelaikan penerbangan.`,
    inspectorNotesEn: `Complete pre-flight walkaround recorded by ${inspector}. Actual telemetry uploaded. ATC controller instructed to inspect telemetry sheet to determine airworthiness clearance.`,
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

  const def = applyDefect(primaryDefect, baseReport)
  baseReport.defectReason = def.reasonId
  baseReport.defectReasonId = def.reasonId
  baseReport.defectReasonEn = def.reasonEn

  // With 35% probability, generate a secondary subtle defect
  if (Math.random() < 0.35) {
    const remainingPool = DEFECT_POOL.filter((d) => d !== primaryDefect)
    const secondaryDefect = remainingPool[Math.floor(Math.random() * remainingPool.length)]
    baseReport.secondaryDefect = secondaryDefect
    const sec = applyDefect(secondaryDefect, baseReport)
    baseReport.secondaryDefectReason = sec.reasonId
    baseReport.secondaryDefectReasonId = sec.reasonId
    baseReport.secondaryDefectReasonEn = sec.reasonEn
  }

  return baseReport as AircraftTechReport
}
