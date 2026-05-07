import {
  BoundsComponent,
  LifeCyclePropagate,
  MeshComponent,
  PriorityLane,
  SpatialComponent,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { CreateEntityOptions, GameComponent, GameEntity } from '@gglib/ecs'
import { Texture } from '@gglib/graphics'
import { withResolvers } from '@gglib/utils'
import type { RegionMaterial } from '../api'
import { TerrainCompositeMaterial } from '../material'
import { gameCoordinate2D, gameToRenderCoordinate } from '../math'
import { ContentService } from '../services/content-service'
import type { TerrainRegion, TerraQuad } from './TerrainRegion'

export interface TerrainRegionComponentOptions {
  level: string
  region: TerrainRegion
  materialData: RegionMaterial
  mountainHeight: number
}

export function terrainRegion(parent: GameEntity, options: TerrainRegionComponentOptions): CreateEntityOptions {
  const origin = gameCoordinate2D(options.region.origin.x, options.region.origin.y)
  const position = gameToRenderCoordinate(origin, 0)
  return {
    name: `Terrain Region [${options.region.xIndex};${options.region.yIndex}]`,
    parent,
    transform: new TransformComponent({
      position,
      keepWorld: true,
      lifeCycle: LifeCyclePropagate,
    }),
    components: [new TerrainRegionComponent(options)],
  }
}

export function terrainPatchEntity(parent: GameEntity, quad: TerraQuad): CreateEntityOptions {
  const { min } = quad.bounds

  const origin = gameCoordinate2D(min.x, min.z)
  const position = gameToRenderCoordinate(origin, 0)
  return {
    name: `Terrain Patch [${quad.rootGridX};${quad.rootGridZ}]`,
    parent: parent,
    transform: new TransformComponent({
      position: position,
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      //new SpatialComponent()
    ],
  }
}

export class TerrainRegionComponent implements GameComponent {
  public entity: GameEntity

  private content: ContentService

  private mountainHeight: number
  private materialData: RegionMaterial

  public layerMaterials: TerrainCompositeMaterial[] = []
  private layerMaterialsTask: ScheduledTask
  private layerMaterialsError: boolean

  public macroMaterial: TerrainCompositeMaterial
  private macroMaterialTask: ScheduledTask
  private macroMaterialError: boolean

  public materialVersion = 0

  public readonly region: TerrainRegion
  public get regionSize(): number {
    return this.region.size
  }

  public readonly level: string

  public constructor(options: TerrainRegionComponentOptions) {
    this.level = options.level
    this.region = options.region
    this.materialData = options.materialData
    this.mountainHeight = options.mountainHeight
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)

    this.region.root.traverseTopDown((node) => {
      node.data.entity = this.entity.world.createEntity(terrainPatchEntity(this.entity, node))
      node.data.region = this.region
    })
  }

  public activate() {
    this.loadMacroMaterial()
    this.loadLayerMaterials()
  }

  public deactivate() {
    if (this.layerMaterialsTask) {
      this.layerMaterialsTask.cancelled = true
      this.layerMaterialsTask = null
    }
    this.disposeLayerMaterials()

    if (this.macroMaterialTask) {
      this.macroMaterialTask.cancelled = true
      this.macroMaterialTask = null
    }
    // keep macro material alive
  }

  public destroy(): void {
    this.disposeLayerMaterials()
    this.disposeMacroMaterial()
  }

  private disposeMacroMaterial() {
    this.macroMaterial?.dispose()
    this.macroMaterial = null
  }

  private disposeLayerMaterials() {
    const toDispose = this.layerMaterials
    this.layerMaterials = null
    if (toDispose) {
      for (const material of toDispose) {
        material.dispose()
      }
    }
  }

  private loadMacroMaterial() {
    if (this.macroMaterial || this.macroMaterialTask || this.macroMaterialError) {
      return
    }
    const task = loadMacroMaterial(this.content, this.materialData)
    this.macroMaterialTask = task

    task.result
      .then((material) => {
        this.macroMaterial = material
        this.macroMaterial.SplatMap = this.content.whitePixel
        console.log('loaded macro material', material)
        this.syncMacroTextures()
      })
      .catch(() => {
        this.macroMaterialError = true
      })
      .finally(() => {
        this.macroMaterialTask = null
        this.materialVersion++
      })
  }

  private loadLayerMaterials() {
    if (this.layerMaterials?.length || this.layerMaterialsTask || this.layerMaterialsError) {
      return
    }
    const task = loadLayerMaterials(this.content, this.materialData)
    this.layerMaterialsTask = task

    task.result
      .then((materials) => {
        console.log('loaded layer materials', materials)
        this.layerMaterials = materials
        this.syncMacroTextures()
      })
      .catch((err) => {
        console.error('error loading layer materials', err)
        this.layerMaterialsError = true
      })
      .finally(() => {
        this.layerMaterialsTask = null
        this.materialVersion++
      })
  }

  private syncMacroTextures() {
    if (this.macroMaterial) {
      this.macroMaterial.MacroNormalScale = 1 / this.mountainHeight
    } else {
      return
    }
    if (this.layerMaterials?.length) {
      for (const material of this.layerMaterials) {
        material.MacroBaseMap = this.macroMaterial.MacroBaseMap
        material.MacroNormalMap = this.macroMaterial.MacroNormalMap
        material.MacroGlossMap = this.macroMaterial.MacroGlossMap
        material.MacroNormalScale = 1 / this.mountainHeight
      }
    }
  }
}

function loadMacroMaterial(
  content: ContentService,
  data: RegionMaterial,
): ScheduledTask<Promise<TerrainCompositeMaterial>> {
  let colorMap: Texture
  let normalMap: Texture
  let specularMap: Texture

  let material: TerrainCompositeMaterial
  let cancelled = false
  let done = false
  const { promise, resolve, reject } = withResolvers<TerrainCompositeMaterial>()

  function finalize() {
    // textures, if loaded, have been passed to material, which takes ownership
    // and increments ref coutners so we can safely dispose our references here
    colorMap?.dispose()
    normalMap?.dispose()
    specularMap?.dispose()
    //
    if (cancelled && material) {
      material.dispose()
    }
    const result = material
    colorMap = null
    normalMap = null
    specularMap = null

    material = null

    if (done) {
      resolve(result)
    } else {
      reject(new Error('Task cancelled'))
    }
  }

  return content.schedule({
    lane: PriorityLane.High,
    result: promise,
    load: async (signal) => {
      if (!signal.aborted) {
        colorMap = await content.loadTexture(data.colorMap)
      }
      if (!signal.aborted) {
        normalMap = await content.loadTexture(data.normalMap)
      }
      if (!signal.aborted) {
        specularMap = await content.loadTexture(data.specularMap)
      }
      if (!signal.aborted) {
        material = await content.loader
          .loadMaterial<TerrainCompositeMaterial>(data.defaultMaterial + '.glb', {
            baseUrl: content.nwbtFileUrl,
          })
          .then((material: TerrainCompositeMaterial) => {
            material.MacroBaseMap = colorMap
            material.MacroNormalMap = normalMap
            material.MacroGlossMap = specularMap
            return material
          })
      }
    },
    onCancel: () => {
      cancelled = true
      finalize()
    },
    onDone: () => {
      done = true
      finalize()
    },
  })
}

function loadLayerMaterials(
  content: ContentService,
  data: RegionMaterial,
): ScheduledTask<Promise<TerrainCompositeMaterial[]>> {
  const layers: Array<{ splat: Texture; material: TerrainCompositeMaterial }> = []
  const result: TerrainCompositeMaterial[] = []

  const { promise, resolve, reject } = withResolvers<TerrainCompositeMaterial[]>()

  return content.schedule({
    lane: PriorityLane.Medium,
    result: promise,
    load: async (signal) => {
      for (const layer of data.layers || []) {
        if (layer.affectedTiles === '0') {
          // skip layers that are marked as not affecting anything
          // seems to be safe, splat and material textures are usually some dummy data
          continue
        }
        layers.push({
          splat: await content.loadTexture(layer.splatMap),
          material: await content.loader.loadMaterial<TerrainCompositeMaterial>(layer.material + '.glb', {
            baseUrl: content.nwbtFileUrl,
          }),
        })

        if (signal.aborted) {
          return
        }
      }
      for (const { splat, material } of layers) {
        material.SplatMap = splat
        result.push(material)
      }
    },
    onCancel: () => {
      reject(new Error('Task cancelled'))
    },
    onDone: () => {
      resolve(result)
    },
  })
  return
}
