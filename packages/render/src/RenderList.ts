import {
  BlendState,
  BufferRecorder,
  CullState,
  DepthBiasState,
  DepthState,
  Effect,
  Geometry,
  Program,
  ProgramInputBlock,
  Renderable,
  RenderEncoder,
} from '@gglib/graphics'
import { Mat4, Vec4 } from '@gglib/math'
import { RenderListMode, Sortable } from './RenderListMode'
import { RenderView } from './types'

export class RenderListCache {
  private lists = new Map<RenderListMode, RenderList>()

  /**
   * Clears all render lists in the cache. This should be called at the beginning of each frame, before rendering.
   */
  public clear() {
    for (const list of this.lists.values()) {
      list.clear()
      list.isSorted = false
    }
  }

  public get(mode: RenderListMode): RenderList {
    let list = this.lists.get(mode)
    if (!list) {
      list = new RenderList()
      this.lists.set(mode, list)
    }
    return list
  }

  public sumDrawCount(): number {
    let size = 0
    for (const list of this.lists.values()) {
      size += list.drawCount
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

  protected keys: bigint[] = []
  protected indices: number[] = []
  protected items: Renderable[] = []
  protected effect: Effect[] = []
  protected transforms: Mat4[] = []
  protected instances: Array<Float32Array<ArrayBuffer>> = []
  protected inputs: Array<Record<string, ProgramInputBlock>> = []

  protected item: Sortable = {
    depth: 0,
    material: 0,
    layer: 0,
    state: 0,
    geometry: 0,
  }

  protected drawIndices: number[] = []

  protected drawInstanceOffset: number[] = []
  protected drawInstanceCount: number[] = []

  protected viewForward: Vec4
  protected viewInputs: Record<string, ProgramInputBlock>
  protected viewRange: number

  protected perInstanceTransforms: BufferRecorder
  protected perInstanceData: BufferRecorder

  public begin(
    mode: RenderListMode,
    view: RenderView,
    viewInputs: Record<string, ProgramInputBlock>,
    transformBuffer: BufferRecorder,
    instanceBuffer: BufferRecorder,
  ): void {
    this.mode = mode
    this.viewForward = view.camera.view.getRow(2, this.viewForward)
    this.viewInputs = viewInputs
    this.viewRange = view.camera.far - view.camera.near
    this.perInstanceTransforms = transformBuffer
    this.perInstanceData = instanceBuffer
    this.clear()
  }

  public getDepth(world: Mat4): number {
    const depth = -(
      this.viewForward.x * world.translationX +
      this.viewForward.y * world.translationY +
      this.viewForward.z * world.translationZ +
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

  public getKey(depth: number, layer: number, material: number, state: number, geometry: number) {
    this.item.depth = depth
    this.item.layer = layer
    this.item.material = material
    this.item.state = state
    this.item.geometry = geometry
    return this.mode.getKey(this.item)
  }

  public add(
    key: bigint,
    item: Renderable,
    effect: Effect | null,
    inputs: Record<string, ProgramInputBlock>,
    transform: Mat4,
    instance: Float32Array<ArrayBuffer>,
  ): void {
    if (effect && !effect.isReady) {
      // effect is not ready, skip this item for now. It will be added in the next frame when the effect is ready.
      return
    }
    const index = this.size++
    this.items[index] = item
    this.effect[index] = effect
    this.inputs[index] = inputs
    this.keys[index] = key
    this.indices[index] = index
    this.transforms[index] = transform
    this.instances[index] = instance
  }

  public end(): void {
    if (!this.isSorted) {
      this.indices.length = this.size
      this.indices.sort(this.sortBy)
      this.isSorted = true
    }
    if (!this.isBatched) {
      this.batch()
      this.isBatched = true
    }
  }

  private sortBy = (a: number, b: number) => {
    return compare(this.keys[a], this.keys[b])
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

    let instanceOffset = this.perInstanceTransforms.recordIndex
    this.drawCount = 0

    for (let i = 0; i < this.size; i++) {
      index = this.indices[i]
      item = this.items[index]
      effect = this.effect[index]
      inputs = this.inputs[index]
      transform = this.transforms[index]
      instance = this.instances[index]
      if (!effect) {
        // item is self-renderable and does not participate in batching
        instanceItem = null
        instanceEffect = null
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = 0
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

      if (!program.perInstanceTransformBlock || !(item instanceof Geometry)) {
        // custom renderables or not opted for instancing
        instanceItem = null
        instanceEffect = null
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = 0
        this.drawCount++
        continue
      }

      if (instanceItem !== item || instanceEffect !== effect) {
        instanceItem = item
        instanceEffect = effect
        this.drawIndices[this.drawCount] = index
        this.drawInstanceCount[this.drawCount] = 0
        this.drawInstanceOffset[this.drawCount] = instanceOffset
        this.drawCount++

        program.mustGet(program.perInstanceTransformBlock).setBuffer(this.perInstanceTransforms.gpuBuffer)
        if (program.perInstanceDataBlock) {
          effect.program.mustGet(program.perInstanceDataBlock).setBuffer(this.perInstanceData.gpuBuffer)
        }
      }

      this.drawInstanceCount[this.drawCount - 1] += 1
      this.writeInstance(instanceOffset, transform, instance)
      instanceOffset += 1
    }

    this.perInstanceData.commit()
    this.perInstanceTransforms.commit()
  }

  private writeInstance(index: number, transform: Mat4, instance: Float32Array<ArrayBuffer>) {
    this.perInstanceTransforms.seek(index)
    this.perInstanceTransforms.writeMat4(transform)

    if (instance) {
      this.perInstanceData.seek(index)
      this.perInstanceData.writeFloat32Array(instance)
    } else {
      this.perInstanceData.seek(index)
      this.perInstanceData.clearRecord(index)
    }
  }

  public render(pass: RenderEncoder): void {
    let itemIndex = 0
    let item: Renderable
    let effect: Effect

    let instanceCount: number
    let instanceOffset: number
    for (let drawIndex = 0; drawIndex < this.drawCount; drawIndex++) {
      itemIndex = this.drawIndices[drawIndex]
      item = this.items[itemIndex]
      effect = this.effect[itemIndex]

      if (!effect) {
        // item is self-renderable, so we just call render without applying any effect
        item.render(pass)
        continue
      }

      instanceCount = this.drawInstanceCount[drawIndex]
      instanceOffset = this.drawInstanceOffset[drawIndex]

      effect.program.commit()
      effect.applyState(pass)

      if (instanceCount == 0 || !(item instanceof Geometry)) {
        item.render(pass)
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

      effect.restoreState(pass)
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
      result[i] = this.keys[index].toString(2)
    }
    return result
  }
}

function compare(a: bigint, b: bigint): number {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}
