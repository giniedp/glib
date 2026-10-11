import type { IVec2 } from '@gglib/math'

export interface LevelListEntry {
  name: string
  coatlicueNames: string[]
}

export interface CoatlicueListEntry {
  name: string
  level: string
  maps: GameModeMap[]
}

export interface LevelIndex {
  levels: LevelListEntry[]
  coatlicues: CoatlicueListEntry[]
}

// ---------------------------------------------------------------------------
// Coatlicue / world info
// ---------------------------------------------------------------------------

export interface LevelInfo {
  level: string
  name: string
  regionSize: number
  regionCellSize: number
  /** `streaming.regionChunksEnabled` from offlineoptions.json, the level streams region chunks */
  enableChunks: boolean
  enableVegetation: boolean
  enableDistribution: boolean
  mountainHeight: number
  mountainRoughness: number
  oceanLevel: number
  valleyIntensity: number
  tracts: unknown
  regions: RegionLocation[]
  gameModeMaps: GameModeMap[]
  mission: MissionInfo | null
  missionEntities: ViewerEntity[]
  /** slices/system/skyboxsystem, spawned by the game for every level. Holds the default TimeOfDay POI and its skybox */
  skyboxSystem: ViewerSlice | null
  /**
   * Territory master slice from tracts.json `territoryMasterSlicePath`, spawned by the game.
   * Its PrefabReferencer lists the territory, zone and POI bounds slices (Territory components).
   */
  territorySystem?: ViewerSlice | null
  /**
   * slices referenced by skyboxSystem and territorySystem, keyed by `${guid}_${subId}`
   */
  slices?: Record<string, ViewerSlice> | null
}

export interface GameModeMap {
  gameModeMapId: string
  gameModeId: string
  slicePath: string
  coatlicueName: string
  worldBounds: string[]
  teamTeleportData: string
  uiMapId: string
  sliceExclusionList: string[]
}

export interface RegionLocation {
  /**
   * Folder base name in the format "r_+xx_+yy" e.g. "r_+00_+00", "r_+00_+01"
   * The order is different from the location array
   */
  name: string
  /**
   * Grid tile location [X, Y], e.g. [0,0], [0,1], [0,1].
   * The order is different from the name
   */
  location: [number, number]
  playable: boolean
}

export interface MissionInfo {
  environment: EnvironmentInfo
  timeOfDay: TimeOfDay
}

export interface EnvironmentInfo {
  // fog: Fog
  // terrain: Terrain
  // envState: EnvState
  // volFogShadows: VolFogShadows
  // cloudShadows: CloudShadows
  // particleLighting: ParticleLighting
  // skyBox: SkyBox
  ocean?: OceanInfo
  oceanAnimation?: OceanAnimationInfo
  moon: Moon
  // dynTexSource: DynTexSource
  // totalIllumination: TotalIllumination
  lighting: Lighting
}

export interface OceanInfo {
  material: string
  causticsDistanceAtten: string
  causticDepth: string
  causticIntensity: string
  causticsTilling: string
}

export interface OceanAnimationInfo {
  windDirection: string
  windSpeed: string
  wavesAmount: string
  wavesSize: string
  wavesSpeed: string
}

export interface Moon {
  latitude: number
  longitude: number
  size: number
  texture: string
}

export interface Lighting {
  sunRotation: number
  sunHeight: number
  lighting: number
  hemiSamplQuality: number
  longitude: number
  dawnTime: number
  dawnDuration: number
  duskTime: number
  duskDuration: number
  sunVector: number[]
}

// ---------------------------------------------------------------------------
// Time of day
// ---------------------------------------------------------------------------

export interface TimeOfDay {
  time: number
  timeStart: number
  timeEnd: number
  timeAnimSpeed: number
  variable: TimeOfDayVariable[]
}

export interface TimeOfDayVariable {
  name: string
  color: number[]
  value: number
  spline: {
    keys: string
  }
}

// ---------------------------------------------------------------------------
// Region info
// ---------------------------------------------------------------------------

export interface RegionInfo {
  name: string
  poiImpostors: RegionImpostor[]
  impostors: RegionImpostor[]
  terrainMaterial: RegionMaterial | null
  /**
   * Region local tract names (localmappings.json), indexed by the values of `tractmap.bin`.
   * `tractmap.bin` holds u8 indices in image order like the heightmap (row 0 at region max y), 255 = unmapped.
   */
  tracts?: string[]
}

export interface RegionImpostor {
  position: IVec2
  model: string
}

export interface RegionMaterial {
  tileX: number
  tileY: number
  defaultMaterial: string // nwfs.File — use string path or replace with concrete type
  normalMap: string
  colorMap: string
  specularMap: string
  layers: RegionMaterialLayer[]
  pertinentLayersMipChain: string[]
  macroMaterialParams?: MacroMaterialParams
  customBackgroundParams?: MacroMaterialParams
  customForegroundParams?: MacroMaterialParams
  worldBackgroundParams?: MacroMaterialParams
  worldForegroundParams?: MacroMaterialParams
  pomDisplacement?: number
  pomHeightBias?: number
  pomSelfShadowStrength?: number
}

export interface MacroMaterialParams {
  color: [number, number, number, number]
  colorScale: number
  glossScale: number
  normalScale: number
  specularReflectance: number
}

export interface RegionMaterialLayer {
  material: string // nwfs.File
  splatMap: string // nwfs.File
  affectedTiles: string
  priority: number
}

// ---------------------------------------------------------------------------
// Runtime data
// ---------------------------------------------------------------------------

export type Vec3Data = [number, number, number]

/** Column-major 4×4 matrix, stored as a flat array of 16 numbers. */
export type Mat4Data = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface AssetReference {
  guid: string
  subId: number
  hint?: string
  /**
   * Lower case slice variant, the slice is keyed by `${guid}_${subId}_${variant}`
   */
  variant?: string
}

/**
 * Key of the referenced slice in RegionCapitalsData.slices
 */
export function assetReferenceKey(ref: AssetReference) {
  return ref.variant ? `${ref.guid}_${ref.subId}_${ref.variant}` : `${ref.guid}_${ref.subId}`
}

export interface CapitalRuntimeData {
  id: string
  transform: Mat4Data
  radius: number
  slice: AssetReference
}

export interface ChunkRuntimeData {
  id: string
  transform: Mat4Data
  size: number
  /** Stream margin input: the game uses margin = spawnRadius - size, clamped to >= 0 for mesh chunks smaller than 128, otherwise to >= 25 */
  spawnRadius?: number
  /** 0: static, 1: mesh, 2: collision */
  chunkType?: number
  slice: AssetReference
}

export const ChunkType = {
  Static: 0,
  Mesh: 1,
  Collision: 2,
}

export interface RegionCapitalsData {
  /** Keyed by layer name. */
  capitals: Record<string, CapitalRuntimeData[]>
  /** Keyed by layer name. */
  chunks: Record<string, ChunkRuntimeData[]>
  /** Keyed by asset UUID_SUBID. */
  slices: Record<string, ViewerSlice>
}

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

/**
 * Header of a reduced region.distribution file.
 *
 * Instance data is served separately as binary, a structure of arrays with `count` entries each:
 * - `uint16 type[count]` index into {@link RegionDistributionData.types}
 * - `uint16 x[count]` region local x, 0..0xFFFF maps to 0..regionSize
 * - `uint16 y[count]` region local y, 0..0xFFFF maps to 0..regionSize
 */
/**
 * Header and resolved asset table of a region.vegetation file
 */
export interface RegionVegetationData {
  tileSize: number
  regionSize: number
  maxInstancesPerCell: number
  /**
   * Total number of instances in the region
   */
  count: number
  /**
   * Indexed by the asset index of the instance groups in the file
   */
  assets: RegionVegetationAsset[]
}

export interface RegionVegetationAsset {
  /**
   * Model file, empty if the asset could not be resolved
   */
  model: string
  /**
   * Material override
   */
  material?: string
  kind: number
  flags: number
  count: number
}

export interface RegionDistributionData {
  region: [number, number]
  /** Number of instances in the binary buffer */
  count: number
  /** Interned model paths */
  models: string[]
  /** Interned material paths */
  materials: string[]
  types: DistributionType[]
}

export interface DistributionType {
  slice: string
  variant?: string
  meshes: DistributionMesh[]
}

export interface DistributionMesh {
  /** Index into {@link RegionDistributionData.models} */
  model: number
  /** Index into {@link RegionDistributionData.materials} */
  material: number
  /** Slice local transform, omitted if identity */
  transform?: Mat4Data
  maxViewDistance?: number
}

// ---------------------------------------------------------------------------
// Viewer / slice types
// ---------------------------------------------------------------------------

export interface ViewerEntity {
  id: string
  name: string
  parentId?: string
  transform: Mat4Data
  components: ViewerComponent[]
  /** The entity is not active when the slice is instantiated (isRuntimeActive = false) */
  inactive?: boolean
}

export interface ViewerSlice {
  entities: ViewerEntity[]
  /**
   * Transform of the slice root entity, only set if it is not identity.
   * Entity transforms are in slice space where the root sits at this transform. The spawner places the root:
   * entityWorld = spawnerWorld * inverse(transform) * entityTransform
   */
  transform?: Mat4Data
  spawnRadius: number
  isStaticSlice: boolean
}

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

export const MeshComponentName = 'Mesh' as const
export const SpawnerComponentName = 'Spawner' as const
export const PointSpawnerComponentName = 'PointSpawner' as const
export const PrefabSpawnerComponentName = 'PrefabSpawner' as const
export const AreaSpawnerComponentName = 'AreaSpawner' as const
export const LightComponentName = 'Light' as const
export const TimeOfDayComponentName = 'TimeOfDay' as const
export const ColliderComponentName = 'Collider' as const
export const VolumeComponentName = 'Volume' as const
export const RoadComponentName = 'Road' as const
export const RiverComponentName = 'River' as const
export const WaterVolumeComponentName = 'WaterVolume' as const
export const TerritoryComponentName = 'Territory' as const
export const PrefabReferencerComponentName = 'PrefabReferencer' as const
export const AudioTriggerComponentName = 'AudioTrigger' as const
export const AudioAmbienceComponentName = 'AudioAmbience' as const
export const AudioAreaComponentName = 'AudioArea' as const
export const ParticleComponentName = 'Particle' as const

export const ComponentTypes = {
  MeshComponentName,
  SpawnerComponentName,
  PointSpawnerComponentName,
  PrefabSpawnerComponentName,
  AreaSpawnerComponentName,
  LightComponentName,
  TimeOfDayComponentName,
  ColliderComponentName,
  VolumeComponentName,
  RoadComponentName,
  RiverComponentName,
  WaterVolumeComponentName,
  TerritoryComponentName,
  PrefabReferencerComponentName,
  AudioTriggerComponentName,
  AudioAmbienceComponentName,
  AudioAreaComponentName,
  ParticleComponentName,
}

export type ComponentType =
  | typeof MeshComponentName
  | typeof SpawnerComponentName
  | typeof PointSpawnerComponentName
  | typeof PrefabSpawnerComponentName
  | typeof AreaSpawnerComponentName
  | typeof ColliderComponentName
  | typeof VolumeComponentName
  | typeof RoadComponentName
  | typeof RiverComponentName
  | typeof WaterVolumeComponentName
  | typeof TerritoryComponentName
  | typeof PrefabReferencerComponentName
  | typeof AudioTriggerComponentName
  | typeof ParticleComponentName
  | typeof AudioAmbienceComponentName
  | typeof AudioAreaComponentName

export interface ViewerBaseComponent {
  type: ComponentType
}

export interface ViewerMeshComponent extends ViewerBaseComponent {
  type: typeof MeshComponentName
  mesh: string
  material?: string
  instances?: Mat4Data[]
  maxViewDistance?: number
  viewDistanceMultiplier?: number
  opacity?: number
  crossFadeTime?: number
  castShadow?: boolean
  shouldInstance?: boolean
  shouldMerge?: boolean
  forceMerge?: boolean
  fadeEnabled?: boolean
  loadOnActivate?: boolean
  acceptDecals?: boolean
  acceptSand?: boolean
  acceptSilhouette?: boolean
  acceptSnow?: boolean
  alwaysRender?: boolean
  sortType?: number
  visibilityOccluder?: boolean
  useVisAreas?: boolean
  useManualViewDistance?: boolean
  /**
   * MeshRenderOptions.LODRatio, scales the level of detail distances by lodRatio / 100. Omitted if 100 (default)
   */
  lodRatio?: number
  /**
   * MeshRenderOptions.Lod_MinScreenPct, NW specific screen percentage per level of detail, index 0 is level 0
   */
  lodMinScreenPct?: number[]
  /**
   * The mesh is baked into the POI impostor of its cell (m_impostorFarDistance in region.slicedata)
   */
  impostor?: boolean
}

export interface ViewerSpawnerComponent extends ViewerBaseComponent {
  type: typeof SpawnerComponentName
  slice: AssetReference
  autoSpawn: boolean
}

export interface ViewerPointSpawnerComponent extends ViewerBaseComponent {
  type: typeof PointSpawnerComponentName
  slice: AssetReference
  autoSpawn: boolean
}

export interface ViewerPrefabSpawnerComponent extends ViewerBaseComponent {
  type: typeof PrefabSpawnerComponentName
  slice: AssetReference
}

export interface ViewerAreaSpawnerComponent extends ViewerBaseComponent {
  type: typeof AreaSpawnerComponentName
  slice: AssetReference
  locations: Mat4Data[]
  liveCount?: number
  minRespawnRange?: number
  maxRespawnRange?: number
  spawnOnEnable?: boolean
  spawnOnTrigger?: boolean
}

export interface ViewerLightComponent {
  type: typeof LightComponentName
  light: ViewerLightConfig
}

export interface ViewerLightConfig {
  type: string
  color: [number, number, number, number]
  specMultiplier: number
  diffuseMultiplier: number
  attenuation: number
  range: number
  ambient: boolean
  // type 0: point light

  // type 1: area light
  areaWidth: number
  areaHeight: number
  areaFOV: number

  // type 2: projector light
  projectorDistance: number
  projectorFOV: number
  projectorNearPlane: number
  // ProjectorTexture          AssetReference

  // type 4: environment probe
  boxWidth: number
  boxHeight: number
  boxDepth: number

  maxViewDistance: number
  viewDistanceEnabled: boolean
  viewDistanceMultiplier: number
}

export interface ViewerTimeOfDayComponent {
  type: string
  shape: string
  width: number
  height: number
  depth: number
  radius: number
  blendDistance: number
  blendTime: number
  priority: number
  override: number
  file: string
  preset: TimeOfDay
  /** skybox slice (slices/sky/*), its mesh is the cloud dome */
  sky?: AssetReference
}

export interface ViewerUnknownComponent {
  type: string
  data: any
}

/**
 * Road or river of the RoadsAndRivers gem: a strip of geometry along the entity spline,
 * rendered with the material (Illum decal for roads). Spline data is in entity space.
 */
export interface ViewerRoadComponent extends ViewerBaseComponent {
  type: typeof RoadComponentName | typeof RiverComponentName
  material: string
  /** default width, widths are per spline vertex offsets added to it */
  width: number
  widths?: number[]
  segmentLength: number
  tileLength: number
  sortPriority: number
  minSpec: number
  viewDistanceMultiplier: number
  spline: ViewerSpline
  river?: ViewerRiver
}

export interface ViewerSpline {
  type: 'Linear' | 'Bezier' | 'CatmullRom'
  closed: boolean
  vertices: Vec3Data[]
  /** control points per vertex, absolute in entity space like the vertices */
  bezier?: Array<{ back: Vec3Data; forward: Vec3Data; angle: number }>
  granularity?: number
  /** catmull rom knot parameterization, 0 uniform, 0.5 centripetal, 1 chordal */
  knotParameterization?: number
}

export interface ViewerRiver {
  tileWidth: number
  waterVolumeDepth: number
  waterStreamSpeed: number
  waterFogDensity: number
  fogColor: [number, number, number, number]
  fogColorScale: number
  widthFadeDist: number
  lengthStartFadeDist: number
  lengthEndFadeDist: number
}

export type ViewerComponent =
  | ViewerMeshComponent
  | ViewerRoadComponent
  | ViewerWaterVolumeComponent
  | ViewerTerritoryComponent
  | ViewerPrefabReferencerComponent
  | ViewerAudioTriggerComponent
  | ViewerParticleComponent
  | ViewerAudioAmbienceComponent
  | ViewerAudioAreaComponent
  | ViewerSpawnerComponent
  | ViewerPointSpawnerComponent
  | ViewerPrefabSpawnerComponent
  | ViewerAreaSpawnerComponent
  | ViewerLightComponent
  | ViewerTimeOfDayComponent
  | ViewerUnknownComponent

export function isViewerRoadComponent(component: any): component is ViewerRoadComponent {
  return component.type === ComponentTypes.RoadComponentName || component.type === ComponentTypes.RiverComponentName
}

/**
 * Water volume (Water gem): a flat water surface on top of the entity shape, see nwbt ViewerWaterVolumeComponent.
 * Box and cylinder surfaces are at +height / 2, prism surfaces at +height (entity space).
 */
export interface ViewerWaterVolumeComponent extends ViewerBaseComponent {
  type: typeof WaterVolumeComponentName
  material: string
  shape: ViewerShape
  /**
   * Already multiplied with the FogColorMultiplier
   */
  fogColor: [number, number, number]
  fogDensity: number
  fogColorAffectedBySun: boolean
  /**
   * Texture coordinates per world unit
   */
  surfaceUScale: number
  surfaceVScale: number
  minSpec: number
  viewDistanceMultiplier: number
}

export function isViewerWaterVolumeComponent(component: any): component is ViewerWaterVolumeComponent {
  return component.type === ComponentTypes.WaterVolumeComponentName
}

/**
 * Territory, zone or POI area (TerritoryDataProviderComponent) with its polygon prism in entity space, see nwbt ViewerTerritoryComponent.
 * Territories and POIs share one id space. Audio values come from the territory and POI definition datasheets,
 * e.g. `MX_Territory` / `Brightwoods` or `POI_State` / `castle_dracula`. Zones without audio omit them.
 */
export interface ViewerTerritoryComponent extends ViewerBaseComponent {
  type: typeof TerritoryComponentName
  territoryId: string
  shape: ViewerShape
  audioGroup?: string
  audioState?: string
}

export function isViewerTerritoryComponent(component: any): component is ViewerTerritoryComponent {
  return component.type === ComponentTypes.TerritoryComponentName
}

/**
 * Slices that an entity references without spawning them, e.g. the territory master referencing the bounds slices
 */
export interface ViewerPrefabReferencerComponent extends ViewerBaseComponent {
  type: typeof PrefabReferencerComponentName
  slices: AssetReference[]
}

export function isViewerPrefabReferencerComponent(component: any): component is ViewerPrefabReferencerComponent {
  return component.type === ComponentTypes.PrefabReferencerComponentName
}

/**
 * ATL audio emitter (AudioTriggerComponent), see nwbt ViewerAudioTriggerComponent.
 * `playsImmediately` is often false for ambient loops that scripts start (e.g. torches), do not rely on it.
 * With `followShape` the emitter sits at the closest point of `shape` or `spline` (entity space) to the listener.
 */
export interface ViewerAudioTriggerComponent extends ViewerBaseComponent {
  type: typeof AudioTriggerComponentName
  playTrigger: string
  stopTrigger?: string
  playsImmediately: boolean
  /**
   * ATL preload names (AudioPreloadComponent)
   */
  preloads?: string[]
  followShape?: boolean
  shape?: ViewerShape
  spline?: ViewerSpline
}

export function isViewerAudioTriggerComponent(component: any): component is ViewerAudioTriggerComponent {
  return component.type === ComponentTypes.AudioTriggerComponentName
}

/**
 * Listener ambience bed of an instance (dungeon_amb_soundbank_loader.lua), e.g. `Play_QuadAmb_Dungeon_CutlassKeys`
 */
export interface ViewerAudioAmbienceComponent extends ViewerBaseComponent {
  type: typeof AudioAmbienceComponentName
  playTrigger: string
  stopTrigger: string
  preload?: string
}

export function isViewerAudioAmbienceComponent(component: any): component is ViewerAudioAmbienceComponent {
  return component.type === ComponentTypes.AudioAmbienceComponentName
}

/**
 * Trigger area (dungeon_audio.lua) that sets audio states while the listener is inside its shape (entity space)
 */
export interface ViewerAudioAreaComponent extends ViewerBaseComponent {
  type: typeof AudioAreaComponentName
  shape: ViewerShape | null
  values: AudioAreaValues
}

export interface AudioAreaValues {
  /**
   * starts the instance music on activation
   */
  startMusic?: boolean
  isArena?: boolean
  dungeonName?: string
  musicGroup?: string
  ambientGroup?: string
  switchName?: string
  rtpcName?: string
  enterMusicState?: string
  enterAmbientState?: string
  enterSwitchValue?: string
  enterRtpcValue?: string
  exitMusicState?: string
  exitAmbientState?: string
  exitSwitchValue?: string
  exitRtpcValue?: string
}

export function isViewerAudioAreaComponent(component: any): component is ViewerAudioAreaComponent {
  return component.type === ComponentTypes.AudioAreaComponentName
}

export function isViewerMeshComponent(component: any): component is ViewerMeshComponent {
  return component.type === ComponentTypes.MeshComponentName
}

export function isViewerSpawnerComponent(component: any): component is ViewerSpawnerComponent {
  return component.type === ComponentTypes.SpawnerComponentName
}

export function isViewerPointSpawnerComponent(component: any): component is ViewerPointSpawnerComponent {
  return component.type === ComponentTypes.PointSpawnerComponentName
}

export function isViewerPrefabSpawnerComponent(component: any): component is ViewerPrefabSpawnerComponent {
  return component.type === ComponentTypes.PrefabSpawnerComponentName
}

export function isViewerAreaSpawnerComponent(component: any): component is ViewerAreaSpawnerComponent {
  return component.type === ComponentTypes.AreaSpawnerComponentName
}

export function isViewerLightComponent(component: any): component is ViewerLightComponent {
  return component.type === ComponentTypes.LightComponentName
}

export function isTimeOfDayComponent(component: any): component is ViewerTimeOfDayComponent {
  return component.type === ComponentTypes.TimeOfDayComponentName
}

/**
 * Primitive shape in entity space (Z-up), see nwbt ViewerShape
 */
export interface ViewerShape {
  kind: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'prism'
  /**
   * Offset of the shape center in entity space
   */
  center?: Vec3Data
  /**
   * box: half extents
   */
  halfExtents?: Vec3Data
  /**
   * sphere, capsule, cylinder
   */
  radius?: number
  /**
   * capsule: length of the segment between the cap centers, cylinder: full height along Z, prism: extrusion height
   */
  height?: number
  /**
   * capsule: segment direction, Z if omitted
   */
  axis?: Vec3Data
  /**
   * prism: polygon in the XY plane, extruded along Z from 0 to height
   */
  vertices?: Array<[number, number]>
}

/**
 * Collision of a rigid body, either a RockNRoll shape asset or a primitive
 */
export interface ViewerColliderComponent extends ViewerBaseComponent {
  type: typeof ColliderComponentName
  /**
   * File path of the .rnr shape asset
   */
  rnr?: string
  shape?: ViewerShape
  /**
   * Collision filter, e.g. Structure, CharacterOnly
   */
  filter?: string
  dynamic?: boolean
  scaleShapes?: boolean
}

/**
 * Query or trigger volume without collision response
 */
export interface ViewerVolumeComponent extends ViewerBaseComponent {
  type: typeof VolumeComponentName
  volume: 'hit' | 'detection' | 'trigger'
  shape: ViewerShape
  filter?: string
  name?: string
}

export function isViewerColliderComponent(component: any): component is ViewerColliderComponent {
  return component.type === ComponentTypes.ColliderComponentName
}

export function isViewerVolumeComponent(component: any): component is ViewerVolumeComponent {
  return component.type === ComponentTypes.VolumeComponentName
}

/**
 * Particle emitter (ParticleComponent), see nwbt ViewerParticleComponent.
 * The library is a CryEngine particle library xml, `emitter` is the full effect name, library name first.
 * The settings scale the effect like the engine SpawnParams.
 */
export interface ViewerParticleComponent extends ViewerBaseComponent {
  type: typeof ParticleComponentName
  library: string
  emitter: string
  color: [number, number, number, number]
  alphaScale: number
  countScale: number
  sizeScale: number
  particleSize: [number, number, number]
  particleSizeRandom?: number
  speedScale: number
  timeScale: number
  /**
   * Emitter strength, negative uses the emitter age
   */
  strength: number
  pulsePeriod?: number
  preroll?: boolean
  ignoreRotation?: boolean
  notAttached?: boolean
  viewDistanceMultiplier: number
  useLod?: boolean
}

export function isViewerParticleComponent(component: any): component is ViewerParticleComponent {
  return component.type === ComponentTypes.ParticleComponentName
}
