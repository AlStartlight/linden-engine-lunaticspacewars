
import { Vector3, Euler, PerspectiveCamera } from 'three'
import { SoundSystem } from './SoundSystem'
import { GalacticWar } from './GalacticWar'

interface Projectile {
  id: string
  pos: Vector3
  vel: Vector3
  life: number
  damage: number
  isEnemy: boolean
  isMissile: boolean
  targetId?: string
}

interface EnemyShip {
  id: string
  name: string
  pos: Vector3
  vel: Vector3
  rot: Vector3
  hull: number
  maxHull: number
  shield: number
  maxShield: number
  speed: number
  aiState: 'chase' | 'evade' | 'retreat'
  fireTimer: number
  isBoss?: boolean
}

interface Pickup {
  id: string
  type: 'repair' | 'missile' | 'energy'
  pos: Vector3
}

interface Drone {
  id: string
  offsetAngle: number
}

export default class SpaceGame {
  private ctx: any
  private sound!: SoundSystem
  private galaxy!: GalacticWar

  // Game States: 'MENU' | 'HANGAR' | 'DOGFIGHT' | 'GALAXY' | 'SETTINGS' | 'ENDGAME'
  gameState = 'MENU'

  // Ships definition
  ships = [
    {
      name: 'Viper-X',
      class: 'INTERCEPTOR CLASS',
      maxHull: 100,
      maxShield: 80,
      speed: 42,
      boostSpeed: 82,
      turnRate: 2.4,
      damage: 20,
      meshScale: [1.0, 1.0, 1.0],
      color: '#00f0ff',
      abilityName: 'PHASE DASH',
      abilityDesc: 'Blinks forward 45 meters instantaneously, shedding all missile locks.'
    },
    {
      name: 'Oni Warden',
      class: 'HEAVY FIGHTER CLASS',
      maxHull: 260,
      maxShield: 200,
      speed: 26,
      boostSpeed: 50,
      turnRate: 1.5,
      damage: 48,
      meshScale: [1.3, 1.2, 1.1],
      color: '#ffe600',
      abilityName: 'SHIELD OVERCHARGE',
      abilityDesc: 'Generates an invulnerable barrier absorbing 100% of damage for 5s.'
    },
    {
      name: 'Ghost Wire',
      class: 'STEALTH FIGHTER CLASS',
      maxHull: 130,
      maxShield: 110,
      speed: 35,
      boostSpeed: 68,
      turnRate: 1.9,
      damage: 70,
      meshScale: [0.95, 0.85, 1.05],
      color: '#a855f7',
      abilityName: 'ACTIVE CLOAK',
      abilityDesc: 'Cloaks hull for 4s, preventing enemy lock-on and target tracking.'
    },
    {
      name: 'Demon Crown',
      class: 'FLAGSHIP DREADNOUGHT',
      maxHull: 450,
      maxShield: 380,
      speed: 22,
      boostSpeed: 44,
      turnRate: 1.2,
      damage: 60,
      meshScale: [1.55, 1.35, 1.4],
      color: '#ff007f',
      abilityName: 'DRONE SWARM',
      abilityDesc: 'Summons 3 automated laser escort drones orbiting the flagship.'
    }
  ]

  selectedShipIndex = 0
  activeNeonColor = '#00f0ff'

  // Upgrades
  upgWeapons = 1
  upgShield = 1
  upgEngines = 1

  // Player Vitals
  hull = 100
  maxHull = 100
  shield = 80
  maxShield = 80
  energy = 100
  maxEnergy = 100
  currentSpeed = 0
  score = 0
  credits = 1250
  missiles = 8
  maxMissiles = 12

  // Cooldowns
  private lastHitTime = 0
  private shieldRegenDelay = 3.0
  private fireCooldown = 0
  private missileCooldown = 0
  private abilityCooldown = 0
  private abilityDuration = 0
  private isInvulnerable = false
  private isCloaked = false

  // Targeting
  private lockedTargetId: string | null = null

  // Active Entities in World
  private projectiles: Projectile[] = []
  private enemies: EnemyShip[] = []
  private pickups: Pickup[] = []
  private drones: Drone[] = []

  // Camera & Projection
  private camOffset = new Vector3(0, 4.2, 17.5)
  private currentCamPos = new Vector3(0, 4.2, 17.5)
  private shakeIntensity = 0
  private projCam = new PerspectiveCamera(65, 16 / 9, 0.1, 5000)
  private menuOrbitAngle = 0

  // Waves & Sectors
  currentWave = 1
  totalWaves = 3
  activeSectorName = 'DEMON SANCTUM (HOME)'
  hostileDistanceText = '~1.000 TAHUN CAHAYA (AMAN)'
  isInCombatZone = false
  isWarping = false
  warpTimer = 0
  private targetWarpMode: 'combat' | 'home' = 'combat'
  private targetWarpSector = ''

  onInit(ctx: any) {
    this.ctx = ctx
    this.sound = new SoundSystem()
    this.galaxy = new GalacticWar()

    this.setupUI()
    this.applyShipVisuals()

    ctx.log('NEON DOMINION 2099 initialized successfully')
  }

  private applyShipVisuals() {
    const s = this.ships[this.selectedShipIndex]
    const pMesh = this.ctx.entity.getComponent('MeshRenderer')
    if (pMesh) {
      pMesh.color = this.activeNeonColor || s.color
    }

    const t = this.ctx.entity.getTransform()
    t.scale.x = s.meshScale[0]
    t.scale.y = s.meshScale[1]
    t.scale.z = s.meshScale[2]

    // Update vitals
    const shdMult = 1 + (this.upgShield - 1) * 0.20
    this.maxHull = s.maxHull
    this.maxShield = Math.round(s.maxShield * shdMult)
    this.hull = this.maxHull
    this.shield = this.maxShield
  }

  private setupUI() {
    const ui = this.ctx.ui
    if (!ui) return

    // HUD bindings
    ui.bind('#hud-credits', () => this.credits + ' CR')
    ui.bind('#hud-score', () => String(this.score))
    ui.bind('#hud-sector', () => this.activeSectorName)
    ui.bind('#hud-hostile-dist', () => this.hostileDistanceText)
    ui.bind('#hud-mode', () => this.gameState)
    ui.bind('#hull-val', () => Math.max(0, Math.round((this.hull / this.maxHull) * 100)) + '%')
    ui.bind('#shield-val', () => Math.max(0, Math.round((this.shield / this.maxShield) * 100)) + '%')
    ui.bind('#energy-val', () => Math.max(0, Math.round((this.energy / this.maxEnergy) * 100)) + '%')
    ui.bind('#speed-val', () => Math.round(this.currentSpeed) + ' M/S')
    ui.bind('#msl-count', () => String(this.missiles))
    ui.bind('#skill-status', () => {
      if (this.abilityCooldown <= 0) return 'READY'
      return Math.ceil(this.abilityCooldown) + 'S'
    })

    // Targeting HUD Actions
    ui.on('#btn-tgt-missile', 'click', () => {
      if (this.missileCooldown <= 0 && this.missiles > 0) {
        const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)
        const pRot = this.ctx.entity.getTransform().rotation
        const forward = new Vector3(0, 0, -1).applyEuler(new Euler(pRot.x, pRot.y, pRot.z, 'YXZ'))
        this.fireMissile(pPos, forward)
      }
    })
    ui.on('#btn-tgt-unlock', 'click', () => {
      this.lockedTargetId = null
      this.sound.playClick()
    })

    // Menu Buttons
    ui.on('#btn-play-patrol', 'click', () => this.startDogfight(false))
    ui.on('#btn-play-dogfight', 'click', () => this.startDogfight(true))
    ui.on('#btn-warp-jump', 'click', () => this.initiateWarpJump())
    ui.on('#btn-warp-home', 'click', () => this.initiateWarpRetreat())
    ui.on('#btn-open-hangar', 'click', () => this.openHangar())
    ui.on('#btn-open-galaxy', 'click', () => this.openGalaxy())
    ui.on('#btn-open-settings', 'click', () => this.openSettings())

    // Hangar
    ui.on('#btn-ship-prev', 'click', () => this.cycleShip(-1))
    ui.on('#btn-ship-next', 'click', () => this.cycleShip(1))
    ui.on('#btn-hangar-close', 'click', () => this.openMainMenu())
    ui.on('#btn-select-ship', 'click', () => this.deployShip())

    ui.on('#btn-upg-wpn', 'click', () => this.buyUpgrade('weapon'))
    ui.on('#btn-upg-shd', 'click', () => this.buyUpgrade('shield'))
    ui.on('#btn-upg-eng', 'click', () => this.buyUpgrade('engine'))

    ui.on('#paint-cyan', 'click', () => this.setPaintColor('#00f0ff'))
    ui.on('#paint-magenta', 'click', () => this.setPaintColor('#ff007f'))
    ui.on('#paint-yellow', 'click', () => this.setPaintColor('#ffe600'))
    ui.on('#paint-purple', 'click', () => this.setPaintColor('#a855f7'))

    // Galaxy
    ui.on('#btn-end-turn', 'click', () => this.endGalaxyTurn())
    ui.on('#btn-galaxy-close', 'click', () => this.openMainMenu())

    // Settings
    ui.on('#btn-toggle-bgm', 'click', () => this.toggleBgm())
    ui.on('#btn-settings-close', 'click', () => this.openMainMenu())

    // Endgame
    ui.on('#btn-endgame-restart', 'click', () => this.startDogfight())
    ui.on('#btn-endgame-hangar', 'click', () => this.openHangar())
  }

  onUpdate(dt: number) {
    if (dt > 0.1) dt = 0.1

    if (this.isWarping) {
      this.warpTimer -= dt
      this.shakeIntensity = Math.max(this.shakeIntensity, 0.7)
      if (this.warpTimer <= 0) {
        this.completeWarp()
      }
    }

    if (this.gameState === 'DOGFIGHT') {
      this.updateFlight(dt)
      this.updateCombat(dt)
      this.updateEnemies(dt)
      this.updateProjectiles(dt)
      this.updatePickups(dt)
      this.updateDrones(dt)
      this.updateCamera(dt)
      this.updateTacticalSensors()

      if (this.ctx.input && this.ctx.input.isActionJustPressed('Pause')) {
        this.openMainMenu()
      }
    } else {
      this.updateCamera(dt)
      if (this.gameState === 'MENU') {
        if (this.ctx.input && (this.ctx.input.isActionJustPressed('Attack') || this.ctx.input.isActionJustPressed('Jump') || this.ctx.input.isActionJustPressed('Interact'))) {
          this.startDogfight(false)
        }
      }
    }

    // Cooldown timers
    if (this.missileCooldown > 0) this.missileCooldown -= dt
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt
    if (this.fireCooldown > 0) this.fireCooldown -= dt

    if (this.abilityDuration > 0) {
      this.abilityDuration -= dt
      if (this.abilityDuration <= 0) {
        this.isInvulnerable = false
        this.isCloaked = false
      }
    }

    // Shield Regeneration
    this.lastHitTime += dt
    if (this.lastHitTime >= this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 28 * dt)
    }

    // Energy Recharge
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 22 * dt)
    }

    this.updateHUDGauges()
  }

  private updateFlight(dt: number) {
    const input = this.ctx.input
    const ship = this.ships[this.selectedShipIndex]
    const pTransform = this.ctx.entity.getTransform()

    const moveVec = input.getVector ? input.getVector('Move') : { x: 0, y: 0 }
    const lookVec = input.getVector ? input.getVector('Look') : { x: 0, y: 0 }
    const turnVal = input.getAxis ? input.getAxis('Turn') : 0
    const vertVal = input.getAxis ? input.getAxis('Vertical') : 0
    const isBoosting = (input.isActionPressed('Sprint') || input.isActionPressed('Boost')) && this.energy > 5

    // Speed calculation
    const baseSpeed = ship.speed * (1 + (this.upgEngines - 1) * 0.18)
    const maxBoost = ship.boostSpeed * (1 + (this.upgEngines - 1) * 0.18)

    let targetSpeed = 0
    if (moveVec.y > 0.1 || isBoosting) {
      targetSpeed = isBoosting ? maxBoost : baseSpeed
      if (isBoosting) {
        this.energy = Math.max(0, this.energy - 32 * dt)
      }
    } else if (moveVec.y < -0.1) {
      targetSpeed = -baseSpeed * 0.4
    }

    if (this.isWarping) {
      targetSpeed = 420
      this.currentSpeed = 420
    }

    this.currentSpeed += (targetSpeed - this.currentSpeed) * Math.min(1, 4 * dt)

    // Pitch, Yaw, Roll
    const pitch = -lookVec.y * 1.6 * dt
    const yaw = -lookVec.x * 1.6 * dt
    const roll = -turnVal * ship.turnRate * dt

    const rot = pTransform.rotation
    rot.x += pitch
    rot.y += yaw
    rot.z += roll + (-moveVec.x * 0.35 - rot.z * 0.1) * dt * 4

    // Apply 3D translation
    const euler = new Euler(rot.x, rot.y, rot.z, 'YXZ')
    const forward = new Vector3(0, 0, -1).applyEuler(euler)
    const right = new Vector3(1, 0, 0).applyEuler(euler)
    const up = new Vector3(0, 1, 0).applyEuler(euler)

    const strafeSpeed = baseSpeed * 0.6
    const vel = forward.clone().multiplyScalar(this.currentSpeed * dt)
    vel.add(right.clone().multiplyScalar(moveVec.x * strafeSpeed * dt))
    vel.add(up.clone().multiplyScalar(vertVal * strafeSpeed * dt))

    const pos = pTransform.position
    pos.x += vel.x
    pos.y += vel.y
    pos.z += vel.z
  }

  private updateCombat(dt: number) {
    const input = this.ctx.input
    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)
    const pRot = this.ctx.entity.getTransform().rotation
    const forward = new Vector3(0, 0, -1).applyEuler(new Euler(pRot.x, pRot.y, pRot.z, 'YXZ'))

    // Primary Attack (Twin Laser / Plasma / Railgun / Beam)
    if (input.isActionPressed('Attack') && this.fireCooldown <= 0) {
      this.firePrimary(pPos, forward)
    }

    // Missile Launch
    if (input.isActionJustPressed('FireMissile') && this.missileCooldown <= 0 && this.missiles > 0) {
      this.fireMissile(pPos, forward)
    }

    // Target Lock
    if (input.isActionJustPressed('LockTarget')) {
      this.cycleTargetLock()
    }

    // Ability
    if (input.isActionJustPressed('Ability') && this.abilityCooldown <= 0) {
      this.triggerAbility(forward)
    }

    // Galaxy Map
    if (input.isActionJustPressed('GalaxyMap')) {
      this.openGalaxy()
    }

    // Warp Jump [J] & Warp Retreat [H]
    if (input.isKeyDown && input.isKeyDown('KeyJ') && !this.isWarping) {
      if (!this.isInCombatZone) {
        this.initiateWarpJump()
      }
    }
    if (input.isKeyDown && input.isKeyDown('KeyH') && !this.isWarping) {
      if (this.isInCombatZone) {
        this.initiateWarpRetreat()
      }
    }
  }

  private firePrimary(pos: Vector3, forward: Vector3) {
    const s = this.ships[this.selectedShipIndex]
    const dmg = s.damage * (1 + (this.upgWeapons - 1) * 0.15)

    if (this.selectedShipIndex === 0) {
      // Viper-X: Twin Rapid Lasers
      this.fireCooldown = 0.13
      this.sound.playLaser(true)

      const offsets = [-1.5, 1.5]
      offsets.forEach(ox => {
        const pEnt = this.ctx.world.createEntity({
          name: 'Laser',
          tags: ['Projectile'],
          components: [
            {
              type: 'Transform',
              data: {
                position: [pos.x + ox, pos.y, pos.z - 2],
                rotation: [0, 0, 0],
                scale: [0.2, 0.2, 4.0]
              }
            },
            {
              type: 'MeshRenderer',
              data: { primitive: 'box', color: '#00f0ff' }
            }
          ]
        })

        this.projectiles.push({
          id: pEnt.id,
          pos: new Vector3(pos.x + ox, pos.y, pos.z - 2),
          vel: forward.clone().multiplyScalar(240),
          life: 2.2,
          damage: dmg,
          isEnemy: false,
          isMissile: false
        })
      })
    } else if (this.selectedShipIndex === 1) {
      // Oni Warden: Heavy Plasma Cannon
      this.fireCooldown = 0.38
      this.sound.playPlasma()

      const pEnt = this.ctx.world.createEntity({
        name: 'Plasma',
        tags: ['Projectile'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [pos.x, pos.y, pos.z - 3],
              rotation: [0, 0, 0],
              scale: [1.2, 1.2, 1.2]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'sphere', color: '#ffe600' }
          }
        ]
      })

      this.projectiles.push({
        id: pEnt.id,
        pos: new Vector3(pos.x, pos.y, pos.z - 3),
        vel: forward.clone().multiplyScalar(160),
        life: 2.5,
        damage: dmg,
        isEnemy: false,
        isMissile: false
      })
    } else if (this.selectedShipIndex === 2) {
      // Ghost Wire: Spinal Railgun
      this.fireCooldown = 0.7
      this.sound.playRailgun()

      const pEnt = this.ctx.world.createEntity({
        name: 'Railgun',
        tags: ['Projectile'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [pos.x, pos.y, pos.z - 4],
              rotation: [0, 0, 0],
              scale: [0.35, 0.35, 12.0]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'cylinder', color: '#c084fc' }
          }
        ]
      })

      this.projectiles.push({
        id: pEnt.id,
        pos: new Vector3(pos.x, pos.y, pos.z - 4),
        vel: forward.clone().multiplyScalar(350),
        life: 1.8,
        damage: dmg,
        isEnemy: false,
        isMissile: false
      })
    } else {
      // Demon Crown: Sovereign Continuous Beam
      this.fireCooldown = 0.09
      this.sound.playLaser(false)

      const pEnt = this.ctx.world.createEntity({
        name: 'DemonBeam',
        tags: ['Projectile'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [pos.x, pos.y, pos.z - 4],
              rotation: [0, 0, 0],
              scale: [0.6, 0.6, 6.0]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'cylinder', color: '#ff007f' }
          }
        ]
      })

      this.projectiles.push({
        id: pEnt.id,
        pos: new Vector3(pos.x, pos.y, pos.z - 4),
        vel: forward.clone().multiplyScalar(280),
        life: 1.6,
        damage: dmg * 0.45,
        isEnemy: false,
        isMissile: false
      })
    }
  }

  private fireMissile(pos: Vector3, forward: Vector3) {
    this.missiles--
    this.missileCooldown = 2.5
    this.sound.playMissileLaunch()

    const mEnt = this.ctx.world.createEntity({
      name: 'Missile',
      tags: ['Missile'],
      components: [
        {
          type: 'Transform',
          data: {
            position: [pos.x, pos.y - 1, pos.z - 2],
            rotation: [0, 0, 0],
            scale: [0.45, 0.45, 2.5]
          }
        },
        {
          type: 'MeshRenderer',
          data: { primitive: 'cylinder', color: '#f97316' }
        }
      ]
    })

    this.projectiles.push({
      id: mEnt.id,
      pos: new Vector3(pos.x, pos.y - 1, pos.z - 2),
      vel: forward.clone().multiplyScalar(100),
      life: 5.0,
      damage: 130,
      isEnemy: false,
      isMissile: true,
      targetId: this.lockedTargetId || undefined
    })
  }

  setLockedTarget(id: string | null) {
    if (this.lockedTargetId === id) {
      this.lockedTargetId = null
    } else {
      this.lockedTargetId = id
      if (id) this.sound.playClick()
    }
  }

  private cycleTargetLock() {
    if (this.enemies.length === 0) {
      this.lockedTargetId = null
      return
    }

    const currentIdx = this.enemies.findIndex(e => e.id === this.lockedTargetId)
    const nextIdx = (currentIdx + 1) % this.enemies.length
    this.setLockedTarget(this.enemies[nextIdx].id)
  }

  private triggerAbility(forward: Vector3) {
    const idx = this.selectedShipIndex
    this.abilityCooldown = 8.0

    if (idx === 0) {
      // Phase Dash
      this.sound.playDash()
      const t = this.ctx.entity.getTransform()
      t.position.x += forward.x * 45
      t.position.y += forward.y * 45
      t.position.z += forward.z * 45
      this.shakeIntensity = 0.5
      this.addNotification('PHASE DASH: 45M BLINK')
    } else if (idx === 1) {
      // Shield Overcharge
      this.sound.playShieldHit()
      this.isInvulnerable = true
      this.abilityDuration = 5.0
      this.shield = this.maxShield
      this.addNotification('SHIELD OVERCHARGE: 5S INVULNERABLE')
    } else if (idx === 2) {
      // Active Cloak
      this.sound.playDash()
      this.isCloaked = true
      this.abilityDuration = 4.0
      this.addNotification('ACTIVE CLOAK: ENEMY LOCK BROKEN')
    } else {
      // Drone Swarm
      this.sound.playLaser(true)
      this.spawnDrones()
      this.addNotification('DRONE SWARM: 3 ESCORTS DEPLOYED')
    }
  }

  private spawnDrones() {
    this.drones.forEach(d => this.ctx.world.destroyEntity(d.id))
    this.drones = []

    const pPos = this.ctx.entity.getTransform().position
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3
      const dEnt = this.ctx.world.createEntity({
        name: 'EscortDrone',
        tags: ['Drone'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [pPos.x + Math.cos(angle) * 8, pPos.y + 2, pPos.z + Math.sin(angle) * 8],
              rotation: [0, 0, 0],
              scale: [1, 1, 1]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'sphere', color: '#ff007f' }
          }
        ]
      })

      this.drones.push({ id: dEnt.id, offsetAngle: angle })
    }
  }

  private updateDrones(dt: number) {
    if (this.drones.length === 0) return
    const pPos = this.ctx.entity.getTransform().position

    this.drones.forEach(d => {
      d.offsetAngle += 1.8 * dt
      const droneEnt = this.ctx.world.getEntity(d.id)
      if (droneEnt) {
        const t = droneEnt.getTransform()
        t.position.x = pPos.x + Math.cos(d.offsetAngle) * 9
        t.position.y = pPos.y + Math.sin(d.offsetAngle * 2) * 2 + 1.5
        t.position.z = pPos.z + Math.sin(d.offsetAngle) * 9
      }
    })
  }

  // ENEMY AI & WAVES
  private updateEnemies(dt: number) {
    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      const toPlayer = pPos.clone().sub(e.pos)
      const dist = toPlayer.length()

      // Look at player
      if (dist > 8 && !this.isCloaked) {
        e.rot.y = Math.atan2(toPlayer.x, toPlayer.z)
        e.rot.x = -Math.asin(toPlayer.y / dist)
      }

      // Movement behavior
      const prevPos = e.pos.clone()
      if (e.hull < e.maxHull * 0.25) {
        // Retreat
        e.aiState = 'retreat'
        e.pos.add(toPlayer.clone().normalize().multiplyScalar(-e.speed * dt))
      } else if (dist > 28) {
        // Chase
        e.aiState = 'chase'
        e.pos.add(toPlayer.clone().normalize().multiplyScalar(e.speed * dt))
      } else {
        // Evade & Strafe
        e.aiState = 'evade'
        const sideVec = new Vector3(-toPlayer.z, 0, toPlayer.x).normalize()
        e.pos.add(sideVec.multiplyScalar(e.speed * 0.8 * dt))
      }
      e.vel.copy(e.pos).sub(prevPos).divideScalar(Math.max(0.001, dt))

      // Update ECS transform
      const ent = this.ctx.world.getEntity(e.id)
      if (ent) {
        const t = ent.getTransform()
        t.position.x = e.pos.x
        t.position.y = e.pos.y
        t.position.z = e.pos.z
        t.rotation.x = e.rot.x * (180 / Math.PI)
        t.rotation.y = e.rot.y * (180 / Math.PI)
      }

      // Enemy weapons
      e.fireTimer += dt
      const interval = e.isBoss ? 0.7 : 1.6
      if (e.fireTimer >= interval && dist < 220 && !this.isCloaked) {
        e.fireTimer = 0
        this.fireEnemyLaser(e, toPlayer.normalize())
      }
    }

    if (this.enemies.length === 0 && this.gameState === 'DOGFIGHT') {
      this.onWaveCleared()
    }
  }

  private fireEnemyLaser(e: EnemyShip, dir: Vector3) {
    const lEnt = this.ctx.world.createEntity({
      name: 'EnemyLaser',
      tags: ['Projectile'],
      components: [
        {
          type: 'Transform',
          data: {
            position: [e.pos.x, e.pos.y, e.pos.z],
            rotation: [0, 0, 0],
            scale: [0.25, 0.25, 4.0]
          }
        },
        {
          type: 'MeshRenderer',
          data: { primitive: 'box', color: e.isBoss ? '#c084fc' : '#ffaa00' }
        }
      ]
    })

    this.projectiles.push({
      id: lEnt.id,
      pos: e.pos.clone(),
      vel: dir.multiplyScalar(150),
      life: 2.8,
      damage: e.isBoss ? 26 : 14,
      isEnemy: true,
      isMissile: false
    })
  }

  // PROJECTILES & COLLISION
  private updateProjectiles(dt: number) {
    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.life -= dt

      // Missile Homing
      if (p.isMissile && p.targetId) {
        const target = this.enemies.find(e => e.id === p.targetId)
        if (target) {
          const toTarget = target.pos.clone().sub(p.pos).normalize()
          p.vel.lerp(toTarget.multiplyScalar(180), 5 * dt)
        }
      }

      p.pos.add(p.vel.clone().multiplyScalar(dt))

      const pEnt = this.ctx.world.getEntity(p.id)
      if (pEnt) {
        const t = pEnt.getTransform()
        t.position.x = p.pos.x
        t.position.y = p.pos.y
        t.position.z = p.pos.z
      }

      let hit = false

      if (!p.isEnemy) {
        // Player shot checking against enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j]
          const radius = e.isBoss ? 20 : 5.5
          if (p.pos.distanceTo(e.pos) < radius) {
            hit = true
            this.damageEnemy(e, p.damage)
            break
          }
        }
      } else {
        // Enemy shot checking against player
        if (p.pos.distanceTo(pPos) < 4.5 && !this.isInvulnerable) {
          hit = true
          this.damagePlayer(p.damage)
        }
      }

      if (hit || p.life <= 0) {
        this.ctx.world.destroyEntity(p.id)
        this.projectiles.splice(i, 1)
      }
    }
  }

  private damagePlayer(amount: number) {
    this.lastHitTime = 0
    this.shakeIntensity = 0.45
    this.sound.playShieldHit()

    if (this.shield > 0) {
      this.shield -= amount
      if (this.shield < 0) {
        this.hull += this.shield
        this.shield = 0
      }
    } else {
      this.hull -= amount
      this.sound.playExplosion(false)
    }

    if (this.hull <= 0) {
      this.hull = 0
      this.sound.playExplosion(true)
      this.onGameOver()
    }
  }

  private damageEnemy(e: EnemyShip, amount: number) {
    if (e.shield > 0) {
      e.shield -= amount
      if (e.shield < 0) {
        e.hull += e.shield
        e.shield = 0
      }
    } else {
      e.hull -= amount
    }

    if (e.hull <= 0) {
      this.destroyEnemy(e)
    }
  }

  private destroyEnemy(e: EnemyShip) {
    this.sound.playExplosion(e.isBoss)
    this.ctx.world.destroyEntity(e.id)

    const idx = this.enemies.indexOf(e)
    if (idx !== -1) this.enemies.splice(idx, 1)
    if (this.lockedTargetId === e.id) this.lockedTargetId = null

    const rewardCr = e.isBoss ? 500 : 90
    this.score += e.isBoss ? 2000 : 300
    this.credits += rewardCr
    this.addNotification('DESTROYED: ' + e.name + ' (+' + rewardCr + ' CR)')

    // Drop Pickup
    if (Math.random() < 0.65 || e.isBoss) {
      const types: ('repair' | 'missile' | 'energy')[] = ['repair', 'missile', 'energy']
      const dropType = types[Math.floor(Math.random() * types.length)]
      this.spawnPickup(dropType, e.pos.clone())
    }
  }

  private spawnPickup(type: 'repair' | 'missile' | 'energy', pos: Vector3) {
    const color = type === 'repair' ? '#22c55e' : (type === 'missile' ? '#f97316' : '#00f0ff')
    const pEnt = this.ctx.world.createEntity({
      name: 'Pickup_' + type,
      tags: ['Pickup'],
      components: [
        {
          type: 'Transform',
          data: {
            position: [pos.x, pos.y, pos.z],
            rotation: [0, 0, 0],
            scale: [1.6, 1.6, 1.6]
          }
        },
        {
          type: 'MeshRenderer',
          data: { primitive: 'torus', color }
        }
      ]
    })

    this.pickups.push({ id: pEnt.id, type, pos })
  }

  private updatePickups(dt: number) {
    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]
      const dist = p.pos.distanceTo(pPos)

      if (dist < 25) {
        p.pos.lerp(pPos, 7 * dt)
        const ent = this.ctx.world.getEntity(p.id)
        if (ent) {
          const t = ent.getTransform()
          t.position.x = p.pos.x
          t.position.y = p.pos.y
          t.position.z = p.pos.z
        }
      }

      if (dist < 4.5) {
        this.sound.playClick()
        if (p.type === 'repair') {
          this.hull = Math.min(this.maxHull, this.hull + 35)
          this.addNotification('PICKUP: NANITE REPAIR (+35 HULL)')
        } else if (p.type === 'missile') {
          this.missiles = Math.min(this.maxMissiles, this.missiles + 4)
          this.addNotification('PICKUP: MISSILE POD (+4 AMMO)')
        } else {
          this.energy = Math.min(this.maxEnergy, this.energy + 50)
          this.addNotification('PICKUP: ENERGY CELL (+50 ENERGY)')
        }

        this.ctx.world.destroyEntity(p.id)
        this.pickups.splice(i, 1)
      }
    }
  }

  // WAVES
  private spawnWave(wave: number) {
    this.currentWave = wave

    if (wave === 1) {
      this.addNotification('WAVE 1: 3x JACKAL PIRATE SKIMMERS INCOMING')
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3
        const spawnPos = new Vector3(Math.cos(angle) * 120, 15, Math.sin(angle) * 120 - 60)

        const eEnt = this.ctx.world.createEntity({
          name: 'Jackal Skimmer ' + (i + 1),
          tags: ['Enemy'],
          components: [
            {
              type: 'Transform',
              data: {
                position: [spawnPos.x, spawnPos.y, spawnPos.z],
                rotation: [0, 0, 0],
                scale: [2.5, 0.8, 8.0]
              }
            },
            {
              type: 'MeshRenderer',
              data: { primitive: 'box', color: '#ffaa00' }
            }
          ]
        })

        this.enemies.push({
          id: eEnt.id,
          name: 'Jackal Skimmer ' + (i + 1),
          pos: spawnPos,
          vel: new Vector3(),
          rot: new Vector3(),
          hull: 65,
          maxHull: 65,
          shield: 40,
          maxShield: 40,
          speed: 38,
          aiState: 'chase',
          fireTimer: Math.random() * 0.8
        })
      }
    } else if (wave === 2) {
      this.addNotification('WAVE 2: HELIX STRIKE INTERCEPTORS & BOMBERS')
      for (let i = 0; i < 3; i++) {
        const spawnPos = new Vector3(-60 + i * 60, 20, -180)
        const eEnt = this.ctx.world.createEntity({
          name: 'Helix Interceptor ' + (i + 1),
          tags: ['Enemy'],
          components: [
            {
              type: 'Transform',
              data: {
                position: [spawnPos.x, spawnPos.y, spawnPos.z],
                rotation: [0, 0, 0],
                scale: [2.8, 1.0, 8.5]
              }
            },
            {
              type: 'MeshRenderer',
              data: { primitive: 'cone', color: '#00e5ff' }
            }
          ]
        })

        this.enemies.push({
          id: eEnt.id,
          name: 'Helix Interceptor ' + (i + 1),
          pos: spawnPos,
          vel: new Vector3(),
          rot: new Vector3(),
          hull: 85,
          maxHull: 85,
          shield: 60,
          maxShield: 60,
          speed: 40,
          aiState: 'chase',
          fireTimer: Math.random() * 0.5
        })
      }

      const bPos = new Vector3(0, -15, -220)
      const bEnt = this.ctx.world.createEntity({
        name: 'Helix Torpedo Raider',
        tags: ['Enemy'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [bPos.x, bPos.y, bPos.z],
              rotation: [0, 0, 0],
              scale: [5.0, 2.0, 11.0]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'box', color: '#0099ff' }
          }
        ]
      })

      this.enemies.push({
        id: bEnt.id,
        name: 'Helix Torpedo Raider',
        pos: bPos,
        vel: new Vector3(),
        rot: new Vector3(),
        hull: 180,
        maxHull: 180,
        shield: 120,
        maxShield: 120,
        speed: 25,
        aiState: 'chase',
        fireTimer: 0.2
      })
    } else {
      this.addNotification('BOSS ENCOUNTER: CONCORD DREAD-FRIGATE CAPITAL SHIP')
      const bossPos = new Vector3(0, 35, -260)
      const bossEnt = this.ctx.world.createEntity({
        name: 'Concord Dread-Frigate (BOSS)',
        tags: ['Enemy', 'Boss'],
        components: [
          {
            type: 'Transform',
            data: {
              position: [bossPos.x, bossPos.y, bossPos.z],
              rotation: [0, 0, 0],
              scale: [16, 10, 60]
            }
          },
          {
            type: 'MeshRenderer',
            data: { primitive: 'box', color: '#c084fc' }
          }
        ]
      })

      this.enemies.push({
        id: bossEnt.id,
        name: 'Concord Dread-Frigate (BOSS)',
        pos: bossPos,
        vel: new Vector3(),
        rot: new Vector3(),
        hull: 750,
        maxHull: 750,
        shield: 400,
        maxShield: 400,
        speed: 18,
        aiState: 'chase',
        fireTimer: 0,
        isBoss: true
      })
    }
  }

  private onWaveCleared() {
    if (this.currentWave < this.totalWaves) {
      this.addNotification('WAVE ' + this.currentWave + ' SECURED // NEXT WAVE IMMINENT')
      setTimeout(() => this.spawnWave(this.currentWave + 1), 2000)
    } else {
      this.onVictory()
    }
  }

  private onVictory() {
    this.gameState = 'ENDGAME'
    this.sound.playLaser(true)
    const ui = this.ctx.ui
    if (ui) {
      ui.show('#menu-endgame')
      const title = ui.query('#endgame-title')
      const desc = ui.query('#endgame-desc')
      if (title) title.innerText = 'SECTOR CONQUERED'
      if (desc) desc.innerText = 'The enemy battlefleet has been incinerated. Imperial reign expands.'
    }
    this.credits += 700
    this.galaxy.onPlayerVictory('s04')
  }

  private onGameOver() {
    this.gameState = 'ENDGAME'
    this.sound.playAlarm()
    const ui = this.ctx.ui
    if (ui) {
      ui.show('#menu-endgame')
      const title = ui.query('#endgame-title')
      const desc = ui.query('#endgame-desc')
      if (title) title.innerText = 'VESSEL COMPROMISED'
      if (desc) desc.innerText = 'Critical hull breach. Emergency mind-core safely teleported to drydock.'
    }
  }

  // CAMERA THIRD PERSON & CINEMATIC ORBIT
  private updateCamera(dt: number) {
    const camEntities = this.ctx.scene.findByTag('MainCamera')
    if (camEntities.length === 0) return
    const cam = camEntities[0]

    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)
    const pRot = this.ctx.entity.getTransform().rotation
    const forward = new Vector3(0, 0, -1).applyEuler(new Euler(pRot.x, pRot.y, pRot.z, 'YXZ'))
    const up = new Vector3(0, 1, 0).applyEuler(new Euler(pRot.x, pRot.y, pRot.z, 'YXZ'))

    if (this.gameState === 'DOGFIGHT') {
      const isBoosting = this.currentSpeed > 45
      const targetOffsetZ = isBoosting ? 19.5 : this.camOffset.z
      const targetOffsetY = isBoosting ? 4.6 : this.camOffset.y

      const targetCamPos = pPos.clone()
        .sub(forward.clone().multiplyScalar(targetOffsetZ))
        .add(up.clone().multiplyScalar(targetOffsetY))

      this.currentCamPos.lerp(targetCamPos, Math.min(1, 9 * dt))

      if (this.shakeIntensity > 0) {
        this.currentCamPos.x += (Math.random() - 0.5) * this.shakeIntensity
        this.currentCamPos.y += (Math.random() - 0.5) * this.shakeIntensity
        this.shakeIntensity = Math.max(0, this.shakeIntensity - 1.5 * dt)
      }

      const t = cam.getTransform()
      t.position.x = this.currentCamPos.x
      t.position.y = this.currentCamPos.y
      t.position.z = this.currentCamPos.z

      const lookTarget = pPos.clone().add(forward.clone().multiplyScalar(28))
      const camDir = lookTarget.clone().sub(this.currentCamPos).normalize()

      const pitch = -Math.asin(camDir.y)
      const yaw = Math.atan2(camDir.x, camDir.z) + Math.PI

      t.rotation.x = pitch * (180 / Math.PI)
      t.rotation.y = yaw * (180 / Math.PI)
      t.rotation.z = pRot.z * 0.35

      // Sync projCam for in-space tactical overlay projection
      const aspect = typeof window !== 'undefined' ? window.innerWidth / Math.max(1, window.innerHeight) : 16 / 9
      this.projCam.aspect = aspect
      this.projCam.position.copy(this.currentCamPos)
      this.projCam.rotation.set(pitch, yaw, pRot.z * 0.35 * (Math.PI / 180), 'YXZ')
      this.projCam.updateMatrixWorld()
    } else {
      // MENU & HANGAR: Cinematic Hero Orbit Showcase around the spaceship!
      this.menuOrbitAngle += 0.35 * dt
      const orbitDist = 16.0
      const orbitHeight = 3.2
      const targetCamPos = new Vector3(
        pPos.x + Math.sin(this.menuOrbitAngle) * orbitDist,
        pPos.y + orbitHeight,
        pPos.z + Math.cos(this.menuOrbitAngle) * orbitDist
      )

      this.currentCamPos.lerp(targetCamPos, Math.min(1, 6 * dt))

      const t = cam.getTransform()
      t.position.x = this.currentCamPos.x
      t.position.y = this.currentCamPos.y
      t.position.z = this.currentCamPos.z

      const shipCenter = pPos.clone().add(new Vector3(0, 0.4, 0))
      const camDir = shipCenter.clone().sub(this.currentCamPos).normalize()

      const pitch = -Math.asin(camDir.y)
      const yaw = Math.atan2(camDir.x, camDir.z) + Math.PI

      t.rotation.x = pitch * (180 / Math.PI)
      t.rotation.y = yaw * (180 / Math.PI)
      t.rotation.z = 0
    }
  }

  // EVE ONLINE TACTICAL SENSOR & TARGETING SYSTEM
  private updateTacticalSensors() {
    if (typeof document === 'undefined') return
    const pPos = new Vector3().copy(this.ctx.entity.getTransform().position)

    const bracketsLayer = document.getElementById('brackets-layer')
    const overviewList = document.getElementById('overview-list')
    const overviewCount = document.getElementById('overview-count')
    const targetHud = document.getElementById('target-hud')
    const leadMarker = document.getElementById('lead-marker')

    interface TacticalContact {
      id: string
      name: string
      type: 'enemy' | 'boss' | 'station' | 'asteroid' | 'pickup'
      pos: Vector3
      vel?: Vector3
      hull?: number
      maxHull?: number
      shield?: number
      maxShield?: number
      classDesc?: string
      dist: number
    }

    const contacts: TacticalContact[] = []

    // 1. Hostiles
    if (this.enemies.length === 0 && !this.isInCombatZone) {
      contacts.push({
        id: 'hostile-signature-1000ly',
        name: 'ARMADA MUSUH (SEKTOR LUAR)',
        type: 'enemy',
        pos: new Vector3(0, 0, -10000),
        classDesc: 'ARMADA MUSUH BERADA DI JARAK ~1.000 TAHUN CAHAYA [ZONA AMAN]',
        dist: 9999999
      })
    }

    this.enemies.forEach(e => {
      contacts.push({
        id: e.id,
        name: e.name,
        type: e.isBoss ? 'boss' : 'enemy',
        pos: e.pos,
        vel: e.vel,
        hull: e.hull,
        maxHull: e.maxHull,
        shield: e.shield,
        maxShield: e.maxShield,
        classDesc: e.isBoss ? 'DREAD-FRIGATE // CONCORD CAPITAL FLEET' : 'INTERCEPTOR // PIRATE FACTION',
        dist: pPos.distanceTo(e.pos)
      })
    })

    // 2. Space Station
    const stationPos = new Vector3(-140, 40, -260)
    contacts.push({
      id: 'station-07',
      name: 'CYBER ORBITAL STATION 07',
      type: 'station',
      pos: stationPos,
      classDesc: 'IMPERIAL NAVAL CITADEL',
      dist: pPos.distanceTo(stationPos)
    })

    // 3. Asteroids
    const asteroids = [
      { id: 'ast-alpha', name: 'ASTEROID ALPHA', pos: new Vector3(-80, -20, -100) },
      { id: 'ast-beta', name: 'ASTEROID BETA', pos: new Vector3(90, 30, -140) },
      { id: 'ast-gamma', name: 'ASTEROID GAMMA', pos: new Vector3(0, -60, -200) }
    ]
    asteroids.forEach(a => {
      contacts.push({
        id: a.id,
        name: a.name,
        type: 'asteroid',
        pos: a.pos,
        classDesc: 'IRIDIUM ROCK CLUSTER',
        dist: pPos.distanceTo(a.pos)
      })
    })

    // 4. Pickups
    this.pickups.forEach(p => {
      const typeLabel = p.type === 'repair' ? 'NANITE POD' : (p.type === 'missile' ? 'MISSILE POD' : 'ENERGY CELL')
      contacts.push({
        id: p.id,
        name: typeLabel,
        type: 'pickup',
        pos: p.pos,
        classDesc: 'TACTICAL SUPPLY DROP',
        dist: pPos.distanceTo(p.pos)
      })
    })

    // Sort contacts by distance
    contacts.sort((a, b) => a.dist - b.dist)

    // Render In-Space Holographic Brackets
    if (bracketsLayer) {
      bracketsLayer.innerHTML = ''
      const w = window.innerWidth
      const h = window.innerHeight

      contacts.forEach(c => {
        const isLocked = (c.id === this.lockedTargetId)
        const proj = c.pos.clone().project(this.projCam)

        if (proj.z < 1.0 && proj.x >= -1.15 && proj.x <= 1.15 && proj.y >= -1.15 && proj.y <= 1.15) {
          const sx = (proj.x * 0.5 + 0.5) * w
          const sy = (-proj.y * 0.5 + 0.5) * h

          const bEl = document.createElement('div')
          bEl.className = 'space-bracket ' + c.type + (isLocked ? ' locked' : '')
          bEl.style.left = sx + 'px'
          bEl.style.top = sy + 'px'
          bEl.setAttribute('data-interactive', 'true')

          const distStr = c.dist >= 1000 ? (c.dist / 1000).toFixed(1) + ' KM' : Math.round(c.dist) + ' M'

          let healthHtml = ''
          if (c.hull !== undefined && c.maxHull !== undefined) {
            const hPct = Math.max(0, Math.round((c.hull / c.maxHull) * 100))
            const sPct = c.shield !== undefined && c.maxShield ? Math.max(0, Math.round((c.shield / c.maxShield) * 100)) : 0
            healthHtml =
              '<div class="bracket-bars">' +
              '<div class="bracket-bar-track"><div class="bracket-bar-fill shield-fill" style="width:' + sPct + '%;"></div></div>' +
              '<div class="bracket-bar-track"><div class="bracket-bar-fill hull-fill" style="width:' + hPct + '%;"></div></div>' +
              '</div>'
          }

          bEl.innerHTML =
            '<div class="bracket-reticle"></div>' +
            healthHtml +
            '<div class="bracket-label">' + c.name + ' [' + distStr + ']</div>'

          bEl.onclick = (ev) => {
            ev.stopPropagation()
            this.setLockedTarget(c.id)
          }

          bracketsLayer.appendChild(bEl)
        }
      })
    }

    // Render Tactical Overview Contacts
    if (overviewList) {
      overviewList.innerHTML = ''
      if (overviewCount) overviewCount.innerText = contacts.length + ' CONTACTS'

      contacts.forEach(c => {
        const isLocked = (c.id === this.lockedTargetId)
        const row = document.createElement('div')
        row.className = 'overview-row' + (isLocked ? ' selected' : '')
        row.setAttribute('data-interactive', 'true')

        let iconColor = '#00f0ff'
        if (c.type === 'enemy') iconColor = '#ff0055'
        else if (c.type === 'boss') iconColor = '#c084fc'
        else if (c.type === 'pickup') iconColor = '#22c55e'
        else if (c.type === 'asteroid') iconColor = '#94a3b8'

        let distStr = ''
        if (c.id === 'hostile-signature-1000ly') {
          distStr = '~1.000 LY'
        } else if (c.dist >= 1000) {
          distStr = (c.dist / 1000).toFixed(1) + ' km'
        } else {
          distStr = Math.round(c.dist) + ' m'
        }

        row.innerHTML =
          '<div style="display:flex; align-items:center; gap:6px;">' +
          '<span style="width:7px; height:7px; border-radius:50%; background:' + iconColor + '; box-shadow:0 0 6px ' + iconColor + ';"></span>' +
          '<span style="font-size:11px; color:#fff; font-weight:' + (isLocked ? 'bold' : 'normal') + ';">' + c.name + '</span>' +
          '</div>' +
          '<span style="font-size:10px; color:' + (c.id === 'hostile-signature-1000ly' ? '#22c55e' : '#ffe600') + ';">' + distStr + '</span>'

        row.onclick = () => this.setLockedTarget(c.id)
        overviewList.appendChild(row)
      })
    }

    // Render Selected Target Card (Top-Right EVE Style HUD)
    if (targetHud) {
      const lockedContact = contacts.find(c => c.id === this.lockedTargetId)
      if (lockedContact) {
        targetHud.classList.add('active')
        const nameEl = document.getElementById('tgt-name')
        const distEl = document.getElementById('tgt-dist')
        const classEl = document.getElementById('tgt-class')
        const shdVal = document.getElementById('tgt-shield-val')
        const shdBar = document.getElementById('tgt-shield-bar')
        const hullVal = document.getElementById('tgt-hull-val')
        const hullBar = document.getElementById('tgt-hull-bar')

        if (nameEl) nameEl.innerText = lockedContact.name.toUpperCase()
        if (distEl) distEl.innerText = lockedContact.dist >= 1000 ? (lockedContact.dist / 1000).toFixed(2) + ' KM' : Math.round(lockedContact.dist) + ' M'
        if (classEl) classEl.innerText = lockedContact.classDesc || 'UNKNOWN CONTACT'

        const hPct = lockedContact.hull !== undefined && lockedContact.maxHull ? Math.max(0, Math.round((lockedContact.hull / lockedContact.maxHull) * 100)) : 100
        const sPct = lockedContact.shield !== undefined && lockedContact.maxShield ? Math.max(0, Math.round((lockedContact.shield / lockedContact.maxShield) * 100)) : 0

        if (shdVal) shdVal.innerText = sPct + '%'
        if (shdBar) shdBar.style.width = sPct + '%'
        if (hullVal) hullVal.innerText = hPct + '%'
        if (hullBar) hullBar.style.width = hPct + '%'
      } else {
        targetHud.classList.remove('active')
      }
    }

    // Predictive Lead Indicator Reticle
    if (leadMarker) {
      const targetEnemy = this.enemies.find(e => e.id === this.lockedTargetId)
      if (targetEnemy && targetEnemy.vel) {
        const dist = pPos.distanceTo(targetEnemy.pos)
        const bulletSpeed = 240
        const timeToHit = dist / bulletSpeed
        const leadWorld = targetEnemy.pos.clone().add(targetEnemy.vel.clone().multiplyScalar(timeToHit))
        const leadProj = leadWorld.project(this.projCam)

        if (leadProj.z < 1.0) {
          leadMarker.style.display = 'block'
          leadMarker.style.left = ((leadProj.x * 0.5 + 0.5) * window.innerWidth) + 'px'
          leadMarker.style.top = ((-leadProj.y * 0.5 + 0.5) * window.innerHeight) + 'px'
        } else {
          leadMarker.style.display = 'none'
        }
      } else {
        leadMarker.style.display = 'none'
      }
    }
  }

  private updateHUDGauges() {
    const ui = this.ctx.ui
    if (!ui) return

    const hullBar = ui.query('#hull-bar')
    const shdBar = ui.query('#shield-bar')
    const nrgBar = ui.query('#energy-bar')

    if (hullBar) hullBar.style.width = Math.max(0, Math.round((this.hull / this.maxHull) * 100)) + '%'
    if (shdBar) shdBar.style.width = Math.max(0, Math.round((this.shield / this.maxShield) * 100)) + '%'
    if (nrgBar) nrgBar.style.width = Math.max(0, Math.round((this.energy / this.maxEnergy) * 100)) + '%'
  }

  private addNotification(text: string) {
    if (typeof document === 'undefined') return
    const feed = document.getElementById('kill-feed')
    if (!feed) return
    const item = document.createElement('div')
    item.className = 'kill-item'
    item.innerText = text
    feed.appendChild(item)
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item)
    }, 4500)
  }

  // STATE MANAGEMENT
  startDogfight(immediateCombat = false) {
    this.gameState = 'DOGFIGHT'
    this.sound.playClick()
    this.sound.startBgm()

    const ui = this.ctx.ui
    if (ui) {
      ui.hide('#menu-main')
      ui.hide('#menu-hangar')
      ui.hide('#menu-galaxy')
      ui.hide('#menu-settings')
      ui.hide('#menu-endgame')
      ui.show('#game-hud')
    }

    const t = this.ctx.entity.getTransform()
    t.position.x = 0
    t.position.y = 0
    t.position.z = 0
    t.rotation.x = 0
    t.rotation.y = 0
    t.rotation.z = 0

    this.hull = this.maxHull
    this.shield = this.maxShield
    this.energy = this.maxEnergy

    if (immediateCombat) {
      this.initiateWarpJump()
    } else {
      this.isInCombatZone = false
      this.activeSectorName = 'DEMON SANCTUM (HOME BASE)'
      this.hostileDistanceText = '~1.000 TAHUN CAHAYA (AMAN)'
      this.clearEnemies()
      this.updateWarpButtons()
      this.addNotification('🚀 SEKTOR PATROLI: MUSUH BERJARAK ~1.000 TAHUN CAHAYA.')
      this.addNotification('🛡️ ZONA AMAN AKTIF // TEKAN [J] UNTUK WARP JUMP KE PERANG MUSUH')
    }
  }

  initiateWarpJump(targetSector?: string) {
    if (this.isWarping) return
    this.isWarping = true
    this.warpTimer = 1.4
    this.targetWarpMode = 'combat'
    this.targetWarpSector = targetSector || 'SEKTOR MUSUH // 1.000 LY'
    this.sound.playWarp()
    this.shakeIntensity = 0.9
    this.addNotification('🚀 HYPERDRIVE: MELOMPAT 1.000 TAHUN CAHAYA MENUJU SEKTOR MUSUH!')
  }

  initiateWarpRetreat() {
    if (this.isWarping) return
    this.isWarping = true
    this.warpTimer = 1.4
    this.targetWarpMode = 'home'
    this.sound.playWarp()
    this.shakeIntensity = 0.9
    this.addNotification('🛡️ EMERGENCY WARP: KEMBALI 1.000 TAHUN CAHAYA KE DEMON SANCTUM!')
  }

  private completeWarp() {
    this.isWarping = false
    if (this.targetWarpMode === 'combat') {
      this.isInCombatZone = true
      this.activeSectorName = this.targetWarpSector || 'SEKTOR MUSUH // 1.000 LY'
      this.hostileDistanceText = 'KONTAK TEMPUR (0 LY)'
      this.sound.playAlarm()
      this.spawnWave(1)
      this.addNotification('⚠️ WARP EXIT: TIBA DI SEKTOR MUSUH (~1.000 LY)! ALARM PERANG AKTIF!')
      this.updateWarpButtons()
    } else {
      this.isInCombatZone = false
      this.clearEnemies()
      this.activeSectorName = 'DEMON SANCTUM (HOME BASE)'
      this.hostileDistanceText = '~1.000 TAHUN CAHAYA (AMAN)'
      this.addNotification('🛡️ WARP EXIT: TIBA DI DEMON SANCTUM. MUSUH BERJARAK ~1.000 TAHUN CAHAYA (AMAN).')
      this.updateWarpButtons()
    }
  }

  private updateWarpButtons() {
    const ui = this.ctx.ui
    if (!ui) return
    const btnJump = ui.query('#btn-warp-jump')
    const btnHome = ui.query('#btn-warp-home')
    if (btnJump) btnJump.style.display = this.isInCombatZone ? 'none' : 'block'
    if (btnHome) btnHome.style.display = this.isInCombatZone ? 'block' : 'none'
  }

  private clearEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      this.ctx.world.destroyEntity(e.id)
    }
    this.enemies = []
    this.lockedTargetId = null
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      if (p.isEnemy) {
        this.ctx.world.destroyEntity(p.id)
        this.projectiles.splice(i, 1)
      }
    }
  }

  openMainMenu() {
    this.gameState = 'MENU'
    this.sound.playClick()
    const ui = this.ctx.ui
    if (ui) {
      ui.show('#menu-main')
      ui.hide('#menu-hangar')
      ui.hide('#menu-galaxy')
      ui.hide('#menu-settings')
      ui.hide('#menu-endgame')
    }
  }

  openHangar() {
    this.gameState = 'HANGAR'
    this.sound.playClick()
    const ui = this.ctx.ui
    if (ui) {
      ui.hide('#menu-main')
      ui.show('#menu-hangar')
      ui.hide('#menu-galaxy')
      ui.hide('#menu-settings')
      ui.hide('#menu-endgame')
      this.refreshHangarView()
    }
  }

  private cycleShip(dir: number) {
    this.selectedShipIndex = (this.selectedShipIndex + dir + this.ships.length) % this.ships.length
    this.sound.playClick()
    this.applyShipVisuals()
    this.refreshHangarView()
  }

  private refreshHangarView() {
    const ui = this.ctx.ui
    if (!ui) return

    const s = this.ships[this.selectedShipIndex]
    const nameEl = ui.query('#ship-name')
    const classEl = ui.query('#ship-class')
    const hEl = ui.query('#stat-hull')
    const sEl = ui.query('#stat-shield')
    const spEl = ui.query('#stat-speed')
    const mEl = ui.query('#stat-maneuver')
    const dEl = ui.query('#stat-damage')
    const atEl = ui.query('#ability-title')
    const adEl = ui.query('#ability-desc')

    if (nameEl) nameEl.innerText = s.name
    if (classEl) classEl.innerText = s.class
    if (hEl) hEl.innerText = String(s.maxHull)
    if (sEl) sEl.innerText = String(s.maxShield)
    if (spEl) spEl.innerText = s.boostSpeed + ' M/S'
    if (mEl) mEl.innerText = Math.round(s.turnRate * 60) + ' DEG/S'
    if (dEl) dEl.innerText = s.damage + ' DMG'
    if (atEl) atEl.innerText = 'SPECIAL ABILITY: ' + s.abilityName
    if (adEl) adEl.innerText = s.abilityDesc

    const wEl = ui.query('#lvl-wpn')
    const shEl = ui.query('#lvl-shd')
    const egEl = ui.query('#lvl-eng')
    if (wEl) wEl.innerText = String(this.upgWeapons)
    if (shEl) shEl.innerText = String(this.upgShield)
    if (egEl) egEl.innerText = String(this.upgEngines)
  }

  private buyUpgrade(type: 'weapon' | 'shield' | 'engine') {
    const cost = 200
    if (this.credits >= cost) {
      this.credits -= cost
      this.sound.playClick()
      if (type === 'weapon') this.upgWeapons++
      else if (type === 'shield') this.upgShield++
      else if (type === 'engine') this.upgEngines++

      this.applyShipVisuals()
      this.refreshHangarView()
      this.addNotification('UPGRADE COMPLETED: ' + type.toUpperCase() + ' MATRIX')
    }
  }

  private setPaintColor(hex: string) {
    this.activeNeonColor = hex
    this.sound.playClick()
    this.applyShipVisuals()
  }

  private deployShip() {
    this.sound.playClick()
    this.startDogfight()
  }

  openGalaxy() {
    this.gameState = 'GALAXY'
    this.sound.playClick()
    const ui = this.ctx.ui
    if (ui) {
      ui.hide('#menu-main')
      ui.hide('#menu-hangar')
      ui.show('#menu-galaxy')
      ui.hide('#menu-settings')
      ui.hide('#menu-endgame')
      this.renderGalaxyMap()
    }
  }

  private renderGalaxyMap() {
    if (typeof document === 'undefined') return
    const grid = document.getElementById('galaxy-list')
    if (!grid) return

    grid.innerHTML = ''
    const systems = this.galaxy.systems

    const pct = Math.round((this.galaxy.conqueredCount / systems.length) * 100)
    const pctEl = this.ctx.ui.query('#conquest-pct')
    if (pctEl) pctEl.innerText = pct + '%'

    const incEl = this.ctx.ui.query('#turn-income')
    if (incEl) incEl.innerText = String(this.galaxy.getPlayerIncome())

    systems.forEach(sys => {
      const card = document.createElement('div')
      card.className = 'sector-card'
      card.setAttribute('data-interactive', 'true')

      const fInfo = this.galaxy.factions[sys.faction]
      card.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
        '<b style="font-size:12px; color:#ffe600;">' + sys.name + '</b>' +
        '<span class="faction-badge" style="background:' + fInfo.color + '; color:#000;">' + sys.faction + '</span>' +
        '</div>' +
        '<div style="font-size:10px; color:#38bdf8; margin-top:2px; font-weight:bold;">JARAK: ' + sys.distanceLY + ' TAHUN CAHAYA (LY)</div>' +
        '<div style="font-size:11px; color:#aaa; margin-top:3px;">YIELD: +' + sys.income + ' CR | DEF: LVL ' + sys.defense + '</div>' +
        '<div style="font-size:10px; color:#00f0ff; margin-top:2px;">GARRISON: ' + sys.fleet.fighters + ' FTR | ' + sys.fleet.frigates + ' FRG</div>'

      card.onclick = () => this.selectSector(sys)
      grid.appendChild(card)
    })
  }

  private selectSector(sys: any) {
    this.sound.playClick()
    const ui = this.ctx.ui
    if (!ui) return

    const nameEl = ui.query('#sec-name')
    const infoEl = ui.query('#sec-info')
    if (nameEl) nameEl.innerText = sys.name.toUpperCase() + ' [' + sys.distanceLY + ' TAHUN CAHAYA]'
    if (infoEl) {
      infoEl.innerText =
        'Jarak: ' + sys.distanceLY + ' Tahun Cahaya | Faksi: ' + this.galaxy.factions[sys.faction].name +
        ' | Yield: +' + sys.income + ' CR/turn | Garrison: ' +
        sys.fleet.fighters + ' Fighters, ' + sys.fleet.frigates + ' Frigates, ' + sys.fleet.battleships + ' Battleships.'
    }

    if (typeof document === 'undefined') return
    const btns = document.getElementById('sec-btns')
    if (!btns) return
    btns.innerHTML = ''

    if (sys.faction === 'player') {
      const bFtr = document.createElement('button')
      bFtr.className = 'cyber-btn'
      bFtr.innerText = 'BUILD FIGHTER (100 CR)'
      bFtr.setAttribute('data-interactive', 'true')
      bFtr.onclick = () => {
        if (this.galaxy.buildShip(sys.id, 'fighter')) {
          this.sound.playClick()
          this.renderGalaxyMap()
          this.selectSector(sys)
        }
      }
      btns.appendChild(bFtr)

      const bFrg = document.createElement('button')
      bFrg.className = 'cyber-btn yellow'
      bFrg.innerText = 'BUILD FRIGATE (350 CR)'
      bFrg.setAttribute('data-interactive', 'true')
      bFrg.onclick = () => {
        if (this.galaxy.buildShip(sys.id, 'frigate')) {
          this.sound.playClick()
          this.renderGalaxyMap()
          this.selectSector(sys)
        }
      }
      btns.appendChild(bFrg)
    } else {
      const bAtk = document.createElement('button')
      bAtk.className = 'cyber-btn magenta'
      bAtk.innerText = 'WARP ASSAULT (' + sys.distanceLY + ' LY)'
      bAtk.setAttribute('data-interactive', 'true')
      bAtk.onclick = () => {
        this.activeSectorName = sys.name + ' (' + sys.distanceLY + ' LY)'
        this.startDogfight(false)
        this.initiateWarpJump(sys.name + ' (' + sys.distanceLY + ' LY)')
      }
      btns.appendChild(bAtk)
    }
  }

  private endGalaxyTurn() {
    this.sound.playClick()
    this.galaxy.advanceTurn()
    this.credits += this.galaxy.getPlayerIncome()
    this.renderGalaxyMap()
    this.addNotification('CYCLE ADVANCED // SYSTEM CREDITS HARVESTED')
  }

  openSettings() {
    this.gameState = 'SETTINGS'
    this.sound.playClick()
    const ui = this.ctx.ui
    if (ui) {
      ui.hide('#menu-main')
      ui.show('#menu-settings')
    }
  }

  private toggleBgm() {
    const btn = this.ctx.ui.query('#btn-toggle-bgm')
    if (btn) {
      if (btn.innerText === 'ENABLED') {
        this.sound.stopBgm()
        btn.innerText = 'MUTED'
        btn.style.color = '#888'
      } else {
        this.sound.startBgm()
        btn.innerText = 'ENABLED'
        btn.style.color = '#00f0ff'
      }
    }
  }
}
