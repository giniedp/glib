import type { MaterialProperties } from '@gglib/graphics'
import { Vec3, vec4, Vec4, type IVec3, type IVec4 } from '@gglib/math'
import { lfmt } from '@gglib/utils'
import type { NwMaterialProps } from './GltfExtension'
import { getShaderFlags } from './common'

export function paramVec4(value: number[] | string, fallback: IVec4 = Vec4.Zero): IVec4 {
  if (typeof value === 'string') {
    value = value.split(',').map(Number)
  }
  return {
    x: value?.[0] ?? fallback?.x ?? 0,
    y: value?.[1] ?? fallback?.y ?? 0,
    z: value?.[2] ?? fallback?.z ?? 0,
    w: value?.[3] ?? fallback?.w ?? 0,
  }
}

export function paramVec3(value: number[] | string, fallback: IVec3 = Vec3.Zero): IVec3 {
  if (typeof value === 'string') {
    value = value.split(',').map(Number)
  }
  return {
    x: value?.[0] ?? fallback?.x ?? 0,
    y: value?.[1] ?? fallback?.y ?? 0,
    z: value?.[2] ?? fallback?.z ?? 0,
  }
}

export function paramValue(value: number | string, fallback: number = 0): number {
  if (value == null || value == '') {
    return fallback
  }
  if (typeof value === 'number') {
    return value
  }
  value = parseFloat(value)
  if (isNaN(value) || !isFinite(value)) {
    console.warn(`${value} could not be parsed into a number`)
    value = fallback
  }
  return value
}

export class MtlUtil {
  public knownMaps = new Set<string>()
  public knownMods = new Set<string>()
  public knownFlags = new Set<string>()
  public knowsDeform = false

  public name: string
  private log = lfmt.badge('#B07AA1', 'Illum')

  public constructor(
    name: string,
    options?: {
      knownMaps: string[]
      knownMods: string[]
      knownFlags: string[]
      knowsDeform?: boolean
    },
  ) {
    this.name = name
    this.log = lfmt.badge('#B07AA1', `🎨 ${name}`)
    this.addMaps(options?.knownMaps || [])
    this.addMods(options?.knownMods || [])
    this.addFlags(options?.knownFlags || [])
    this.knowsDeform = !!options?.knowsDeform
  }

  public addMaps(names: string[]) {
    for (const it of names) {
      this.knownMaps.add(it)
    }
  }

  public addMods(names: string[]) {
    for (const it of names) {
      this.knownMods.add(it)
    }
  }

  public addFlags(names: string[]) {
    for (const it of names) {
      this.knownFlags.add(it)
    }
  }

  public resolve<T>(properites: MaterialProperties) {
    const props = properites as NwMaterialProps
    const attrs = props?.attrs || {}
    const params = (props?.params || {}) as unknown as T
    const texMaps = props?.textures || {}
    const texMods = props?.mods || {}
    const shaderFlags = getShaderFlags(attrs?.StringGenMask)
    const deform = props.vertexDeform
    const deformWave0 = vec4(0)
    const deformWave1 = vec4(0)
    if (deform?.WaveX?.Type) {
      const w = deform?.WaveX
      // deformWave0 : vec4f, // .x = Frequency .y = Phase .z = Amplitude .w = Level
      // deformWave1 : vec4f, // .x = 1.0 / DividerX
      Vec4.init(deformWave0, w.Freq, w.Phase, w.Amp, w.Level)
      Vec4.init(deformWave1, 1 / deform.DividerX, 1 / deform.DividerY, 0, w.Type)
    }

    for (const mapName in texMaps) {
      if (this.knownMaps.has(mapName)) {
        continue
      }
      this.knownMaps.add(mapName)
      console.warn(...this.log, `Unsupported map "${mapName}"`)
    }

    for (const modName in texMods) {
      if (this.knownMaps.has(modName)) {
        continue
      }
      this.knownMods.add(modName)
      console.warn(...this.log, `Unsupported modifier "${modName}"`)
    }

    for (const feature of shaderFlags) {
      if (!feature || this.knownFlags.has(feature)) {
        continue
      }
      this.knownFlags.add(feature)
      console.warn(...this.log, `Unsupported feature "${feature}"`)
    }

    if (deform?.Type && !this.knowsDeform) {
      this.knowsDeform = true
      console.warn(...this.log, 'Deform not supported', deform)
    }

    if (texMods?.Diffuse?.TexMod_TexGenType) {
      console.info(...this.log, 'TexMod_TexGenType', texMods?.Diffuse)
    }

    return {
      props,
      attrs,
      params,
      texMaps,
      texMods,
      shaderFlags,
      deformWave0,
      deformWave1,
    }
  }
}
