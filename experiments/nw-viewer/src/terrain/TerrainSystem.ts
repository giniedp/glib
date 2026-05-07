import { BasicGame, MeshComponent, PriorityLane, TransformComponent } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import {
  beginGeometry,
  BlendState,
  buildParametricLines,
  buildParametricSurface,
  Color,
  CullState,
  DepthState,
  Device,
  Geometry,
  Mesh,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import {
  HEIGHTMAP_TILE_SIZE,
  LOD_RANGE_FACTOR,
  MATERIAL_TEXTURE_SIZE,
  QUAD_LEAF_SIZE,
  SHOW_TERRAIN_LINES,
} from '../constants'
import { SplatPackMaterial, TerrainCompositeMaterial, TerrainPatchMaterial, WaterPatchMaterial } from '../material'
import { ContentService } from '../services/content-service'
import { TerrainComponent } from './TerrainComponent'

import { Vec4 } from '@gglib/math'
import { TerraQuadState, type TerraQuad } from './TerrainRegion'
import { TerrainRegionComponent } from './TerrainRegionComponent'
import { TerrainTileManager, type TerrainTile } from './TerrainTileManager'

export class TerrainSystem extends GameSystem {
  private tQuery: GameQuery
  private game: BasicGame
  private device: Device
  private content: ContentService

  private geometry: Geometry
  private geometryWater: Geometry
  private geometryLines: Geometry
  private geometryDense: Geometry
  private geometryLinesDense: Geometry

  private tiles: TerrainTileManager
  private t1: Texture
  private t2: Texture
  private t3: Texture
  private combine: SplatPackMaterial
  private frameCounter = 0

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.game = world.getSystem(BasicGame)
    this.content = world.getSystem(ContentService)
    this.tQuery = world.query({ required: [TerrainComponent] })
    this.tiles = new TerrainTileManager(this.device)
    this.combine = new SplatPackMaterial(this.device)
    this.initializeResources()
  }

  public update(): void {
    this.frameCounter++
    this.tQuery.forEach(this.updateTerrain)
  }

  public destroy(): void {
    //
  }

  // #region Update Terrain Entity
  private updateTerrain = (ent: GameEntity) => {
    const regions = ent.component(TerrainComponent).regions
    const camera = this.game.view.camera
    const camX = -camera.world.translationX
    const camZ = camera.world.translationZ

    for (const region of regions) {
      this.updateRegionState(region.entity, camX, camZ)
    }

    for (const region of regions) {
      if (region.entity.isActive) {
        this.updateActiveRegion(region.entity, camX, camZ)
      }
    }
  }
  // #endregion

  // #region Update Region State
  private updateRegionState(entity: GameEntity, camX: number, camZ: number) {
    const component = entity.component(TerrainRegionComponent)

    const dx = component.region.root.centerX - camX
    const dz = component.region.root.centerZ - camZ
    const range = component.regionSize * 0.85
    const shouldActivate = Math.abs(dx) < range && Math.abs(dz) < range

    if (entity.isActive && !shouldActivate) {
      this.tearDownRegion(component)
      if (entity.canDeactivate) {
        entity.deactivate()
      }

      console.assert(!entity.isActive, 'Region should be deactivated')
      console.debug('Deactivated region', component.region.entity.name)
    } else if (!entity.isActive && shouldActivate) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      if (entity.canActivate) {
        entity.activate()
      }
      console.assert(entity.isActive, 'Region should be active')
      console.debug('Activated region', component.region.entity.name)
    }
  }

  // #endregion

  // #region Update Region
  private regionComponent: TerrainRegionComponent

  private updateActiveRegion(entity: GameEntity, camX: number, camY: number) {
    const component = entity.component(TerrainRegionComponent)
    this.regionComponent = component

    component.region.traverseRequiredSet(camX, camY, LOD_RANGE_FACTOR, (node) => {
      this.updateQuadState(node)
    })

    component.region.root.traverseTopDown((node) => {
      this.updateQuadEntity(node)
    })
  }

  private tearDownRegion(component: TerrainRegionComponent) {
    component.region.root.traverseTopDown(this.tearDownNode)
  }
  // #endregion

  // #region Update Quad State
  private updateQuadState(node: TerraQuad) {
    const p = node.data

    console.assert(p.required, 'Node should be required')

    p.state ??= TerraQuadState.Unloaded
    p.lastSeen = this.frameCounter
    p.tile ||= this.tiles.acquireTile()
    this.ensureQuadGeometry(node)

    switch (p.state) {
      case TerraQuadState.Unloaded: {
        if (node.size < HEIGHTMAP_TILE_SIZE) {
          console.assert(node.parent, 'Small node should have a parent')

          // small nodes will use ancestor heightmap
          // set to pending state and wait for ancestor to be ready
          p.state = TerraQuadState.HeightLoading
          break
        }

        // large nodes requires their own heightmap tile
        // but we postpone the request until parent is ready
        // to distribute the load across frames
        if (!node.parent || node.parent.data.state >= TerraQuadState.HeightReady) {
          p.state = TerraQuadState.HeightLoading
          this.requestHeightmap(node)
        }

        break
      }
      case TerraQuadState.HeightLoading: {
        if (node.size < HEIGHTMAP_TILE_SIZE) {
          // small nodes wait for ancestor's heightmap to be ready
          if (node.parent.data.state >= TerraQuadState.HeightReady) {
            p.state = TerraQuadState.HeightReady
          }
        } else {
          // large nodes are are handled through task
          console.assert(p.heightmapTask, 'Heightmap task should be scheduled')
        }

        break
      }
      case TerraQuadState.HeightReady: {
        // heightmap is ready, we can initiate material loading
        // we could propagate heightmap here, instead of doing it per frame udpate
        p.state = TerraQuadState.MaterialStale
        break
      }

      case TerraQuadState.MaterialStale: {
        p.state = TerraQuadState.MaterialLoading
        p.tile.renderVersion = this.regionComponent.materialVersion
        this.requestRender(node)
        break
      }
      case TerraQuadState.MaterialLoading: {
        // wait for material to be ready
        // state is updated in the render task
        break
      }
      case TerraQuadState.MaterialReady: {
        // mark as ready for rendering
        // we could propagate material to children here instead of doing it per frame update
        p.state = TerraQuadState.Ready
        break
      }

      case TerraQuadState.Ready:
        // ready to render, but always check if material is still valid
        if (p.tile.renderVersion !== this.regionComponent.materialVersion) {
          p.tile.renderVersion = this.regionComponent.materialVersion
          this.requestRender(node)
        }
        break
    }

    resolveHeightmapAncestor(node)
    resolveMaterialAncestor(node)
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
      if (p.lastSeen && this.frameCounter - p.lastSeen > 60) {
        this.unloadQuad(node)
      }
      return
    }

    const nodeSize = node.size
    const leafSize = p.region.leafSize
    const transform = entity.getTransform<TransformComponent>()
    transform.setScaleXYZ(nodeSize / leafSize, 1, nodeSize / leafSize)
    transform.updateIfNeeded()

    this.updateQuadMaterial(node)
  }
  // #endregion

  // #region Update Quad Material
  private updateQuadMaterial(node: TerraQuad) {
    const component = node.data.entity.component(MeshComponent)
    const material = component.mesh.materials[0] as TerrainPatchMaterial
    const p = node.data

    // ---
    // Heightmap
    // ---

    let quadFine: TerraQuad = node
    let quadCoarse: TerraQuad = node
    if (p.heightmapAncestor && p.state >= TerraQuadState.HeightReady) {
      // ready, but we have an ancestor, probably because we are a small node
      // use ancestor for fine layer and it's parent for coarse
      quadFine = p.heightmapAncestor
      quadCoarse = quadFine.parent || quadFine
    } else if (p.heightmapAncestor) {
      // not ready, fallback to ancestor for both layers
      quadFine = p.heightmapAncestor
      quadCoarse = p.heightmapAncestor
    } else if (node.size >= HEIGHTMAP_TILE_SIZE) {
      // ready, use own heightmap and parent for coarse layer
      quadFine = node
      quadCoarse = node.parent || node
    }

    material.HeightMap = quadFine.data.heightmap ?? this.content.blackPixel
    material.HeightMapCoarse = quadCoarse.data.heightmap ?? this.content.blackPixel
    computeUvTransform(node, quadFine, material.HeightMapUvTransform)
    computeUvTransform(node, quadCoarse, material.HeightMapUvTransformCoarse)

    // 0 at leaf level, increase by 1 for each level up
    material.MorphLod = Math.log2(node.size / p.region.leafSize)
    console.assert(material.MorphLod >= 0, 'LOD should be non-negative')

    // sync heightmap to water and line materials if present
    for (let i = 1; i < component.mesh.materials.length; i++) {
      const mtl = component.mesh.materials[i] as TerrainPatchMaterial | WaterPatchMaterial
      mtl.HeightMap = material.HeightMap
      mtl.HeightMapUvTransform.initFrom(material.HeightMapUvTransform)
      if ('MorphLod' in mtl) {
        mtl.MorphLod = material.MorphLod
      }
    }

    // ---
    // Material maps
    // ---

    quadFine = node
    quadCoarse = node

    if (p.materialAncestor) {
      // not ready, fallback to ancestor for both layers
      quadFine = p.materialAncestor
      quadCoarse = p.materialAncestor
    } else {
      // ready, use our own material maps
      // and parent for coarse layer
      quadFine = node
      quadCoarse = node.parent || node
    }

    material.ColorMap1 = quadFine.data.tile.texture1 || this.content.nullBaseMap
    material.ColorMap2 = quadFine.data.tile.texture2 || this.content.nullBaseMap
    computeUvTransform(node, quadFine, material.ColorMapUvTransform)

    material.ColorMap1Coarse = quadCoarse.data.tile.texture1 || this.content.nullBaseMap
    material.ColorMap2Coarse = quadCoarse.data.tile.texture2 || this.content.nullBaseMap
    computeUvTransform(node, quadCoarse, material.ColorMapUvTransformCoarse)
  }
  // #endregion

  // #region create assets
  private initializeResources() {
    this.t1 = this.device.createRenderTarget({
      format: 'RGBA8_UNORM',
      width: MATERIAL_TEXTURE_SIZE,
      height: MATERIAL_TEXTURE_SIZE,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      mipLevelCount: 1,
      generateMipmap: false,
    })
    this.t2 = this.device.createRenderTarget({
      format: 'RGBA8_UNORM',
      width: MATERIAL_TEXTURE_SIZE,
      height: MATERIAL_TEXTURE_SIZE,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      mipLevelCount: 1,
      generateMipmap: false,
    })
    this.t3 = this.device.createRenderTarget({
      format: 'RGBA8_UNORM',
      width: MATERIAL_TEXTURE_SIZE,
      height: MATERIAL_TEXTURE_SIZE,
      usage: TextureUsage.Sampled | TextureUsage.RenderTarget,
      mipLevelCount: 1,
      generateMipmap: false,
    })

    this.geometry = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      lines: false,
    })
    this.geometryDense = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 2,
      lines: false,
    })

    this.geometryLines = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      yOffset: 0.5,
      lines: true,
    })
    this.geometryLinesDense = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 2,
      yOffset: 0.5,
      lines: true,
    })
    this.geometryWater = createQuadGeometry(this.device, {
      size: QUAD_LEAF_SIZE,
      vertexPerUnit: 1,
      lines: false,
    })

    this.geometry.materialId = 0
    this.geometryDense.materialId = 0
    this.geometryWater.materialId = 1
    this.geometryLines.materialId = 2
    this.geometryLinesDense.materialId = 2
  }

  private createMesh(node: TerraQuad) {
    const waterMaterial = new WaterPatchMaterial(this.device)
    const quadMaterial = new TerrainPatchMaterial(this.device)
    const linesMaterial = new TerrainPatchMaterial(this.device)

    quadMaterial.effect.cullState = CullState.CullFront
    quadMaterial.HeightMap = this.content.blackPixel
    quadMaterial.HeightMapCoarse = this.content.blackPixel
    quadMaterial.ColorMap1 = this.content.blackPixel
    quadMaterial.ColorMap2 = this.content.blackPixel
    quadMaterial.ColorMap1Coarse = this.content.blackPixel
    quadMaterial.ColorMap2Coarse = this.content.blackPixel

    linesMaterial.HeightMap = this.content.blackPixel
    linesMaterial.HeightMapCoarse = this.content.blackPixel
    linesMaterial.ColorMap1 = this.content.nullPathMap1
    linesMaterial.ColorMap2 = this.content.nullPathMap2
    linesMaterial.ColorMap1Coarse = this.content.nullPathMap1
    linesMaterial.ColorMap2Coarse = this.content.nullPathMap2
    linesMaterial.Lines = 1

    waterMaterial.effect.cullState = CullState.None
    waterMaterial.effect.blendState = BlendState.Alpha

    linesMaterial.effect.cullState = CullState.CullFront
    linesMaterial.effect.blendState = BlendState.Alpha
    if (!SHOW_TERRAIN_LINES) {
      linesMaterial.effect.depthState = DepthState.Never
    }

    const dense = false // node.size === QUAD_LEAF_SIZE
    return new Mesh(this.device, {
      // parts: dense
      //   ? [this.geometryDense, this.geometryWater, this.geometryLinesDense]
      //   : [this.geometry, this.geometryWater, this.geometryLines],
      parts: [this.geometry, this.geometryWater, this.geometryLines],
      materials: [quadMaterial, waterMaterial, linesMaterial],
    })
  }

  // #endregion

  // #region helper functions
  private getHeightmapUrl(node: TerraQuad) {
    const levelID = this.regionComponent.level
    const lod = Math.log2(node.size / HEIGHTMAP_TILE_SIZE)
    const x = node.worldGridX * Math.pow(2, lod)
    const y = node.worldGridZ * Math.pow(2, lod)
    // border: add 1px, so instead of 256x256 it's 257x257
    // normals: encodes normals XY component in BA channel
    return `${this.content.nwbtUrl}/level/${levelID}/heightmap/${lod + 1}_${y}_${x}.png?border&normals`
  }

  private requestHeightmap(node: TerraQuad) {
    console.assert(node.size >= HEIGHTMAP_TILE_SIZE, 'Should not request heightmap for small nodes')

    const p = node.data

    // Cancel any pending task, we will request a new one for the new URL
    if (p.heightmapTask) {
      p.heightmapTask.cancelled = true
      p.heightmapTask = null
    }

    const task = this.content.scheduler.schedule({
      lane: PriorityLane.High,
      entity: p.entity,
      load: async () => {
        const url = this.getHeightmapUrl(node)
        const texture = await this.content.loadTexture(url)
        if (p.heightmapTask !== task) {
          // task cancelled or replaced by another request
          texture.dispose()
        } else {
          p.heightmap = texture
          p.state = TerraQuadState.HeightReady
          p.heightmapTask = null
        }
      },
    })

    p.heightmapTask = task
    p.state = TerraQuadState.HeightLoading
  }

  private requestRender(node: TerraQuad) {
    const p = node.data

    if (p.materialRenderTask) {
      p.materialRenderTask.cancelled = true
      p.materialRenderTask = null
    }

    const tile = node.data.tile
    const macroScale = node.size / node.getRoot().size
    const isMacro = node.size >= 256
    const texelDensity = isMacro ? 4 : 16 // repeats per leafSize in world space
    const lodScale = node.size / p.region.leafSize // 1 at LOD0, 0.5 at LOD1, 0.25 at LOD2
    const scale = texelDensity * lodScale

    // prettier-ignore
    tile.macroUvTransform.init(
      macroScale,
      -macroScale,
      node.rootGridX * macroScale,
      1.0 - node.rootGridZ * macroScale,
    )

    tile.tileUvTransform.init(
      scale, // scale UV down as patch grows
      scale,
      (node.bounds.min.x / node.size) * texelDensity, // offset follows same scale
      (node.bounds.min.z / node.size) * texelDensity,
    )

    p.state = TerraQuadState.MaterialLoading
    p.materialRenderTask = this.content.scheduler.schedule({
      lane: PriorityLane.Medium,
      entity: p.entity,
      work: () => {
        const tile = node.data.tile
        const baseMaterial = this.regionComponent.macroMaterial
        const layerMaterials = this.regionComponent.layerMaterials
        renderTileData(this.device, tile, baseMaterial, layerMaterials, this.combine, this.t1, this.t2, this.t3)
        return true
      },
      onDone: () => {
        p.state = TerraQuadState.MaterialReady
        p.materialRenderTask = null
      },
    })
  }

  private ensureQuadGeometry(node: TerraQuad) {
    const payload = node.data
    const component = payload.entity.component(MeshComponent)
    if (component.mesh) {
      return
    }
    component.mesh = this.createMesh(node)
  }

  private tearDownNode = (node: TerraQuad) => {
    const p = node.data

    this.unloadQuad(node)
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

    if (p.heightmap) {
      p.heightmap.dispose()
      p.heightmap = null
    }

    if (p.materialRenderTask) {
      p.materialRenderTask.cancelled = true
      p.materialRenderTask = null
    }

    if (p.heightmapTask) {
      p.heightmapTask.cancelled = true
      p.heightmapTask = null
    }

    const mesh = p.entity.component(MeshComponent).mesh
    for (const mtl of mesh?.materials || []) {
      if (mtl instanceof TerrainPatchMaterial) {
        mtl.ColorMap1 = this.content.blackPixel
        mtl.ColorMap2 = this.content.blackPixel
        mtl.ColorMap1Coarse = this.content.blackPixel
        mtl.ColorMap2Coarse = this.content.blackPixel
        mtl.HeightMap = this.content.blackPixel
        mtl.HeightMapCoarse = this.content.blackPixel
      }
      if (mtl instanceof WaterPatchMaterial) {
        mtl.HeightMap = this.content.blackPixel
      }
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
      uSteps: size * vertexPerUnit,
      vSteps: size * vertexPerUnit,
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

function renderTileData(
  device: Device,
  tile: TerrainTile,
  baseMaterial: TerrainCompositeMaterial,
  layerMaterials: TerrainCompositeMaterial[],
  combine: SplatPackMaterial,
  t1: Texture,
  t2: Texture,
  t3: Texture,
) {
  const pass = device.renderPass
  pass.flush()
  pass.setRenderTarget(0, t1)
  pass.setRenderTarget(1, t2)
  pass.setRenderTarget(2, t3)
  pass.setClearColor(0, Color.White) // base color
  pass.setClearColor(1, Color.Black)
  pass.setClearColor(2, Color.LimeGreen) // normal
  pass.setRenderBlend(0, BlendState.AlphaPremultiplied)
  pass.setRenderBlend(1, BlendState.AlphaPremultiplied)
  pass.setRenderBlend(2, BlendState.AlphaPremultiplied)
  pass.setViewportState(0, 0, t1.width, t1.height)
  pass.clear()

  if (baseMaterial) {
    baseMaterial.RegionScaleOffset.initFrom(tile.macroUvTransform)
    baseMaterial.TilingScaleOffset.initFrom(tile.tileUvTransform)
    baseMaterial.effect.commit(baseMaterial.inputs)
    pass.setProgram(baseMaterial.effect.program)
    pass.draw(3)
  }

  for (const material of layerMaterials || []) {
    material.BaseMap.width
    material.RegionScaleOffset.initFrom(tile.macroUvTransform)
    material.TilingScaleOffset.initFrom(tile.tileUvTransform)
    material.effect.commit(material.inputs)
    pass.setProgram(material.effect.program)
    pass.draw(3)
  }

  pass.setRenderTarget(0, tile.texture1)
  pass.setRenderTarget(1, tile.texture2)
  pass.setRenderTarget(2, null)
  pass.setRenderBlend(0, BlendState.Opaque)
  pass.setRenderBlend(1, BlendState.Opaque)
  pass.setClearColor(0, Color.White) // base color
  pass.setClearColor(1, Color.Black)
  pass.setViewportState(0, 0, tile.texture1.width, tile.texture1.height)
  pass.clear()
  combine.Tile1Map = t1
  combine.Tile2Map = t2
  combine.Tile3Map = t3
  combine.effect.commit(combine.inputs)
  pass.setProgram(combine.effect.program)
  pass.draw(3)

  pass.flush()

  tile.texture1.updateMipmaps()
  tile.texture2.updateMipmaps()
}

export function resolveHeightmapAncestor(node: TerraQuad) {
  const p = node.data

  if (p.state === TerraQuadState.Ready && node.size >= HEIGHTMAP_TILE_SIZE) {
    // ready and has its own heightmap, no ancestor needed
    p.heightmapAncestor = null

    return
  }

  // Walk up to find the nearest ready ancestor, that also has a heightmap
  // small nodes always rely on ancestor's heightmap, but mark themselves as ready

  let ancestor = node.parent
  while (ancestor) {
    if (ancestor.data.state === TerraQuadState.Ready && ancestor.size >= HEIGHTMAP_TILE_SIZE) {
      p.heightmapAncestor = ancestor

      return
    }
    ancestor = ancestor.parent
  }

  p.heightmapAncestor = null
}

export function resolveMaterialAncestor(node: TerraQuad) {
  const p = node.data

  if (p.state === TerraQuadState.Ready) {
    p.materialAncestor = null
    return
  }

  // Walk up to find the nearest ready ancestor
  let ancestor = node.parent
  while (ancestor) {
    if (ancestor.data.state === TerraQuadState.Ready) {
      p.materialAncestor = ancestor
      return
    }
    ancestor = ancestor.parent
  }

  p.materialAncestor = null
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
