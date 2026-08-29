import { GameSystem, GameWorld } from '@gglib/ecs'
import { IblSampler, NishitaSkyEffect } from '@gglib/effects'
import { Device, getMipmapCount, Texture, TextureUsage } from '@gglib/graphics'
import { TimeOfDay } from './TimeOfDay'
import { DEGREE_TO_RAD } from '@gglib/math'

export class SkyLightSystem extends GameSystem {
  public device: Device
  public timeOfDay = new TimeOfDay()
  public fxSky: NishitaSkyEffect
  public fxIbl: IblSampler
  public skyDomeTexture: Texture

  public get mieScatteringMap() {
    return this.fxSky.mieScatteringMap
  }

  public get rayleighScatteringMap() {
    return this.fxSky.rayleighScatteringMap
  }
  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.fxSky = new NishitaSkyEffect(this.device, {})
    this.fxIbl = new IblSampler(this.device, {})
    this.skyDomeTexture = this.device.createRenderTarget({
      type: 'Texture2D',
      width: 2048,
      height: 1024,
      mipLevelCount: getMipmapCount(2048, 1024, 1),
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    })
  }

  public override render(time: number, dt: number): void {
    if (this.fxSky.isValid) {
      let latitude = Math.acos(-this.timeOfDay.sunDirection.z)
      let longitude = Math.atan2(-this.timeOfDay.sunDirection.y, -this.timeOfDay.sunDirection.x)

      this.fxSky.textureOut = this.skyDomeTexture
      this.timeOfDay.sunDirection
      this.fxSky.sunLatitude = latitude
      this.fxSky.sunLongitude = longitude
      this.fxSky.mieScattering = this.timeOfDay.skyKM
      this.fxSky.rayleighScattering = this.timeOfDay.skyKR
      this.fxSky.phaseAsymmetry = this.timeOfDay.skyG
      this.fxSky.waveLength.x = this.timeOfDay.skyWaveR
      this.fxSky.waveLength.y = this.timeOfDay.skyWaveG
      this.fxSky.waveLength.z = this.timeOfDay.skyWaveB
      this.fxSky.sunIntensity.x = this.timeOfDay.sunIntensity
      this.fxSky.sunIntensity.y = this.timeOfDay.sunIntensity
      this.fxSky.sunIntensity.z = this.timeOfDay.sunIntensity

      this.fxSky.render(this.device.renderPass)
    }
    if (this.fxIbl.isReady) {
      this.fxIbl.update(this.skyDomeTexture)
    }
  }

  public destroy(): void {
    this.fxIbl.dispose()
    this.fxSky.dispose()
    this.skyDomeTexture.dispose()
  }
}
