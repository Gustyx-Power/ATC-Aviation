import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'

export const Tower3DView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null)

  // Camera orientation state (First Person Tower Drag)
  const isDraggingRef = useRef<boolean>(false)
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cameraRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: -Math.PI * 0.12, // Look directly across the apron towards Runway 09
    pitch: -0.15,          // Look slightly down at airfield operations
  })
  const targetRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: -Math.PI * 0.12,
    pitch: -0.15,
  })
  const cameraFovRef = useRef<number>(65)
  const targetFovRef = useRef<number>(65)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x78b2e8) // Bright aviation sky
    scene.fog = new THREE.FogExp2(0xa2c8ea, 0.00045) // Soft realistic horizon haze

    // 2. Camera setup - Positioned at panoramic glass edge of Tower Cab
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 4500)
    
    // TOWER CAB EYE POSITION: 34m high, positioned cleanly at front window looking out
    const TOWER_POSITION = new THREE.Vector3(0, 34, -6)
    camera.position.copy(TOWER_POSITION)

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.9)
    sunLight.position.set(450, 650, 250)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 50
    sunLight.shadow.camera.far = 1800
    sunLight.shadow.camera.left = -700
    sunLight.shadow.camera.right = 700
    sunLight.shadow.camera.top = 700
    sunLight.shadow.camera.bottom = -700
    sunLight.shadow.bias = -0.0003
    scene.add(sunLight)

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c36, 0.5)
    scene.add(hemiLight)

    // ----------------------------------------------------
    // 5. AIRPORT GROUND & RUNWAYS
    // ----------------------------------------------------
    // Vast Terrain Base
    const terrainGeo = new THREE.PlaneGeometry(4000, 4000)
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x98b886, roughness: 0.95 }) // Natural green grass
    const terrain = new THREE.Mesh(terrainGeo, terrainMat)
    terrain.rotation.x = -Math.PI / 2
    terrain.position.y = -0.2
    terrain.receiveShadow = true
    scene.add(terrain)

    // Airport Infield Turf
    const infieldGeo = new THREE.PlaneGeometry(1800, 1100)
    const infieldMat = new THREE.MeshStandardMaterial({ color: 0x3d702d, roughness: 0.9 })
    const infield = new THREE.Mesh(infieldGeo, infieldMat)
    infield.rotation.x = -Math.PI / 2
    infield.position.set(100, -0.05, -150)
    infield.receiveShadow = true
    scene.add(infield)

    // MAIN RUNWAY 09/27 (Length: 1500m, Width: 55m, at Z = -260)
    const rwyLength = 1500
    const rwyWidth = 55
    const rwyPosZ = -260

    const runwayGeo = new THREE.PlaneGeometry(rwyLength, rwyWidth)
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.75,
      metalness: 0.15,
    })
    const runway = new THREE.Mesh(runwayGeo, runwayMat)
    runway.rotation.x = -Math.PI / 2
    runway.position.set(50, 0.02, rwyPosZ)
    runway.receiveShadow = true
    scene.add(runway)

    // Runway Centerline Dashes
    const markingsGroup = new THREE.Group()
    const dashLength = 25
    const dashGap = 18
    const numDashes = Math.floor(rwyLength / (dashLength + dashGap)) - 4
    const startX = -rwyLength / 2 + 100
    for (let i = 0; i < numDashes; i++) {
      const dashGeo = new THREE.PlaneGeometry(dashLength, 2.4)
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const dash = new THREE.Mesh(dashGeo, dashMat)
      dash.rotation.x = -Math.PI / 2
      dash.position.set(startX + i * (dashLength + dashGap), 0.06, rwyPosZ)
      markingsGroup.add(dash)
    }

    // Runway 09 Threshold Piano Keys (West) & 27 (East)
    const numKeys = 10
    const keyWidth = 2.4
    const keyLength = 26
    for (let i = 0; i < numKeys; i++) {
      const keyGeo = new THREE.PlaneGeometry(keyLength, keyWidth)
      const keyMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const yOffset = -(numKeys * keyWidth * 1.5) / 2 + i * keyWidth * 1.5 + keyWidth

      // 09 Threshold
      const key09 = new THREE.Mesh(keyGeo, keyMat)
      key09.rotation.x = -Math.PI / 2
      key09.position.set(-rwyLength / 2 + 80, 0.07, rwyPosZ + yOffset)
      markingsGroup.add(key09)

      // 27 Threshold
      const key27 = new THREE.Mesh(keyGeo, keyMat)
      key27.rotation.x = -Math.PI / 2
      key27.position.set(rwyLength / 2 - 20, 0.07, rwyPosZ + yOffset)
      markingsGroup.add(key27)
    }

    // Runway Edge Lights (Glowing White) & Threshold Lights (Glowing Green/Red)
    const edgeLightsGroup = new THREE.Group()
    const lightSpacing = 50
    const numLights = Math.floor(rwyLength / lightSpacing)
    const lightSphereGeo = new THREE.SphereGeometry(0.38, 8, 8)
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 })
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 2.2 })
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2.2 })

    for (let i = 0; i <= numLights; i++) {
      const lx = -rwyLength / 2 + 50 + i * lightSpacing
      // North Edge
      const lN = new THREE.Mesh(lightSphereGeo, whiteMat)
      lN.position.set(lx, 0.4, rwyPosZ - rwyWidth / 2 - 1.2)
      edgeLightsGroup.add(lN)
      // South Edge
      const lS = new THREE.Mesh(lightSphereGeo, whiteMat)
      lS.position.set(lx, 0.4, rwyPosZ + rwyWidth / 2 + 1.2)
      edgeLightsGroup.add(lS)
    }

    // Threshold 09 Green Lights Row
    for (let i = -6; i <= 6; i++) {
      const gL = new THREE.Mesh(lightSphereGeo, greenMat)
      gL.position.set(-rwyLength / 2 + 65, 0.4, rwyPosZ + i * 3.6)
      edgeLightsGroup.add(gL)

      const rL = new THREE.Mesh(lightSphereGeo, redMat)
      rL.position.set(rwyLength / 2 - 5, 0.4, rwyPosZ + i * 3.6)
      edgeLightsGroup.add(rL)
    }

    scene.add(markingsGroup)
    scene.add(edgeLightsGroup)

    // TAXIWAY ALPHA (Parallel taxiway connecting gates, hangar, and runway)
    const taxiAlphaGeo = new THREE.PlaneGeometry(1200, 28)
    const taxiMat = new THREE.MeshStandardMaterial({ color: 0x2e333b, roughness: 0.85 })
    const taxiAlpha = new THREE.Mesh(taxiAlphaGeo, taxiMat)
    taxiAlpha.rotation.x = -Math.PI / 2
    taxiAlpha.position.set(-40, 0.03, -135)
    taxiAlpha.receiveShadow = true
    scene.add(taxiAlpha)

    // Taxiway Yellow Centerline
    const taxiYellowMat = new THREE.MeshBasicMaterial({ color: 0xfcc419 })
    const taxiLineGeo = new THREE.PlaneGeometry(1200, 0.8)
    const taxiLine = new THREE.Mesh(taxiLineGeo, taxiYellowMat)
    taxiLine.rotation.x = -Math.PI / 2
    taxiLine.position.set(-40, 0.06, -135)
    scene.add(taxiLine)

    // High Speed Exit Bravo (connects midfield runway to taxiway)
    const exitBravoGeo = new THREE.PlaneGeometry(28, 130)
    const exitBravo = new THREE.Mesh(exitBravoGeo, taxiMat)
    exitBravo.rotation.x = -Math.PI / 2
    exitBravo.position.set(-80, 0.03, -195)
    exitBravo.receiveShadow = true
    scene.add(exitBravo)

    // Entrance Taxiway to Runway 09 Threshold
    const entrance09 = new THREE.Mesh(exitBravoGeo, taxiMat)
    entrance09.rotation.x = -Math.PI / 2
    entrance09.position.set(-600, 0.03, -195)
    entrance09.receiveShadow = true
    scene.add(entrance09)

    // Holding Point Line (Red & Yellow) at Runway 09
    const holdLineGeo = new THREE.PlaneGeometry(26, 1.4)
    const holdLineMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    const holdLine = new THREE.Mesh(holdLineGeo, holdLineMat)
    holdLine.rotation.x = -Math.PI / 2
    holdLine.position.set(-600, 0.07, rwyPosZ + rwyWidth / 2 + 18)
    scene.add(holdLine)

    // ----------------------------------------------------
    // 6. TERMINAL APRON, GATES 1-3, AND MAINTENANCE HANGAR
    // ----------------------------------------------------
    // Main Apron Concrete Pavement
    const apronGeo = new THREE.PlaneGeometry(450, 180)
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x485260, roughness: 0.8 })
    const apron = new THREE.Mesh(apronGeo, apronMat)
    apron.rotation.x = -Math.PI / 2
    apron.position.set(-120, 0.04, -40)
    apron.receiveShadow = true
    scene.add(apron)

    // Terminal 1 Main Building (Modern Glass & Steel Architecture)
    const terminalGeo = new THREE.BoxGeometry(320, 24, 60)
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3 })
    const terminal = new THREE.Mesh(terminalGeo, terminalMat)
    terminal.position.set(-150, 12, 35)
    terminal.castShadow = true
    terminal.receiveShadow = true
    scene.add(terminal)

    // Terminal Blue Glass Facade
    const glassGeo = new THREE.BoxGeometry(310, 16, 2)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f2942,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75,
    })
    const glass = new THREE.Mesh(glassGeo, glassMat)
    glass.position.set(-150, 12, 4)
    scene.add(glass)

    // 3 Telescopic Jetways for Gate 1, Gate 2, Gate 3
    const GATE_POSITIONS = {
      'Gate 1': { x: -230, z: -55 },
      'Gate 2': { x: -150, z: -55 },
      'Gate 3': { x: -70, z: -55 },
      'Hangar': { x: 120, z: -40 },
    }

    Object.entries(GATE_POSITIONS).forEach(([name, pos]) => {
      if (name !== 'Hangar') {
        // Jetway Bridge
        const jetwayGeo = new THREE.BoxGeometry(8, 6, 28)
        const jetwayMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
        const jetway = new THREE.Mesh(jetwayGeo, jetwayMat)
        jetway.position.set(pos.x, 7, -8)
        jetway.castShadow = true
        scene.add(jetway)

        // Gate Lead-in Yellow Line
        const leadInGeo = new THREE.PlaneGeometry(3, 40)
        const leadIn = new THREE.Mesh(leadInGeo, taxiYellowMat)
        leadIn.rotation.x = -Math.PI / 2
        leadIn.position.set(pos.x, 0.06, -38)
        scene.add(leadIn)

        // Red Stop Bar
        const stopBarGeo = new THREE.PlaneGeometry(14, 1.2)
        const stopBarMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 })
        const stopBar = new THREE.Mesh(stopBarGeo, stopBarMat)
        stopBar.rotation.x = -Math.PI / 2
        stopBar.position.set(pos.x, 0.07, pos.z)
        scene.add(stopBar)
      }
    })

    // MAINTENANCE HANGAR BUILDING (East of the terminal apron)
    const hangarGeo = new THREE.BoxGeometry(110, 32, 90)
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.4 })
    const hangar = new THREE.Mesh(hangarGeo, hangarMat)
    hangar.position.set(120, 16, 20)
    hangar.castShadow = true
    hangar.receiveShadow = true
    scene.add(hangar)

    // Open Hangar Bay Doors (Yellow interior work illumination)
    const hangarInteriorGeo = new THREE.BoxGeometry(90, 24, 4)
    const hangarInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0xffaa00,
      emissiveIntensity: 0.25,
    })
    const hangarBay = new THREE.Mesh(hangarInteriorGeo, hangarInteriorMat)
    hangarBay.position.set(120, 12, -24)
    scene.add(hangarBay)

    // Hangar Taxiway Connector
    const hangarTaxiGeo = new THREE.PlaneGeometry(30, 95)
    const hangarTaxi = new THREE.Mesh(hangarTaxiGeo, taxiMat)
    hangarTaxi.rotation.x = -Math.PI / 2
    hangarTaxi.position.set(120, 0.03, -75)
    hangarTaxi.receiveShadow = true
    scene.add(hangarTaxi)

    // ----------------------------------------------------
    // 7. GROUND SERVICE VEHICLES (GSE)
    // ----------------------------------------------------
    const gseGroup = new THREE.Group()

    // Airport Fire Crash Tender (Truck with emergency beacon)
    const fireTruck = new THREE.Group()
    const truckBodyGeo = new THREE.BoxGeometry(7, 4.5, 14)
    const fireRedMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 })
    const truckBody = new THREE.Mesh(truckBodyGeo, fireRedMat)
    truckBody.position.y = 2.8
    truckBody.castShadow = true
    fireTruck.add(truckBody)

    // Water Cannon Roof Monitor
    const cannonGeo = new THREE.CylinderGeometry(0.4, 0.4, 3)
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
    const cannon = new THREE.Mesh(cannonGeo, cannonMat)
    cannon.rotation.x = Math.PI / 3
    cannon.position.set(0, 5.5, -4)
    fireTruck.add(cannon)

    // Emergency Flashing Beacon Lights (Red & Blue)
    const beaconSphereGeo = new THREE.SphereGeometry(0.45, 8, 8)
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const blueBeaconMat = new THREE.MeshBasicMaterial({ color: 0x0088ff })
    const beaconR = new THREE.Mesh(beaconSphereGeo, redBeaconMat)
    beaconR.position.set(-1.8, 5.5, -1)
    fireTruck.add(beaconR)
    const beaconB = new THREE.Mesh(beaconSphereGeo, blueBeaconMat)
    beaconB.position.set(1.8, 5.5, -1)
    fireTruck.add(beaconB)

    fireTruck.position.set(-480, 0, -200) // Standby near Runway 09 entrance
    gseGroup.add(fireTruck)

    // Fuel Tanker Truck
    const fuelTruck = new THREE.Group()
    const tankerGeo = new THREE.CylinderGeometry(2.4, 2.4, 12, 16)
    const fuelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    const tanker = new THREE.Mesh(tankerGeo, fuelMat)
    tanker.rotation.x = Math.PI / 2
    tanker.position.set(0, 3.2, 0)
    fuelTruck.add(tanker)
    const cabGeo = new THREE.BoxGeometry(5, 4, 5)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    const cab = new THREE.Mesh(cabGeo, cabMat)
    cab.position.set(0, 2.5, -7.5)
    fuelTruck.add(cab)
    fuelTruck.position.set(-180, 0, -35) // Servicing Gate 1 area
    gseGroup.add(fuelTruck)

    scene.add(gseGroup)

    // ----------------------------------------------------
    // 8. TOWER CAB INTERIOR & UNOBSTRUCTED CURVED BALCONY
    // ----------------------------------------------------
    // We position the floor and lower consoles below eye-level so the view is 100% panoramic!
    const towerInterior = new THREE.Group()

    // Tower Cab Floor (below player feet)
    const floorGeo = new THREE.CircleGeometry(24, 24)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 32.2, 0)
    towerInterior.add(floor)

    // Low Profile Curved Console Desk (below window line at Y = 32.8)
    const consoleGeo = new THREE.BoxGeometry(26, 1.2, 3.5)
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    const consoleMesh = new THREE.Mesh(consoleGeo, consoleMat)
    consoleMesh.position.set(0, 32.8, -12)
    towerInterior.add(consoleMesh)

    // Low instrument panels
    const panelGeo = new THREE.BoxGeometry(6, 1.5, 0.4)
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x06192a,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.35,
    })
    const panelL = new THREE.Mesh(panelGeo, panelMat)
    panelL.position.set(-6, 33.6, -11.5)
    panelL.rotation.x = -0.3
    towerInterior.add(panelL)

    const panelR = new THREE.Mesh(panelGeo, panelMat)
    panelR.position.set(6, 33.6, -11.5)
    panelR.rotation.x = -0.3
    towerInterior.add(panelR)

    scene.add(towerInterior)

    // ----------------------------------------------------
    // 9. DYNAMIC WEATHER SYSTEM (RAIN & STORM PARTICLES)
    // ----------------------------------------------------
    const rainCount = 6000
    const rainGeo = new THREE.BufferGeometry()
    const rainPositions = new Float32Array(rainCount * 3)

    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 1600
      rainPositions[i + 1] = Math.random() * 400
      rainPositions[i + 2] = (Math.random() - 0.5) * 1600
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
    const rainMat = new THREE.PointsMaterial({
      color: 0xcfd8dc,
      size: 0.75,
      transparent: true,
      opacity: 0, // Hidden during clear weather
    })
    const rainParticles = new THREE.Points(rainGeo, rainMat)
    scene.add(rainParticles)

    // ----------------------------------------------------
    // 10. PROCEDURAL 3D AIRLINER MESHES
    // ----------------------------------------------------
    const aircraftMeshes = new Map<string, THREE.Group>()

    function createAirlinerMesh(airline: string = 'Garuda Indonesia'): THREE.Group {
      const plane = new THREE.Group()

      let liveryColor = 0x00a896 // Garuda Cyan
      if (airline.includes('Lion')) {
        liveryColor = 0xd90429 // Lion Red
      } else if (airline.includes('Citilink')) {
        liveryColor = 0x70e000 // Citilink Green
      } else if (airline.includes('Batik')) {
        liveryColor = 0x9d0208 // Batik Maroon
      }

      // Fuselage Body
      const fuselageGeo = new THREE.CylinderGeometry(2.4, 2.4, 36, 16)
      const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.15 })
      const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
      fuselage.rotation.x = Math.PI / 2
      fuselage.position.y = 3.8
      fuselage.castShadow = true
      fuselage.receiveShadow = true
      plane.add(fuselage)

      // Aerodynamic Nose
      const noseGeo = new THREE.ConeGeometry(2.4, 6.5, 16)
      const noseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
      const nose = new THREE.Mesh(noseGeo, noseMat)
      nose.rotation.x = -Math.PI / 2
      nose.position.set(0, 3.8, -21.2)
      nose.castShadow = true
      plane.add(nose)

      // Cockpit Windshield (Reflective Jet Black Glass)
      const windshieldGeo = new THREE.BoxGeometry(2.5, 1.3, 2.4)
      const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x091428, roughness: 0.1, metalness: 0.9 })
      const windshield = new THREE.Mesh(windshieldGeo, windshieldMat)
      windshield.position.set(0, 4.6, -19)
      windshield.rotation.x = 0.32
      plane.add(windshield)

      // Swept Main Wings
      const wingGeo = new THREE.BoxGeometry(34, 0.5, 6.5)
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
      const wings = new THREE.Mesh(wingGeo, wingMat)
      wings.position.set(0, 3.4, 0)
      wings.castShadow = true
      plane.add(wings)

      // Winglets (Airline Colors)
      const wingletGeo = new THREE.BoxGeometry(0.45, 2.8, 2.5)
      const liveryMat = new THREE.MeshStandardMaterial({ color: liveryColor, roughness: 0.3 })
      const leftWinglet = new THREE.Mesh(wingletGeo, liveryMat)
      leftWinglet.position.set(-17, 4.6, 0)
      plane.add(leftWinglet)
      const rightWinglet = new THREE.Mesh(wingletGeo, liveryMat)
      rightWinglet.position.set(17, 4.6, 0)
      plane.add(rightWinglet)

      // Twin Turbofan Jet Engines
      const engineGeo = new THREE.CylinderGeometry(1.4, 1.3, 5.8, 14)
      const engineMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.35, roughness: 0.3 })
      const leftEngine = new THREE.Mesh(engineGeo, engineMat)
      leftEngine.rotation.x = Math.PI / 2
      leftEngine.position.set(-7.5, 2.2, -1)
      leftEngine.castShadow = true
      plane.add(leftEngine)

      const rightEngine = new THREE.Mesh(engineGeo, engineMat)
      rightEngine.rotation.x = Math.PI / 2
      rightEngine.position.set(7.5, 2.2, -1)
      rightEngine.castShadow = true
      plane.add(rightEngine)

      // Vertical Tail Fin (Livery Colors)
      const tailFinGeo = new THREE.BoxGeometry(0.5, 9, 7)
      const tailFin = new THREE.Mesh(tailFinGeo, liveryMat)
      tailFin.position.set(0, 8.2, 15)
      tailFin.rotation.x = -0.38
      tailFin.castShadow = true
      plane.add(tailFin)

      // Horizontal Stabilizers
      const hStabGeo = new THREE.BoxGeometry(12, 0.4, 3.2)
      const hStab = new THREE.Mesh(hStabGeo, wingMat)
      hStab.position.set(0, 4.8, 16.5)
      hStab.castShadow = true
      plane.add(hStab)

      // Landing Gear with Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.55, 12)
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })

      // Nose Gear
      const noseWheel = new THREE.Mesh(wheelGeo, tireMat)
      noseWheel.rotation.z = Math.PI / 2
      noseWheel.position.set(0, 0.75, -15)
      plane.add(noseWheel)

      // Main Gears
      const mainLeft = new THREE.Mesh(wheelGeo, tireMat)
      mainLeft.rotation.z = Math.PI / 2
      mainLeft.position.set(-4.8, 0.75, 1.8)
      plane.add(mainLeft)

      const mainRight = new THREE.Mesh(wheelGeo, tireMat)
      mainRight.rotation.z = Math.PI / 2
      mainRight.position.set(4.8, 0.75, 1.8)
      plane.add(mainRight)

      // Flashing Anti-Collision Red Beacon
      const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8)
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0022 })
      const topBeacon = new THREE.Mesh(beaconGeo, beaconMat)
      topBeacon.position.set(0, 6.4, 1)
      plane.add(topBeacon)

      // High Intensity Forward Landing Lights
      const landingLight = new THREE.SpotLight(0xfffaed, 3.5, 220, Math.PI * 0.25, 0.6)
      landingLight.position.set(0, 3.8, -20)
      landingLight.target.position.set(0, 0, -140)
      plane.add(landingLight)
      plane.add(landingLight.target)

      return plane
    }

    // ----------------------------------------------------
    // 11. FIRST PERSON TOWER DRAG & POINTER HANDLERS
    // ----------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
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

      const SENSITIVITY = 0.0032
      targetRotationRef.current.yaw -= deltaX * SENSITIVITY
      targetRotationRef.current.pitch -= deltaY * SENSITIVITY

      // Clamp vertical pitch so user has a realistic natural tower view
      targetRotationRef.current.pitch = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.18, targetRotationRef.current.pitch))
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetFovRef.current += e.deltaY * 0.04
      targetFovRef.current = Math.max(22, Math.min(75, targetFovRef.current))
    }

    const dom = renderer.domElement
    dom.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('wheel', onWheel, { passive: false })

    // Raycaster for selecting planes in 3D
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
    // 12. CONTINUOUS 60 FPS RENDER & ANIMATION LOOP
    // ----------------------------------------------------
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth camera interpolation
      cameraRotationRef.current.yaw += (targetRotationRef.current.yaw - cameraRotationRef.current.yaw) * 0.14
      cameraRotationRef.current.pitch += (targetRotationRef.current.pitch - cameraRotationRef.current.pitch) * 0.14
      cameraFovRef.current += (targetFovRef.current - cameraFovRef.current) * 0.14

      if (Math.abs(camera.fov - cameraFovRef.current) > 0.05) {
        camera.fov = cameraFovRef.current
        camera.updateProjectionMatrix()
      }

      const { aircrafts, selectedAircraftId, viewMode, weather, emergencyServicesActive } = useGameStore.getState()
      const selectedAc = aircrafts.find((a) => a.id === selectedAircraftId)

      // Weather Adjustments
      if (weather.condition === 'Hujan Badai') {
        scene.background = new THREE.Color(0x334155) // Stormy slate
        scene.fog = new THREE.FogExp2(0x475569, 0.0012)
        rainMat.opacity = 0.65
        sunLight.intensity = 0.6

        // Animate falling rain streaks
        const positions = rainGeo.attributes.position.array as Float32Array
        for (let i = 1; i < rainCount * 3; i += 3) {
          positions[i] -= 8.5
          if (positions[i] < 0) positions[i] = 400
        }
        rainGeo.attributes.position.needsUpdate = true
      } else if (weather.condition === 'Kabut Tebal') {
        scene.background = new THREE.Color(0x94a3b8)
        scene.fog = new THREE.FogExp2(0x94a3b8, 0.0035) // Heavy dense fog
        rainMat.opacity = 0
        sunLight.intensity = 0.8
      } else {
        scene.background = new THREE.Color(0x78b2e8)
        scene.fog = new THREE.FogExp2(0xa2c8ea, 0.00045)
        rainMat.opacity = 0
        sunLight.intensity = 1.9
      }

      // Emergency Fire Truck Siren Animation
      if (emergencyServicesActive) {
        const flash = Math.sin(Date.now() / 80) > 0
        beaconR.visible = flash
        beaconB.visible = !flash
        // Rush towards runway threshold
        fireTruck.position.x = Math.max(-580, fireTruck.position.x - 1.2)
      } else {
        beaconR.visible = false
        beaconB.visible = false
        fireTruck.position.set(-480, 0, -200)
      }

      // Camera Modes
      if (viewMode === 'follow' && selectedAc && selectedAc.pos3d) {
        const headingRad = ((selectedAc.heading || 90) * Math.PI) / 180
        const camDist = 85
        const camH = 32
        camera.position.x = selectedAc.pos3d.x - Math.sin(headingRad) * camDist
        camera.position.y = selectedAc.pos3d.y + camH
        camera.position.z = selectedAc.pos3d.z + Math.cos(headingRad) * camDist
        camera.lookAt(selectedAc.pos3d.x, selectedAc.pos3d.y + 6, selectedAc.pos3d.z)
      } else if (viewMode === 'binoculars' && selectedAc && selectedAc.pos3d) {
        camera.position.copy(TOWER_POSITION)
        camera.lookAt(selectedAc.pos3d.x, selectedAc.pos3d.y + 4, selectedAc.pos3d.z)
      } else {
        // Unobstructed Panoramic Tower Drag View
        camera.position.copy(TOWER_POSITION)
        const euler = new THREE.Euler(cameraRotationRef.current.pitch, cameraRotationRef.current.yaw, 0, 'YXZ')
        camera.quaternion.setFromEuler(euler)
      }

      // Synchronize 3D Airplane Meshes
      const existingIds = new Set(aircrafts.map((a) => a.id))

      for (const [id, mesh] of aircraftMeshes.entries()) {
        if (!existingIds.has(id)) {
          scene.remove(mesh)
          aircraftMeshes.delete(id)
        }
      }

      aircrafts.forEach((ac) => {
        let mesh = aircraftMeshes.get(ac.id)
        if (!mesh) {
          mesh = createAirlinerMesh(ac.airline)
          mesh.name = ac.id
          scene.add(mesh)
          aircraftMeshes.set(ac.id, mesh)
        }

        if (ac.pos3d) {
          mesh.position.set(ac.pos3d.x, ac.pos3d.y, ac.pos3d.z)
        }

        const rad = ((ac.heading || 90) * Math.PI) / 180
        mesh.rotation.y = -rad + Math.PI / 2

        if (ac.rot3d) {
          mesh.rotation.x = ac.rot3d.pitch
          mesh.rotation.z = ac.rot3d.roll
        }

        // Selected plane scale pulse
        const isSelected = ac.id === selectedAircraftId
        mesh.scale.setScalar(isSelected ? 1.06 : 1.0)
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
      dom.removeEventListener('click', onClick)
      renderer.dispose()
      if (dom.parentElement) dom.parentElement.removeChild(dom)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#78b2e8]"
    />
  )
}
