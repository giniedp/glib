import { EcsGame, PriorityLane, SchedulerSystem } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { mat4$setScaleXYZ, mat4CreateTranslation, vec3, vec3$initFrom, vec4, vec4$init, type IVec4 } from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'

import type { LevelInfo, MacroMaterialParams } from '../../api'
import { QUAD_TREE_LEAF_SIZE, TERRAIN_LOD_RANGE_FACTOR } from '../../constants'
import { ContentService } from '../../content'
import { WaterPatchMaterial, type OceanAnimationParams, type TerrainCompositeMaterial } from '../../material'
import { TerrainComponent } from './TerrainComponent'
import { TerrainMesh } from './TerrainMesh'
import { TerrainRegionComponent, TerraQuadState, type TerraQuad } from './TerrainRegionComponent'
import { TerrainTileManager } from './TerrainTileManager'
import { loadBaseMaterial, loadHeightmap, loadLayerMaterials, loadWatermap } from './loaders'

export class TerrainSystem extends GameSystem {
  private allTerrains: GameQuery
  private allRegions: GameQuery

  private game: EcsGame
  private device: Device
  private content: ContentService
  private scheduler: SchedulerSystem

  private tiles: TerrainTileManager
  private renderList: TerraQuad[] = []
  private loadedRegions: TerrainRegionComponent[] = []

  private frame = 0

  private mountainHeight = 2048
  private oceanLevel = 40

  private oceanMtl: WaterPatchMaterial
  private oceanDirty = true
  private oceanAnimation: OceanAnimationParams = {}

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.allTerrains = world.query({ scope: 'all', required: [TerrainComponent] })
    this.allRegions = world.query({ scope: 'all', required: [TerrainRegionComponent] })
  }

  public update(): void {
    this.frame++

    let count = 0
    for (const entity of this.allTerrains) {
      count++
      this.tiles ||= new TerrainTileManager(this.device)
      if (count === 1) {
        this.updateTerrain(entity.component(TerrainComponent))
      } else {
        console.warn('Multiple terrain entities found, only the first one will be updated')
      }
    }

    if (!count) {
      this.tiles?.dispose()
      this.tiles = null
    }
  }

  public destroy(): void {
    this.tiles?.dispose()
    this.tiles = null
  }

  public async setLevelInfo(info: LevelInfo, ctx: { content: ContentService; signal: AbortSignal }) {
    this.mountainHeight = info.mountainHeight
    this.oceanLevel = info.oceanLevel
    this.oceanAnimation = info.mission?.environment?.oceanAnimation
    this.oceanMtl = null
    this.oceanDirty = true

    const materialName = info.mission?.environment?.ocean?.material
    if (!materialName) {
      return
    }

    const mtlPath = materialName.toLowerCase().replace(/.mtl$/, '') + '.mtl'
    const glbPath = mtlPath + '.glb'
    const material = await this.content.loader.loadMaterial(glbPath, {
      baseUrl: this.content.nwbtFileUrl,
      signal: ctx.signal,
    })
    ctx.signal.throwIfAborted()

    this.oceanMtl = material as WaterPatchMaterial
    this.oceanDirty = true
  }

  // #region Update Terrain Entity

  private updateTerrain(terrain: TerrainComponent) {
    if (!terrain.mesh) {
      const mesh = new TerrainMesh(this.device, { size: QUAD_TREE_LEAF_SIZE })
      mesh.TerrainMaterial.ColorMap1 = this.tiles.colorMap1
      mesh.TerrainMaterial.ColorMap2 = this.tiles.colorMap2
      mesh.TerrainMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.TerrainMaterial.MountainHeight = this.mountainHeight

      mesh.WaterMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.WaterMaterial.MountainHeight = this.mountainHeight
      mesh.WaterMaterial.WaterLevel = this.oceanLevel
      mesh.WaterMaterial.WaterHeight = this.oceanLevel

      terrain.mesh = mesh
    }

    if (this.oceanDirty) {
      this.oceanDirty = false

      const mesh = terrain.mesh
      const oldMaterial = mesh.WaterMaterial
      mesh.WaterMaterial = this.oceanMtl || new WaterPatchMaterial(this.device, { properties: {} })
      mesh.WaterMaterial.applyOceanAnimation(this.oceanAnimation)
      mesh.WaterMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.WaterMaterial.MountainHeight = this.mountainHeight
      mesh.WaterMaterial.WaterLevel = this.oceanLevel
      mesh.WaterMaterial.WaterHeight = this.oceanLevel
      // TODO:
      // oldMaterial  .dispose()
    }

    for (const entity of this.allRegions) {
      const region = entity.component(TerrainRegionComponent)
      if (!entity.isActive) {
        this.unloadRegion(region)
      } else {
        this.updateRegionResources(region)
        this.updateRegion(region)
      }
    }

    this.updateRenderList(terrain)
  }

  private unloadRegion(region: TerrainRegionComponent) {
    if (!this.loadedRegions.includes(region)) {
      return
    }

    removeItemUnordered(this.loadedRegions, region)
    for (const node of region.tree.flatPreOrdered) {
      this.unloadQuad(node)
    }
  }

  private updateRegion(region: TerrainRegionComponent) {
    console.assert(region.entity.isActive, 'Region should be active')

    if (!this.loadedRegions.includes(region)) {
      this.loadedRegions.push(region)
    }

    const camera = this.game.scene.getView(0).camera
    region.traverseRequiredSet(camera, TERRAIN_LOD_RANGE_FACTOR, (node) => {
      this.updateQuadState(node, region)
    })

    for (const node of region.tree.flatPreOrdered) {
      this.updateQuadEntity(node)
    }
  }

  private updateRegionResources(region: TerrainRegionComponent) {
    this.loadHeightmap(region)
    this.loadBaseMaterial(region)
    this.loadLayerMaterials(region)
    this.loadWatermap(region)
  }

  private loadBaseMaterial(region: TerrainRegionComponent) {
    if (region.baseMaterial || region.baseMaterialTask) {
      return
    }
    const material = region.materialData
    if (!material) {
      region.baseMaterialReady = true
      return
    }
    region.baseMaterialTask = loadBaseMaterial(this.content, this.scheduler, material, (result) => {
      region.baseMaterialReady = true
      region.baseMaterialTask = null
      region.baseMaterial = result
      this.syncMacroTextures(region)
      region.materialVersion++
    })
  }

  private loadLayerMaterials(region: TerrainRegionComponent) {
    if (region.layerMaterials || region.layerMaterialsTask) {
      return
    }
    const material = region.materialData
    if (!material) {
      region.layerMaterialsReady = true
      return
    }
    region.layerMaterialsTask = loadLayerMaterials(this.content, this.scheduler, material, (result) => {
      region.layerMaterialsReady = true
      region.layerMaterialsTask = null
      region.layerMaterials = result || []
      this.syncMacroTextures(region)
      region.materialVersion++
    })
  }

  private syncMacroTextures(region: TerrainRegionComponent) {
    if (!region.baseMaterial) {
      return
    }
    // Lumberyard binds the region macro material (TerrainCompositer_Render.cpp BindMacroMaterialShaderConstants).
    // NW adds world foreground/background compositing params with per region overrides,
    // assumption: foreground = composited tiles, background = distant macro only terrain
    const data = region.materialData
    const macro = data?.customForegroundParams ?? data?.worldForegroundParams ?? data?.macroMaterialParams
    applyMacroParams(region.baseMaterial, macro)

    if (!region.layerMaterials?.length) {
      return
    }

    for (const material of region.layerMaterials) {
      material.MacroBaseMap = region.baseMaterial.MacroBaseMap
      material.MacroNormalMap = region.baseMaterial.MacroNormalMap
      material.MacroGlossMap = region.baseMaterial.MacroGlossMap
      applyMacroParams(material, macro)
    }
  }

  private loadHeightmap(region: TerrainRegionComponent) {
    if (region.heightmap || region.heightmapTask) {
      return
    }
    region.heightmapTask = loadHeightmap(
      this.content,
      this.scheduler,
      region.coatlicueName,
      region.regionName,
      (result) => {
        region.heightmapReady = true
        region.heightmapTask = null
        region.heightmap = result || new Float16Array(region.size * region.size)
      },
    )
  }

  private loadWatermap(region: TerrainRegionComponent) {
    if (region.watermap || region.watermapTask) {
      return
    }
    region.watermapTask = loadWatermap(
      this.content,
      this.scheduler,
      region.coatlicueName,
      region.regionName,
      (result) => {
        region.watermapReady = true
        region.watermapTask = null
        region.watermap = result || new Float16Array(region.size * region.size)
      },
    )
  }

  private updateRenderList(terrain: TerrainComponent) {
    this.renderList.length = 0
    terrain.renderRegions.length = 0

    for (const region of this.loadedRegions) {
      if (!region.entity || !region.entity.isActive) {
        continue
      }

      if (!region.heightmap || !region.watermap) {
        continue
      }

      terrain.renderRegions.push(region)

      for (const node of region.tree.flatPreOrdered) {
        if (node.data.visible) {
          this.renderList.push(node)
        }
      }
    }

    terrain.syncHeightmaps()

    const mesh = terrain.meshComponent.mesh as TerrainMesh
    const hmMaterial = mesh.TerrainMaterial
    const wmMaterial = mesh.WaterMaterial
    hmMaterial.HeightMap = terrain.heightmap.texture
    wmMaterial.HeightMap = terrain.heightmap.texture
    wmMaterial.WaterMap = terrain.heightmap.texture2

    mesh.resetInstanceCount()
    let instanceCount = 0
    for (const renderNode of this.renderList) {
      const p = renderNode.data

      const fineNode = p.state >= TerraQuadState.Ready ? renderNode : resolveReadyAncestor(renderNode)
      if (!fineNode || !fineNode.data.tile) {
        continue
      }

      const coarseNode = resolveReadyAncestor(fineNode) ?? fineNode
      const fineReady = fineNode === renderNode
      const coarseReady = coarseNode !== fineNode

      mesh.startInstance(instanceCount)

      // TODO: optimize this

      vec3$initFrom(vec3.$1, renderNode.bounds.min)
      const mat = mat4CreateTranslation(vec3.$1)
      mat4$setScaleXYZ(mat, renderNode.size / p.region.leafSize, renderNode.size / p.region.leafSize, 1)
      mesh.writeTransform(mat)

      const morphLod = Math.log2(renderNode.size / p.region.leafSize)
      mesh.writeParams1({
        x: QUAD_TREE_LEAF_SIZE,
        y: TERRAIN_LOD_RANGE_FACTOR,
        z: morphLod,
        w: 0,
      })

      mesh.writeParams2({
        x: fineNode.data.tile.slot.layer,
        y: coarseNode.data.tile.slot.layer,
        z: fineReady ? 1 : 0,
        w: coarseReady ? 1 : 0,
      })

      mesh.writeParams3({
        x: terrain.getNeighbourLayer(p.region, 0, 0),
        y: terrain.getNeighbourLayer(p.region, 1, 0), // +X,
        z: terrain.getNeighbourLayer(p.region, 0, 1), // +Y,
        w: terrain.getNeighbourLayer(p.region, 1, 1), // +X+Y corner,
      })

      computeUvTransform(renderNode, fineNode, vec4.$0)
      mesh.writeColorUvTransform(vec4.$0)

      computeUvTransform(renderNode, coarseNode, vec4.$0)
      mesh.writeColorUvTransformCoarse(vec4.$0)

      computeUvTransform(renderNode, renderNode.root, vec4.$0)
      mesh.writeHeightUvTransform(vec4.$0)

      computeUvTransform(coarseNode, renderNode.root, vec4.$0)
      mesh.writeHeightUvTransformCoarse(vec4.$0)

      instanceCount++
    }
    mesh.commitInstanceData()
  }

  // #endregion

  // #region Update Quad State
  private updateQuadState(node: TerraQuad, region: TerrainRegionComponent) {
    const p = node.data

    console.assert(p.required, 'Node should be required')

    p.state ??= TerraQuadState.Unloaded
    p.lastSeen = this.frame
    p.tile ||= this.tiles.acquireTile()

    switch (p.state) {
      case TerraQuadState.Unloaded:
      case TerraQuadState.HeightLoading: {
        // waiting until the region got it's heightmap loaded
        if (region.heightmap) {
          p.state = TerraQuadState.HeightReady
        }
        break
      }
      case TerraQuadState.HeightReady: {
        // heightmap is ready, we can initiate material loading
        // this is redundant now, we could have directly went from HeightLoading to MaterialStale
        p.state = TerraQuadState.MaterialStale
        break
      }

      case TerraQuadState.MaterialStale: {
        p.state = TerraQuadState.MaterialLoading
        p.tile.renderVersion = region.materialVersion
        this.requestRender(node, region)
        break
      }
      case TerraQuadState.MaterialLoading: {
        // wait for material to be ready
        // state is updated in the render task
        break
      }
      case TerraQuadState.MaterialReady: {
        // mark as ready for rendering
        p.state = TerraQuadState.Ready
        break
      }

      case TerraQuadState.Ready:
        // ready to render, but always check if material is still valid
        if (p.tile.renderVersion !== region.materialVersion) {
          p.tile.renderVersion = region.materialVersion
          this.requestRender(node, region)
        }
        break
    }
  }
  // #endregion

  // #region Update Quad Entity

  private updateQuadEntity(node: TerraQuad) {
    const p = node.data
    if (p.lastSeen && this.frame - p.lastSeen > 60) {
      this.unloadQuad(node)
    }

    // const entity = p.entity

    // if (entity.canInitialize) {
    //   entity.initialize()
    // }

    // const canRender = p.visible

    // if (entity.isActive && !canRender) {
    //   entity.deactivate()
    //   console.assert(!p.entity.isActive, 'Node should be deactivated')
    // }

    // if (!entity.isActive && canRender) {
    //   entity.activate()
    //   console.assert(p.entity.isActive, 'Node should be active')
    // }

    // if (!entity.isActive) {
    //   return
    // }

    // const nodeSize = node.size
    // const leafSize = p.region.leafSize
    // const transform = entity.getTransform<TransformComponent>()
    // transform.setScaleUniform(nodeSize / leafSize)
    // transform.updateIfNeeded()
  }
  // #endregion

  private requestRender(node: TerraQuad, region: TerrainRegionComponent) {
    const p = node.data

    if (p.materialRenderTask) {
      p.materialRenderTask.cancelled = true
      p.materialRenderTask = null
    }

    p.materialRenderTask = this.scheduler.schedule({
      lane: PriorityLane.Medium,
      // entity: p.entity,
      work: () => {
        const tile = node.data.tile

        const macroScale = node.size / node.getRoot().size
        // prettier-ignore
        vec4$init(tile.macroUvTransform,
          macroScale,
          -macroScale,
          node.rootGridX * macroScale,
          1.0 - node.rootGridY * macroScale,
        )

        const textureWorldSize = 1.0
        const colorScale = node.size / textureWorldSize
        vec4$init(
          tile.colorUvTransform,
          colorScale, // scale UV down as patch grows
          colorScale,
          (node.bounds.min.x / node.size) * colorScale, // offset follows same scale
          (node.bounds.min.y / node.size) * colorScale,
        )

        const isMacro = node.size >= 512
        const baseMaterial = region.baseMaterial
        const layerMaterials = isMacro ? null : region.layerMaterials
        this.tiles.renderTile(tile, baseMaterial, layerMaterials)
        return true
      },
      finalize: (task, err) => {
        if (p.materialRenderTask !== task) {
          // replaced or cancelled
          return
        }
        // TODO: handle error case
        p.state = TerraQuadState.MaterialReady
        p.materialRenderTask = null
      },
    })
  }

  private unloadQuad(node: TerraQuad) {
    const p = node.data
    if (p.state === TerraQuadState.Unloaded) {
      return
    }
    p.state = TerraQuadState.Unloaded

    if (p.tile) {
      this.tiles.releaseTile(p.tile)
      p.tile = null
    }

    if (p.materialRenderTask) {
      p.materialRenderTask.cancelled = true
      p.materialRenderTask = null
    }
  }

  // #endregion
}

function resolveReadyAncestor(node: TerraQuad): TerraQuad | null {
  let current = node.parent
  while (current) {
    if (current.data.state >= TerraQuadState.MaterialReady && !!current.data.tile) {
      return current
    }
    current = current.parent
  }
  return null
}

export function computeUvTransform(childNode: TerraQuad, ancestorNode: TerraQuad, output: IVec4) {
  const child = childNode.bounds
  const ancestor = ancestorNode.bounds

  const rangeW = 1 / (ancestor.max.x - ancestor.min.x)
  const rangeH = 1 / (ancestor.max.y - ancestor.min.y)

  const scaleX = (child.max.x - child.min.x) * rangeW
  const offsetX = (child.min.x - ancestor.min.x) * rangeW

  // HINT: y is flipped in UV space, so we use max.y for offset and scale based on height
  const scaleY = (child.max.y - child.min.y) * rangeH
  const offsetY = (ancestor.max.y - child.max.y) * rangeH

  output.x = scaleX
  output.y = scaleY
  output.z = offsetX
  output.w = offsetY
}

function applyMacroParams(material: TerrainCompositeMaterial, params: MacroMaterialParams | undefined) {
  const color = params?.color ?? [1, 1, 1, 1]
  const colorScale = params?.colorScale ?? 1
  material.MacroColor = vec4(color[0] * colorScale, color[1] * colorScale, color[2] * colorScale, color[3])
  material.MacroGlossScale = params?.glossScale ?? 1
  material.MacroNormalScale = Math.max(params?.normalScale ?? 1, 0.001)
}
