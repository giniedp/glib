import { IVec3 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import { AcquireTextureOptions, Texture, TextureOptions, ProgramInputValue } from '../resources'

export type TextureAsset = TextureOptions | AcquireTextureOptions

export type RenderVariant = Brand<string, 'RenderVariant'>

export const RenderVariant = {
  Depth: brand<RenderVariant>('depth'),
  Forward: brand<RenderVariant>('forward'),
}

export const TRUE = 1
export const FALSE = 0

export type MaterialProperties = Record<string, ProgramInputValue | TextureAsset>

export const CommonBindingKeys = {
  Object: {
    ModelMatrix: 'object.modelMatrix' as const,
    NormalMatrix: 'object.normalMatrix' as const,
    PreviousModelMatrix: 'object.previousModelMatrix' as const,
  },
  View: {
    ViewMatrix: 'view.viewMatrix' as const,
    InverseViewMatrix: 'view.inverseViewMatrix' as const,

    ProjectionMatrix: 'view.projectionMatrix' as const,
    InverseProjectionMatrix: 'view.inverseProjectionMatrix' as const,

    ViewProjectionMatrix: 'view.viewProjectionMatrix' as const,
    InverseViewProjectionMatrix: 'view.inverseViewProjectionMatrix' as const,

    CameraPosition: 'view.cameraPosition' as const,
    CameraDirection: 'view.cameraDirection' as const,

    ViewportSize: 'view.viewportSize' as const,
    ViewportInverseSize: 'view.viewportInverseSize' as const,

    Jitter: 'view.jitter' as const,
    Near: 'view.near' as const,
    Far: 'view.far' as const,
  },

  Frame: {
    Index: 'frame.index' as const,
    ElapsedTime: 'frame.elapsedTime' as const,
    DeltaTime: 'frame.deltaTime' as const,
  },
}

export interface CommonMaterialProps {
  AmbientColor?: IVec3 | number[]
  BaseColor?: IVec3 | number[]
  SpecularColor?: IVec3 | number[]
  SpecularFactor?: number
  EmissiveColor?: IVec3 | number[]
  EmissiveFactor?: number
  Metallic?: number
  Roughness?: number
  Opacity?: number
  IOR?: number
  AlphaClip?: number

  NormalMap?: Texture | AcquireTextureOptions | TextureOptions
  BaseColorMap?: Texture | AcquireTextureOptions | TextureOptions
  SpecularColorMap?: Texture | AcquireTextureOptions | TextureOptions
  OcclusionMap?: Texture | AcquireTextureOptions | TextureOptions
  OpacityMap?: Texture | AcquireTextureOptions | TextureOptions
  EmissiveMap?: Texture | AcquireTextureOptions | TextureOptions
  EnvironmentMap?: Texture | AcquireTextureOptions | TextureOptions
  DisplacementMap?: Texture | AcquireTextureOptions | TextureOptions
  SmoothnessMap?: Texture | AcquireTextureOptions | TextureOptions
}

export type IndexedInputs<M extends Record<string, any>, N extends number> = {
  [P in keyof M & string as `${P}[${N}]`]: M[P]
}

export type InputBlock<Base extends string, M extends Record<string, any>> = {
  [P in keyof M & string as `${Base}.${P}`]: M[P]
}
