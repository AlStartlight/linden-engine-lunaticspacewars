
import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  ConeGeometry,
  SphereGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Color,
  Vector3
} from 'three'

export class ShipModels {
  // Reusable materials
  static getMetalMaterial(colorHex: string, roughness = 0.35, metalness = 0.85) {
    return new MeshStandardMaterial({
      color: new Color(colorHex),
      roughness,
      metalness
    })
  }

  static getNeonMaterial(colorHex: string, intensity = 2.5) {
    return new MeshStandardMaterial({
      color: new Color(colorHex),
      emissive: new Color(colorHex),
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.1
    })
  }

  // 1. VIPER-X (Interceptor: ±11m, sleek, agile, forward wings)
  static createViperX(primaryNeon = '#00f0ff', hullColor = '#0c0e18'): Group {
    const root = new Group()
    root.name = 'Viper-X'

    const hullMat = this.getMetalMaterial(hullColor, 0.25, 0.9)
    const armorMat = this.getMetalMaterial('#161a29', 0.4, 0.7)
    const neonMat = this.getNeonMaterial(primaryNeon, 2.2)

    // Fuselage
    const fuseGeo = new BoxGeometry(1.8, 0.9, 9.5)
    const fuseMesh = new Mesh(fuseGeo, hullMat)
    root.add(fuseMesh)

    // Nose
    const noseGeo = new CylinderGeometry(0.2, 1.0, 3.0, 4)
    noseGeo.rotateX(-Math.PI / 2)
    const noseMesh = new Mesh(noseGeo, armorMat)
    noseMesh.position.set(0, 0, -5.5)
    root.add(noseMesh)

    // Cockpit Canopy
    const canopyGeo = new BoxGeometry(1.1, 0.6, 3.2)
    const canopyMesh = new Mesh(canopyGeo, neonMat)
    canopyMesh.position.set(0, 0.55, -1.0)
    root.add(canopyMesh)

    // Wings (Swept)
    const wingGeo = new BoxGeometry(4.2, 0.18, 3.0)
    const wingL = new Mesh(wingGeo, hullMat)
    wingL.position.set(-2.5, 0.0, 0.8)
    wingL.rotation.y = -0.2
    wingL.rotation.z = -0.05
    root.add(wingL)

    const wingR = new Mesh(wingGeo, hullMat)
    wingR.position.set(2.5, 0.0, 0.8)
    wingR.rotation.y = 0.2
    wingR.rotation.z = 0.05
    root.add(wingR)

    // Neon Wingtip Fins & Guns
    const finGeo = new BoxGeometry(0.12, 1.1, 2.0)
    const finL = new Mesh(finGeo, neonMat)
    finL.position.set(-4.5, 0.45, 1.2)
    root.add(finL)

    const finR = new Mesh(finGeo, neonMat)
    finR.position.set(4.5, 0.45, 1.2)
    root.add(finR)

    // Twin Cannons on wings
    const gunGeo = new CylinderGeometry(0.1, 0.12, 2.4, 6)
    gunGeo.rotateX(-Math.PI / 2)
    const gunL = new Mesh(gunGeo, armorMat)
    gunL.position.set(-2.8, -0.15, -1.2)
    root.add(gunL)

    const gunR = new Mesh(gunGeo, armorMat)
    gunR.position.set(2.8, -0.15, -1.2)
    root.add(gunR)

    // Engines
    const engGeo = new CylinderGeometry(0.45, 0.55, 2.0, 8)
    engGeo.rotateX(Math.PI / 2)
    const engL = new Mesh(engGeo, armorMat)
    engL.position.set(-0.8, 0.1, 5.0)
    root.add(engL)

    const engR = new Mesh(engGeo, armorMat)
    engR.position.set(0.8, 0.1, 5.0)
    root.add(engR)

    // Thruster Glow Discs
    const glowGeo = new CylinderGeometry(0.35, 0.35, 0.2, 8)
    glowGeo.rotateX(Math.PI / 2)
    const glowL = new Mesh(glowGeo, neonMat)
    glowL.position.set(-0.8, 0.1, 6.0)
    root.add(glowL)

    const glowR = new Mesh(glowGeo, neonMat)
    glowR.position.set(0.8, 0.1, 6.0)
    root.add(glowR)

    return root
  }

  // 2. ONI WARDEN (Heavy Fighter: bulky, heavy armor plates, horns, amber/gold neon)
  static createOniWarden(primaryNeon = '#ffe600', hullColor = '#181210'): Group {
    const root = new Group()
    root.name = 'Oni Warden'

    const hullMat = this.getMetalMaterial(hullColor, 0.3, 0.8)
    const heavyMat = this.getMetalMaterial('#2a231f', 0.5, 0.6)
    const neonMat = this.getNeonMaterial(primaryNeon, 2.4)

    // Armored main hull
    const bodyGeo = new BoxGeometry(3.2, 1.8, 8.5)
    const body = new Mesh(bodyGeo, hullMat)
    root.add(body)

    // Armored prow
    const prowGeo = new BoxGeometry(2.6, 1.4, 3.2)
    const prow = new Mesh(prowGeo, heavyMat)
    prow.position.set(0, 0, -4.8)
    root.add(prow)

    // Heavy shoulder armor
    const shoulderGeo = new BoxGeometry(1.6, 1.2, 5.0)
    const shL = new Mesh(shoulderGeo, heavyMat)
    shL.position.set(-2.2, 0.3, 0)
    root.add(shL)

    const shR = new Mesh(shoulderGeo, heavyMat)
    shR.position.set(2.2, 0.3, 0)
    root.add(shR)

    // Heavy Plasma Cannons
    const cannonGeo = new CylinderGeometry(0.3, 0.35, 4.5, 8)
    cannonGeo.rotateX(-Math.PI / 2)
    const canL = new Mesh(cannonGeo, heavyMat)
    canL.position.set(-2.2, -0.2, -2.5)
    root.add(canL)

    const canR = new Mesh(cannonGeo, heavyMat)
    canR.position.set(2.2, -0.2, -2.5)
    root.add(canR)

    // Oni Horn fins
    const hornGeo = new ConeGeometry(0.3, 2.2, 4)
    hornGeo.rotateX(0.4)
    const hornL = new Mesh(hornGeo, neonMat)
    hornL.position.set(-1.0, 1.4, -2.0)
    hornL.rotation.z = -0.3
    root.add(hornL)

    const hornR = new Mesh(hornGeo, neonMat)
    hornR.position.set(1.0, 1.4, -2.0)
    hornR.rotation.z = 0.3
    root.add(hornR)

    // Triple Heavy Thrusters
    const engGeo = new CylinderGeometry(0.5, 0.6, 2.2, 8)
    engGeo.rotateX(Math.PI / 2)
    const eCenter = new Mesh(engGeo, heavyMat)
    eCenter.position.set(0, 0.2, 4.8)
    root.add(eCenter)

    const eL = new Mesh(engGeo, heavyMat)
    eL.position.set(-1.3, 0.0, 4.6)
    root.add(eL)

    const eR = new Mesh(engGeo, heavyMat)
    eR.position.set(1.3, 0.0, 4.6)
    root.add(eR)

    // Neon Thruster Glows
    const glowGeo = new CylinderGeometry(0.4, 0.4, 0.2, 8)
    glowGeo.rotateX(Math.PI / 2)
    const gC = new Mesh(glowGeo, neonMat)
    gC.position.set(0, 0.2, 5.8)
    root.add(gC)

    const gL = new Mesh(glowGeo, neonMat)
    gL.position.set(-1.3, 0.0, 5.6)
    root.add(gL)

    const gR = new Mesh(glowGeo, neonMat)
    gR.position.set(1.3, 0.0, 5.6)
    root.add(gR)

    return root
  }

  // 3. GHOST WIRE (Stealth Fighter: faceted diamond hull, railgun, violet/cyan wireframe neon)
  static createGhostWire(primaryNeon = '#a855f7', hullColor = '#0a0812'): Group {
    const root = new Group()
    root.name = 'Ghost Wire'

    const hullMat = this.getMetalMaterial(hullColor, 0.2, 0.95)
    const stealthMat = this.getMetalMaterial('#151222', 0.2, 0.9)
    const neonMat = this.getNeonMaterial(primaryNeon, 2.3)

    // Diamond delta main fuselage
    const bodyGeo = new BoxGeometry(2.0, 0.8, 10.0)
    const body = new Mesh(bodyGeo, hullMat)
    root.add(body)

    // Razor Delta Wings
    const wingGeo = new BoxGeometry(5.2, 0.12, 4.8)
    const wingL = new Mesh(wingGeo, stealthMat)
    wingL.position.set(-2.8, 0.0, 1.2)
    wingL.rotation.y = -0.4
    root.add(wingL)

    const wingR = new Mesh(wingGeo, stealthMat)
    wingR.position.set(2.8, 0.0, 1.2)
    wingR.rotation.y = 0.4
    root.add(wingR)

    // Center Spinal Railgun
    const railGeo = new BoxGeometry(0.4, 0.5, 7.5)
    const rail = new Mesh(railGeo, neonMat)
    rail.position.set(0, 0.45, -2.5)
    root.add(rail)

    // Stealth cockpit
    const cockGeo = new BoxGeometry(0.8, 0.4, 2.5)
    const cock = new Mesh(cockGeo, neonMat)
    cock.position.set(0, 0.35, 1.2)
    root.add(cock)

    // Flat twin stealth thrusters
    const engGeo = new BoxGeometry(2.4, 0.5, 1.8)
    const eng = new Mesh(engGeo, stealthMat)
    eng.position.set(0, 0, 5.2)
    root.add(eng)

    const glowGeo = new BoxGeometry(2.0, 0.3, 0.2)
    const glow = new Mesh(glowGeo, neonMat)
    glow.position.set(0, 0, 6.1)
    root.add(glow)

    return root
  }

  // 4. DEMON CROWN (Flagship Dreadnought Fighter: grand, imperial, trident prow, magenta neon)
  static createDemonCrown(primaryNeon = '#ff007f', hullColor = '#150612'): Group {
    const root = new Group()
    root.name = 'Demon Crown'

    const hullMat = this.getMetalMaterial(hullColor, 0.25, 0.85)
    const goldArmor = this.getMetalMaterial('#35142a', 0.3, 0.7)
    const neonMat = this.getNeonMaterial(primaryNeon, 2.6)

    // Imperial spine
    const bodyGeo = new BoxGeometry(3.4, 2.2, 12.0)
    const body = new Mesh(bodyGeo, hullMat)
    root.add(body)

    // Trident Center Prow
    const prowCenter = new BoxGeometry(1.6, 1.4, 5.0)
    const pC = new Mesh(prowCenter, goldArmor)
    pC.position.set(0, 0, -7.5)
    root.add(pC)

    // Trident Left Blade
    const prowL = new BoxGeometry(0.8, 1.2, 4.0)
    const pL = new Mesh(prowL, neonMat)
    pL.position.set(-2.0, 0, -6.5)
    root.add(pL)

    // Trident Right Blade
    const prowR = new BoxGeometry(0.8, 1.2, 4.0)
    const pR = new Mesh(prowR, neonMat)
    pR.position.set(2.0, 0, -6.5)
    root.add(pR)

    // Continuous Beam Emitter Core
    const beamCoreGeo = new CylinderGeometry(0.6, 0.6, 1.5, 12)
    beamCoreGeo.rotateX(-Math.PI / 2)
    const beamCore = new Mesh(beamCoreGeo, neonMat)
    beamCore.position.set(0, 0, -9.5)
    root.add(beamCore)

    // Imperial swept wings
    const wingGeo = new BoxGeometry(6.0, 0.3, 4.0)
    const wL = new Mesh(wingGeo, hullMat)
    wL.position.set(-3.8, 0.4, 1.0)
    wL.rotation.y = -0.25
    wL.rotation.z = -0.1
    root.add(wL)

    const wR = new Mesh(wingGeo, hullMat)
    wR.position.set(3.8, 0.4, 1.0)
    wR.rotation.y = 0.25
    wR.rotation.z = 0.1
    root.add(wR)

    // Crown Crest
    const crestGeo = new BoxGeometry(0.4, 2.4, 4.0)
    const crest = new Mesh(crestGeo, neonMat)
    crest.position.set(0, 1.8, 1.5)
    root.add(crest)

    // Quad Engines
    const engGeo = new CylinderGeometry(0.5, 0.6, 2.2, 8)
    engGeo.rotateX(Math.PI / 2)
    const glowGeo = new CylinderGeometry(0.4, 0.4, 0.2, 8)
    glowGeo.rotateX(Math.PI / 2)

    const offsets = [
      [-1.2, 0.6], [1.2, 0.6],
      [-1.2, -0.6], [1.2, -0.6]
    ]

    offsets.forEach(([ox, oy]) => {
      const e = new Mesh(engGeo, goldArmor)
      e.position.set(ox, oy, 6.2)
      root.add(e)
      const g = new Mesh(glowGeo, neonMat)
      g.position.set(ox, oy, 7.3)
      root.add(g)
    })

    return root
  }

  // ENEMY 1: Jackal Skimmer (Light fast raider)
  static createJackalSkimmer(): Group {
    const root = new Group()
    root.name = 'Jackal Skimmer'
    const hullMat = this.getMetalMaterial('#1a1610', 0.5, 0.7)
    const neonMat = this.getNeonMaterial('#ffaa00', 2.0)

    const bodyGeo = new BoxGeometry(1.6, 0.8, 8.0)
    const body = new Mesh(bodyGeo, hullMat)
    root.add(body)

    const wingGeo = new BoxGeometry(3.6, 0.15, 2.5)
    const wL = new Mesh(wingGeo, hullMat)
    wL.position.set(-2.0, 0, 0.5)
    wL.rotation.y = 0.2
    root.add(wL)

    const wR = new Mesh(wingGeo, hullMat)
    wR.position.set(2.0, 0, 0.5)
    wR.rotation.y = -0.2
    root.add(wR)

    const glow = new Mesh(new BoxGeometry(1.2, 0.4, 0.2), neonMat)
    glow.position.set(0, 0, 4.1)
    root.add(glow)

    const cockpit = new Mesh(new BoxGeometry(0.8, 0.4, 2.0), neonMat)
    cockpit.position.set(0, 0.45, -1.0)
    root.add(cockpit)

    return root
  }

  // ENEMY 2: Helix Torpedo Raider (Heavy Bomber)
  static createHelixBomber(): Group {
    const root = new Group()
    root.name = 'Helix Bomber'
    const hullMat = this.getMetalMaterial('#0a1622', 0.35, 0.85)
    const neonMat = this.getNeonMaterial('#00e5ff', 2.2)

    // Twin hull design
    const podGeo = new CylinderGeometry(0.7, 0.8, 9.0, 8)
    podGeo.rotateX(Math.PI / 2)

    const podL = new Mesh(podGeo, hullMat)
    podL.position.set(-1.8, 0, 0)
    root.add(podL)

    const podR = new Mesh(podGeo, hullMat)
    podR.position.set(1.8, 0, 0)
    root.add(podR)

    // Connecting central bay
    const bayGeo = new BoxGeometry(2.4, 1.2, 6.0)
    const bay = new Mesh(bayGeo, hullMat)
    root.add(bay)

    const neonCockpit = new Mesh(new BoxGeometry(1.4, 0.6, 2.0), neonMat)
    neonCockpit.position.set(0, 0.65, -1.8)
    root.add(neonCockpit)

    const glowL = new Mesh(new CylinderGeometry(0.5, 0.5, 0.2, 8), neonMat)
    glowL.rotateX(Math.PI / 2)
    glowL.position.set(-1.8, 0, 4.6)
    root.add(glowL)

    const glowR = new Mesh(new CylinderGeometry(0.5, 0.5, 0.2, 8), neonMat)
    glowR.rotateX(Math.PI / 2)
    glowR.position.set(1.8, 0, 4.6)
    root.add(glowR)

    return root
  }

  // ENEMY 3: Concord Dread-Frigate Boss (±60m long heavy capital ship)
  static createConcordFrigate(): Group {
    const root = new Group()
    root.name = 'Concord Dread-Frigate'
    const hullMat = this.getMetalMaterial('#181024', 0.3, 0.9)
    const armorMat = this.getMetalMaterial('#281a3d', 0.4, 0.8)
    const neonMat = this.getNeonMaterial('#c084fc', 2.8)

    // Main hull block (55m long, 14m wide, 9m tall)
    const mainHull = new Mesh(new BoxGeometry(14, 9, 55), hullMat)
    root.add(mainHull)

    // Raised Command Bridge
    const bridge = new Mesh(new BoxGeometry(8, 5, 18), armorMat)
    bridge.position.set(0, 6.5, 10)
    root.add(bridge)

    const bridgeVisor = new Mesh(new BoxGeometry(7, 1.5, 1.5), neonMat)
    bridgeVisor.position.set(0, 7.5, 0.5)
    root.add(bridgeVisor)

    // Side hangar pods
    const podGeo = new BoxGeometry(4, 5, 30)
    const podL = new Mesh(podGeo, armorMat)
    podL.position.set(-8.5, 0, 0)
    root.add(podL)

    const podR = new Mesh(podGeo, armorMat)
    podR.position.set(8.5, 0, 0)
    root.add(podR)

    // Turret barbettes
    const turretGeo = new CylinderGeometry(1.8, 2.0, 1.5, 12)
    const barrelGeo = new CylinderGeometry(0.3, 0.35, 6, 8)
    barrelGeo.rotateX(-Math.PI / 2)

    const turret1 = new Mesh(turretGeo, armorMat)
    turret1.position.set(0, 5.0, -14)
    const bar1 = new Mesh(barrelGeo, neonMat)
    bar1.position.set(0, 0.5, -3)
    turret1.add(bar1)
    root.add(turret1)

    const turret2 = new Mesh(turretGeo, armorMat)
    turret2.position.set(0, 5.0, -4)
    const bar2 = new Mesh(barrelGeo, neonMat)
    bar2.position.set(0, 0.5, -3)
    turret2.add(bar2)
    root.add(turret2)

    // Massive Engines
    const engGeo = new CylinderGeometry(2.5, 2.8, 6, 12)
    engGeo.rotateX(Math.PI / 2)
    const glowGeo = new CylinderGeometry(2.0, 2.0, 0.5, 12)
    glowGeo.rotateX(Math.PI / 2)

    const engOffsets = [[-4, 0], [4, 0], [0, 3]]
    engOffsets.forEach(([ox, oy]) => {
      const e = new Mesh(engGeo, armorMat)
      e.position.set(ox, oy, 28)
      root.add(e)
      const g = new Mesh(glowGeo, neonMat)
      g.position.set(ox, oy, 31)
      root.add(g)
    })

    return root
  }

  // Support Drone (Demon Crown ability)
  static createDrone(color = '#ff007f'): Group {
    const root = new Group()
    root.name = 'Support Drone'
    const hullMat = this.getMetalMaterial('#150612', 0.2, 0.9)
    const neonMat = this.getNeonMaterial(color, 2.8)

    const core = new Mesh(new SphereGeometry(0.5, 8, 8), neonMat)
    root.add(core)

    const ring = new Mesh(new TorusGeometry(1.1, 0.12, 6, 16), hullMat)
    root.add(ring)

    const gun = new Mesh(new CylinderGeometry(0.08, 0.08, 1.4, 6), neonMat)
    gun.rotateX(-Math.PI / 2)
    gun.position.set(0, 0, -0.6)
    root.add(gun)

    return root
  }

  // Floating Pickups (Repair, Missile, Energy)
  static createPickup(type: 'repair' | 'missile' | 'energy'): Group {
    const root = new Group()
    root.name = 'Pickup_' + type

    let color = '#22c55e'
    let iconGeo: any

    if (type === 'repair') {
      color = '#22c55e' // Green
      iconGeo = new BoxGeometry(0.6, 1.4, 0.6)
    } else if (type === 'missile') {
      color = '#f97316' // Orange
      iconGeo = new ConeGeometry(0.4, 1.4, 6)
      iconGeo.rotateX(-Math.PI / 2)
    } else {
      color = '#00f0ff' // Cyan
      iconGeo = new CylinderGeometry(0.4, 0.4, 1.2, 8)
    }

    const neonMat = this.getNeonMaterial(color, 3.0)
    const iconMesh = new Mesh(iconGeo, neonMat)
    root.add(iconMesh)

    const ring = new Mesh(new TorusGeometry(1.2, 0.08, 6, 16), neonMat)
    root.add(ring)

    return root
  }
}
