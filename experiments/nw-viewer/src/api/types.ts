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
  // ocean: Ocean
  // oceanAnimation: OceanAnimation
  moon: Moon
  // dynTexSource: DynTexSource
  // totalIllumination: TotalIllumination
  lighting: Lighting
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
}

// ---------------------------------------------------------------------------
// Region info
// ---------------------------------------------------------------------------

export interface RegionInfo {
  name: string
  poiImpostors: RegionImpostor[]
  impostors: RegionImpostor[]
  terrainMaterial: RegionMaterial | null
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
  slice: AssetReference
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
// Viewer / slice types
// ---------------------------------------------------------------------------

export interface ViewerEntity {
  id: string
  name: string
  parentId?: string
  transform: Mat4Data
  components: ViewerComponent[]
}

export interface ViewerSlice {
  entities: ViewerEntity[]
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

export const ComponentTypes = {
  MeshComponentName,
  SpawnerComponentName,
  PointSpawnerComponentName,
  PrefabSpawnerComponentName,
  AreaSpawnerComponentName,
  LightComponentName,
  TimeOfDayComponentName,
}

export type ComponentType =
  | typeof MeshComponentName
  | typeof SpawnerComponentName
  | typeof PointSpawnerComponentName
  | typeof PrefabSpawnerComponentName
  | typeof AreaSpawnerComponentName

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
}

export interface ViewerUnknownComponent {
  type: string
  data: any
}

export type ViewerComponent =
  | ViewerMeshComponent
  | ViewerSpawnerComponent
  | ViewerPointSpawnerComponent
  | ViewerPrefabSpawnerComponent
  | ViewerAreaSpawnerComponent
  | ViewerLightComponent
  | ViewerTimeOfDayComponent
  | ViewerUnknownComponent

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
