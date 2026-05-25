// https://www.cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/35259544
// https://github.com/aws/lumberyard/blob/413ecaf24d7a534801cac64f50272fe3191d278f/dev/Code/CryEngine/RenderDll/Common/Shaders/ShaderCore.cpp#L2692
//
// rotateType
// 0 => no change
//   Rotator is deactivated.
// 1 => fixed
//   Static rotation with no animation. Similar to the rotation function of the tiling menu.
// 2 => constant
//   Rotation is constant, rotating/shifting in one direction and back
// 3 => oscilated
//   Rotation oscillates from the minimum, to the maximum, and back:
//
// oscillatorType
// 0 => no change
//   Oscillator is deactivated.
// 1 => fixed
//   Fixed moving is a static oscillation with no animation.
// 2 => constant
//   Texture shifts endlessly in the adjusted direction:
// 3 => jitter
//   Texture shifts endlessly in the adjusted direction with jittering added. Has a stroboscope effect:
// 4 => pan
//   exture shifts in the adjusted direction until the maximum amplitude is reached and back until the minimum amplitude is reached. Comparable to a pendulum movement:
// 5 => stretch moving
//   Similar to pan moving, but different in that the texture is stretched and not shifted to the adjusted direction until the maximum amplitude is reached and back until the minimum amplitude is reached:
// 6 => stretch repeat
//   Similar to stretch moving with the difference that the texture stretching restarts at 0 when the maximum amplitude is reached:
//
// Rate - Defines the number of complete rotation cycles per unit of time. Or in the case of oscillating rotation, defines the rate of change of direction.
// Phase - The phase of an oscillation or wave is the fraction of a complete cycle corresponding to an offset in the displacement from a specified reference point in time t = 0.
// Amplitude - Defines the maximum value of an oscillation/wave.
// CenterU and CenterV - Centers the texture on the model in U and V direction separately.

import { Mat4 } from '@gglib/math'
import { brand, type Brand } from '@gglib/utils'

export type RotateType = Brand<number, 'RotateType'>
export const RotateType = {
  Disabled: brand<RotateType>(0),
  Fixed: brand<RotateType>(1),
  Constant: brand<RotateType>(2),
  Oscilated: brand<RotateType>(3),
}

export type OscillatorType = Brand<number, 'OscillatorType'>
export const OscillatorType = {
  Disabled: brand<OscillatorType>(0),
  Fixed: brand<OscillatorType>(1),
  Constant: brand<OscillatorType>(2),
  Jitter: brand<OscillatorType>(3),
  Pan: brand<OscillatorType>(4),
  Stretch: brand<OscillatorType>(5),
  StretchRepeat: brand<OscillatorType>(6),
}

export type TexGenType = Brand<number, 'TexGenType'>
export const TexGenType = {
  Stream: brand<TexGenType>(0),
  World: brand<TexGenType>(1),
  Camera: brand<TexGenType>(2),
}

export type TexMod = {
  OffsetU?: number
  OffsetV?: number
  RotateU?: number
  RotateV?: number
  RotateW?: number
  TexMod_bTexGenProjected?: number
  TexMod_RotateType?: number
  TexMod_TexGenType?: number
  TexMod_UOscillatorAmplitude?: number
  TexMod_UOscillatorPhase?: number
  TexMod_UOscillatorRate?: number
  TexMod_UOscillatorType?: number
  TexMod_URotateAmplitude?: number
  TexMod_URotateCenter?: number
  TexMod_URotatePhase?: number
  TexMod_URotateRate?: number
  TexMod_VOscillatorAmplitude?: number
  TexMod_VOscillatorPhase?: number
  TexMod_VOscillatorRate?: number
  TexMod_VOscillatorType?: number
  TexMod_VRotateAmplitude?: number
  TexMod_VRotateCenter?: number
  TexMod_VRotatePhase?: number
  TexMod_VRotateRate?: number
  TexMod_WRotateAmplitude?: number
  TexMod_WRotatePhase?: number
  TexMod_WRotateRate?: number
  TileU?: number
  TileV?: number
}

const _m2 = new Mat4()

function hasMods(mod: TexMod): boolean {
  return !!mod.TexMod_UOscillatorType || !!mod.TexMod_VOscillatorType || !!mod.TexMod_RotateType
}

function hasValues(mod: TexMod): boolean {
  return !!(mod.OffsetU || mod.OffsetV || mod.TileU != 1 || mod.TileV != 1 || mod.RotateU || mod.RotateV || mod.RotateW)
}

export class TextureModifier {
  public static isModified(mod: TexMod): boolean {
    return (!!mod && hasMods(mod)) || hasValues(mod)
  }

  private jitterU: number = Math.random()
  private jitterV: number = Math.random()
  private jitterTimeU: number = 0
  private jitterTimeV: number = 0

  private mat: Mat4 = Mat4.createIdentity()
  private mod: TexMod

  public isAnimated: boolean

  private hasMods: boolean
  private hasValues: boolean

  public constructor(mod: TexMod) {
    this.mod = mod
    if (!mod) {
      throw new Error('TexMod is required')
    }

    this.hasMods = hasMods(mod)
    this.hasValues = hasValues(mod)
    this.isAnimated = this.hasMods
  }

  public get matrix(): Mat4 {
    return this.mat
  }

  public update(time: number): void {
    const mod = this.mod

    const hasMods = this.hasMods
    const hasValues = this.hasValues
    const isModified = hasMods || hasValues

    if (!isModified) {
      return
    }

    const m = this.mat.initIdentity()
    const tmp = _m2.initIdentity()
    const seconds = time / 1000

    this.applyRotation(m, tmp, time)
    this.applyOscillatorU(m, seconds)
    this.applyOscillatorV(m, seconds)

    if (hasValues) {
      if (mod.RotateU) {
        m.premultiply(tmp.initRotationX(mod.RotateU))
      }
      if (mod.RotateV) {
        m.premultiply(tmp.initRotationY(mod.RotateV))
      }
      if (mod.RotateW) {
        m.premultiply(tmp.initRotationZ(mod.RotateW))
      }

      tmp.initIdentity()
      tmp.elements[0] = mod.TileU ?? 1
      tmp.elements[5] = mod.TileV ?? 1
      tmp.elements[12] = mod.OffsetU || 0
      tmp.elements[13] = mod.OffsetV || 0
      m.premultiply(tmp)
    }
  }

  private applyRotation(m: Mat4, tmp: Mat4, time: number): void {
    const mod = this.mod
    const centerU = mod.TexMod_URotateCenter || 0
    const centerV = mod.TexMod_VRotateCenter || 0

    switch (mod.TexMod_RotateType) {
      case RotateType.Disabled:
        break

      case RotateType.Fixed:
        m.initIdentity().setTranslationXYZ(-centerU, -centerV, 0)
        if (mod.TexMod_URotateAmplitude) {
          m.premultiply(tmp.initRotationX(mod.TexMod_URotateAmplitude))
        }
        if (mod.TexMod_VRotateAmplitude) {
          m.premultiply(tmp.initRotationY(mod.TexMod_VRotateAmplitude))
        }
        if (mod.TexMod_WRotateAmplitude) {
          m.premultiply(tmp.initRotationZ(mod.TexMod_WRotateAmplitude))
        }
        m.premultiply(tmp.initIdentity().setTranslationXYZ(centerU, centerV, 0))
        break

      case RotateType.Constant:
        const fxAmp = ((mod.TexMod_URotateAmplitude || 0) * time * Math.PI) / 180 + (mod.TexMod_URotatePhase || 0)
        const fyAmp = ((mod.TexMod_VRotateAmplitude || 0) * time * Math.PI) / 180 + (mod.TexMod_VRotatePhase || 0)
        const fzAmp = ((mod.TexMod_WRotateAmplitude || 0) * time * Math.PI) / 180 + (mod.TexMod_WRotatePhase || 0)
        m.initIdentity().setTranslationXYZ(-centerU, -centerV, 0)
        if (fxAmp) {
          m.premultiply(tmp.initRotationX(fxAmp).transpose())
        }
        if (fyAmp) {
          m.premultiply(tmp.initRotationY(fyAmp).transpose())
        }
        if (fzAmp) {
          m.premultiply(tmp.initRotationZ(fzAmp).transpose())
        }
        m.premultiply(tmp.initIdentity().setTranslationXYZ(centerU, centerV, 0))
        break

      case RotateType.Oscilated:
        m.initIdentity().setTranslationXYZ(-centerU, -centerV, 0)
        const sx = time * (mod.TexMod_UOscillatorRate || 0)
        const sy = time * (mod.TexMod_VOscillatorRate || 0)
        const dx =
          (mod.TexMod_URotateAmplitude || 0) * Math.sin(2 * Math.PI * (sx - Math.floor(sx))) +
          (mod.TexMod_URotatePhase || 0)
        const dy =
          (mod.TexMod_VRotateAmplitude || 0) * Math.sin(2 * Math.PI * (sy - Math.floor(sy))) +
          (mod.TexMod_VRotatePhase || 0)
        const dz = mod.TexMod_WRotateAmplitude || 0 // sz was always 0
        if (dx) {
          m.premultiply(tmp.initRotationX(dx))
        }
        if (dy) {
          m.premultiply(tmp.initRotationY(dy))
        }
        if (dz) {
          m.premultiply(tmp.initRotationZ(dz))
        }
        m.premultiply(tmp.initIdentity().setTranslationXYZ(centerU, centerV, 0))
        break
    }
  }

  private applyOscillatorU(m: Mat4, seconds: number): void {
    const mod = this.mod
    const rate = mod.TexMod_UOscillatorRate || 0
    const t = rate * seconds
    const amp = mod.TexMod_UOscillatorAmplitude || 0
    const phase = mod.TexMod_UOscillatorPhase || 0

    let value = m.elements[12]

    switch (mod.TexMod_UOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        value = rate
        break
      case OscillatorType.Constant:
        value = t * amp
        break
      case OscillatorType.Pan:
        value = amp * Math.sin(2 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.Stretch:
        value = 1 + amp * Math.sin(2 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.StretchRepeat:
        value = 1 + amp * Math.sin(0.5 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.Jitter:
        if (this.jitterTimeU < 1 || this.jitterTimeU > t + 1) {
          this.jitterTimeU = phase + Math.floor(t)
        }
        if (this.jitterTimeU > 1) {
          this.jitterU = Math.random() * amp
          this.jitterTimeU = phase + Math.floor(t)
        }
        value = this.jitterU
        break
    }

    m.elements[12] = value
  }

  private applyOscillatorV(m: Mat4, seconds: number): void {
    const mod = this.mod
    const rate = mod.TexMod_VOscillatorRate || 0
    const t = rate * seconds
    const amp = mod.TexMod_VOscillatorAmplitude || 0
    const phase = mod.TexMod_VOscillatorPhase || 0

    let value = m.elements[13]

    switch (mod.TexMod_VOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        value = rate
        break
      case OscillatorType.Constant:
        value = t * amp
        break
      case OscillatorType.Pan:
        value = amp * Math.sin(2 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.Stretch:
        value = 1 + amp * Math.sin(2 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.StretchRepeat:
        value = 1 + amp * Math.sin(0.5 * Math.PI * (t - Math.floor(t))) + 2 * Math.PI * phase
        break
      case OscillatorType.Jitter:
        if (this.jitterTimeV < 1 || this.jitterTimeV > t + 1) {
          this.jitterTimeV = phase + Math.floor(t)
        }
        if (this.jitterTimeV > 1) {
          this.jitterV = Math.random() * amp
          this.jitterTimeV = phase + Math.floor(t)
        }
        value = this.jitterV
        break
    }

    m.elements[13] = value
  }
}
