import type { Texture } from '@gglib/graphics'
import { clamp, lerp, Mat4, Vec2, vec3, Vec3, vec4, Vec4, type IVec3 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { removeItemUnordered } from '@gglib/utils'
import type { Lighting, TimeOfDay as TimeOfDayData } from '../../api'
import { TodParams, type TodParam } from './TimeOfDayParams'
import { TimeOfDayPreset } from './TimeOfDayPreset'

export type TimeOfDayLayer = {
  priority: number
  blendWeight: number
  blendTarget: number
  blendDuration: number
  preset: TimeOfDayPreset
}
const MAX_TIME = (24 * 60 - 1) / 60.0

export class TimeOfDay {
  public sunColor = vec3(1, 0.71085715, 0.5335781)
  public sunDirection = Vec3.normalize(vec3(-1, -1, -10))
  public sunMultiplier = 1.0
  public sunSpecularMultiplier = 1.0
  public sunIsMoon = false

  public cloudshadingCustomSkyColor = vec3(0)
  public cloudshadingCustomSunColor = vec3(0)
  public cloudshadingCustomColor = vec3(0)

  public skyKM = 0.0025
  public skyKR = 0.0025
  public skyG = 0.76
  public skyWaveR = 650
  public skyWaveG = 570
  public skyWaveB = 475

  public nightSkyHorizonColor = vec3()
  public nightSkyZenithColor = vec3()
  public nightSkyZenithColorShift = new Vec2()
  public nightSkyColorDelta = vec3()

  public nightSkyMoonColor = vec3()
  public nightSkyMoonInnerCorona = new Vec4()
  public nightSkyMoonOuterCorona = new Vec4()
  public moonDirection = Vec3.normalize(vec3(-1, -1, -10))

  public fogColor = vec3(0.21678638, 0.41612425, 0.79515541)
  public fogMultiplier = 0.97500086
  public fogHeight = 0
  public fogDensity = 0.050000004
  public fogTopColor = vec3(0.17437994, 0.42185885, 0.76625574)
  public fogTopMultiplier = 0.97500086
  public fogTopHeight = 400
  public fogTopDensity = 0.020000001
  public fogRadialColor = vec3(0.17437994, 0.42185885, 0.76625574)
  public fogRadialMultiplier = 0.97500086

  public fogParams = vec4(0)
  public fogRampParams = vec4(0)
  public fogColGradBase = vec4(0) // base color
  public fogColGradDelta = vec4(0) // base color - end color
  public fogColGradParams = vec4(0)
  public fogColGradRadial = vec4(0)

  public fogHeightOffset = 0.5

  public base: TimeOfDayPreset
  public poiLayers: TimeOfDayLayer[] = []
  public time: number = 12
  public timeStart: number = 0
  public timeEnd: number = 24
  public timeAnimSpeed: number = 0
  public sunRotationLatitude: number = 0
  public sunRotationLongitude: number = 90
  public moonRotationLatitude: number = 240
  public moonRotationLongitude: number = 45
  public moonSize: number = 1.0
  public moonTexture: Texture
  public animate: boolean = false
  public enablePoiLayers: boolean = true
  public dawnStart = 350.0 / 60.0
  public dawnEnd = 360.0 / 60.0
  public duskStart = 12.0 + 360.0 / 60.0
  public duskEnd = 12.0 + 370.0 / 60.0

  public constructor(base?: TimeOfDayPreset) {
    this.reset()
    if (base) {
      this.base = base
    }
  }

  public reset(data?: TimeOfDayData) {
    this.base = new TimeOfDayPreset(data)
    this.time = 12
    this.timeStart = 0
    this.timeEnd = 24
    this.timeAnimSpeed = 0
    if (data) {
      this.time = data.time
      this.timeStart = data.timeStart
      this.timeEnd = data.timeEnd
      this.timeAnimSpeed = data.timeAnimSpeed
    }
    this.sunRotationLatitude = 0
    this.sunRotationLongitude = 90
    this.dawnStart = 350.0 / 60.0
    this.dawnEnd = 360.0 / 60.0
    this.duskStart = 12.0 + 360.0 / 60.0
    this.duskEnd = 12.0 + 370.0 / 60.0
  }

  public setLighting(lighting: Lighting) {
    this.sunRotationLatitude = lighting.sunRotation
    this.sunRotationLongitude = lighting.longitude

    this.dawnStart = (lighting.dawnTime - lighting.dawnDuration * 0.5) / 60.0
    this.dawnEnd = (lighting.dawnTime + lighting.dawnDuration * 0.5) / 60.0
    this.duskStart = 12.0 + (lighting.duskTime - lighting.duskDuration * 0.5) / 60.0
    this.duskEnd = 12.0 + (lighting.duskTime + lighting.duskDuration * 0.5) / 60.0
    if (this.dawnEnd > this.duskStart) {
      this.duskEnd += this.dawnEnd - this.duskStart
      this.duskStart = this.dawnEnd
    }
  }

  private interpolate() {
    const t = this.time / MAX_TIME
    this.base.interpolate(t)
    for (const layer of this.poiLayers) {
      layer.preset.interpolate(t)
    }
  }

  public getParamValue(param: TodParam<number>): number {
    let value = this.base.variables[param.name].value
    if (!this.enablePoiLayers) {
      return value
    }
    for (const layer of this.poiLayers) {
      const lValue = layer.preset.variables[param.name].value
      if (layer.blendWeight > 0) {
        value = lerp(value, lValue, layer.blendWeight)
      }
    }
    value = clamp(value, param.min, param.max)
    return value
  }

  public getParamColor(param: TodParam<IVec3>, out: IVec3) {
    const base = this.base.variables[param.name].value
    out.x = base.x
    out.y = base.y
    out.z = base.z
    if (!this.enablePoiLayers) {
      return
    }
    for (const layer of this.poiLayers) {
      const value = layer.preset.variables[param.name].value
      if (layer.blendWeight > 0) {
        out.x = lerp(out.x, value.x, layer.blendWeight)
        out.y = lerp(out.y, value.y, layer.blendWeight)
        out.z = lerp(out.z, value.z, layer.blendWeight)
      }
    }
  }

  public scheduleAdd(preset: TimeOfDayPreset, priority: number, duration: number) {
    if (!this.poiLayers.find((it) => it.preset === preset)) {
      this.poiLayers.push({
        preset,
        priority,
        blendWeight: 0,
        blendTarget: 1,
        blendDuration: Math.max(duration ?? 1, 1),
      })
      this.poiLayers.sort(prioritySort)
    }
  }

  public scheduleRemove(preset: TimeOfDayPreset) {
    const layer = this.poiLayers.find((it) => it.preset === preset)
    if (layer) {
      layer.blendTarget = 0
    }
  }

  public update(time: number, dt: number, camera: CameraData) {
    this.removeLayers()
    this.updateWeights(dt)
    if (this.animate) {
      this.tickTime(dt)
    }
    this.interpolate()

    this.updateDayNight()
    this.updateMoonDirection()
    this.updateSunDirection()
    this.updateVariables(camera)
  }

  private toRemove: TimeOfDayLayer[] = []
  private removeLayers() {
    for (const it of this.poiLayers) {
      if (it.blendWeight <= 0.001 && it.blendTarget <= 0.001) {
        this.toRemove.push(it)
      }
    }
    for (const it of this.toRemove) {
      removeItemUnordered(this.poiLayers, it)
    }
    this.toRemove.length = 0
    this.poiLayers.sort(prioritySort)
  }

  private updateWeights(dt: number) {
    for (const it of this.poiLayers) {
      const rate = dt / it.blendDuration
      const delta = it.blendTarget - it.blendWeight
      const step = Math.sign(delta) * Math.min(Math.abs(delta), rate)
      it.blendWeight = clamp(it.blendWeight + step, 0, 1)
    }
  }

  private tickTime(dt: number) {
    let time = this.time + dt * this.timeAnimSpeed
    if (this.timeStart <= 0.05 && this.timeEnd >= 23.5) {
      if (time > this.timeEnd) {
        time = this.timeStart
      }
      if (time < this.timeStart) {
        time = this.timeEnd
      }
    } else if (Math.abs(this.timeStart - this.timeEnd) <= 0.05) {
      if (time > MAX_TIME) {
        time -= MAX_TIME
      } else if (time < 0.0) {
        time += MAX_TIME
      }
    } else {
      if (time > this.timeEnd) {
        time = this.timeEnd
      }
      if (time < this.timeStart) {
        time = this.timeStart
      }
    }
    this.time = time
  }

  private updateDayNight() {
    // The ratio between night and day for adjusting luminance.   Day = 1, Night = 0, transitions = [0..1]
    let midDayIndicator = 1
    // The ratio [0..1] relative to high noon which represents maximum luminance.
    let dayNightIndicator = 1
    let sunMultiplier = 1
    // let sunIntensityMultiplier = 1
    let sunIsMoon = false

    if (this.time < this.dawnStart || this.time >= this.duskEnd) {
      // night time
      midDayIndicator = 0
      dayNightIndicator = 0
      this.sunMultiplier = sunMultiplier
      this.sunIsMoon = true
      return
    }

    const noonTime = 12
    if (this.time <= noonTime) {
      const dawnToNoon = noonTime - this.dawnStart
      midDayIndicator = (this.time - this.dawnStart) / dawnToNoon
    } else {
      const noonToDusk = this.duskEnd - noonTime
      midDayIndicator = (this.time - noonTime) / noonToDusk
    }
    midDayIndicator = Math.cos(0.5 * midDayIndicator * Math.PI)

    if (this.time < this.dawnEnd) {
      const b = 0.5 * (this.dawnStart + this.dawnEnd)
      if (this.time < b) {
        // fade out moon
        sunMultiplier *= (b - this.time) / (b - this.dawnStart)
        sunIsMoon = true
      } else {
        // fade in sun
        sunMultiplier *= (this.time - b) / (this.dawnEnd - b)
      }
      dayNightIndicator = (this.time - this.dawnStart) / (this.dawnEnd - this.dawnStart)
    } else if (this.time < this.duskStart) {
      // day
      dayNightIndicator = 1
    } else if (this.time < this.duskEnd) {
      const b = 0.5 * (this.duskStart + this.duskEnd)

      if (this.time < b) {
        // fade out sun
        sunMultiplier *= (b - this.time) / (b - this.duskStart)
      } else {
        // fade in moon
        const t = (this.time - b) / (this.duskEnd - b)
        sunMultiplier *= (this.time - b) / (this.duskEnd - b)
        sunIsMoon = true
      }

      dayNightIndicator = (this.duskEnd - this.time) / (this.duskEnd - this.duskStart)
    }

    this.sunMultiplier = sunMultiplier
    this.sunIsMoon = sunIsMoon
  }

  private updateSunDirection() {
    const PI = Math.PI
    let timeAng = ((this.time + 12.0) / MAX_TIME) * PI * 2.0
    let sunRot = (PI * -this.sunRotationLatitude) / 180.0
    let longitude = 0.5 * PI - (PI * this.sunRotationLongitude) / 180.0

    const sunPos = this.sunDirection.init(0, 1, 0)
    Mat4.$0.initIdentity().rotateY(sunRot).rotateX(longitude).rotateZ(timeAng).transformV3Normal(sunPos, sunPos)

    const h = sunPos.z
    sunPos.z = sunPos.y
    sunPos.y = -h
    sunPos.negate()

    if (this.sunIsMoon) {
      Vec3.copy(this.moonDirection, this.sunDirection)
      this.sunDirection.negate()
    }
  }

  private updateMoonDirection() {
    const moonLati = -Math.PI + (Math.PI * this.moonRotationLatitude) / 180.0
    const moonLong = 0.5 * Math.PI - (Math.PI * this.moonRotationLongitude) / 180.0

    const sinLon = Math.sin(moonLong)
    const cosLon = Math.cos(moonLong)
    const sinLat = Math.sin(moonLati)
    const cosLat = Math.cos(moonLati)

    this.moonDirection.init(sinLon * cosLat, sinLon * sinLat, cosLon)
    if (this.sunIsMoon) {
      Vec3.copy(this.moonDirection, this.sunDirection)
      this.sunDirection.negate()
    }
  }

  private updateVariables(view: CameraData) {
    const sunIntensity = this.getParamValue(TodParams.SUN_INTENSITY) * this.sunMultiplier
    this.getParamColor(TodParams.SUN_COLOR, this.sunColor)
    convertIlluminanceToLightColor(this.sunColor, sunIntensity)
    this.sunSpecularMultiplier = this.getParamValue(TodParams.SUN_SPECULAR_MULTIPLIER)

    this.skyKM = this.getParamValue(TodParams.SKYLIGHT_KM) * 1e-4 // downscaling from ui friendly value
    this.skyKR = this.getParamValue(TodParams.SKYLIGHT_KR) * 1e-4 // downscaling from ui friendly value
    this.skyG = this.getParamValue(TodParams.SKYLIGHT_G)
    this.skyWaveR = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_R)
    this.skyWaveG = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_G)
    this.skyWaveB = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_B)

    {
      const scale = this.getParamValue(TodParams.NIGHSKY_HORIZON_COLOR_MULTIPLIER)
      this.getParamColor(TodParams.NIGHSKY_HORIZON_COLOR, this.nightSkyHorizonColor)
      this.nightSkyHorizonColor.x *= scale
      this.nightSkyHorizonColor.y *= scale
      this.nightSkyHorizonColor.z *= scale
    }

    {
      const scale = this.getParamValue(TodParams.NIGHSKY_ZENITH_COLOR_MULTIPLIER)
      this.getParamColor(TodParams.NIGHSKY_ZENITH_COLOR, this.nightSkyZenithColor)
      this.nightSkyZenithColor.x *= scale
      this.nightSkyZenithColor.y *= scale
      this.nightSkyZenithColor.z *= scale
    }

    this.nightSkyColorDelta.x = this.nightSkyHorizonColor.x - this.nightSkyZenithColor.x
    this.nightSkyColorDelta.y = this.nightSkyHorizonColor.y - this.nightSkyZenithColor.y
    this.nightSkyColorDelta.z = this.nightSkyHorizonColor.z - this.nightSkyZenithColor.z

    const nightSkyZenithColorShift = this.getParamValue(TodParams.NIGHSKY_ZENITH_SHIFT)
    const nightSkyZenithGradient = -0.1
    this.nightSkyZenithColorShift.x = 1 / (nightSkyZenithColorShift - nightSkyZenithGradient)
    this.nightSkyZenithColorShift.y = -nightSkyZenithGradient / (nightSkyZenithColorShift - nightSkyZenithGradient)

    this.getParamColor(TodParams.NIGHSKY_MOON_COLOR, this.nightSkyMoonColor)
    Vec3.multiplyScalar(
      this.nightSkyMoonColor,
      this.getParamValue(TodParams.NIGHSKY_MOON_COLOR_MULTIPLIER),
      this.nightSkyMoonColor,
    )

    this.getParamColor(TodParams.NIGHSKY_MOON_INNERCORONA_COLOR, this.nightSkyMoonInnerCorona)
    this.nightSkyMoonInnerCorona.w = 1.0 + 1000.0 * this.getParamValue(TodParams.NIGHSKY_MOON_INNERCORONA_SCALE)

    this.getParamColor(TodParams.NIGHSKY_MOON_OUTERCORONA_COLOR, this.nightSkyMoonOuterCorona)
    this.nightSkyMoonOuterCorona.w = 1.0 + 1000.0 * this.getParamValue(TodParams.NIGHSKY_MOON_OUTERCORONA_SCALE)

    this.getParamColor(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR, this.cloudshadingCustomColor)
    const csCustomSunColorMult = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_MULTIPLIER)
    Vec3.multiplyScalar(this.cloudshadingCustomColor, csCustomSunColorMult, this.cloudshadingCustomColor)

    const csSunlightMultiplier = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_MULTIPLIER)
    Vec3.multiplyScalar(this.sunColor, csSunlightMultiplier, this.cloudshadingCustomSunColor)

    const csCustomSunColorInfluence = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_INFLUENCE)
    Vec3.lerp(
      this.cloudshadingCustomSunColor,
      this.cloudshadingCustomColor,
      csCustomSunColorInfluence,
      this.cloudshadingCustomSunColor,
    )

    this.updateVolumetricFogParams(view)
    this.updateVolumetricFogRampParams()
    this.updateFogColorGradientConstants()
    this.updateFogColorGradientParams()
    this.updateFogColorGradientRadial(view)
  }

  private updateVolumetricFogParams(view: CameraData) {
    let globalDensity = this.getParamValue(TodParams.VOLFOG_GLOBAL_DENSITY)
    const finalDensityClamp = this.getParamValue(TodParams.VOLFOG_FINAL_DENSITY_CLAMP)

    const fogHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT)
    const fogDensity = clamp(this.getParamValue(TodParams.VOLFOG_DENSITY), 1e-5, 1.0)

    let fogHeight2 = this.getParamValue(TodParams.VOLFOG_HEIGHT2)
    const fogDensity2 = clamp(this.getParamValue(TodParams.VOLFOG_DENSITY2), 1e-5, 1.0)
    fogHeight2 = fogHeight2 < fogHeight + 1.0 ? fogHeight + 1.0 : fogHeight2

    const ha = fogHeight
    const hb = fogHeight2

    const da = fogDensity
    const db = fogDensity2

    const ga = Math.log(da)
    const gb = Math.log(db)

    const c = (gb - ga) / (hb - ha)
    const o = ga - c * ha

    const viewHeight = view.world.translationZ
    const co = clamp(c * viewHeight + o, -50.0, 50.0) // Avoiding FPEs at extreme ranges

    globalDensity *= 0.01 // multiply by 1/100 to scale value editor value back to a reasonable range

    this.fogParams.x = c
    this.fogParams.y = 1.44269502 * globalDensity * Math.exp(co) // log2(e) = 1.44269502
    this.fogParams.z = globalDensity
    this.fogParams.w = 1.0 - clamp(finalDensityClamp, 0.0, 1.0)
  }

  private updateVolumetricFogRampParams() {
    let rampStart = this.getParamValue(TodParams.VOLFOG_RAMP_START)
    let rampEnd = this.getParamValue(TodParams.VOLFOG_RAMP_END)
    let rampInfluence = this.getParamValue(TodParams.VOLFOG_RAMP_INFLUENCE)

    rampStart = rampStart < 0 ? 0 : rampStart // start
    rampEnd = rampEnd < rampStart + 0.1 ? rampStart + 0.1 : rampEnd // end
    rampInfluence = clamp(rampInfluence, 0.0, 1.0) // influence

    const invRampDist = 1.0 / (rampEnd - rampStart)
    this.fogRampParams.x = invRampDist
    this.fogRampParams.y = -rampStart * invRampDist
    this.fogRampParams.z = rampInfluence
    this.fogRampParams.w = -rampInfluence + 1.0
  }

  private updateFogColorGradientConstants() {
    this.getParamColor(TodParams.FOG_COLOR, this.fogColor)
    this.fogMultiplier = this.getParamValue(TodParams.FOG_COLOR_MULTIPLIER)

    this.getParamColor(TodParams.FOG_COLOR2, this.fogTopColor)
    this.fogTopMultiplier = this.getParamValue(TodParams.FOG_COLOR2_MULTIPLIER)

    this.fogColGradBase.x = this.fogColor.x * this.fogMultiplier
    this.fogColGradBase.y = this.fogColor.y * this.fogMultiplier
    this.fogColGradBase.z = this.fogColor.z * this.fogMultiplier

    this.fogColGradDelta.x = this.fogColGradBase.x - this.fogTopColor.x * this.fogTopMultiplier
    this.fogColGradDelta.y = this.fogColGradBase.y - this.fogTopColor.y * this.fogTopMultiplier
    this.fogColGradDelta.z = this.fogColGradBase.z - this.fogTopColor.z * this.fogTopMultiplier
  }

  private updateFogColorGradientParams() {
    const fogHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT)
    let fogTopHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT2)
    fogTopHeight = fogTopHeight < fogHeight + 1.0 ? fogHeight + 1.0 : fogTopHeight

    let colorHeightOffset = this.getParamValue(TodParams.VOLFOG_HEIGHT_OFFSET)
    let radialSize = this.getParamValue(TodParams.VOLFOG_RADIAL_SIZE)
    let radialLobe = this.getParamValue(TodParams.VOLFOG_RADIAL_LOBE)

    colorHeightOffset = clamp(colorHeightOffset, -1.0, 1.0)
    radialSize = -Math.exp((1.0 - clamp(radialSize, 0.0, 1.0)) * 14.0) * 1.44269502 // log2(e) = 1.44269502;
    radialLobe = 1.0 / clamp(radialLobe, 1.0 / 21.0, 1.0) - 1.0

    const invDist = 1.0 / (fogTopHeight - fogHeight)

    this.fogColGradParams.x = invDist
    this.fogColGradParams.y = -fogHeight * invDist - colorHeightOffset
    this.fogColGradParams.z = radialSize
    this.fogColGradParams.w = radialLobe
  }

  private updateFogColorGradientRadial(view: CameraData) {
    this.getParamColor(TodParams.FOG_RADIAL_COLOR, this.fogRadialColor)
    this.fogRadialMultiplier = this.getParamValue(TodParams.FOG_RADIAL_COLOR_MULTIPLIER)
    this.fogColGradRadial.x = this.fogRadialColor.x * this.fogRadialMultiplier
    this.fogColGradRadial.y = this.fogRadialColor.y * this.fogRadialMultiplier
    this.fogColGradRadial.z = this.fogRadialColor.z * this.fogRadialMultiplier
    this.fogColGradRadial.w = 1.0 / view.far
  }
}

function prioritySort(a: { priority: number }, b: { priority: number }) {
  return a.priority - b.priority
}

export function createTimeOfDay(): TimeOfDay {
  return new TimeOfDay()
}

const RENDERER_LIGHT_UNIT_SCALE = 10000.0
function convertIlluminanceToLightColor(colorRGB: IVec3, illuminance: number) {
  illuminance /= RENDERER_LIGHT_UNIT_SCALE

  const lum = colorRGB.x * 0.212671 + colorRGB.y * 0.71516 + colorRGB.z * 0.072169
  const scale = lum > 0 ? illuminance / lum : 1
  Vec3.multiplyScalar(colorRGB, scale, colorRGB)
  Vec3.multiplyScalar(colorRGB, 1 / Math.PI, colorRGB)
}
