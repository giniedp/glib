export interface LevelData {
  name: string
  oceanLevel: number
  mountainHeight: number
  groundMaterial: string
  regionSize: number
  regions: RegionReference[]
  maps: MapData[]
  timeOfDay: TimeOfDay
}

export interface TimeOfDay {
  time: number
  timeStart: number
  timeEnd: number
  timeAnimSpeed: number
  variables: TimeOfDayVariable[]
}
export interface TimeOfDayVariable {
  name: string
  color: string
  value: string
}
export interface MapData {
  gameModeMapId: string
  gameModeId: string
  slicePath: string
  coatlicueName: string
  worldBounds: string
  teamTeleportData: string
}

export interface RegionReference {
  name: string
  location: [number, number]
}

export interface RegionData {
  name: string
  size: number
  cellResolution: number
  poiImpostors: ImpostorData[]
  impostors: ImpostorData[]
  capitals: Record<string, CapitalData[]>
  chunks: Record<string, ChunkData[]>
}

export interface ImpostorData {
  position: [number, number]
  model: string
}

export interface DistributionData {
  slices: Record<string, EntityData[]>
  segments: Record<string, DistributionSlice[]>
}

export interface DistributionSlice {
  slice: string
  positions: number[][]
}

export interface CapitalLayerData {
  name: string
  capitals: CapitalData[]
  chunks: ChunkData[]
}

export interface CapitalData {
  id: string
  transform: number[]
  radius: number
  slice: AssetReference
}

export interface ChunkData {
  id: string
  transform: number[]
  size: number
  slice: AssetReference
}

export interface EntityData {
  id: string
  name: string
  file: string
  transform: number[]
  model: string
  material: string
  instances: number[][]
  light: LightData
  vital: VitalSpawnData
  encounter: string
  encounterName: string
  maxViewDistance: number
  layer: string
}

export interface VitalSpawnData {
  vitalsId: string
  categoryId: string
  level: number
  adbFile: string
  statusEffects: string[]
  tags: string[]
  damageTable: string
}

export interface LightData {
  type: number
  color: [number, number, number, number]
  diffuseIntensity: number
  specularIntensity: number
  pointDistance: number
  pointAttenuation: number
}

export interface TerrainData {
  level: string
  tileSize: number
  mipCount: number
  width: number
  height: number
  regionsX: number
  regionsY: number
  regionSize: number
  oceanLevel: number
  mountainHeight: number
  materials: RegionMaterial[]
}

export interface CatalogAssetData {
  asset: AssetData
  assets: AssetData[]
}

export interface AssetData {
  guid: string
  subId: number
  type: string
  file: string
  size: number
}

export interface RegionMaterial {
  regionX: number
  regionY: number
  normalMap: string
  colorMap: string
  specularMap: string
  defaultMaterial: string
  layers: TerrainMaterialLayerData[]
  pertinentLayersMipChain: string[]
}
export interface TerrainMaterialLayerData {
  material: string
  splatMap: string
  affectedTiles: string
  priority: number
}

export const ComponentTypes = {
  MeshComponentName: 'Mesh',
  SpawnerComponentName: 'Spawner',
  PointSpawnerComponentName: 'PointSpawner',
  PrefabSpawnerComponentName: 'PrefabSpawner',
  AreaSpawnerComponentName: 'AreaSpawner',
}

export interface ViewerEntity {
  id: string
  name: string
  transform: number[]
  components: any[]
}

export interface ViewerComponent {
  type: string
}

export interface ViewerSlice {
  entities: ViewerEntity[]
  spawnRadius: number
  isStaticSlice: boolean
}

export interface ViewerMeshComponent {
  type: 'Mesh'
  mesh: string
  material: string
  maxViewDistance: number
  viewDistanceMultiplier: number
  castShadow: boolean
  shouldInstance: boolean
  shouldMerge: boolean
  forceMerge: boolean
  fadeEnabled: boolean
  opacity: number
  loadOnActivate: boolean
  instances: number[]
}

export function isViewerMeshComponent(component: any): component is ViewerMeshComponent {
  return component.type === ComponentTypes.MeshComponentName
}

export interface ViewerSpawnerComponent {
  type: 'Spawner'
  slice: AssetReference
  autoSpawn: boolean
}

export function isViewerSpawnerComponent(component: any): component is ViewerSpawnerComponent {
  return component.type === ComponentTypes.SpawnerComponentName
}

export interface ViewerPointSpawnerComponent {
  type: 'PointSpawner'
  slice: AssetReference
  autoSpawn: boolean
}

export function isViewerPointSpawnerComponent(component: any): component is ViewerPointSpawnerComponent {
  return component.type === ComponentTypes.PointSpawnerComponentName
}

export interface ViewerPrefabSpawnerComponent {
  type: 'PrefabSpawner'
  slice: AssetReference
}

export function isViewerPrefabSpawnerComponent(component: any): component is ViewerPrefabSpawnerComponent {
  return component.type === ComponentTypes.PrefabSpawnerComponentName
}

export interface ViewerAreaSpawnerComponent {
  type: 'AreaSpawner'
  slice: AssetReference
  locations: number[]
  liveCount: number
  minRespawnRange: number
  maxRespawnRange: number
  spawnOnEnable: boolean
  spawnOnTrigger: boolean
}

export function isViewerAreaSpawnerComponent(component: any): component is ViewerAreaSpawnerComponent {
  return component.type === ComponentTypes.AreaSpawnerComponentName
}

export interface AssetReference {
  guid: string
  subId: number
  hint: string
}
