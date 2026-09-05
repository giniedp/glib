import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { IblSampler, NishitaSkyEffect } from '@gglib/effects'
import { Device, getMipmapCount, Texture, TextureUsage } from '@gglib/graphics'
import { vec3, vec4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { InputSlots } from '../../material'
import { TimeOfDay } from './TimeOfDay'
import { TimeOfDayComponent } from './TimeOfDayComponent'

export class SkyLightSystem extends GameSystem {
  private game: EcsGame
  private renderer: Renderer
  private todQuery: GameQuery

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

  public get reflectionMap() {
    return this.fxIbl.envMapGGX
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.todQuery = world.query({ scope: 'active', required: [TimeOfDayComponent] })
    this.device = world.getSystem(Device)
    this.renderer = world.getSystem(Renderer)
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
  public override update(time: number, dt: number): void {
    const cam = this.game.scene.getView(0).camera.world.getTranslation()

    for (const entity of this.todQuery) {
      const it = entity.component(TimeOfDayComponent)
      if (it.isPointInside(cam)) {
        this.timeOfDay.scheduleAdd(it.preset, it.config.priority, it.config.blendTime)
      } else {
        this.timeOfDay.scheduleRemove(it.preset)
      }
    }

    this.timeOfDay.update(time, dt)
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
      this.fxSky.sunIntensity.x = this.timeOfDay.sunColor.x
      this.fxSky.sunIntensity.y = this.timeOfDay.sunColor.y
      this.fxSky.sunIntensity.z = this.timeOfDay.sunColor.z
      this.fxSky.nightSkyColorBase = this.timeOfDay.nightSkyZenithColor
      this.fxSky.nightSkyColorDelta = this.timeOfDay.nightSkyColorDelta
      this.fxSky.nightSkyColorShift = this.timeOfDay.nightSkyZenithColorShift
      this.fxSky.groundColor = this.timeOfDay.bottomFogColor

      this.fxSky.render(this.device.renderPass)
    }
    if (this.fxIbl.isReady) {
      this.fxIbl.update(this.skyDomeTexture)
    }

    const tod = this.timeOfDay
    const inputs = this.renderer.inputs
    const sunColor = inputs.get(InputSlots.Global.SunColor) || vec4(0)
    sunColor.x = tod.sunColor.x
    sunColor.y = tod.sunColor.y
    sunColor.z = tod.sunColor.z
    sunColor.w = tod.sunSpecularMultiplier
    inputs.set(InputSlots.Global.SunColor, sunColor)
    inputs.set(InputSlots.Global.SunDirection, tod.sunDirection)

    const scaledBottomFogColor = inputs.get(InputSlots.Global.BottomFogColor) || vec3()
    scaledBottomFogColor.x = tod.bottomFogColor.x * tod.bottomFogMultiplier
    scaledBottomFogColor.y = tod.bottomFogColor.y * tod.bottomFogMultiplier
    scaledBottomFogColor.z = tod.bottomFogColor.z * tod.bottomFogMultiplier
    inputs.set(InputSlots.Global.BottomFogColor, scaledBottomFogColor)

    const scaledTopFogColor = inputs.get(InputSlots.Global.TopFogColor) || vec3()
    scaledTopFogColor.x = tod.topFogColor.x * tod.topFogMultiplier
    scaledTopFogColor.y = tod.topFogColor.y * tod.topFogMultiplier
    scaledTopFogColor.z = tod.topFogColor.z * tod.topFogMultiplier
    inputs.set(InputSlots.Global.TopFogColor, scaledTopFogColor)

    inputs.set(InputSlots.Global.TopFogDensity, tod.topFogDensity)
    inputs.set(InputSlots.Global.BottomFogDensity, tod.bottomFogDensity)
    inputs.set(InputSlots.Global.TopFogHeight, tod.topFogHeight)
    inputs.set(InputSlots.Global.BottomFogHeight, tod.bottomFogHeight)
    inputs.set(InputSlots.Global.FogHeightOffset, tod.fogHeightOffset)

    inputs.set(InputSlots.Global.CloudShadingSunColor, tod.cloudshadingCustomSunColor)
    inputs.set(InputSlots.Global.CloudShadingSkyColor, tod.cloudshadingCustomSkyColor)

    inputs.set(InputSlots.Global.EnvMap, this.fxIbl.envMapGGX)
  }

  public destroy(): void {
    this.fxIbl.dispose()
    this.fxSky.dispose()
    this.skyDomeTexture.dispose()
  }
}
