import {
  BlendState,
  CullState,
  DepthBiasState,
  DepthState,
  Effect,
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
}

export class RenderList {
  public size: number = 0
  public isSorted: boolean

  protected mode: RenderListMode

  protected keys: bigint[] = []
  protected indices: number[] = []
  protected items: Renderable[] = []
  protected effect: Effect[] = []
  protected inputs: Array<Record<string, ProgramInputBlock>> = []
  protected item: Sortable = {
    depth: 0,
    material: 0,
    layer: 0,
    state: 0,
    geometry: 0,
  }

  protected viewForward: Vec4
  protected viewInputs: Record<string, ProgramInputBlock>
  public begin(mode: RenderListMode, view: RenderView, viewInputs: Record<string, ProgramInputBlock>): void {
    this.mode = mode
    this.viewForward = view.camera.view.getRow(2, this.viewForward)
    this.viewInputs = viewInputs
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
    const d = depth / 4000 // TODO: get far plane from view

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

  public add(item: Renderable, effect: Effect | null, inputs: Record<string, ProgramInputBlock>, key: bigint): void {
    const index = this.size++
    this.items[index] = item
    this.effect[index] = effect
    this.inputs[index] = inputs
    this.keys[index] = key
    this.indices[index] = index
  }

  public sort(): void {
    this.isSorted = true
    // TODO: fix sorting, background items flicker when camera moves
    // this.indices.sort(this.sortBy)
  }

  private sortBy = (a: number, b: number) => {
    return compare(this.keys[a], this.keys[b])
  }

  public render(pass: RenderEncoder): void {
    let index = 0
    let item: Renderable
    let effect: Effect
    let inputs: Record<string, ProgramInputBlock>

    for (let i = 0; i < this.size; i++) {
      index = this.indices[i]
      item = this.items[index]
      effect = this.effect[index]
      inputs = this.inputs[index]
      if (!effect) {
        // item is self-renderable, so we just call render without applying any effect
        item.render(pass)
        continue
      }
      if (!effect.isReady) {
        // waiting for compilation
        continue
      }
      if (inputs) {
        for (const key in inputs) {
          if (!(key in this.viewInputs)) {
            effect.program.applyBlock(inputs[key])
          }
        }
      }
      if (this.viewInputs) {
        for (const key in this.viewInputs) {
          effect.program.applyBlock(this.viewInputs[key])
        }
      }
      effect.program.commit()
      effect.apply(pass)
      item.render(pass)
      effect.restore(pass)
    }
  }

  public clear(): void {
    this.isSorted = false
    this.size = 0
  }

  public get keysAarray() {
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
