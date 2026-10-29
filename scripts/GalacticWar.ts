
export interface StarSystem {
  id: string
  name: string
  pos: [number, number, number]
  faction: 'player' | 'helix' | 'jackal' | 'concord'
  income: number
  defense: number
  fleet: { fighters: number; frigates: number; battleships: number }
  connections: string[]
  isCapital?: boolean
  distanceLY: number
}

export interface FactionInfo {
  id: 'player' | 'helix' | 'jackal' | 'concord'
  name: string
  title: string
  color: string
  credits: number
}

export class GalacticWar {
  systems: StarSystem[] = []
  factions: Record<string, FactionInfo> = {
    player: {
      id: 'player',
      name: 'Kerajaan Iblis Neon',
      title: 'Neon Demon Sovereign',
      color: '#ff007f',
      credits: 600
    },
    helix: {
      id: 'helix',
      name: 'Helix Dynamics',
      title: 'Corporate Conglomerate',
      color: '#00f0ff',
      credits: 1200
    },
    jackal: {
      id: 'jackal',
      name: 'Chrome Jackals',
      title: 'Scavenger Syndicate',
      color: '#ffaa00',
      credits: 900
    },
    concord: {
      id: 'concord',
      name: 'Orbital Concord',
      title: 'Militarized Union',
      color: '#c084fc',
      credits: 1100
    }
  }

  selectedSystemId: string | null = null
  targetSystemId: string | null = null
  turnNumber = 1
  conqueredCount = 0

  constructor() {
    this.initGalaxy()
    this.loadProgress()
  }

  private initGalaxy() {
    this.systems = [
      // PLAYER HOME CLUSTER (0 - 52 TAHUN CAHAYA)
      { id: 's01', name: 'Demon Sanctum (Capital)', pos: [0, 0, 0], faction: 'player', income: 150, defense: 3, fleet: { fighters: 8, frigates: 2, battleships: 1 }, connections: ['s02', 's03', 'b01', 'b06'], isCapital: true, distanceLY: 0 },
      { id: 's02', name: 'Abyssal Foundry (Core)', pos: [-35, 10, -25], faction: 'player', income: 90, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s01', 's04', 'b02'], distanceLY: 45 },
      { id: 's03', name: 'Crimson Veil (Core)', pos: [30, -15, -40], faction: 'player', income: 80, defense: 2, fleet: { fighters: 4, frigates: 1, battleships: 0 }, connections: ['s01', 's05', 'b04'], distanceLY: 52 },

      // BIMASAKTI PLANETARY SYSTEMS (TATA SURYA)
      { id: 'b01', name: 'Bumi - Terra Gaia (Bimasakti)', pos: [45, 20, -110], faction: 'player', income: 130, defense: 3, fleet: { fighters: 6, frigates: 2, battleships: 0 }, connections: ['s01', 'b02', 'b06'], distanceLY: 120 },
      { id: 'b02', name: 'Mars - Planet Merah (Bimasakti)', pos: [-55, 35, -160], faction: 'player', income: 100, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s02', 'b01', 'b03'], distanceLY: 180 },
      { id: 'b03', name: 'Jupiter - Raksasa Gas (Bimasakti)', pos: [90, 55, -230], faction: 'player', income: 175, defense: 4, fleet: { fighters: 9, frigates: 3, battleships: 1 }, connections: ['b02', 'b04', 's04'], distanceLY: 270 },
      { id: 'b04', name: 'Saturnus - Permata Cincin (Bimasakti)', pos: [-85, -30, -290], faction: 'player', income: 150, defense: 3, fleet: { fighters: 7, frigates: 2, battleships: 1 }, connections: ['s03', 'b03', 'b05'], distanceLY: 340 },
      { id: 'b05', name: 'Neptunus - Raksasa Es Biru (Bimasakti)', pos: [-45, -60, -360], faction: 'player', income: 115, defense: 3, fleet: { fighters: 6, frigates: 2, battleships: 0 }, connections: ['b04', 's05', 's06'], distanceLY: 410 },
      { id: 'b06', name: 'Venus - Bintang Kejora (Bimasakti)', pos: [35, -20, -85], faction: 'player', income: 110, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s01', 'b01'], distanceLY: 90 },

      // DEEP SPACE VOID BUFFER ZONE (~500 TAHUN CAHAYA)
      { id: 's04', name: 'Void Waypoint Alpha (Buffer DMZ)', pos: [-180, 40, -450], faction: 'player', income: 70, defense: 2, fleet: { fighters: 4, frigates: 1, battleships: 0 }, connections: ['s02', 's15', 's06'], distanceLY: 490 },
      { id: 's05', name: 'Abyssal Rift Beta (Buffer DMZ)', pos: [150, -50, -480], faction: 'player', income: 85, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s03', 's06', 's12'], distanceLY: 510 },

      // CHROME JACKALS PIRATE SECTOR (~1,000 TAHUN CAHAYA)
      { id: 's07', name: 'Jackal Core (Capital)', pos: [-580, -120, -820], faction: 'jackal', income: 140, defense: 3, fleet: { fighters: 9, frigates: 2, battleships: 1 }, connections: ['s08', 's11'], isCapital: true, distanceLY: 1010 },
      { id: 's08', name: 'Rust Asteroids Outpost', pos: [-520, -90, -780], faction: 'jackal', income: 65, defense: 2, fleet: { fighters: 4, frigates: 1, battleships: 0 }, connections: ['s15', 's11', 's07'], distanceLY: 940 },
      { id: 's11', name: 'Dead Man Drift', pos: [-460, -70, -750], faction: 'jackal', income: 75, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s15', 's08', 's07'], distanceLY: 880 },
      { id: 's15', name: 'Titan Scrapyard Nebula', pos: [-400, -50, -700], faction: 'jackal', income: 85, defense: 2, fleet: { fighters: 6, frigates: 1, battleships: 0 }, connections: ['s04', 's11', 's08'], distanceLY: 810 },

      // HELIX DYNAMICS CORPORATE SECTOR (~1,000 TAHUN CAHAYA)
      { id: 's13', name: 'Helix Prime (Capital)', pos: [50, 240, -970], faction: 'helix', income: 180, defense: 4, fleet: { fighters: 12, frigates: 3, battleships: 2 }, connections: ['s09', 's17', 's10', 's14'], isCapital: true, distanceLY: 1000 },
      { id: 's10', name: 'Aether Siphon Megastructure', pos: [120, 200, -940], faction: 'helix', income: 100, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s09', 's13', 's14'], distanceLY: 970 },
      { id: 's14', name: 'Neuro-Link Relay Array', pos: [-40, 260, -960], faction: 'helix', income: 130, defense: 3, fleet: { fighters: 8, frigates: 2, battleships: 0 }, connections: ['s17', 's10', 's13'], distanceLY: 995 },
      { id: 's17', name: 'Synth Bio Labs Core', pos: [180, 180, -910], faction: 'helix', income: 115, defense: 2, fleet: { fighters: 6, frigates: 2, battleships: 0 }, connections: ['s06', 's14', 's13'], distanceLY: 945 },
      { id: 's09', name: 'Calyx IV Gateway Hub', pos: [20, 140, -840], faction: 'helix', income: 110, defense: 3, fleet: { fighters: 7, frigates: 2, battleships: 0 }, connections: ['s06', 's10', 's13'], distanceLY: 850 },
      { id: 's06', name: 'Vesper Outer Void', pos: [0, 100, -780], faction: 'helix', income: 90, defense: 2, fleet: { fighters: 6, frigates: 1, battleships: 0 }, connections: ['s04', 's05', 's09', 's17'], distanceLY: 790 },

      // ORBITAL CONCORD MILITARIZED SECTOR (~1,000 TAHUN CAHAYA)
      { id: 's21', name: 'Concord Citadel (Capital)', pos: [620, -140, -810], faction: 'concord', income: 190, defense: 4, fleet: { fighters: 14, frigates: 4, battleships: 2 }, connections: ['s16', 's18', 's20'], isCapital: true, distanceLY: 1030 },
      { id: 's12', name: 'Null Sector Alpha Vanguard', pos: [480, -70, -720], faction: 'concord', income: 120, defense: 3, fleet: { fighters: 8, frigates: 2, battleships: 1 }, connections: ['s05', 's16', 's19'], distanceLY: 870 },
      { id: 's16', name: 'Helios Gate Dread-Nexus', pos: [550, -100, -770], faction: 'concord', income: 140, defense: 3, fleet: { fighters: 7, frigates: 2, battleships: 1 }, connections: ['s12', 's18', 's20', 's21'], distanceLY: 950 },
      { id: 's18', name: 'Vanguard Orbital Fortress', pos: [590, -60, -840], faction: 'concord', income: 100, defense: 3, fleet: { fighters: 7, frigates: 2, battleships: 0 }, connections: ['s16', 's21', 's22'], distanceLY: 1030 },
      { id: 's19', name: 'Astraea Nexus', pos: [630, -100, -790], faction: 'concord', income: 95, defense: 3, fleet: { fighters: 8, frigates: 2, battleships: 0 }, connections: ['s12', 's20', 's23'], distanceLY: 1015 },
      { id: 's20', name: 'Iron Bastion Dread-Spire', pos: [660, -120, -860], faction: 'concord', income: 110, defense: 3, fleet: { fighters: 9, frigates: 2, battleships: 1 }, connections: ['s16', 's19', 's21', 's24'], distanceLY: 1090 },
      { id: 's22', name: 'Deep Space Sentinel Beacon', pos: [710, -90, -900], faction: 'concord', income: 70, defense: 2, fleet: { fighters: 5, frigates: 1, battleships: 0 }, connections: ['s18', 's24'], distanceLY: 1150 },
      { id: 's23', name: 'Garrison Alpha Rift', pos: [650, -40, -780], faction: 'concord', income: 80, defense: 2, fleet: { fighters: 6, frigates: 1, battleships: 0 }, connections: ['s19', 's24'], distanceLY: 1020 },
      { id: 's24', name: 'Omega Rift Sentinel', pos: [750, 20, -850], faction: 'concord', income: 90, defense: 2, fleet: { fighters: 7, frigates: 1, battleships: 0 }, connections: ['s20', 's22', 's23'], distanceLY: 1130 }
    ]
    this.updateConquestStats()
  }

  updateConquestStats() {
    this.conqueredCount = this.systems.filter(s => s.faction === 'player').length
  }

  getPlayerIncome(): number {
    return this.systems
      .filter(s => s.faction === 'player')
      .reduce((sum, s) => sum + s.income, 0)
  }

  buildShip(systemId: string, shipType: 'fighter' | 'frigate' | 'battleship'): boolean {
    const sys = this.systems.find(s => s.id === systemId)
    if (!sys || sys.faction !== 'player') return false

    const costs = { fighter: 100, frigate: 350, battleship: 850 }
    const cost = costs[shipType]
    if (this.factions.player.credits < cost) return false

    this.factions.player.credits -= cost
    if (shipType === 'fighter') sys.fleet.fighters += 1
    else if (shipType === 'frigate') sys.fleet.frigates += 1
    else if (shipType === 'battleship') sys.fleet.battleships += 1

    this.saveProgress()
    return true
  }

  canAttack(fromId: string, toId: string): boolean {
    const fromSys = this.systems.find(s => s.id === fromId)
    const toSys = this.systems.find(s => s.id === toId)
    if (!fromSys || !toSys) return false
    if (fromSys.faction !== 'player') return false
    if (toSys.faction === 'player') return false
    return fromSys.connections.includes(toId)
  }

  onPlayerVictory(systemId: string) {
    const sys = this.systems.find(s => s.id === systemId)
    if (!sys) return
    sys.faction = 'player'
    sys.fleet = { fighters: 4, frigates: 1, battleships: 0 }
    this.factions.player.credits += 300 // Bonus bounty
    this.updateConquestStats()
    this.advanceTurn()
    this.saveProgress()
  }

  advanceTurn() {
    this.turnNumber++

    // Generate income for all factions
    Object.keys(this.factions).forEach(fId => {
      const inc = this.systems
        .filter(s => s.faction === fId)
        .reduce((sum, s) => sum + s.income, 0)
      this.factions[fId].credits += inc
    })

    // AI dynamic skirmishes (helix, jackal, concord attempt to expand)
    const aiFactions: ('helix' | 'jackal' | 'concord')[] = ['helix', 'jackal', 'concord']
    aiFactions.forEach(ai => {
      if (Math.random() < 0.45) {
        const owned = this.systems.filter(s => s.faction === ai)
        if (owned.length === 0) return
        const source = owned[Math.floor(Math.random() * owned.length)]
        const targetIds = source.connections.filter(cId => {
          const target = this.systems.find(s => s.id === cId)
          // Enemies ~1,000 light years away do not directly attack player core home worlds
          return target && target.faction !== ai && !target.isCapital && target.id !== 's01' && target.id !== 's02' && target.id !== 's03'
        })
        if (targetIds.length > 0) {
          const targetSys = this.systems.find(s => s.id === targetIds[0])!
          // AI coin flip attack
          if (Math.random() < 0.5) {
            targetSys.faction = ai
          }
        }
      }
    })

    this.updateConquestStats()
    this.saveProgress()
  }

  checkWinCondition(): 'victory' | 'defeat' | null {
    const total = this.systems.length
    const pct = this.conqueredCount / total
    if (pct >= 0.70) return 'victory'

    // Or all 3 rival capitals conquered
    const capitals = this.systems.filter(s => s.isCapital && s.id !== 's01')
    if (capitals.every(c => c.faction === 'player')) return 'victory'

    // Defeat if player lost capital and all systems
    if (this.conqueredCount === 0) return 'defeat'

    return null
  }

  saveProgress() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = {
          systems: this.systems,
          factions: this.factions,
          turnNumber: this.turnNumber,
          conqueredCount: this.conqueredCount
        }
        window.localStorage.setItem('NEON_DOMINION_2099_GALAXY', JSON.stringify(data))
      }
    } catch (e) {
      // localStorage security fallback
    }
  }

  loadProgress(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('NEON_DOMINION_2099_GALAXY')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.systems && parsed.factions) {
            this.systems = parsed.systems
            this.factions = parsed.factions
            this.turnNumber = parsed.turnNumber || 1
            this.conqueredCount = parsed.conqueredCount || 3
            return true
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return false
  }
}
