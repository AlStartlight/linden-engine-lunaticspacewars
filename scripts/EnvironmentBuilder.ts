
import {
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  CylinderGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Color,
  CanvasTexture
} from 'three'

export class EnvironmentBuilder {
  static createSpaceStation(): Group {
    const root = new Group()
    root.name = 'OrbitalStation'

    const stationMat = new MeshStandardMaterial({
      color: new Color('#141722'),
      metalness: 0.85,
      roughness: 0.3
    })

    const neonCyan = new MeshStandardMaterial({
      color: new Color('#00f0ff'),
      emissive: new Color('#00f0ff'),
      emissiveIntensity: 2.5
    })

    const neonMagenta = new MeshStandardMaterial({
      color: new Color('#ff007f'),
      emissive: new Color('#ff007f'),
      emissiveIntensity: 2.5
    })

    const neonYellow = new MeshStandardMaterial({
      color: new Color('#ffe600'),
      emissive: new Color('#ffe600'),
      emissiveIntensity: 2.5
    })

    // Central Spindle
    const spindle = new Mesh(new CylinderGeometry(8, 10, 120, 16), stationMat)
    root.add(spindle)

    // Main Habitat Torus Ring
    const torus = new Mesh(new TorusGeometry(50, 6, 12, 32), stationMat)
    torus.rotateX(Math.PI / 2)
    root.add(torus)

    // Outer Neon Ring Rim
    const rim = new Mesh(new TorusGeometry(56, 1.2, 8, 32), neonCyan)
    rim.rotateX(Math.PI / 2)
    root.add(rim)

    // 4 Connecting Spokes
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      const spoke = new Mesh(new CylinderGeometry(2.5, 2.5, 50, 8), stationMat)
      spoke.position.set(Math.cos(angle) * 25, 0, Math.sin(angle) * 25)
      spoke.rotation.z = Math.PI / 2
      spoke.rotation.y = angle
      root.add(spoke)
    }

    // Solar / Neon Panel Arrays
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3
      const panel = new Mesh(new BoxGeometry(12, 0.4, 25), neonCyan)
      panel.position.set(Math.cos(angle) * 65, 20, Math.sin(angle) * 65)
      panel.rotation.y = angle
      root.add(panel)
    }

    // 3 Holographic Cyberpunk Billboards
    const b1 = new Mesh(new BoxGeometry(22, 12, 0.5), neonCyan)
    b1.position.set(0, 45, -30)
    root.add(b1)

    const b2 = new Mesh(new BoxGeometry(22, 12, 0.5), neonMagenta)
    b2.position.set(30, 45, 0)
    b2.rotation.y = Math.PI / 2
    root.add(b2)

    const b3 = new Mesh(new BoxGeometry(22, 12, 0.5), neonYellow)
    b3.position.set(-30, 45, 0)
    b3.rotation.y = -Math.PI / 2
    root.add(b3)

    return root
  }

  static createDistantPlanet(): Group {
    const root = new Group()
    root.name = 'DistantPlanet'

    const planetMat = new MeshStandardMaterial({
      color: new Color('#2b1055'),
      roughness: 0.9,
      metalness: 0.1
    })

    const planet = new Mesh(new SphereGeometry(120, 24, 24), planetMat)
    root.add(planet)

    // Neon Atmospheric Rings
    const ringMat = new MeshStandardMaterial({
      color: new Color('#00f0ff'),
      emissive: new Color('#00f0ff'),
      emissiveIntensity: 1.2,
      roughness: 0.5
    })
    const ring = new Mesh(new TorusGeometry(200, 14, 2, 48), ringMat)
    ring.rotation.x = Math.PI / 3
    ring.rotation.y = 0.2
    root.add(ring)

    return root
  }

  static createAsteroids(count = 25): Group {
    const root = new Group()
    root.name = 'AsteroidField'

    const rockMat = new MeshStandardMaterial({
      color: new Color('#363230'),
      roughness: 0.95,
      metalness: 0.2
    })

    const oreMat = new MeshStandardMaterial({
      color: new Color('#00f0ff'),
      emissive: new Color('#00f0ff'),
      emissiveIntensity: 1.5,
      roughness: 0.3
    })

    for (let i = 0; i < count; i++) {
      const rock = new Group()
      const radius = 6 + Math.random() * 16

      const baseRock = new Mesh(new SphereGeometry(radius, 6, 5), rockMat)
      baseRock.scale.set(
        0.8 + Math.random() * 0.5,
        0.8 + Math.random() * 0.5,
        0.8 + Math.random() * 0.5
      )
      rock.add(baseRock)

      // Ore Vein glowing inside asteroid
      if (Math.random() > 0.4) {
        const ore = new Mesh(new BoxGeometry(radius * 0.8, 1.2, radius * 0.8), oreMat)
        ore.rotation.set(Math.random() * 3, Math.random() * 3, 0)
        rock.add(ore)
      }

      // Distribute in a spherical belt around arena
      const dist = 140 + Math.random() * 300
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI * 0.7

      rock.position.set(
        Math.cos(theta) * Math.cos(phi) * dist,
        Math.sin(phi) * dist,
        Math.sin(theta) * Math.cos(phi) * dist
      )
      rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      root.add(rock)
    }

    return root
  }

  static createHangarPlatform(): Group {
    const root = new Group()
    root.name = 'HangarPlatform'

    const platMat = new MeshStandardMaterial({
      color: new Color('#0f1118'),
      metalness: 0.9,
      roughness: 0.2
    })

    const neonMat = new MeshStandardMaterial({
      color: new Color('#00f0ff'),
      emissive: new Color('#00f0ff'),
      emissiveIntensity: 3.0
    })

    // Central circular pedestal
    const disc = new Mesh(new CylinderGeometry(14, 15, 1.5, 32), platMat)
    disc.position.y = -2
    root.add(disc)

    // Concentric neon rings
    const ring1 = new Mesh(new TorusGeometry(13.8, 0.2, 8, 32), neonMat)
    ring1.rotation.x = Math.PI / 2
    ring1.position.y = -1.2
    root.add(ring1)

    const ring2 = new Mesh(new TorusGeometry(8.0, 0.15, 8, 32), neonMat)
    ring2.rotation.x = Math.PI / 2
    ring2.position.y = -1.2
    root.add(ring2)

    return root
  }
}
