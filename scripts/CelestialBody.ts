export default class CelestialBody {
  rotSpeedY = 1.5
  rotSpeedX = 0.0
  rotSpeedZ = 0.0

  private ctx: any

  onInit(ctx: any) {
    this.ctx = ctx
  }

  onUpdate(dt: number) {
    const t = this.ctx.entity.getTransform()
    if (!t) return
    t.rotation.y = (t.rotation.y + this.rotSpeedY * dt) % 360
    if (this.rotSpeedX !== 0) {
      t.rotation.x = (t.rotation.x + this.rotSpeedX * dt) % 360
    }
    if (this.rotSpeedZ !== 0) {
      t.rotation.z = (t.rotation.z + this.rotSpeedZ * dt) % 360
    }
  }
}
