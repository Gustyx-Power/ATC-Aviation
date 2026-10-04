import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

export const Tower3DView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null)

  // Camera orientation state (First Person Tower Drag)
  const isDraggingRef = useRef<boolean>(false)
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cameraRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: -Math.PI * 0.15, // Default view looking slightly towards runway 09 and apron
    pitch: -0.18,          // Looking slightly down at the airfield
  })
  const targetRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: -Math.PI * 0.15,
    pitch: -0.18,
  })
  const cameraFovRef = useRef<number>(65)
  const targetFovRef = useRef<number>(65)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x8ecae6) // Clear daytime sky
    scene.fog = new THREE.FogExp2(0xa2d2ff, 0.0006) // Atmospheric haze

    // 2. Camera setup
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 3500)
    
    // Tower cab POV position (elevated high above the apron/runway)
    const TOWER_POSITION = new THREE.Vector3(0, 38, 0)
    camera.position.copy(TOWER_POSITION)

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.8)
    sunLight.position.set(400, 600, 300)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 50
    sunLight.shadow.camera.far = 1600
    sunLight.shadow.camera.left = -600
    sunLight.shadow.camera.right = 600
    sunLight.shadow.camera.top = 600
    sunLight.shadow.camera.bottom = -600
    sunLight.shadow.bias = -0.0004
    scene.add(sunLight)

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.45)
    scene.add(hemiLight)

    // ----------------------------------------------------
    // 5. AIRPORT GROUND & ENVIRONMENT
    // ----------------------------------------------------
    // Terrain base
    const terrainGeo = new THREE.PlaneGeometry(3200, 3200)
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xc9b037, // Warm sand / light desert terrain like Murcia/tropical
      roughness: 0.95,
      metalness: 0.05,
    })
    const terrain = new THREE.Mesh(terrainGeo, terrainMat)
    terrain.rotation.x = -Math.PI / 2
    terrain.position.y = -0.2
    terrain.receiveShadow = true
    scene.add(terrain)

    // Airport Grass Infield
    const grassGeo = new THREE.PlaneGeometry(1600, 1000)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c36, // Airport green turf
      roughness: 0.9,
    })
    const grass = new THREE.Mesh(grassGeo, grassMat)
    grass.rotation.x = -Math.PI / 2
    grass.position.set(100, -0.1, -120)
    grass.receiveShadow = true
    scene.add(grass)

    // RUNWAY 09/27 (Length: 1400m, Width: 55m)
    // Oriented along X axis, positioned at Z = -220 (out in front of tower)
    const rwyLength = 1400
    const rwyWidth = 54
    const rwyPosZ = -240

    const runwayGeo = new THREE.PlaneGeometry(rwyLength, rwyWidth)
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x22262c, // Dark asphalt
      roughness: 0.85,
      metalness: 0.1,
    })
    const runway = new THREE.Mesh(runwayGeo, runwayMat)
    runway.rotation.x = -Math.PI / 2
    runway.position.set(0, 0.02, rwyPosZ)
    runway.receiveShadow = true
    scene.add(runway)

    // Runway Markings Helper
    const markingsGroup = new THREE.Group()

    // Centerline dashed white stripes
    const dashLength = 22
    const dashGap = 16
    const numDashes = Math.floor(rwyLength / (dashLength + dashGap)) - 4
    const startX = -rwyLength / 2 + 80
    for (let i = 0; i < numDashes; i++) {
      const dashGeo = new THREE.PlaneGeometry(dashLength, 2.2)
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const dash = new THREE.Mesh(dashGeo, dashMat)
      dash.rotation.x = -Math.PI / 2
      dash.position.set(startX + i * (dashLength + dashGap), 0.06, rwyPosZ)
      markingsGroup.add(dash)
    }

    // Runway 09 Threshold Piano Keys (West end: X = -rwyLength/2)
    const numKeys = 10
    const keyWidth = 2.4
    const keyLength = 24
    for (let i = 0; i < numKeys; i++) {
      const keyGeo = new THREE.PlaneGeometry(keyLength, keyWidth)
      const keyMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      // West threshold (09)
      const key09 = new THREE.Mesh(keyGeo, keyMat)
      key09.rotation.x = -Math.PI / 2
      key09.position.set(-rwyLength / 2 + 20, 0.07, rwyPosZ - (numKeys * keyWidth * 1.5) / 2 + i * keyWidth * 1.5 + keyWidth)
      markingsGroup.add(key09)

      // East threshold (27)
      const key27 = new THREE.Mesh(keyGeo, keyMat)
      key27.rotation.x = -Math.PI / 2
      key27.position.set(rwyLength / 2 - 20, 0.07, rwyPosZ - (numKeys * keyWidth * 1.5) / 2 + i * keyWidth * 1.5 + keyWidth)
      markingsGroup.add(key27)
    }

    // Runway edge lights (glowing white lights along both edges)
    const edgeLightsGroup = new THREE.Group()
    const lightSpacing = 45
    const numLights = Math.floor(rwyLength / lightSpacing)
    const lightSphereGeo = new THREE.SphereGeometry(0.35, 8, 8)
    const whiteEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
    })
    const greenEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 2.0,
    })

    for (let i = 0; i <= numLights; i++) {
      const lx = -rwyLength / 2 + i * lightSpacing
      // North edge
      const lNorth = new THREE.Mesh(lightSphereGeo, whiteEmissiveMat)
      lNorth.position.set(lx, 0.4, rwyPosZ - rwyWidth / 2 - 1.2)
      edgeLightsGroup.add(lNorth)
      // South edge
      const lSouth = new THREE.Mesh(lightSphereGeo, whiteEmissiveMat)
      lSouth.position.set(lx, 0.4, rwyPosZ + rwyWidth / 2 + 1.2)
      edgeLightsGroup.add(lSouth)
    }

    // Threshold green lights (Runway 09 entrance)
    for (let i = -6; i <= 6; i++) {
      const gLight = new THREE.Mesh(lightSphereGeo, greenEmissiveMat)
      gLight.position.set(-rwyLength / 2 + 4, 0.4, rwyPosZ + i * 3.5)
      edgeLightsGroup.add(gLight)
    }
    scene.add(edgeLightsGroup)
    scene.add(markingsGroup)

    // TAXIWAY SYSTEM (Taxiway Alpha, connecting apron to runway)
    const taxiAlphaGeo = new THREE.PlaneGeometry(rwyLength * 0.75, 26)
    const taxiwayMat = new THREE.MeshStandardMaterial({ color: 0x2e333b, roughness: 0.9 })
    const taxiAlpha = new THREE.Mesh(taxiAlphaGeo, taxiwayMat)
    taxiAlpha.rotation.x = -Math.PI / 2
    taxiAlpha.position.set(-80, 0.03, -120)
    taxiAlpha.receiveShadow = true
    scene.add(taxiAlpha)

    // Yellow taxiway centerline
    const taxiLineGeo = new THREE.PlaneGeometry(rwyLength * 0.75, 0.8)
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfcc419 })
    const taxiLine = new THREE.Mesh(taxiLineGeo, yellowLineMat)
    taxiLine.rotation.x = -Math.PI / 2
    taxiLine.position.set(-80, 0.06, -120)
    scene.add(taxiLine)

    // Connector Taxiway Bravo (links Taxiway Alpha to Runway 09 Threshold)
    const connectorBravoGeo = new THREE.PlaneGeometry(26, 120)
    const connectorBravo = new THREE.Mesh(connectorBravoGeo, taxiwayMat)
    connectorBravo.rotation.x = -Math.PI / 2
    connectorBravo.position.set(-rwyLength / 2 + 80, 0.03, -180)
    connectorBravo.receiveShadow = true
    scene.add(connectorBravo)

    // Holding Point double-yellow lines
    const holdLineGeo = new THREE.PlaneGeometry(24, 1.2)
    const holdLineMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    const holdLine = new THREE.Mesh(holdLineGeo, holdLineMat)
    holdLine.rotation.x = -Math.PI / 2
    holdLine.position.set(-rwyLength / 2 + 80, 0.07, rwyPosZ + rwyWidth / 2 + 18)
    scene.add(holdLine)

    // Connector Charlie (Midfield runway exit)
    const connectorCharlie = new THREE.Mesh(connectorBravoGeo, taxiwayMat)
    connectorCharlie.rotation.x = -Math.PI / 2
    connectorCharlie.position.set(0, 0.03, -180)
    connectorCharlie.receiveShadow = true
    scene.add(connectorCharlie)

    // APRON & TERMINAL GATES (South of Taxiway Alpha, right in front of tower)
    const apronGeo = new THREE.PlaneGeometry(360, 160)
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x3d4450, roughness: 0.85 })
    const apron = new THREE.Mesh(apronGeo, apronMat)
    apron.rotation.x = -Math.PI / 2
    apron.position.set(-60, 0.04, -30)
    apron.receiveShadow = true
    scene.add(apron)

    // Terminal Building Structure
    const terminalGeo = new THREE.BoxGeometry(320, 22, 60)
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xd9e2ec, roughness: 0.4, metalness: 0.3 })
    const terminal = new THREE.Mesh(terminalGeo, terminalMat)
    terminal.position.set(-60, 11, 40)
    terminal.castShadow = true
    terminal.receiveShadow = true
    scene.add(terminal)

    // Terminal Glass Facade
    const glassFacadeGeo = new THREE.BoxGeometry(310, 14, 2)
    const glassFacadeMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8,
    })
    const glassFacade = new THREE.Mesh(glassFacadeGeo, glassFacadeMat)
    glassFacade.position.set(-60, 11, 9)
    scene.add(glassFacade)

    // Passenger Jetway Bridges (Stands 1, 2, 3)
    const STAND_X_COORDS = [-140, -60, 20]
    STAND_X_COORDS.forEach((sx) => {
      const jetwayBridgeGeo = new THREE.BoxGeometry(8, 6, 26)
      const jetwayMat = new THREE.MeshStandardMaterial({ color: 0x829ab1, roughness: 0.6 })
      const jetway = new THREE.Mesh(jetwayBridgeGeo, jetwayMat)
      jetway.position.set(sx, 7, 0)
      jetway.castShadow = true
      scene.add(jetway)

      // Stand lead-in yellow parking line
      const standLineGeo = new THREE.PlaneGeometry(3, 40)
      const standLine = new THREE.Mesh(standLineGeo, yellowLineMat)
      standLine.rotation.x = -Math.PI / 2
      standLine.position.set(sx, 0.06, -35)
      scene.add(standLine)

      // Red stop bar
      const stopBarGeo = new THREE.PlaneGeometry(12, 1.2)
      const stopBarMat = new THREE.MeshBasicMaterial({ color: 0xff2222 })
      const stopBar = new THREE.Mesh(stopBarGeo, stopBarMat)
      stopBar.rotation.x = -Math.PI / 2
      stopBar.position.set(sx, 0.07, -48)
      scene.add(stopBar)
    })

    // Perimeter security fencing & lights
    const fenceGeo = new THREE.BoxGeometry(1600, 4, 1)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x627d98, roughness: 0.8 })
    const northFence = new THREE.Mesh(fenceGeo, fenceMat)
    northFence.position.set(0, 2, -340)
    scene.add(northFence)

    // ----------------------------------------------------
    // 6. THE 3D TOWER CAB INTERIOR (Where Player Stands!)
    // ----------------------------------------------------
    const towerGroup = new THREE.Group()

    // Tower Concrete Base Column
    const towerShaftGeo = new THREE.CylinderGeometry(14, 18, 36, 16)
    const towerShaftMat = new THREE.MeshStandardMaterial({ color: 0x9fb3c8, roughness: 0.7 })
    const towerShaft = new THREE.Mesh(towerShaftGeo, towerShaftMat)
    towerShaft.position.set(0, 18, 0)
    towerShaft.castShadow = true
    towerShaft.receiveShadow = true
    scene.add(towerShaft)

    // Tower Cab Floor
    const cabFloorGeo = new THREE.CylinderGeometry(18, 16, 2, 16)
    const cabFloorMat = new THREE.MeshStandardMaterial({ color: 0x1f2933, roughness: 0.9 })
    const cabFloor = new THREE.Mesh(cabFloorGeo, cabFloorMat)
    cabFloor.position.set(0, 36.5, 0)
    towerGroup.add(cabFloor)

    // Tower Cab Roof / Ceiling
    const cabRoofGeo = new THREE.CylinderGeometry(20, 18, 2.5, 16)
    const cabRoofMat = new THREE.MeshStandardMaterial({ color: 0x102a43, roughness: 0.6 })
    const cabRoof = new THREE.Mesh(cabRoofGeo, cabRoofMat)
    cabRoof.position.set(0, 45, 0)
    cabRoof.castShadow = true
    towerGroup.add(cabRoof)

    // Angled Window Mullions / Pillars (Roblox style tower cab frame)
    const numPillars = 8
    const pillarRadius = 17.5
    for (let i = 0; i < numPillars; i++) {
      const angle = (i / numPillars) * Math.PI * 2
      const px = Math.sin(angle) * pillarRadius
      const pz = Math.cos(angle) * pillarRadius
      const pillarGeo = new THREE.BoxGeometry(1.6, 7.5, 1.6)
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334e68, roughness: 0.5 })
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.set(px, 40.5, pz)
      // Slight outwards flare like modern control towers
      pillar.rotation.y = angle
      towerGroup.add(pillar)
    }

    // ATC Desk Console inside the cab (curved console in front of player)
    const consoleGeo = new THREE.BoxGeometry(18, 1.4, 4)
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1b2838, roughness: 0.7 })
    const consoleMesh = new THREE.Mesh(consoleGeo, consoleMat)
    consoleMesh.position.set(0, 36.8, -6)
    consoleMesh.rotation.y = 0
    towerGroup.add(consoleMesh)

    // Glowing Desk Radar & Comms Monitors
    const monitorGeo = new THREE.BoxGeometry(4.8, 3.2, 0.4)
    const radarScreenMat = new THREE.MeshStandardMaterial({
      color: 0x051b14,
      emissive: 0x00ffaa,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    })
    const fidsScreenMat = new THREE.MeshStandardMaterial({
      color: 0x091b29,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    })

    const radarMonitor = new THREE.Mesh(monitorGeo, radarScreenMat)
    radarMonitor.position.set(-4.5, 38.8, -5.6)
    radarMonitor.rotation.y = 0.2
    radarMonitor.rotation.x = -0.15
    towerGroup.add(radarMonitor)

    const fidsMonitor = new THREE.Mesh(monitorGeo, fidsScreenMat)
    fidsMonitor.position.set(4.5, 38.8, -5.6)
    fidsMonitor.rotation.y = -0.2
    fidsMonitor.rotation.x = -0.15
    towerGroup.add(fidsMonitor)

    // Rotating Radar Dish atop the tower roof
    const radarDishGeo = new THREE.CylinderGeometry(4, 4, 0.6, 16)
    const radarDishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4 })
    const radarDish = new THREE.Mesh(radarDishGeo, radarDishMat)
    radarDish.position.set(0, 47, 0)
    towerGroup.add(radarDish)

    scene.add(towerGroup)

    // ----------------------------------------------------
    // 7. PROCEDURAL 3D AIRLINER MESH FACTORY
    // ----------------------------------------------------
    const aircraftMeshes = new Map<string, THREE.Group>()

    function createAirlinerMesh(airline: string = 'Garuda Indonesia'): THREE.Group {
      const plane = new THREE.Group()

      // Primary livery color
      let liveryColor = 0x00a896 // Garuda Cyan
      if (airline.includes('Lion')) {
        liveryColor = 0xd90429 // Lion Red
      } else if (airline.includes('Citilink')) {
        liveryColor = 0x70e000 // Citilink Green
      } else if (airline.includes('Batik')) {
        liveryColor = 0x9d0208 // Batik Maroon
      }

      // Fuselage Body
      const fuselageGeo = new THREE.CylinderGeometry(2.3, 2.3, 34, 16)
      const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.35, metalness: 0.2 })
      const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
      fuselage.rotation.x = Math.PI / 2
      fuselage.position.y = 3.6
      fuselage.castShadow = true
      fuselage.receiveShadow = true
      plane.add(fuselage)

      // Nose Cone
      const noseGeo = new THREE.ConeGeometry(2.3, 6, 16)
      const noseMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.35 })
      const nose = new THREE.Mesh(noseGeo, noseMat)
      nose.rotation.x = -Math.PI / 2
      nose.position.set(0, 3.6, -19.5)
      nose.castShadow = true
      plane.add(nose)

      // Cockpit Windshield (Dark Glass)
      const windshieldGeo = new THREE.BoxGeometry(2.4, 1.2, 2.2)
      const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x0a1128, roughness: 0.1, metalness: 0.9 })
      const windshield = new THREE.Mesh(windshieldGeo, windshieldMat)
      windshield.position.set(0, 4.4, -17.5)
      windshield.rotation.x = 0.3
      plane.add(windshield)

      // Swept Wings
      const wingGeo = new THREE.BoxGeometry(32, 0.45, 6)
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.4 })
      const wings = new THREE.Mesh(wingGeo, wingMat)
      wings.position.set(0, 3.2, 0)
      wings.castShadow = true
      plane.add(wings)

      // Winglets (colored tips)
      const wingletGeo = new THREE.BoxGeometry(0.4, 2.6, 2.4)
      const liveryMat = new THREE.MeshStandardMaterial({ color: liveryColor, roughness: 0.3 })
      const leftWinglet = new THREE.Mesh(wingletGeo, liveryMat)
      leftWinglet.position.set(-16, 4.4, 0)
      plane.add(leftWinglet)
      const rightWinglet = new THREE.Mesh(wingletGeo, liveryMat)
      rightWinglet.position.set(16, 4.4, 0)
      plane.add(rightWinglet)

      // Jet Engines (Twin Underwing Turbofans)
      const engineGeo = new THREE.CylinderGeometry(1.3, 1.2, 5.5, 14)
      const engineMat = new THREE.MeshStandardMaterial({ color: 0xdce2ea, metalness: 0.4, roughness: 0.3 })
      const leftEngine = new THREE.Mesh(engineGeo, engineMat)
      leftEngine.rotation.x = Math.PI / 2
      leftEngine.position.set(-7, 2.0, -1)
      leftEngine.castShadow = true
      plane.add(leftEngine)

      const rightEngine = new THREE.Mesh(engineGeo, engineMat)
      rightEngine.rotation.x = Math.PI / 2
      rightEngine.position.set(7, 2.0, -1)
      rightEngine.castShadow = true
      plane.add(rightEngine)

      // Vertical Tail Fin
      const tailFinGeo = new THREE.BoxGeometry(0.5, 8.5, 6.5)
      const tailFin = new THREE.Mesh(tailFinGeo, liveryMat)
      tailFin.position.set(0, 7.8, 14)
      tailFin.rotation.x = -0.35
      tailFin.castShadow = true
      plane.add(tailFin)

      // Horizontal Stabilizers
      const hStabGeo = new THREE.BoxGeometry(11, 0.35, 3)
      const hStab = new THREE.Mesh(hStabGeo, wingMat)
      hStab.position.set(0, 4.6, 15)
      hStab.castShadow = true
      plane.add(hStab)

      // Landing Gear with rubber wheels
      const gearLegGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.2)
      const gearMat = new THREE.MeshStandardMaterial({ color: 0x495057 })
      const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12)
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })

      // Nose Gear
      const noseLeg = new THREE.Mesh(gearLegGeo, gearMat)
      noseLeg.position.set(0, 1.8, -14)
      plane.add(noseLeg)
      const noseWheel = new THREE.Mesh(wheelGeo, tireMat)
      noseWheel.rotation.z = Math.PI / 2
      noseWheel.position.set(0, 0.7, -14)
      plane.add(noseWheel)

      // Main Gear Left & Right
      const mainWheelLeft = new THREE.Mesh(wheelGeo, tireMat)
      mainWheelLeft.rotation.z = Math.PI / 2
      mainWheelLeft.position.set(-4.5, 0.7, 1.5)
      plane.add(mainWheelLeft)

      const mainWheelRight = new THREE.Mesh(wheelGeo, tireMat)
      mainWheelRight.rotation.z = Math.PI / 2
      mainWheelRight.position.set(4.5, 0.7, 1.5)
      plane.add(mainWheelRight)

      // Anti-Collision Flashing Beacon (Top of fuselage)
      const beaconGeo = new THREE.SphereGeometry(0.25, 8, 8)
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 })
      const topBeacon = new THREE.Mesh(beaconGeo, beaconMat)
      topBeacon.position.set(0, 6.0, 1)
      plane.add(topBeacon)

      // Wingtip Nav Lights: Red (Port/Left), Green (Starboard/Right)
      const navLightGeo = new THREE.SphereGeometry(0.2, 6, 6)
      const redNav = new THREE.Mesh(navLightGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      redNav.position.set(-16.2, 4.4, 0)
      plane.add(redNav)
      const greenNav = new THREE.Mesh(navLightGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
      greenNav.position.set(16.2, 4.4, 0)
      plane.add(greenNav)

      // Forward Landing Lights
      const landingLight = new THREE.SpotLight(0xfffaed, 2.5, 180, Math.PI * 0.22, 0.5)
      landingLight.position.set(0, 3.6, -18)
      landingLight.target.position.set(0, 0, -100)
      plane.add(landingLight)
      plane.add(landingLight.target)

      return plane
    }

    // ----------------------------------------------------
    // 8. FIRST PERSON TOWER DRAG & POINTER HANDLERS
    // ----------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      // Left click drags camera view (Roblox style!)
      if (e.button === 0) {
        isDraggingRef.current = true
        prevMousePosRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - prevMousePosRef.current.x
      const deltaY = e.clientY - prevMousePosRef.current.y
      prevMousePosRef.current = { x: e.clientX, y: e.clientY }

      // Adjust target yaw & pitch smoothly
      const SENSITIVITY = 0.0035
      targetRotationRef.current.yaw -= deltaX * SENSITIVITY
      targetRotationRef.current.pitch -= deltaY * SENSITIVITY

      // Clamp vertical pitch so user doesn't flip upside down inside the tower
      targetRotationRef.current.pitch = Math.max(-Math.PI * 0.38, Math.min(Math.PI * 0.22, targetRotationRef.current.pitch))
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
    }

    const onWheel = (e: WheelEvent) => {
      // Scroll wheel zooms camera FOV (Binoculars effect)
      e.preventDefault()
      targetFovRef.current += e.deltaY * 0.04
      targetFovRef.current = Math.max(22, Math.min(80, targetFovRef.current))
    }

    // Touch support for tablets / touchscreens
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - prevMousePosRef.current.x
      const deltaY = e.touches[0].clientY - prevMousePosRef.current.y
      prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }

      targetRotationRef.current.yaw -= deltaX * 0.004
      targetRotationRef.current.pitch -= deltaY * 0.004
      targetRotationRef.current.pitch = Math.max(-Math.PI * 0.38, Math.min(Math.PI * 0.22, targetRotationRef.current.pitch))
    }

    const onTouchEnd = () => {
      isDraggingRef.current = false
    }

    const dom = renderer.domElement
    dom.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    dom.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)

    // Raycaster for clicking 3D aircraft
    const raycaster = new THREE.Raycaster()
    const mouseCoord = new THREE.Vector2()

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect()
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouseCoord, camera)
      const planes = Array.from(aircraftMeshes.values())
      const intersects = raycaster.intersectObjects(planes, true)

      if (intersects.length > 0) {
        // Find which plane group was clicked
        let obj: THREE.Object3D | null = intersects[0].object
        while (obj && !obj.name && obj.parent) {
          obj = obj.parent
        }
        if (obj && obj.name) {
          useGameStore.getState().selectAircraft(obj.name)
        }
      }
    }
    dom.addEventListener('click', onClick)

    // ----------------------------------------------------
    // 9. ANIMATION & RENDER LOOP
    // ----------------------------------------------------
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Rotate top radar dish
      radarDish.rotation.y += 0.03

      // Smooth camera interpolation (lerp)
      cameraRotationRef.current.yaw += (targetRotationRef.current.yaw - cameraRotationRef.current.yaw) * 0.12
      cameraRotationRef.current.pitch += (targetRotationRef.current.pitch - cameraRotationRef.current.pitch) * 0.12
      cameraFovRef.current += (targetFovRef.current - cameraFovRef.current) * 0.12

      if (Math.abs(camera.fov - cameraFovRef.current) > 0.05) {
        camera.fov = cameraFovRef.current
        camera.updateProjectionMatrix()
      }

      const { aircrafts, selectedAircraftId, viewMode } = useGameStore.getState()
      const selectedAc = aircrafts.find((a) => a.id === selectedAircraftId)

      // Camera Modes
      if (viewMode === 'follow' && selectedAc && selectedAc.pos3d) {
        // Chase cam behind selected aircraft
        const headingRad = ((selectedAc.heading || 90) * Math.PI) / 180
        const camDistance = 80
        const camHeight = 35
        camera.position.x = selectedAc.pos3d.x - Math.sin(headingRad) * camDistance
        camera.position.y = selectedAc.pos3d.y + camHeight
        camera.position.z = selectedAc.pos3d.z + Math.cos(headingRad) * camDistance
        camera.lookAt(selectedAc.pos3d.x, selectedAc.pos3d.y + 10, selectedAc.pos3d.z)
      } else if (viewMode === 'binoculars' && selectedAc && selectedAc.pos3d) {
        // Fixed Tower POV zoomed in on target plane
        camera.position.copy(TOWER_POSITION)
        camera.lookAt(selectedAc.pos3d.x, selectedAc.pos3d.y + 4, selectedAc.pos3d.z)
      } else {
        // First Person Tower Drag View
        camera.position.copy(TOWER_POSITION)
        const euler = new THREE.Euler(cameraRotationRef.current.pitch, cameraRotationRef.current.yaw, 0, 'YXZ')
        camera.quaternion.setFromEuler(euler)
      }

      // Sync 3D Aircraft Models with Store Data
      const existingIds = new Set(aircrafts.map((a) => a.id))

      // Remove old meshes
      for (const [id, mesh] of aircraftMeshes.entries()) {
        if (!existingIds.has(id)) {
          scene.remove(mesh)
          aircraftMeshes.delete(id)
        }
      }

      // Update or create meshes for each aircraft
      aircrafts.forEach((ac) => {
        let mesh = aircraftMeshes.get(ac.id)
        if (!mesh) {
          mesh = createAirlinerMesh(ac.airline)
          mesh.name = ac.id
          scene.add(mesh)
          aircraftMeshes.set(ac.id, mesh)
        }

        // Compute 3D position based on aircraft phase
        if (ac.pos3d) {
          mesh.position.set(ac.pos3d.x, ac.pos3d.y, ac.pos3d.z)
        } else {
          // Fallback based on 2D store coordinates mapped to 3D world
          const center = useGameStore.getState().radarCenter || { x: 450, y: 350 }
          const worldX = (ac.x - center.x) * 2.2
          const worldZ = (ac.y - center.y) * 2.2 - 140
          const worldY = ac.status === 'landing' ? 0.2 : Math.max(0.2, (ac.altitude / 8000) * 180)
          mesh.position.set(worldX, worldY, worldZ)
        }

        // Aircraft Rotation
        const rad = ((ac.heading || 90) * Math.PI) / 180
        mesh.rotation.y = -rad + Math.PI / 2

        if (ac.rot3d) {
          mesh.rotation.x = ac.rot3d.pitch
          mesh.rotation.z = ac.rot3d.roll
        }

        // Highlight selected plane with beacon intensity
        const isSelected = ac.id === selectedAircraftId
        mesh.scale.setScalar(isSelected ? 1.05 : 1.0)
      })

      renderer.render(scene, camera)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      dom.removeEventListener('click', onClick)
      renderer.dispose()
      if (dom.parentElement) dom.parentElement.removeChild(dom)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#8ecae6]"
    />
  )
}
