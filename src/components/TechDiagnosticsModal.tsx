import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { TECH_STANDARDS, ANOMALY_OPTIONS } from '../utils/techDiagnostics'
import type { TechAnomalyCategory } from '../types/atc'
import {
  Wrench,
  ShieldCheck,
  X,
  FileText,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'

export const TechDiagnosticsModal: React.FC = () => {
  const selectedId = useGameStore((s) => s.selectedTechReportAircraftId)
  const initialModalView = useGameStore((s) => s.techReportModalView)
  const close = useGameStore((s) => s.setSelectedTechReportAircraftId)
  const aircrafts = useGameStore((s) => s.aircrafts)
  const resolveTechVerdict = useGameStore((s) => s.resolveTechVerdict)

  const [view, setView] = useState<'telemetry' | 'pick_anomaly'>('telemetry')
  const [selectedAnomaly, setSelectedAnomaly] = useState<TechAnomalyCategory>('hydraulic')

  useEffect(() => {
    if (initialModalView) {
      setView(initialModalView)
    }
  }, [initialModalView, selectedId])

  if (!selectedId) return null

  const aircraft = aircrafts.find((a) => a.id === selectedId)
  const report = aircraft?.techReport

  if (!aircraft || !report) return null

  const isPendingVerdict = aircraft.pendingClearance === 'tech_verdict'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 font-mono select-none pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(null)
      }}
    >
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl w-full max-w-4xl h-[88vh] max-h-[88vh] flex flex-col overflow-hidden text-zinc-200 pointer-events-auto">
        {/* Header (Pinned) */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-sky-950 border border-sky-600/50 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-zinc-100 uppercase">
                  Laporan Statistik & Telemetri Pra-Terbang (ICAO FORM-TECH)
                </h2>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-sky-400 text-[10px] font-bold border border-zinc-700">
                  {aircraft.id} ({aircraft.airline})
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Stand: <span className="text-zinc-200 font-bold">{aircraft.assignedGate || aircraft.gate || 'Gate'}</span> | Inspektor:{' '}
                <span className="text-zinc-200 font-bold">{report.inspector}</span> | Waktu: {report.timestamp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPendingVerdict && (
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setView('telemetry')}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                    view === 'telemetry' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Data Telemetri
                </button>
                <button
                  onClick={() => setView('pick_anomaly')}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                    view === 'pick_anomaly' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Pilih Dugaan Anomali
                </button>
              </div>
            )}
            <button
              onClick={() => close(null)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700 cursor-pointer transition-colors"
              title="Tutup Laporan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hangar Teardown Findings Banner (If available) */}
        {aircraft.hangarDiagnosisResult && (
          <div
            className={`border-b px-5 py-2.5 text-xs font-mono shrink-0 flex items-start gap-2.5 ${
              aircraft.hangarDiagnosisResult.verdict === 'perfect'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : aircraft.hangarDiagnosisResult.verdict === 'partial'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
            }`}
          >
            <div className="text-xl">
              {aircraft.hangarDiagnosisResult.verdict === 'perfect'
                ? '🏆'
                : aircraft.hangarDiagnosisResult.verdict === 'partial'
                ? '⚡'
                : '❌'}
            </div>
            <div className="flex-1">
              <div className="font-bold flex items-center justify-between">
                <span>
                  {aircraft.hangarDiagnosisResult.verdict === 'perfect' && 'HASIL TEARDOWN HANGAR: DIAGNOSA ATC 100% TEPAT!'}
                  {aircraft.hangarDiagnosisResult.verdict === 'partial' &&
                    'HASIL TEARDOWN HANGAR: DIAGNOSA BENAR SEBAGIAN (ADA CACAT LAIN)'}
                  {aircraft.hangarDiagnosisResult.verdict === 'wrong' &&
                    'HASIL TEARDOWN HANGAR: SALAH VONIS KOMPONEN (SANKSI TOWER)'}
                </span>
                <span
                  className={
                    aircraft.hangarDiagnosisResult.scoreChange >= 0
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {aircraft.hangarDiagnosisResult.scoreChange >= 0
                    ? `+${aircraft.hangarDiagnosisResult.scoreChange}`
                    : aircraft.hangarDiagnosisResult.scoreChange}{' '}
                  Skor |{' '}
                  {aircraft.hangarDiagnosisResult.airMilesChange >= 0
                    ? `+${aircraft.hangarDiagnosisResult.airMilesChange}`
                    : aircraft.hangarDiagnosisResult.airMilesChange}{' '}
                  Mil
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-95">
                {aircraft.hangarDiagnosisResult.message}
              </p>
            </div>
          </div>
        )}

        {/* View Mode 1: Anomaly Selection View */}
        {view === 'pick_anomaly' ? (
          <>
            {/* Notice for Suspect Anomaly */}
            <div className="bg-rose-950/40 border-b border-rose-800/40 px-5 py-3 flex items-start gap-3 text-xs text-rose-200 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-rose-300 text-sm uppercase tracking-wide">
                  Surat Perintah Grounding & Derek ke Hangar: Tentukan Dugaan Anomali
                </h3>
                <p className="mt-0.5 text-zinc-300 leading-relaxed text-[11px]">
                  Pilihlah salah satu komponen di bawah ini yang Anda vonis abnormal atau rusak berdasarkan hasil telemetri. Saat proses overhaul di Hangar, teknisi akan melakukan pembongkaran mekanik dan menguji kebenaran dugaan Anda.
                </p>
              </div>
            </div>

            {/* List of 11 Anomaly Options */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-3 bg-zinc-950/90 telemetry-scroll-area">
              <div className="text-xs text-zinc-400 flex items-center justify-between pb-1">
                <span className="font-bold text-zinc-300">
                  KLASIFIKASI ANOMALI YANG DICURIGAI ({ANOMALY_OPTIONS.length} PILIHAN):
                </span>
                <button
                  onClick={() => setView('telemetry')}
                  className="text-sky-400 hover:text-sky-300 underline text-[11px] cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Cek Ulang Angka Telemetri</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ANOMALY_OPTIONS.map((opt) => {
                  const isSelected = selectedAnomaly === opt.id
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedAnomaly(opt.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'bg-rose-950/70 border-rose-500 ring-1 ring-rose-500 text-white shadow-lg'
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="text-2xl shrink-0 pt-0.5">{opt.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-zinc-100">{opt.label}</span>
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Dipilih
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{opt.desc}</p>
                        <span className="inline-block mt-1 text-[10px] text-amber-300/90 font-mono bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                          Batas Normal: {opt.refStandard}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Bar for Anomaly Picking */}
            <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setView('telemetry')}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold font-mono cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Angka Telemetri</span>
              </button>

              <button
                onClick={() => {
                  resolveTechVerdict(aircraft.id, 'hangar', selectedAnomaly)
                  close(null)
                }}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-rose-950/50"
              >
                <Wrench className="w-4 h-4" />
                <span>
                  KONFIRMASI DEREK & LAPORKAN: {ANOMALY_OPTIONS.find((o) => o.id === selectedAnomaly)?.label.toUpperCase()}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* View Mode 2: Telemetry Data Table View */
          <>
            {/* Notice for Player (Pinned) */}
            <div className="bg-sky-950/40 border-b border-sky-800/40 px-5 py-2.5 flex items-start justify-between gap-2.5 text-xs text-sky-200 shrink-0">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sky-300">INSTRUKSI PENGAWAS TOWER (ATC): </span>
                  Bandingkan nilai telemetri aktual setiap komponen terhadap nilai acuan standar operasi normal. Keputusan kelayakan lolos terbang atau rujuk ke hangar sepenuhnya merupakan wewenang dan penilaian mandiri Anda.
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-900/50 border border-sky-700/50 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                ↕ Scroll untuk melihat seluruh data
              </span>
            </div>

            {/* Telemetry Metrics Body (SCROLLABLE) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 text-xs select-text telemetry-scroll-area">
              {/* Section 1: Hydraulic Systems */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5">
                <h3 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span>1. Sistem Hidrolik & Tekanan Aktuator</span>
                  <span className="text-zinc-500 font-normal text-[10px]">HYDRAULIC TELEMETRY</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.sysAPressure.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.sysAPressure} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.sysAPressure.min} - {TECH_STANDARDS.sysAPressure.max} PSI
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.sysBPressure.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.sysBPressure} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.sysBPressure.min} - {TECH_STANDARDS.sysBPressure.max} PSI
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.brakeAccumulator.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.brakeAccumulator} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.brakeAccumulator.min} - {TECH_STANDARDS.brakeAccumulator.max} PSI
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Powerplant & Turbofans */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5">
                <h3 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span>2. Mesin Pendorong Turbofan & Parameter Termal</span>
                  <span className="text-zinc-500 font-normal text-[10px]">POWERPLANT & TURBINE</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.engine1Vibration.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.engine1Vibration} mils/s</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: &lt; {TECH_STANDARDS.engine1Vibration.max} mils/s
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.engine2Vibration.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.engine2Vibration} mils/s</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: &lt; {TECH_STANDARDS.engine2Vibration.max} mils/s
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.egtMarginDeg.label}</span>
                    <span className="text-base font-bold text-zinc-100">+{report.egtMarginDeg} °C</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: &gt; +{TECH_STANDARDS.egtMarginDeg.min} °C
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.oilPressurePsi.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.oilPressurePsi} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.oilPressurePsi.min} - {TECH_STANDARDS.oilPressurePsi.max} PSI
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Landing Gear & Brakes */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5">
                <h3 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span>3. Roda Pendarat & Ketebalan Kampas Rem</span>
                  <span className="text-zinc-500 font-normal text-[10px]">LANDING GEAR & BRAKING</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.noseGearPsi.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.noseGearPsi} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.noseGearPsi.min} - {TECH_STANDARDS.noseGearPsi.max} PSI
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.mainGearPsi.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.mainGearPsi} PSI</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: {TECH_STANDARDS.mainGearPsi.min} - {TECH_STANDARDS.mainGearPsi.max} PSI
                    </span>
                  </div>
                  <div className="bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.brakeWearPinMm.label}</span>
                    <span className="text-base font-bold text-zinc-100">{report.brakeWearPinMm} mm</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Nilai Acuan: Min {TECH_STANDARDS.brakeWearPinMm.min} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Avionics, Pitot Sensor, Fuel & Bleed Air */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5">
                  <h3 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2 border-b border-zinc-800/80 pb-1.5">
                    4. Avionik & Pemanas Sensor Pitot
                  </h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.pitotHeat.label}</span>
                        <span className="text-xs font-bold text-zinc-100">{report.pitotHeat}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Acuan: OPERATIONAL</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.transponderTCAS.label}</span>
                        <span className="text-xs font-bold text-zinc-100">{report.transponderTCAS}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Acuan: PASS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5">
                  <h3 className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-2 border-b border-zinc-800/80 pb-1.5">
                    5. Bahan Bakar & Sistem Pneumatik
                  </h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.fuelWaterDrain.label}</span>
                        <span className="text-xs font-bold text-zinc-100">{report.fuelWaterDrain}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Acuan: CLEAR</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-950/80 border border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">{TECH_STANDARDS.apuBleedPressure.label}</span>
                        <span className="text-xs font-bold text-zinc-100">{report.apuBleedPressure} PSI</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Acuan: 35 - 48 PSI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Inspector Notes */}
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-300">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Catatan Lapangan Teknisi:
                </span>
                <p className="italic text-zinc-300 font-mono leading-relaxed">
                  "{report.inspectorNotes}"
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar (Pinned) */}
            <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-zinc-400">
                Status Izin Saat Ini:{' '}
                <span className="font-bold text-amber-400 uppercase">
                  {aircraft.pendingClearanceTitle || aircraft.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isPendingVerdict ? (
                  <>
                    <button
                      onClick={() => setView('pick_anomaly')}
                      className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold font-mono cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <Wrench className="w-4 h-4 text-rose-400" />
                      <span>TOLAK & DEREK KE HANGAR</span>
                    </button>

                    <button
                      onClick={() => {
                        resolveTechVerdict(aircraft.id, 'airworthy')
                        close(null)
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono cursor-pointer transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>LOLOSKAN IZIN BOARDING</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => close(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold font-mono cursor-pointer transition-colors"
                  >
                    Tutup Lembar Telemetri
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
