import {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  Effect,
  Geometry,
  Material,
  Program,
  ProgramInputBlock,
  Renderable,
  RenderEncoder,
  RenderVariant,
} from '@gglib/graphics'
import {
  IVec4,
  Mat4,
  mat4GetRow,
  mat4GetTranslation,
  mat4GetTranslationX,
  mat4GetTranslationY,
  mat4GetTranslationZ,
} from '@gglib/math'
import { RenderInstanceWriter } from './RenderInstanceWriter'
import { compareSortKey, RenderListMode, Sortable, SortKey } from './RenderListMode'
import { RenderView } from './Types'

/**
 * Render lists of a frame, one per list mode and material effect variant.
 *
 * The effect of each item is resolved for a variant when the list is collected (it decides the sort state and
 * the batches), so a list collected for one variant can't be reused by a pass that renders another variant.
 */
export class RenderListCache {
  private lists = new Map<RenderListMode, Map<RenderVariant, RenderList>>()

  /**
   * Clears all render lists in the cache. This should be called at the beginning of each frame, before rendering.
   */
  public clear() {
    for (const byVariant of this.lists.values()) {
      for (const list of byVariant.values()) {
        list.clear()
        list.isSorted = false
      }
    }
  }

  public get(mode: RenderListMode, variant: RenderVariant = RenderVariant.Forward): RenderList {
    let byVariant = this.lists.get(mode)
    if (!byVariant) {
      byVariant = new Map()
      this.lists.set(mode, byVariant)
    }
    let list = byVariant.get(variant)
    if (!list) {
      list = new RenderList()
      byVariant.set(variant, list)
    }
    return list
  }

  public sumDrawCount(): number {
    let size = 0
    for (const byVariant of this.lists.values()) {
      for (const list of byVariant.values()) {
        size += list.drawCount
      }
    }
    return size
  }
}

export class RenderList {
  public size: number = 0
  public isSorted: boolean
  public isBatched: boolean
  public drawCount = 0

  protected mode: RenderListMode

  protected keysHi: number[] = []
  protected keysLo: number[] = []
  protected key: SortKey = { hi: 0, lo: 0 }
  protected indices: number[] = []
  protected items: Renderable[] = []
  protected effect: Effect[] = []
  protected transforms: Mat4[] = []
  protected instanceData: Array<Float32Array<ArrayBuffer>> = []
  protected inputs: Array<Record<string, ProgramInputBlock>> = []
  /**
   * Instance range of entries that are already batched, see {@link addInstanced}. A count of 0 marks a regular entry.
   */
  protected rangeOffset: number[] = []
  protected rangeCount: number[] = []
  /**
   * Layer of each entry, from the last {@link getKey}
   */
  protected layers: number[] = []

  protected item: Sortable = {
    depth: 0,
    material: 0,
    layer: 0,
    state: 0,
    geometry: 0,
    order: 0,
  }

  protected drawIndices: number[] = []

  protected drawInstanceOffset: number[] = []
  protected drawInstanceCount: number[] = []
  /**
   * Stencil reference per draw, -1 leaves it unchanged (see {@link RenderListLayers.stencilReference})
   */
  protected drawStencil: number[] = []

  protected viewForward: IVec4
  protected viewInputs: Record<string, ProgramInputBlock>
  protected viewRange: number
  protected instances: RenderInstanceWriter

  public begin(
    mode: RenderListMode,
    view: RenderView,
    viewInputs: Record<string, ProgramInputBlock>,
    instances: RenderInstanceWriter,
  ): void {
    this.mode = mode
    this.viewForward = mat4GetRow(view.camera.view, 2, this.viewForward)
    this.viewInputs = viewInputs
    this.viewRange = view.camera.far - view.camera.near
    this.instances = instances
    this.instances.begin() // creates buffers if
    this.clear()
  }

  public getDepth(world: Mat4): number {
    mat4GetTranslation
    const depth = -(
      this.viewForward.x * mat4GetTranslationX(world) +
      this.viewForward.y * mat4GetTranslationY(world) +
      this.viewForward.z * mat4GetTranslationZ(world) +
      this.viewForward.w
    )

    // normalize to [0,1]
    const d = depth / this.viewRange

    return d < 0 ? 0 : d > 1 ? 1 : d
  }

  public getState(
    blendState?: BlendState,
    depthState?: DepthState,
    offsetState?: DepthBiasState,
    cullState?: CullState,
  ): number {
    let id = 0
    // TODO:
    if (blendState) {
      id |= blendState.id
    }
    if (depthState) {
      id |= depthState.id << 8
    }
    if (offsetState) {
      id |= offsetState.id << 16
    }
    if (cullState) {
      id |= cullState.id << 24
    }
    return id
  }

  /**
   * The effect a material is listed with, null if the list skips the material (see {@link RenderListMode.getEffect})
   */
  public getEffect(material: Material, variant: RenderVariant): Effect | null {
    return this.mode.getEffect(material, variant)
  }

  public getKey(depth: number, layer: number, material: number, state: number, geometry: number, order = 0) {
    this.item.depth = depth
    this.item.layer = layer
    this.item.material = material
    this.item.state = state
    this.item.geometry = geometry
    this.item.order = order
    // the returned key is reused, it must be passed to add() before the next call
    return this.mode.getKey(this.item, this.key)
  }

  public add(
    key: SortKey,
    item: Renderable,
    effect: Effect | null,
    inputs: Record<string, ProgramInputBlock>,
    transform: Mat4,
    instanceData: Float32Array<ArrayBuffer>,
  ): void {
    if (effect && !effect.isReady) {
      // effect is not ready, skip this item for now. It will be added in the next frame when the effect is ready.
      return
    }
    const index = this.size++
    this.items[index] = item
    this.effect[index] = effect
    this.inputs[index] = inputs
    this.keysHi[index] = key.hi
    this.keysLo[index] = key.lo
    this.indices[index] = index
    this.transforms[index] = transform
    this.instanceData[index] = instanceData
    this.rangeCount[index] = 0
    this.layers[index] = this.item.layer
  }

  /**
   * Adds a draw whose instances are already written to the instance buffers, e.g. into a range
   * from {@link RenderInstanceWriter.reserve}. The entry is drawn as is and is not merged with other entries.
   *
   * @remarks
   * The effect must read its transforms from the per instance buffer, other effects are skipped.
   */
  public addInstanced(
    key: SortKey,
    geometry: Geometry,
    effect: Effect,
    inputs: Record<string, ProgramInputBlock>,
    instanceOffset: number,
    instanceCount: number,
  ): void {
    if (!effect.isReady || instanceCount <= 0) {
      return
    }
    const index = this.size++
    this.items[index] = geometry
    this.effect[index] = effect
    this.inputs[index] = inputs
    this.keysHi[index] = key.hi
    this.keysLo[index] = key.lo
    this.indices[index] = index
    this.transforms[index] = null
    this.instanceData[index] = null
    this.rangeOffset[index] = instanceOffset
    this.rangeCount[index] = instanceCount
    this.layers[index] = this.item.layer
  }

  /**
   * CPU time in ms of the last sort, measured by {@link end}
   */
  public sortTime = 0
  /**
   * CPU time in ms of the last batch, measured by {@link end}
   */
  public batchTime = 0

  public end(): void {
    this.sortTime = 0
    this.batchTime = 0
    if (!this.isSorted) {
      const t0 = performance.now()
      this.indices.length = this.size
      this.indices.sort(this.sortBy)
      this.isSorted = true
      this.sortTime = performance.now() - t0
    }
    if (!this.isBatched) {
      const t0 = performance.now()
      this.batch()
      this.isBatched = true
      this.batchTime = performance.now() - t0
    }
  }

  private sortBy = (a: number, b: number) => {
    return compareSortKey(this.keysHi[a], this.keysLo[a], this.keysHi[b], this.keysLo[b])
  }

  private batch() {
    let index = 0
    let item: Renderable
    let effect: Effect
    let inputs: Record<string, ProgramInputBlock>
    let transform: Mat4
    let instance: Float32Array<ArrayBuffer>
    let program: Program

    // current geometry that will receive instancing parameters
    let instanceItem: Geometry
    let instanceEffect: Effect

    // continue behind the instances of lists that were batched before in this frame
    let instanceOffset = this.instances.count
    this.drawCount = 0

    const stencilReference = this.mode.stencilReference
    let stencil = -1
    let instanceStencil = -1

    for (let i = 0; i < this.size; i++) {
      index = this.indices[i]
      item = this.items[index]
      effect = this.effect[index]
      inputs = this.inputs[index]
      transform = this.transforms[index]
      instance = this.instanceData[index]
      stencil = stencilReference ? stencilReference(this.layers[index]) : -1
      if (!effect) {
        // item is self-renderable and does not participate in batching
        instanceItem = null
        instanceEffect = null
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = 0
        this.drawStencil[this.drawCount] = stencil
        this.drawCount++
        continue
      }
      program = effect.program

      // apply inputs to effect early in the loop for simplicity
      // inputs are versioned and won't cause redundant state changes

      if (inputs) {
        for (const key in inputs) {
          if (key in this.viewInputs) {
            // view inputs always have precedence
          } else {
            program.applyBlock(inputs[key])
          }
        }
      }

      // TODO: this needs profiling
      // we don't know whether view input blocks are shared or not so we can't apply them only once.
      // we have to apply them here and rely on the version checks to skip redundant updates
      // despite being cheap, this still can accumulate in thousands no-op calls
      if (this.viewInputs) {
        for (const key in this.viewInputs) {
          program.applyBlock(this.viewInputs[key])
        }
      }

      if (this.rangeCount[index] > 0) {
        // already batched, draws its own instance range
        instanceItem = null
        instanceEffect = null
        if (!program.perInstanceTransformBlock) {
          continue
        }
        this.instances.apply(program)
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = this.rangeCount[index]
        this.drawInstanceOffset[this.drawCount] = this.rangeOffset[index]
        this.drawStencil[this.drawCount] = stencil
        this.drawCount++
        continue
      }

      if (!program.perInstanceTransformBlock || !(item instanceof Geometry)) {
        // custom renderables or not opted for instancing
        instanceItem = null
        instanceEffect = null
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = 0
        this.drawStencil[this.drawCount] = stencil
        this.drawCount++
        continue
      }

      if (instanceItem !== item || instanceEffect !== effect || instanceStencil !== stencil) {
        instanceItem = item
        instanceEffect = effect
        instanceStencil = stencil
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = instanceOffset
        this.drawStencil[this.drawCount] = stencil
        this.drawCount++

        this.instances.apply(program)
      }

      this.drawInstanceCount[this.drawCount - 1] += 1
      this.instances.write(instanceOffset, transform, instance)
      instanceOffset += 1
    }

    this.instances.commit()
  }

  public render(pass: RenderEncoder): void {
    let itemIndex = 0
    let item: Renderable
    let effect: Effect

    let instanceCount: number
    let instanceOffset: number
    let stencil = -1
    // the effect whose states are applied to the pass. Consecutive draws of the same effect keep its states,
    // they are restored only when another effect, a self-renderable item or the end of the list follows
    let applied: Effect = null
    for (let drawIndex = 0; drawIndex < this.drawCount; drawIndex++) {
      itemIndex = this.drawIndices[drawIndex]
      item = this.items[itemIndex]
      effect = this.effect[itemIndex]

      if (this.drawStencil[drawIndex] >= 0 && this.drawStencil[drawIndex] !== stencil) {
        stencil = this.drawStencil[drawIndex]
        pass.setStencilReference(stencil)
      }

      if (!effect) {
        // item is self-renderable, so we just call render without applying any effect
        if (applied) {
          applied.restoreState(pass)
          applied = null
        }
        item.render(pass)
        continue
      }

      instanceCount = this.drawInstanceCount[drawIndex]
      instanceOffset = this.drawInstanceOffset[drawIndex]

      if (applied !== effect) {
        if (applied) {
          applied.restoreState(pass)
        }
        // the inputs were applied in batch(), they don't change between draws of the same effect
        effect.program.commit()
        effect.applyState(pass)
        applied = effect
      }

      if (instanceCount == 0 || !(item instanceof Geometry)) {
        item.render(pass)
        if (!(item instanceof Geometry)) {
          // custom renderables may change any pass state, the next draw applies its effect again
          applied.restoreState(pass)
          applied = null
        }
      } else {
        pass.setIndexBuffer(item.indexBuffer)
        pass.setVertexBuffer(item.vertexBuffer)
        pass.setPrimitiveType(item.primitiveType)
        if (item.indexBuffer) {
          pass.drawIndexed(item.indexCount, instanceCount, item.indexOffset, item.baseVertex, instanceOffset)
        } else {
          pass.draw(item.vertexCount, instanceCount, item.vertexOffset, instanceOffset)
        }
      }
    }
    if (applied) {
      applied.restoreState(pass)
    }
  }

  public clear(): void {
    this.isSorted = false
    this.isBatched = false
    this.size = 0
    this.drawCount = 0
  }

  public get keysArray() {
    const result = new Array<string>(this.size)
    for (let i = 0; i < this.size; i++) {
      const index = this.indices[i]
      result[i] =
        this.keysHi[index].toString(2).padStart(53, '0') + ':' + this.keysLo[index].toString(2).padStart(53, '0')
    }
    return result
  }
}
