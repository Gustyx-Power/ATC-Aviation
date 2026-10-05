export interface Waypoint {
  x: number;
  y: number;
}

export type AircraftStatus =
  | 'approach'
  | 'holding_pattern'
  | 'landing'
  | 'taxi_to_gate'
  | 'at_gate'
  | 'deboarding'
  | 'cleaning'
  | 'refueling'
  | 'maintenance_check'
  | 'taxi_to_hangar'
  | 'in_hangar'
  | 'overhaul'
  | 'avionics_check'
  | 'c_check'
  | 'boarding'
  | 'ready_pushback'
  | 'pushback'
  | 'taxi_to_runway'
  | 'holding'
  | 'takeoff'
  | 'airborne'
  | 'cruising'
  | 'emergency';

export type AssignedGate =
  | 'Gate 1'
  | 'Gate 2'
  | 'Gate 3'
  | 'Gate 4'
  | 'Gate 5'
  | 'Gate 6'
  | 'Hangar 1'
  | 'Hangar 2';

export type PendingClearanceType =
  | 'landing'
  | 'taxi_to_gate'
  | 'deboarding'
  | 'cleaning'
  | 'refueling'
  | 'maintenance_check'
  | 'tech_verdict'
  | 'boarding'
  | 'pushback'
  | 'taxi_to_runway'
  | 'takeoff'
  | 'overhaul'
  | 'avionics_check'
  | 'c_check'
  | 'hangar_release';

export type TechAnomalyCategory =
  | 'hydraulic'
  | 'engine_vibe'
  | 'egt_thermal'
  | 'oil_pressure'
  | 'landing_gear'
  | 'brakes'
  | 'pitot_heat'
  | 'transponder'
  | 'fuel_water'
  | 'apu_bleed'
  | 'unspecified_caution';

export interface AircraftTechReport {
  timestamp: string;
  inspector: string;
  // Hydraulic systems
  sysAPressure: number;       // PSI (Ref: 2800 - 3100 PSI)
  sysBPressure: number;       // PSI (Ref: 2800 - 3100 PSI)
  brakeAccumulator: number;   // PSI (Ref: 2700 - 3100 PSI)
  // Powerplant / Turbofans
  engine1Vibration: number;   // mils/s (Ref: < 1.5 mils/s)
  engine2Vibration: number;   // mils/s (Ref: < 1.5 mils/s)
  egtMarginDeg: number;       // °C (Ref: > +25 °C)
  oilPressurePsi: number;     // PSI (Ref: 45 - 65 PSI)
  // Landing gear & braking
  noseGearPsi: number;        // PSI (Ref: 165 - 180 PSI)
  mainGearPsi: number;        // PSI (Ref: 200 - 215 PSI)
  brakeWearPinMm: number;     // mm (Ref: > 2.5 mm)
  // Avionics & sensors
  pitotHeat: 'OPERATIONAL' | 'DEGRADED';      // Ref: OPERATIONAL
  transponderTCAS: 'PASS' | 'INTERMITTENT';   // Ref: PASS
  // Fuel & drain
  fuelWaterDrain: 'CLEAR' | 'CONTAMINATED';   // Ref: CLEAR
  apuBleedPressure: number;   // PSI (Ref: 35 - 48 PSI)
  inspectorNotes: string;
  // Ground truth evaluation (hidden from player)
  isDefective: boolean;
  primaryDefect?: TechAnomalyCategory;
  secondaryDefect?: TechAnomalyCategory;
  defectReason?: string;
  secondaryDefectReason?: string;
}

export interface Aircraft {
  id: string;              // e.g., "GIA123"
  x: number;
  y: number;
  speed: number;           // knots / speed unit
  heading: number;         // 0-360 degrees
  altitude: number;        // in feet
  fuel: number;            // 0-100%
  waypoints: Waypoint[];
  status: AircraftStatus;
  
  // Tactical data & 3D Tower extensions
  airline?: string;
  aircraftType?: string;
  squawk?: string;
  targetHeading?: number;
  targetAltitude?: number;
  targetSpeed?: number;
  history?: { x: number; y: number }[];
  conflictWith?: string[];
  landingProgress?: number;
  gate?: string;            // e.g., "Gate 1", "Gate 2", "Gate 3", "Hangar 1"
  assignedGate?: AssignedGate;
  destination?: string;     // e.g., "DPS / Bali", "SUB / Surabaya"
  pos3d?: { x: number; y: number; z: number };
  rot3d?: { pitch: number; yaw: number; roll: number };
  phaseProgress?: number;   // 0 to 1 progress for animations
  serviceProgress?: number; // 0 to 100% for deboarding, cleaning, fueling, etc.
  orbitAngle?: number;      // 0 to 2PI for holding pattern circling in air
  passengers?: { current: number; max: number };
  technicalHealth?: number; // 0 to 100%
  emergencyReason?: string; // e.g. "Kerusakan Mesin 1", "Bahan Bakar Kritis"

  // 2-Way Clearance & Turnaround System
  pendingClearance?: PendingClearanceType;
  pendingClearanceTitle?: string;
  isClearedToLand?: boolean;
  holdingReason?: 'gates_full' | 'atc_order';

  turnaround?: {
    deboarded?: boolean;
    cabinCleaned?: boolean;
    refueled?: boolean;
    techInspected?: boolean;
    boarded?: boolean;
    // Hangar maintenance flags
    engineOverhauled?: boolean;
    avionicsCalibrated?: boolean;
    cCheckPassed?: boolean;
  };
  hangarService?: {
    engineOverhauled?: boolean;
    avionicsCalibrated?: boolean;
    cCheckPassed?: boolean;
  };
  techReport?: AircraftTechReport;
  suspectedAnomaly?: TechAnomalyCategory;
  hangarDiagnosisResult?: {
    verdict: 'perfect' | 'partial' | 'wrong';
    suspectedLabel: string;
    actualReason: string;
    secondaryReason?: string;
    message: string;
    scoreChange: number;
    airMilesChange: number;
  };
}

export interface Runway {
  id: string;
  name: string;
  x: number;
  y: number;
  length: number;
  width: number;
  heading: number;         // 90 deg = runway 09
  touchdownX: number;
  touchdownY: number;
}

export interface CommLogItem {
  id: string;
  timestamp: string;
  sender: 'ATC' | 'PILOT' | 'SYSTEM' | 'GROUND_CREW';
  callsign?: string;
  message: string;
  type: 'info' | 'command' | 'ack' | 'alert';
}

export type ViewMode = 'tower' | 'binoculars' | 'follow' | 'radar2d';
export type RadioChannel = 'approach' | 'tower' | 'ground' | 'clearance' | 'stand';
export type WeatherCondition = 'Cerah' | 'Hujan Badai' | 'Kabut Tebal';

export interface WeatherState {
  condition: WeatherCondition;
  temp: number;
  wind: string;
  rainIntensity: number;   // 0 (none) to 1 (heavy)
  visibility: number;      // in meters
  time: string;
}

export interface GameState {
  aircrafts: Aircraft[];
  score: number;
  landedCount: number;
  airMiles: number;
  airportLevel: number;
  survivalTime: number;
  gameOver: boolean;
  gameOverReason?: string;
  collisionPoint: { x: number; y: number } | null;
  radarCenter: { x: number; y: number };
  radarRadius: number;
  isPaused: boolean;
  selectedAircraftId: string | null;
  commsLog: CommLogItem[];
  micActive: boolean;

  // 3D Tower & Operations state
  viewMode: ViewMode;
  activeChannel: RadioChannel;
  tutorialText: string;
  tutorialActive: boolean;
  weather: WeatherState;
  emergencyServicesActive: boolean;

  // Actions
  addAircraft: (aircraft: Aircraft) => void;
  updateAircrafts: () => void;
  setWaypoints: (id: string, path: Waypoint[]) => void;
  spawnAircraft: () => void;
  setRadarCenter: (center: { x: number; y: number }) => void;
  setRadarDimensions: (center: { x: number; y: number }, radius: number) => void;
  selectAircraft: (id: string | null) => void;
  setAircraftHeading: (id: string, heading: number) => void;
  setAircraftSpeed: (id: string, speed: number) => void;
  setAircraftAltitude: (id: string, altitude: number) => void;
  addCommLog: (item: Omit<CommLogItem, 'id' | 'timestamp'>) => void;
  togglePause: () => void;
  simSpeed: number; // 1 (normal/realistic), 2 (fast), 4 (express)
  setSimSpeed: (speed: number) => void;
  setMicActive: (active: boolean) => void;
  resetGame: () => void;

  // Focused flight for 1-by-1 systematic ATC control
  focusedFlightId: string | null;
  setFocusedFlightId: (id: string | null) => void;
  approveClearance: (id: string) => void;
  denyClearance: (id: string) => void;

  // Real Turnaround & Ground Operations Clearances
  assignDestination: (id: string, destination: 'Gate 1' | 'Gate 2' | 'Gate 3' | 'Gate 4' | 'Gate 5' | 'Gate 6' | 'Hangar 1' | 'Hangar 2') => void;
  startDeboarding: (id: string) => void;
  startCabinService: (id: string) => void;
  startRefueling: (id: string) => void;
  startTechnicalCheck: (id: string) => void;
  startBoarding: (id: string) => void;
  orderPushback: (id: string) => void;
  orderTaxi: (id: string) => void;
  orderTakeoff: (id: string) => void;
  orderHold: (id: string) => void;
  orderHoldInAir: (id: string) => void;
  orderExitHolding: (id: string) => void;
  orderClearedToLand: (id: string) => void;
  orderGoAround: (id: string) => void;

  // Hangar Maintenance Operations
  startEngineOverhaul: (id: string) => void;
  startAvionicsCheck: (id: string) => void;
  startCCheck: (id: string) => void;
  releaseFromHangar: (id: string, targetGate?: 'Gate 1' | 'Gate 2' | 'Gate 3' | 'Gate 4' | 'Gate 5' | 'Gate 6') => void;

  // Emergency & Weather
  triggerEmergency: (id?: string) => void;
  dispatchEmergencyServices: (id: string) => void;
  setWeatherCondition: (condition: WeatherCondition) => void;

  // Technical Telemetry & Engineer Report
  selectedTechReportAircraftId: string | null;
  techReportModalView?: 'telemetry' | 'pick_anomaly';
  setSelectedTechReportAircraftId: (id: string | null, view?: 'telemetry' | 'pick_anomaly') => void;
  resolveTechVerdict: (id: string, decision: 'airworthy' | 'hangar', suspectedAnomaly?: TechAnomalyCategory) => void;

  // View & UI
  setViewMode: (mode: ViewMode) => void;
  setActiveChannel: (channel: RadioChannel) => void;
  dismissTutorial: () => void;
}
