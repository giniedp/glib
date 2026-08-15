import { EcsGame, PriorityLane, SchedulerSystem } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { Mat4, Vec3, Vec4, type IVec4 } from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'

import { LOD_RANGE_FACTOR, QUAD_LEAF_SIZE } from '../../constants'
import { ContentService } from '../../content'
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

  public mountainHeight = 2048
  public oceanLevel = 40

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

  // #region Update Terrain Entity

  private updateTerrain(terrain: TerrainComponent) {
    if (!terrain.meshComponent.mesh) {
      const mesh = new TerrainMesh(this.device, { size: QUAD_LEAF_SIZE })
      mesh.TerrainMaterial.ColorMap1 = this.tiles.colorMap1
      mesh.TerrainMaterial.ColorMap2 = this.tiles.colorMap2
      mesh.TerrainMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.TerrainMaterial.MountainHeight = this.mountainHeight

      mesh.WaterMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.WaterMaterial.MountainHeight = this.mountainHeight
      mesh.WaterMaterial.WaterLevel = this.oceanLevel
      mesh.WaterMaterial.WaterHeight = this.oceanLevel

      terrain.meshComponent.mesh = mesh
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

    const camera = this.game.view.camera
    region.traverseRequiredSet(camera, LOD_RANGE_FACTOR, (node) => {
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
      return
    }
    region.baseMaterialTask = loadBaseMaterial(this.content, this.scheduler, material, (result) => {
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
      return
    }
    region.layerMaterialsTask = loadLayerMaterials(this.content, this.scheduler, material, (result) => {
      region.layerMaterialsTask = null
      region.layerMaterials = result || []
      this.syncMacroTextures(region)
      region.materialVersion++
    })
  }

  private syncMacroTextures(region: TerrainRegionComponent) {
    if (region.baseMaterial) {
      region.baseMaterial.MacroNormalScale = 1 / region.mountainHeight
    } else {
      return
    }

    if (!region.layerMaterials?.length) {
      return
    }

    for (const material of region.layerMaterials) {
      material.MacroBaseMap = region.baseMaterial.MacroBaseMap
      material.MacroNormalMap = region.baseMaterial.MacroNormalMap
      material.MacroGlossMap = region.baseMaterial.MacroGlossMap
      material.MacroNormalScale = 1 / region.mountainHeight
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

      const position = Vec3.$1.initFrom(renderNode.bounds.min)
      const mat = Mat4.createTranslation(position)
      mat.setScale({
        x: renderNode.size / p.region.leafSize,
        y: renderNode.size / p.region.leafSize,
        z: 1,
      })
      mesh.writeTransform(mat)

      const morphLod = Math.log2(renderNode.size / p.region.leafSize)
      mesh.writeParams1({
        x: QUAD_LEAF_SIZE,
        y: LOD_RANGE_FACTOR,
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

      computeUvTransform(renderNode, fineNode, Vec4.$0)
      mesh.writeColorUvTransform(Vec4.$0)

      computeUvTransform(renderNode, coarseNode, Vec4.$0)
      mesh.writeColorUvTransformCoarse(Vec4.$0)

      computeUvTransform(renderNode, renderNode.root, Vec4.$0)
      mesh.writeHeightUvTransform(Vec4.$0)

      computeUvTransform(coarseNode, renderNode.root, Vec4.$0)
      mesh.writeHeightUvTransformCoarse(Vec4.$0)

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
        tile.macroUvTransform.init(
          macroScale,
          -macroScale,
          node.rootGridX * macroScale,
          1.0 - node.rootGridY * macroScale,
        )

        const textureWorldSize = 1.0
        const colorScale = node.size / textureWorldSize
        tile.colorUvTransform.init(
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
      finalize: (_, err) => {
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
