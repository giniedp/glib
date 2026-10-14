import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { IblSampler, NishitaSkyEffect } from '@gglib/effects'
import { Device, getMipmapCount, Texture, TextureUsage } from '@gglib/graphics'
import { mat4GetTranslation, vec3, vec4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import type { AssetReference } from '../../api'
import { ENABLE_VOLUMETRIC_FOG_2 } from '../../constants'
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
  /**
   * Skybox slice of the highest priority TimeOfDay POI that contains the camera
   */
  public activeSky: AssetReference | null = null

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
    // read by the SunShaftsPass, not bound by materials
    if (!this.renderer.inputs.hasBlock('sunShafts')) {
      this.renderer.inputs.createBlock('sunShafts')
    }
    this.fxSky = new NishitaSkyEffect(this.device, {})
    // materials only read the GGX map (EnvMap), it is re-filtered every frame
    this.fxIbl = new IblSampler(this.device, { lambert: false, charlie: false })
    this.skyDomeTexture = this.device.createRenderTarget({
      type: '2d',
      width: 2048,
      height: 1024,
      mipLevelCount: getMipmapCount(2048, 1024, 1),
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    })
  }
  public override update(time: number, dt: number): void {
    const view = this.game.scene.getView(0).camera
    const cam = mat4GetTranslation(view.world)

    let sky: TimeOfDayComponent = null
    for (const entity of this.todQuery) {
      const it = entity.component(TimeOfDayComponent)
      if (it.isPointInside(cam)) {
        this.timeOfDay.scheduleAdd(it.preset, it.config.priority, it.config.blendTime)
        // POIs without a skybox keep the sky of a lower priority POI (assumption, not verified against the game)
        if (it.config.sky && (!sky || (it.config.priority ?? 0) > (sky.config.priority ?? 0))) {
          sky = it
        }
      } else {
        this.timeOfDay.scheduleRemove(it.preset)
      }
    }
    this.activeSky = sky?.config.sky ?? null

    this.timeOfDay.update(time, dt, view)
  }

  public override render(time: number, dt: number): void {
    // intentionally rendered each frame
    // TODO: review whether we should optimize this
    if (this.fxSky.isValid) {
      // the sky scatters the actual sun, also at night when the sun light is the moon (sunPosOrig in TimeOfDay.cpp)
      const skySun = this.timeOfDay.skySunDirection
      let latitude = Math.acos(-skySun.z)
      let longitude = Math.atan2(-skySun.y, -skySun.x)

      this.fxSky.textureOut = this.skyDomeTexture
      this.fxSky.sunLatitude = latitude
      this.fxSky.sunLongitude = longitude
      this.fxSky.mieScattering = this.timeOfDay.skyKM
      this.fxSky.rayleighScattering = this.timeOfDay.skyKR
      this.fxSky.phaseAsymmetry = this.timeOfDay.skyG
      this.fxSky.waveLength.x = this.timeOfDay.skyWaveR
      this.fxSky.waveLength.y = this.timeOfDay.skyWaveG
      this.fxSky.waveLength.z = this.timeOfDay.skyWaveB
      this.fxSky.sunIntensity.x = this.timeOfDay.skySunIntensity.x
      this.fxSky.sunIntensity.y = this.timeOfDay.skySunIntensity.y
      this.fxSky.sunIntensity.z = this.timeOfDay.skySunIntensity.z
      this.fxSky.nightSkyColorBase = this.timeOfDay.nightSkyHorizonColor
      this.fxSky.nightSkyColorDelta = this.timeOfDay.nightSkyColorDelta
      this.fxSky.nightSkyColorShift = this.timeOfDay.nightSkyZenithColorShift
      this.fxSky.groundColor = this.timeOfDay.fogColor

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
    scaledBottomFogColor.x = tod.fogColor.x * tod.fogMultiplier
    scaledBottomFogColor.y = tod.fogColor.y * tod.fogMultiplier
    scaledBottomFogColor.z = tod.fogColor.z * tod.fogMultiplier
    inputs.set(InputSlots.Global.BottomFogColor, scaledBottomFogColor)

    const scaledTopFogColor = inputs.get(InputSlots.Global.TopFogColor) || vec3()
    scaledTopFogColor.x = tod.fogTopColor.x * tod.fogTopMultiplier
    scaledTopFogColor.y = tod.fogTopColor.y * tod.fogTopMultiplier
    scaledTopFogColor.z = tod.fogTopColor.z * tod.fogTopMultiplier
    inputs.set(InputSlots.Global.TopFogColor, scaledTopFogColor)

    inputs.set(InputSlots.Global.TopFogDensity, tod.fogTopDensity)
    inputs.set(InputSlots.Global.BottomFogDensity, tod.fogDensity)
    inputs.set(InputSlots.Global.TopFogHeight, tod.fogTopHeight)
    inputs.set(InputSlots.Global.BottomFogHeight, tod.fogHeight)
    inputs.set(InputSlots.Global.FogHeightOffset, tod.fogHeightOffset)

    inputs.set(InputSlots.Global.CloudShadingSunColor, tod.cloudshadingCustomSunColor)
    inputs.set(InputSlots.Global.CloudShadingSkyColor, tod.cloudshadingCustomSkyColor)

    inputs.set(InputSlots.SunShafts.Params, tod.sunShaftsParams)
    inputs.set(InputSlots.SunShafts.Color, tod.sunShaftsColor)

    inputs.set(InputSlots.Global.VolumetricFogParams, tod.fogParams)
    inputs.set(InputSlots.Global.VolumetricFogRampParams, tod.fogRampParams)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientParams, tod.fogColGradParams)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientBase, tod.fogColGradBase)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientDelta, tod.fogColGradDelta)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientRadial, tod.fogColGradRadial)

    inputs.set(InputSlots.Global.EnvMap, this.fxIbl.envMapGGX)

    // see Ocean.cpp, ocean fog color is tinted by the sun, density is converted to log2 base
    const oceanFog = inputs.get(InputSlots.Global.OceanFogColorDensity) || vec4(0)
    oceanFog.x = tod.sunColor.x * tod.oceanFogColor.x
    oceanFog.y = tod.sunColor.y * tod.oceanFogColor.y
    oceanFog.z = tod.sunColor.z * tod.oceanFogColor.z
    oceanFog.w = tod.oceanFogDensity * Math.LOG2E
    inputs.set(InputSlots.Global.OceanFogColorDensity, oceanFog)

    // volumetric fog 2 (sGetVolumetricFog* in D3DHWShader.cpp)
    // the scattering color is the sun color times the atmosphere fog albedo, also used by APPLY_FOG_COLOR
    inputs.set(InputSlots.Global.FogScatteringColor, tod.volFog2ScatteringColor)
    inputs.set(InputSlots.Global.FogScatteringSecondaryColor, tod.volFog2ScatteringSecondaryColor)
    inputs.set(InputSlots.Global.VolFog2HeightDensity, tod.volFog2HeightDensity)
    inputs.set(InputSlots.Global.VolFog2Ramp, tod.volFog2Ramp)
    inputs.set(InputSlots.Global.VolFog2Scattering, tod.volFog2Scattering)
    inputs.set(InputSlots.Global.VolFog2Blend, tod.volFog2Blend)
    inputs.set(InputSlots.Global.VolFog2Zenith, tod.volFog2Zenith)
    // no environment probes: the fog color of the time of day stands in for the probe in-scattering
    inputs.set(InputSlots.Global.VolFog2Ambient, tod.fogColGradBase)
    inputs.set(InputSlots.Global.VolFog2Enabled, ENABLE_VOLUMETRIC_FOG_2 ? 1 : 0)
  }

  public destroy(): void {
    this.fxIbl.dispose()
    this.fxSky.dispose()
    this.skyDomeTexture.dispose()
  }
}
