
export class SoundSystem {
  private ctx: any = null
  private masterGain: any = null
  private bgmGain: any = null
  private sfxGain: any = null
  private isBgmPlaying = false
  private bgmTimer: any = null
  private beat = 0
  private enabled = true

  constructor() {
    this.initAudio()
  }

  private initAudio() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
        this.masterGain = this.ctx.createGain()
        this.bgmGain = this.ctx.createGain()
        this.sfxGain = this.ctx.createGain()

        this.masterGain.gain.value = 0.8
        this.bgmGain.gain.value = 0.25
        this.sfxGain.gain.value = 0.4

        this.bgmGain.connect(this.masterGain)
        this.sfxGain.connect(this.masterGain)
        this.masterGain.connect(this.ctx.destination)
      }
    } catch (e) {
      // Audio not supported in headless mode
    }
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(master: number, sfx: number, bgm: number) {
    if (!this.ctx) return
    if (this.masterGain) this.masterGain.gain.value = master
    if (this.sfxGain) this.sfxGain.gain.value = sfx
    if (this.bgmGain) this.bgmGain.gain.value = bgm
  }

  startBgm() {
    if (!this.ctx || this.isBgmPlaying) return
    this.resume()
    this.isBgmPlaying = true
    this.beat = 0

    const bassNotes = [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4] // A1, C2, D2, E2
    const arpNotes = [220, 261.6, 329.6, 440, 392, 329.6, 261.6, 196]

    const stepInterval = 135 // ms (~110 bpm sixteenth notes)
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return
      const t = this.ctx.currentTime

      // Bass note every 2 steps
      if (this.beat % 2 === 0) {
        const bassFreq = bassNotes[(Math.floor(this.beat / 2)) % bassNotes.length]
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(bassFreq, t)
        g.gain.setValueAtTime(0.3, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc.connect(g)
        g.connect(this.bgmGain)
        osc.start(t)
        osc.stop(t + 0.25)
      }

      // Arpeggio note
      if (this.beat % 1 === 0) {
        const arpFreq = arpNotes[this.beat % arpNotes.length]
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(arpFreq, t)
        g.gain.setValueAtTime(0.12, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        osc.connect(g)
        g.connect(this.bgmGain)
        osc.start(t)
        osc.stop(t + 0.13)
      }

      this.beat = (this.beat + 1) % 32
    }, stepInterval)
  }

  stopBgm() {
    this.isBgmPlaying = false
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer)
      this.bgmTimer = null
    }
  }

  playLaser(isTwin = false) {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(isTwin ? 880 : 660, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12)
    g.gain.setValueAtTime(0.2, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.13)
  }

  playPlasma() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(320, t)
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.25)
    g.gain.setValueAtTime(0.35, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.26)
  }

  playRailgun() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1600, t)
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.4)
    g.gain.setValueAtTime(0.4, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.41)
  }

  playMissileLaunch() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.linearRampToValueAtTime(440, t + 0.3)
    g.gain.setValueAtTime(0.25, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.36)
  }

  playExplosion(isLarge = false) {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(isLarge ? 90 : 140, t)
    osc.frequency.exponentialRampToValueAtTime(20, t + (isLarge ? 0.7 : 0.4))
    g.gain.setValueAtTime(isLarge ? 0.6 : 0.35, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + (isLarge ? 0.7 : 0.4))
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + (isLarge ? 0.72 : 0.42))
  }

  playShieldHit() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1)
    g.gain.setValueAtTime(0.3, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.16)
  }

  playDash() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2)
    g.gain.setValueAtTime(0.35, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.26)
  }

  playAlarm() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.setValueAtTime(440, t + 0.1)
    g.gain.setValueAtTime(0.2, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.23)
  }

  playClick() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, t)
    g.gain.setValueAtTime(0.15, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.05)
  }

  playWarp() {
    if (!this.ctx) return
    this.resume()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(90, t)
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.7)
    g.gain.setValueAtTime(0.4, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + 0.85)
  }
}
