import { IVec3 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import {
  AcquireTextureOptions,
  inputSlotMat3,
  inputSlotMat4,
  inputSlotSampler,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec2,
  inputSlotVec3,
  inputSlotVec4,
  InputValueType,
  Texture,
  TextureOptions,
} from '../resources'

export type TextureAsset = TextureOptions | AcquireTextureOptions

export type RenderVariant = Brand<string, 'RenderVariant'>

export const RenderVariant = {
  Depth: brand<RenderVariant>('depth'),
  Forward: brand<RenderVariant>('forward'),
}

export const TRUE = 1
export const FALSE = 0

export type MaterialProperties = Record<string, InputValueType | TextureAsset>

const Global = 'global'
const Frame = 'frame'
const View = 'view'
const Object = 'object'
const Material = 'material'
const Settings = 'settings'
export const CommonBlocks = {
  Global,
  Frame,
  View,
  Object,
  Material,
  Settings,
} as const

export const CommonInputs = {
  Global: {
    AmbientColor: inputSlotVec3(Global, 'ambientColor'),
    FogColor: inputSlotVec3(Global, 'fogColor'),
    FogDensity: inputSlotScalar(Global, 'fogDensity'),
    FogNear: inputSlotScalar(Global, 'fogNear'),
    FogFar: inputSlotScalar(Global, 'fogFar'),
    IrradianceMap: inputSlotTexture(Global, 'irradianceMap'),
  },

  Frame: {
    /**
     * @binding frame.index
     */
    FrameIndex: inputSlotScalar(Frame, 'index'),
    /**
     * @binding frame.elapsedTime
     */
    FrameElapsedTime: inputSlotScalar(Frame, 'elapsedTime'),
    /**
     * @binding frame.deltaTime
     */
    FrameDeltaTime: inputSlotScalar(Frame, 'deltaTime'),
    /**
     * @binding frame.randomSeed
     */
    FrameRandomSeed: inputSlotScalar(Frame, 'randomSeed'),
  },

  View: {
    ViewMatrix: inputSlotMat4(View, 'viewMatrix'),
    InverseViewMatrix: inputSlotMat4(View, 'inverseViewMatrix'),
    ProjectionMatrix: inputSlotMat4(View, 'projectionMatrix'),
    InverseProjectionMatrix: inputSlotMat4(View, 'inverseProjectionMatrix'),
    ViewProjectionMatrix: inputSlotMat4(View, 'viewProjectionMatrix'),
    InverseViewProjectionMatrix: inputSlotMat4(View, 'inverseViewProjectionMatrix'),
    CameraPosition: inputSlotVec3(View, 'cameraPosition'),
    CameraDirection: inputSlotVec3(View, 'cameraDirection'),
    ViewportSize: inputSlotVec2(View, 'viewportSize'),
    ViewportInverseSize: inputSlotVec2(View, 'viewportInverseSize'),
    Near: inputSlotScalar(View, 'near'),
    Far: inputSlotScalar(View, 'far'),
  },

  Object: {
    ModelMatrix: inputSlotMat4(Object, 'modelMatrix'),
    NormalMatrix: inputSlotMat3(Object, 'normalMatrix'),
    PreviousModelMatrix: inputSlotMat4(Object, 'previousModelMatrix'),
    ObjectId: inputSlotScalar(Object, 'objectId'),
    ReceivesShadows: inputSlotScalar(Object, 'receivesShadows'),
  },

  Material: {
    BaseColor: inputSlotVec4(Material, 'baseColor'),
    Roughness: inputSlotScalar(Material, 'roughness'),
    Metallic: inputSlotScalar(Material, 'metallic'),
    Emissive: inputSlotVec3(Material, 'emissive'),
    Opacity: inputSlotScalar(Material, 'opacity'),
    AlphaCutoff: inputSlotScalar(Material, 'alphaCutoff'),
    BaseColorMap: inputSlotTexture(Material, 'baseColorMap'),
    NormalMap: inputSlotTexture(Material, 'normalMap'),
    MetallicRoughnessMap: inputSlotTexture(Material, 'metallicRoughnessMap'),
    EmissiveMap: inputSlotTexture(Material, 'emissiveMap'),
    DefaultSampler: inputSlotSampler(Material, 'defaultSampler'),
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
