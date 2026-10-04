import React from 'react'
import { useGameStore } from '../store/useGameStore'
import { TECH_STANDARDS } from '../utils/techDiagnostics'
import { Wrench, ShieldCheck, X, FileText, AlertCircle, ArrowRight } from 'lucide-react'

export const TechDiagnosticsModal: React.FC = () => {
  const selectedId = useGameStore((s) => s.selectedTechReportAircraftId)
  const close = useGameStore((s) => s.setSelectedTechReportAircraftId)
  const aircrafts = useGameStore((s) => s.aircrafts)
  const resolveTechVerdict = useGameStore((s) => s.resolveTechVerdict)

  if (!selectedId) return null

  const aircraft = aircrafts.find((a) => a.id === selectedId)
  const report = aircraft?.techReport

  if (!aircraft || !report) return null

  const isPendingVerdict = aircraft.pendingClearance === 'tech_verdict'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
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
                Stand: <span className="text-zinc-200 font-bold">{aircraft.assignedGate || aircraft.gate || 'Gate'}</span> | Inspektor: <span className="text-zinc-200 font-bold">{report.inspector}</span> | Waktu: {report.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={() => close(null)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700 cursor-pointer transition-colors"
            title="Tutup Laporan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice for Player (Evaluation Guidance without Clues) */}
        <div className="bg-sky-950/40 border-b border-sky-800/40 px-5 py-2.5 flex items-start gap-2.5 text-xs text-sky-200">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sky-300">INSTRUKSI PENGAWAS TOWER (ATC): </span>
            Bandingkan nilai telemetri aktual setiap komponen terhadap nilai acuan standar operasi normal. Keputusan kelayakan lolos terbang atau rujuk ke hangar sepenuhnya merupakan wewenang dan penilaian mandiri Anda.
          </div>
        </div>

        {/* Telemetry Metrics Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
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

        {/* Bottom Actions Bar */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
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
                  onClick={() => resolveTechVerdict(aircraft.id, 'hangar')}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold font-mono cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Wrench className="w-4 h-4 text-rose-400" />
                  <span>TOLAK & DEREK KE HANGAR</span>
                </button>

                <button
                  onClick={() => resolveTechVerdict(aircraft.id, 'airworthy')}
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
      </div>
    </div>
  )
}
