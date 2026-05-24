import { BasicGame, PriorityLane, SchedulerSystem, TransformComponent } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { LOD_RANGE_FACTOR, QUAD_LEAF_SIZE, SEGMENT_SIZE } from '../../constants'
import { ContentService } from '../../content'
import { TerrainComponent } from './TerrainComponent'

import { Mat4, Vec4, type IVec4 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { TerrainMesh } from './TerrainMesh'
import { TerraQuadState, type TerraQuad } from './TerrainRegion'
import { TerrainRegionComponent } from './TerrainRegionComponent'
import { TerrainTileManager } from './TerrainTileManager'

export class TerrainSystem extends GameSystem {
  private terrainQuery: GameQuery

  private game: BasicGame
  private device: Device
  private content: ContentService
  private scheduler: SchedulerSystem

  private tiles: TerrainTileManager
  private renderList: TerraQuad[] = []

  private frame = 0
  private terrainCount = 0

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.game = world.getSystem(BasicGame)
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.terrainQuery = world.query({ required: [TerrainComponent] })
  }

  public update(): void {
    this.frame++
    this.terrainCount = 0
    for (const entity of this.terrainQuery) {
      this.terrainCount++
      this.tiles ||= new TerrainTileManager(this.device)
      this.updateTerrain(entity)
    }
    if (this.terrainCount === 0) {
      this.tiles?.dispose()
      this.tiles = undefined
    }
  }

  public destroy(): void {
    this.tiles?.dispose()
  }

  // #region Update Terrain Entity

  private updateTerrain(ent: GameEntity) {
    const terrain = ent.component(TerrainComponent)
    if (!terrain.meshComponent.mesh) {
      const mesh = new TerrainMesh(this.device, { size: QUAD_LEAF_SIZE })
      mesh.TerrainMaterial.ColorMap1 = this.tiles.colorMap1
      mesh.TerrainMaterial.ColorMap2 = this.tiles.colorMap2
      mesh.TerrainMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.WaterMaterial.HeightMap = this.content.nullHeightmapArray

      terrain.meshComponent.mesh = mesh
    }

    const camera = this.game.view.camera

    for (const region of terrain.regions) {
      if (region.entity) {
        this.updateRegionState(region.entity, camera)
      }
    }

    this.updateRenderList(terrain)
  }

  private updateRenderList(terrain: TerrainComponent) {
    this.renderList.length = 0
    terrain.renderRegions.length = 0

    for (const region of terrain.regions) {
      if (!region.entity || !region.entity.isActive) {
        continue
      }

      if (!region.heightmap) {
        continue
      }

      terrain.renderRegions.push(region)

      for (const node of region.region.tree.flatPreOrdered) {
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
      mesh.writeTransform(p.entity.getTransform().world)

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

  // #region Update Region State
  private updateRegionState(entity: GameEntity, camera: CameraData) {
    const component = entity.component(TerrainRegionComponent)

    const pX = camera.world.translationX
    const pY = camera.world.translationY

    const regionSize = component.regionSize
    const minX = component.region.tree.bounds.min.x
    const maxX = component.region.tree.bounds.max.x
    const minY = component.region.tree.bounds.min.y
    const maxY = component.region.tree.bounds.max.y

    const dx = Math.max(minX - pX, 0, pX - maxX)
    const dy = Math.max(minY - pY, 0, pY - maxY)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const visibleAt = regionSize * 0.5 - SEGMENT_SIZE
    const invisibleAt = regionSize * 0.5

    if (entity.isActive && distance >= invisibleAt) {
      this.tearDownRegion(component)
      if (entity.canDeactivate) {
        entity.deactivate()
      }

      console.assert(!entity.isActive, 'Region should be deactivated')
      console.debug('Deactivated region', component.region.entity.name)
    } else if (!entity.isActive && distance <= visibleAt) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      if (entity.canActivate) {
        entity.activate()
      }
      console.assert(entity.isActive, 'Region should be active')
      console.debug('Activated region', component.region.entity.name)
    }

    if (!entity.isActive) {
      return
    }

    component.region.traverseRequiredSet(camera, LOD_RANGE_FACTOR, (node) => {
      this.updateQuadState(node, component)
    })

    for (const node of component.region.tree.flatPreOrdered) {
      this.updateQuadEntity(node)
    }
  }

  private tearDownRegion(component: TerrainRegionComponent) {
    for (const node of component.region.tree.flatPreOrdered) {
      this.unloadQuad(node)
    }
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
    const entity = p.entity

    if (entity.canInitialize) {
      entity.initialize()
    }

    const canRender = p.visible

    if (entity.isActive && !canRender) {
      entity.deactivate()
      console.assert(!p.entity.isActive, 'Node should be deactivated')
    }

    if (!entity.isActive && canRender) {
      entity.activate()
      console.assert(p.entity.isActive, 'Node should be active')
    }

    if (!entity.isActive) {
      if (p.lastSeen && this.frame - p.lastSeen > 60) {
        this.unloadQuad(node)
      }
      return
    }

    const nodeSize = node.size
    const leafSize = p.region.leafSize
    const transform = entity.getTransform<TransformComponent>()
    transform.setScaleUniform(nodeSize / leafSize)
    transform.updateIfNeeded()
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
      entity: p.entity,
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
      onDone: () => {
        p.state = TerraQuadState.MaterialReady
        p.materialRenderTask = null
      },
    })
  }

  private unloadQuad = (node: TerraQuad) => {
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
