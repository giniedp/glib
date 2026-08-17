import { Mat4, vec3 } from '@gglib/math'
import { brand, Brand } from '@gglib/utils'
import {
  AcquireTextureOptions,
  inputSlotMat3,
  inputSlotMat4,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec2,
  inputSlotVec3,
  InputValueType,
  Texture,
  TextureOptions,
} from '../resources'
import { SamplerState } from '../states'

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

export const CommonBlocks = {
  Global,
  Frame,
  View,

  Object,
  Material,
} as const

export const CommonInputs = {
  /**
   * Inputs that are commonly set once per frame or globally
   */
  Global: {
    /** Ambient color term */
    AmbientColor: inputSlotVec3(Global, 'ambientColor'),
    /** Second ambiend color term for sky or gradient color */
    AmbientColorTop: inputSlotVec3(Global, 'ambientColorTop'),
    /** Direction of the ambient gradient, usually UP for sky */
    AmbientDirection: inputSlotVec3(Global, 'ambientDirection'),

    FogColor: inputSlotVec3(Global, 'fogColor'),
    FogDensity: inputSlotScalar(Global, 'fogDensity'),
    FogNear: inputSlotScalar(Global, 'fogNear'),
    FogFar: inputSlotScalar(Global, 'fogFar'),
    IrradianceMap: inputSlotTexture(Global, 'irradianceMap'),
  },

  /**
   * Inputs that are commonly set once per frame
   */
  Frame: {
    /**
     * @binding `frame.index`
     */
    FrameIndex: inputSlotScalar(Frame, 'index'),
    /**
     * @binding `frame.elapsedTime`
     */
    ElapsedTime: inputSlotScalar(Frame, 'elapsedTime'),
    /**
     * @binding `frame.deltaTime`
     */
    DeltaTime: inputSlotScalar(Frame, 'deltaTime'),
    /**
     * @binding `frame.randomSeed`
     */
    RandomSeed: inputSlotScalar(Frame, 'randomSeed'),
  },

  /**
   * Inputs that are commonly set once per render view
   */
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
    SceneColorMap: inputSlotTexture(View, 'sceneColorMap'),
    SceneDepthMap: inputSlotTexture(View, 'sceneDepthMap'),
  },

  Object: {
    ModelMatrix: inputSlotMat4(Object, 'modelMatrix'),
    NormalMatrix: inputSlotMat3(Object, 'normalMatrix'),
    PreviousModelMatrix: inputSlotMat4(Object, 'previousModelMatrix'),
    ObjectId: inputSlotScalar(Object, 'objectId'),
    ReceivesShadows: inputSlotScalar(Object, 'receivesShadows'),
  },
}

export interface CommonMaterialProps {
  AmbientColor?: number[]
  BaseColor?: number[]
  SpecularColor?: number[]
  SpecularWeight?: number
  EmissiveColor?: number[]
  EmissiveStrength?: number
  Metallic?: number
  Roughness?: number
  Opacity?: number
  IOR?: number
  AlphaClip?: number
  AlphaBlend?: boolean
  DoubleSided?: boolean

  BaseMap?: Texture | AcquireTextureOptions | TextureOptions
  BaseMapSampler?: SamplerState
  BaseMapUv?: CommonUvInfo

  NormalMap?: Texture | AcquireTextureOptions | TextureOptions
  NormalMapSampler?: SamplerState
  NormalMapUv?: CommonUvInfo

  SpecularMap?: Texture | AcquireTextureOptions | TextureOptions
  SpecularMapSampler?: SamplerState
  SpecularMapUv?: CommonUvInfo

  OcclusionMap?: Texture | AcquireTextureOptions | TextureOptions
  OcclusionMapSampler?: SamplerState
  OcclusionMapUv?: CommonUvInfo

  OpacityMap?: Texture | AcquireTextureOptions | TextureOptions
  OpacityMapSampler?: SamplerState
  OpacityMapUv?: CommonUvInfo

  EmissiveMap?: Texture | AcquireTextureOptions | TextureOptions
  EmissiveMapSampler?: SamplerState
  EmissiveMapUv?: CommonUvInfo

  EnvironmentMap?: Texture | AcquireTextureOptions | TextureOptions
  EnvironmentMapSampler?: SamplerState
  EnvironmentMapUv?: CommonUvInfo

  DisplacementMap?: Texture | AcquireTextureOptions | TextureOptions
  DisplacementMapSampler?: SamplerState
  DisplacementMapUv?: CommonUvInfo

  SmoothnessMap?: Texture | AcquireTextureOptions | TextureOptions
  SmoothnessMapSampler?: SamplerState
  SmoothnessMapUv?: CommonUvInfo

  MetallicRoughnessMap?: Texture | AcquireTextureOptions | TextureOptions
  MetallicRoughnessMapSampler?: SamplerState
  MetallicRoughnessMapUv?: CommonUvInfo
}

export interface CommonUvInfo {
  /**
   * UV index. Default is 0
   */
  index?: number
  /**
   * UV offset. Default is [0, 0]
   */
  offset?: number[]
  /**
   * UV rotation. Default is 0
   */
  rotation?: number
  /**
   * UV scale, Default is [1, 1]
   */
  scale: number[]
}

export function uvInfoToMat4(info: CommonUvInfo): Mat4 {
  return Mat4.createTranslation(vec3(info.offset ?? [0, 0], 0))
    .multiply(Mat4.createRotationZ(-(info.rotation ?? 0)))
    .multiply(Mat4.createScale(vec3(info.scale ?? [1, 1], 1)))
}
