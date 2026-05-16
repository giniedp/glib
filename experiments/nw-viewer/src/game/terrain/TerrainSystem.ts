import { BasicGame, PriorityLane, SchedulerSystem, TransformComponent } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import {
  beginGeometry,
  BlendState,
  buildParametricLines,
  buildParametricSurface,
  CullState,
  DepthState,
  Device,
  Geometry,
  Mesh,
} from '@gglib/graphics'
import { LOD_RANGE_FACTOR, QUAD_LEAF_SIZE, SEGMENT_SIZE, SHOW_TERRAIN_LINES } from '../../constants'
import { ContentService } from '../../content'
import { TerrainPatchMaterial, WaterPatchMaterial } from '../../material'
import { TerrainBufferLayout, TerrainComponent } from './TerrainComponent'

import { Vec4 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { TerraQuadState, type TerraQuad } from './TerrainRegion'
import { TerrainRegionComponent } from './TerrainRegionComponent'
import { TerrainTileManager } from './TerrainTileManager'

export class TerrainSystem extends GameSystem {
  private terrainQuery: GameQuery

  private game: BasicGame
  private device: Device
  private content: ContentService
  private scheduler: SchedulerSystem

  private geometry: Geometry
  private geometryWater: Geometry
  private geometryLines: Geometry

  private tiles: TerrainTileManager
  private renderList: TerraQuad[] = []

  private tmpV3 = Vec4.create()
  private frame = 0
  private terrainCount = 0

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.game = world.getSystem(BasicGame)
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.terrainQuery = world.query({ required: [TerrainComponent] })

    this.initializeResources()
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
    this.geometry?.dispose()
    this.geometryWater?.dispose()
    this.geometryLines?.dispose()
  }

  // #region Update Terrain Entity

  private updateTerrain(ent: GameEntity) {
    const terrain = ent.component(TerrainComponent)
    if (!terrain.meshComponent.mesh) {
      const mesh = this.createMesh().enableInstancing({
        capacity: 1000,
        layout: TerrainBufferLayout,
        buffer: this.device.createBuffer({
          name: 'Terrain Instance Buffer',
          type: 'StorageBuffer',
        }),
      })
      mesh.instances.setCount(1)
      mesh.instances.commit(true)
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

    const mesh = terrain.meshComponent.mesh
    const hmMaterial = mesh.materials[0] as TerrainPatchMaterial
    const wmMaterial = mesh.materials[1] as WaterPatchMaterial
    hmMaterial.HeightMap = terrain.heightmap.texture
    wmMaterial.HeightMap = terrain.heightmap.texture

    mesh.instances.setCount(this.renderList.length)

    let actualCount = 0
    for (const renderNode of this.renderList) {
      const p = renderNode.data

      const fineNode = p.state >= TerraQuadState.Ready ? renderNode : resolveReadyAncestor(renderNode)
      if (!fineNode || !fineNode.data.tile) {
        continue
      }

      const coarseNode = resolveReadyAncestor(fineNode) ?? fineNode
      const fineReady = fineNode === renderNode
      const coarseReady = coarseNode !== fineNode

      mesh.instances.writeFieldMat4(actualCount, 'transform', p.entity.getTransform().world)

      const morphLod = Math.log2(renderNode.size / p.region.leafSize)
      mesh.instances.writeFieldVec4(actualCount, 'params1', {
        x: QUAD_LEAF_SIZE,
        y: LOD_RANGE_FACTOR,
        z: morphLod,
        w: 0,
      })

      mesh.instances.writeFieldVec4(actualCount, 'params2', {
        x: fineNode.data.tile.slot.layer,
        y: coarseNode.data.tile.slot.layer,
        z: fineReady ? 1 : 0,
        w: coarseReady ? 1 : 0,
      })

      mesh.instances.writeFieldVec4(actualCount, 'params3', {
        x: terrain.getNeighbourLayer(p.region, 0, 0),
        y: terrain.getNeighbourLayer(p.region, 1, 0), // +X,
        z: terrain.getNeighbourLayer(p.region, 0, 1), // +Z,
        w: terrain.getNeighbourLayer(p.region, 1, 1), // +X+Z corner,
      })

      computeUvTransform(renderNode, fineNode, this.tmpV3)
      mesh.instances.writeFieldVec4(actualCount, 'colorUvTransform', this.tmpV3)

      computeUvTransform(renderNode, coarseNode, this.tmpV3)
      mesh.instances.writeFieldVec4(actualCount, 'colorUvTransformCoarse', this.tmpV3)

      computeUvTransform(renderNode, renderNode.root, this.tmpV3)
      mesh.instances.writeFieldVec4(actualCount, 'heightUvTransform', this.tmpV3)

      computeUvTransform(coarseNode, renderNode.root, this.tmpV3)
      mesh.instances.writeFieldVec4(actualCount, 'heightUvTransformCoarse', this.tmpV3)

      actualCount++
    }
    mesh.instances.setCount(actualCount)
  }

  // #endregion

  // #region Update Region State
  private updateRegionState(entity: GameEntity, camera: CameraData) {
    const component = entity.component(TerrainRegionComponent)

    const pX = -camera.world.translationX
    const pY = camera.world.translationZ

    const regionSize = component.regionSize
    const minX = component.region.tree.bounds.min.x
    const maxX = component.region.tree.bounds.max.x
    const minY = component.region.tree.bounds.min.z
    const maxY = component.region.tree.bounds.max.z

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
    transform.setScaleXYZ(nodeSize / leafSize, 1, nodeSize / leafSize)
    transform.updateIfNeeded()
  }
  // #endregion

  // #region create assets
  private initializeResources() {
    this.geometry = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      lines: false,
    })

    this.geometryLines = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      yOffset: 0.5,
      lines: true,
    })

    this.geometryWater = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      lines: false,
    })

    this.geometry.materialId = 0
    this.geometryLines.materialId = 1
    this.geometryWater.materialId = 1
  }

  private createMesh() {
    const waterMaterial = new WaterPatchMaterial(this.device)
    const patchMaterial = new TerrainPatchMaterial(this.device)
    const linesMaterial = new TerrainPatchMaterial(this.device)

    patchMaterial.effect.cullState = CullState.CullFront
    patchMaterial.HeightMap = this.content.nullHeightmapArray
    patchMaterial.ColorMap1 = this.tiles.colorMap1
    patchMaterial.ColorMap2 = this.tiles.colorMap2

    linesMaterial.HeightMap = this.content.nullHeightmapArray
    linesMaterial.ColorMap1 = this.tiles.colorMap1
    linesMaterial.ColorMap2 = this.tiles.colorMap2
    linesMaterial.Lines = 1

    waterMaterial.effect.cullState = CullState.None
    waterMaterial.effect.blendState = BlendState.Alpha
    waterMaterial.HeightMap = this.content.nullHeightmapArray

    linesMaterial.effect.cullState = CullState.CullFront
    linesMaterial.effect.blendState = BlendState.Alpha
    if (!SHOW_TERRAIN_LINES) {
      linesMaterial.effect.depthState = DepthState.Never
    }

    return new Mesh(this.device, {
      parts: [
        this.geometry,
        // this.geometryLines,
        this.geometryWater,
      ],
      materials: [
        patchMaterial,
        // linesMaterial,
        waterMaterial,
      ],
    })
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
          1.0 - node.rootGridZ * macroScale,
        )

        const textureWorldSize = 1.0
        const colorScale = node.size / textureWorldSize
        tile.colorUvTransform.init(
          colorScale, // scale UV down as patch grows
          colorScale,
          (node.bounds.min.x / node.size) * colorScale, // offset follows same scale
          (node.bounds.min.z / node.size) * colorScale,
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

export interface QuadGeomOptions {
  size: number
  yOffset?: number
  vertexPerUnit?: number
  lines?: boolean
}

function createQuadGeometry(device: Device, { size, yOffset = 0, vertexPerUnit = 1, lines = false }: QuadGeomOptions) {
  return beginGeometry({
    layout: [['position', 'normal', 'texture']],
  })
    .append(lines ? buildParametricLines : buildParametricSurface, {
      uSegments: size * vertexPerUnit,
      vSegments: size * vertexPerUnit,
      position: (u: number, v: number) => {
        return {
          x: -u * size,
          y: yOffset,
          z: v * size,
        }
      },
      texture: (u: number, v: number) => {
        return {
          x: u,
          y: 1 - v,
        }
      },
    })
    .endGeometry(device, {
      primitiveType: lines ? 'LineList' : 'TriangleList',
    })
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

export function computeUvTransform(childNode: TerraQuad, ancestorNode: TerraQuad, output: Vec4) {
  const child = childNode.bounds
  const ancestor = ancestorNode.bounds

  const invW = 1 / (ancestor.max.x - ancestor.min.x)
  const invH = 1 / (ancestor.max.z - ancestor.min.z)

  const scaleX = (child.max.x - child.min.x) * invW
  const offsetX = (child.min.x - ancestor.min.x) * invW

  // HINT: y is flipped in UV space, so we use max.z for offset and scale based on height
  const scaleZ = (child.max.z - child.min.z) * invH
  const offsetZ = (ancestor.max.z - child.max.z) * invH

  output.init(scaleX, scaleZ, offsetX, offsetZ)
}
