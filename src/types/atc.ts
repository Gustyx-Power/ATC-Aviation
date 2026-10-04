export interface Waypoint {
  x: number;
  y: number;
}

export interface Aircraft {
  id: string;              // e.g., "GIA123"
  x: number;
  y: number;
  speed: number;           // pixels per frame (1.2 to 2.5)
  heading: number;         // 0-360 degrees (0 = North, 90 = East, 180 = South, 270 = West)
  altitude: number;        // in feet, e.g. 2000 - 8000
  fuel: number;            // 0-100%
  waypoints: Waypoint[];   // Array of points from 'Draw Path'
  status: 'cruising' | 'landing' | 'emergency';
  
  // Tactical data & Phase 4 extensions
  airline?: string;
  aircraftType?: string;
  squawk?: string;
  targetHeading?: number;
  targetAltitude?: number;
  targetSpeed?: number;
  history?: { x: number; y: number }[]; // Phosphor persistence trail
  conflictWith?: string[];              // IDs of nearby aircraft (loss of separation warning)
  landingProgress?: number;             // Rollout progress on runway
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

export interface GameState {
  aircrafts: Aircraft[];
  score: number;
  landedCount: number;
  survivalTime: number;    // seconds survived
  gameOver: boolean;
  gameOverReason?: string;
  collisionPoint: { x: number; y: number } | null;
  radarCenter: { x: number; y: number };
  isPaused: boolean;
  selectedAircraftId: string | null;
  commsLog: CommLogItem[];
  micActive: boolean;

  // Actions required by PRD
  addAircraft: (aircraft: Aircraft) => void;
  updateAircrafts: () => void;
  setWaypoints: (id: string, path: Waypoint[]) => void;

  // Additional control & Phase 4 actions
  spawnAircraft: () => void;
  setRadarCenter: (center: { x: number; y: number }) => void;
  selectAircraft: (id: string | null) => void;
  setAircraftHeading: (id: string, heading: number) => void;
  setAircraftSpeed: (id: string, speed: number) => void;
  setAircraftAltitude: (id: string, altitude: number) => void;
  addCommLog: (item: Omit<CommLogItem, 'id' | 'timestamp'>) => void;
  togglePause: () => void;
  setMicActive: (active: boolean) => void;
  resetGame: () => void;
}
