export interface Waypoint {
  x: number;
  y: number;
}

export type AircraftStatus =
  | 'at_gate'
  | 'pushback'
  | 'taxiing'
  | 'holding'
  | 'takeoff'
  | 'airborne'
  | 'cruising'
  | 'approach'
  | 'landing'
  | 'emergency';

export interface Aircraft {
  id: string;              // e.g., "GIA123"
  x: number;
  y: number;
  speed: number;           // pixels per frame (1.2 to 2.5) or knots
  heading: number;         // 0-360 degrees
  altitude: number;        // in feet, e.g. 0 - 8000
  fuel: number;            // 0-100%
  waypoints: Waypoint[];   // Array of points from 'Draw Path'
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
  gate?: string;            // e.g., "Stand 1", "Stand 2"
  destination?: string;     // e.g., "DPS / Bali", "SUB / Surabaya"
  pos3d?: { x: number; y: number; z: number };
  rot3d?: { pitch: number; yaw: number; roll: number };
  phaseProgress?: number;   // 0 to 1 progress for pushback / taxiing animations
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
  sender: 'ATC' | 'PILOT' | 'SYSTEM';
  callsign?: string;
  message: string;
  type: 'info' | 'command' | 'ack' | 'alert';
}

export type ViewMode = 'tower' | 'binoculars' | 'follow' | 'radar2d';
export type RadioChannel = 'approach' | 'tower' | 'ground' | 'clearance' | 'stand';

export interface GameState {
  aircrafts: Aircraft[];
  score: number;
  landedCount: number;
  airMiles: number;
  airportLevel: number;
  survivalTime: number;    // seconds survived
  gameOver: boolean;
  gameOverReason?: string;
  collisionPoint: { x: number; y: number } | null;
  radarCenter: { x: number; y: number };
  radarRadius: number;
  isPaused: boolean;
  selectedAircraftId: string | null;
  commsLog: CommLogItem[];
  micActive: boolean;

  // 3D Tower & Roblox HUD state
  viewMode: ViewMode;
  activeChannel: RadioChannel;
  tutorialText: string;
  tutorialActive: boolean;
  weather: {
    condition: string;
    temp: number;
    wind: string;
    time: string;
  };

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
  setMicActive: (active: boolean) => void;
  resetGame: () => void;

  // Tower 3D Clearances & Commands (Roblox style)
  orderPushback: (id: string) => void;
  orderTaxi: (id: string) => void;
  orderTakeoff: (id: string) => void;
  orderHold: (id: string) => void;
  orderClearedToLand: (id: string) => void;
  orderGoAround: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveChannel: (channel: RadioChannel) => void;
  dismissTutorial: () => void;
}
