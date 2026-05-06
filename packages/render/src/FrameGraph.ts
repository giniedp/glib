import { Texture, TextureDescriptor, TextureUsage } from '@gglib/graphics'
import { PooledList } from './PooledList'
import { RenderChannel } from './RenderChannel'
import { RenderPass } from './types'

export interface FrameResource<T = unknown> {
  /**
   * The managed texture or rendertarget associated with this resource.
   * This will be null until the resource is allocated by the renderer,
   * and may be null if the resource is never allocated (e.g. culled).
   */
  texture?: Texture

  channel: RenderChannel
  version: number

  producer: FrameGraphNode<T>
  desc: TextureDescriptor

  imported: boolean
  exported: boolean
  firstUse: number
  lastUse: number
}

export interface FrameGraphNode<T = unknown> {
  id: number
  pass: T
  reads: FrameResource<T>[]
  writes: FrameResource<T>[]
  dependencies: FrameGraphNode<T>[]
  culled: boolean

  acquire: FrameResource[]
  release: FrameResource[]
}

export class FrameGraph<T = RenderPass> {
  private passes = new PooledList<FrameGraphNode<T>>()
  private resources = new PooledList<FrameResource<T>>()
  private latestVersions: Record<RenderChannel, FrameResource<T>> = {}
  private latestReaders: Record<RenderChannel, FrameGraphNode<T>[]> = {}
  private current: FrameGraphNode<T>
  private compiled: FrameGraphNode<T>[] = []
  private outputs: RenderChannel[] = []
  private isCompiled = false
  private width: number
  private height: number
  private schemas: Record<RenderChannel, Readonly<TextureDescriptor>> = {}

  /**
   * The list of render passes in this frame, in execution order. This will be empty until the graph is compiled.
   */
  public get nodes(): ReadonlyArray<Readonly<FrameGraphNode<T>>> {
    return this.compiled
  }

  public setDescriptors(channels: Record<RenderChannel, Readonly<TextureDescriptor>>) {
    for (const channel in channels) {
      this.schemas[channel] = channels[channel]
    }
  }

  /**
   * Gets a list of all versions of the given render channel that are used in this frame.
   * This can be used for debugging or visualization purposes.
   */
  public channelVersions(channel: RenderChannel, out: FrameResource<T>[] = []): ReadonlyArray<FrameResource<T>> {
    for (let i = 0; i < this.resources.size; i++) {
      const resource = this.resources.item(i)
      if (resource.channel === channel) {
        out.push(resource)
      }
    }
    return out
  }

  /**
   * Begins recording a new frame. This will reset the graph and prepare it for recording new passes.
   *
   * @param outputs The expected render channels, used for culling the graph.
   * @param width The width of the output render targets for this frame, in pixels.
   * @param height The height of the output render targets for this frame, in pixels.
   */
  public begin(outputs: RenderChannel[], width: number, height: number): void {
    this.isCompiled = false
    this.current = null
    this.width = width
    this.height = height
    this.passes.clear()
    this.resources.clear()
    this.outputs.length = 0
    for (const channel of outputs) {
      this.outputs.push(channel)
    }
    for (const key in this.latestVersions) {
      delete this.latestVersions[key]
    }
    for (const key in this.latestReaders) {
      delete this.latestReaders[key]
    }
  }

  /**
   * Adds a render pass to this frame. Subsequent {@link read} and {@link write}
   * calls will be associated with this pass until the next call to {@link addPass}.
   */
  public addPass(pass: T) {
    if (this.isCompiled) {
      throw new Error('Cannot add pass after frame is compiled')
    }
    const node = this.passes.nextAvailable() || {
      id: null,
      pass: null,
      reads: [],
      writes: [],
      acquire: [],
      release: [],
      dependencies: [],
      culled: false,
    }
    node.id = this.passes.size
    node.pass = pass
    node.reads.length = 0
    node.writes.length = 0
    node.acquire.length = 0
    node.release.length = 0
    node.dependencies.length = 0
    node.culled = false

    this.passes.push(node)
    this.current = node
  }

  /**
   * Ends recording of this frame and compiles the render graph.
   * This will build the dependencies between passes, cull unused passes, and compute resource lifetimes.
   */
  public compile(): void {
    if (this.isCompiled) {
      throw new Error('Frame is already compiled')
    }
    this.isCompiled = true

    this.buildDependencies()
    this.cullNodes(this.outputs, this.compiled)
    this.computeLifetimes(this.compiled)
    this.computeSchedule(this.compiled)
    // topological sort is not needed since dependencies are added in order
  }

  /**
   * Tracks a read of the given render channel by the current pass.
   */
  public read(channel: RenderChannel): FrameResource<T> {
    if (this.isCompiled) {
      throw new Error('Can not modify compiled frame')
    }
    if (!this.current) {
      throw new Error('No active pass')
    }

    const resource = this.latestVersions[channel]
    if (!resource) {
      throw new Error(`No producer for ${channel}`)
    }
    const readers = this.latestReaders[channel] || []
    if (readers[readers.length - 1] !== this.current) {
      readers.push(this.current)
    }
    this.latestReaders[channel] = readers
    this.current.reads.push(resource)
    return resource
  }

  /**
   * Tracks a write to the given render channel by the current pass.
   * A new version of the resource will be created if there are any readers of the previous version,
   * otherwise the previous version will be reused.
   *
   * @example
   * ```ts
   * // write after write, no readers, can reuse version
   * frame.write(RenderChannel.Color) // version #N
   * frame.write(RenderChannel.Color) // version #N
   * // write after read, need new version
   * frame.read(RenderChannel.Color) // version #N
   * frame.write(RenderChannel.Color) // version #N+1, because of the read
   */
  public write(channel: RenderChannel, desc?: Partial<TextureDescriptor>): FrameResource<T> {
    if (this.isCompiled) {
      throw new Error('Can not modify compiled frame')
    }
    if (!this.current) {
      throw new Error('No active pass')
    }

    const readers = this.latestReaders[channel] || []
    let version = this.latestVersions[channel]
    if (!version) {
      // first write
      version = this.createResource(channel, desc)
    } else if (!readers.length) {
      // write after write, can reuse resource
      version.producer = this.current
    } else {
      // write after read, need new version
      version = this.createResource(channel, desc)
      for (const reader of readers) {
        addDependency(this.current, reader)
      }
    }

    readers.length = 0
    this.latestReaders[channel] = readers
    this.latestVersions[channel] = version
    this.current.writes.push(version)

    return version
  }

  /**
   * A convenience method that combines {@link read} and {@link write}.
   * This will **always** create a new version of the resource.
   */
  public modify(channel: RenderChannel, desc?: Partial<TextureDescriptor>): FrameResource {
    this.read(channel)
    return this.write(channel, desc)
  }

  /**
   * Modifies the given render channel in place by the current pass.
   * This will reuse the latest version of the resource, and add a dependency on the previous producer if there is one.
   */
  public modifyInPlace(channel: RenderChannel): FrameResource {
    if (this.isCompiled) {
      throw new Error('Can not modify compiled frame')
    }
    if (!this.current) {
      throw new Error('No active pass')
    }

    const resource = this.latestVersions[channel]
    if (!resource) {
      throw new Error(`No producer for ${channel}`)
    }

    // dependency on previous producer
    addDependency(this.current, resource.producer)

    this.current.reads.push(resource)
    this.current.writes.push(resource)

    return resource
  }

  public import(channel: RenderChannel, texture: Texture, desc?: Partial<TextureDescriptor>): FrameResource<T> {
    if (this.isCompiled) {
      throw new Error('Can not modify compiled frame')
    }
    const resource = this.createResource(channel, desc)
    resource.texture = texture
    resource.imported = true
    resource.producer = null
    this.latestVersions[channel] = resource
    return resource
  }

  public export(channel: RenderChannel): FrameResource<T> {
    if (this.isCompiled) {
      throw new Error('Can not modify compiled frame')
    }
    const resource = this.latestVersions[channel]
    if (!resource) {
      throw new Error(`No producer for ${channel}`)
    }
    resource.exported = true
    return resource
  }

  public collectExports(result: FrameResource<T>[] = []): FrameResource<T>[] {
    for (let i = 0; i < this.resources.size; i++) {
      const res = this.resources.item(i)
      if (res.exported) {
        result.push(res)
      }
    }
    return result
  }

  private createResource(channel: RenderChannel, desc?: Partial<TextureDescriptor>) {
    const schema = this.schemas[channel]
    if (!schema) {
      throw new Error(`No schema for channel ${channel}`)
    }
    const resource: FrameResource<T> = this.resources.nextAvailable() || {
      channel,
      version: 0,
      producer: null,
      desc: {
        format: null,
        type: 'Texture2D',
        width: 1,
        height: 1,
        depth: 1,
        sampleCount: 1,
        mipLevelCount: 1,
        usage: TextureUsage.RenderTarget | TextureUsage.Sampled,
      },
      firstUse: Infinity,
      lastUse: -Infinity,
      imported: false,
      exported: false,
      texture: null,
    }
    resource.channel = channel
    resource.version = (this.latestVersions[channel]?.version ?? -1) + 1
    resource.producer = this.current || null
    resource.firstUse = Infinity
    resource.lastUse = -Infinity
    resource.imported = false
    resource.desc.format = desc?.format ?? schema.format
    resource.desc.type = desc?.type ?? schema.type
    resource.desc.width = desc?.width ?? schema.width
    resource.desc.height = desc?.height ?? schema.height
    resource.desc.depth = desc?.depth ?? schema.depth
    resource.desc.sampleCount = desc?.sampleCount ?? schema.sampleCount
    resource.desc.mipLevelCount = desc?.mipLevelCount ?? schema.mipLevelCount
    if (resource.desc.width <= 1 && resource.desc.height <= 1) {
      resource.desc.width = this.width * (resource.desc.width || 1)
      resource.desc.height = this.height
    }
    this.resources.push(resource)
    return resource
  }

  private buildDependencies(): void {
    for (let i = 0; i < this.passes.size; i++) {
      const node = this.passes.item(i)
      for (const resource of node.reads) {
        if (!resource.producer) {
          continue
        }
        if (resource.producer === node) {
          continue
        }
        if (node.dependencies.includes(resource.producer)) {
          continue
        }
        node.dependencies.push(resource.producer)
      }
    }
  }

  private cullNodes(outputs: RenderChannel[], nodes: FrameGraphNode[]): void {
    for (let i = 0; i < this.passes.size; i++) {
      this.passes.item(i).culled = true
    }

    for (const channel of outputs) {
      const resource = this.latestVersions[channel]
      if (resource?.producer) {
        this.uncull(resource.producer)
      }
    }

    nodes.length = 0
    for (let i = 0; i < this.passes.size; i++) {
      const node = this.passes.item(i)
      if (!node.culled) {
        nodes.push(node)
      }
    }
  }

  private uncull(node: FrameGraphNode): void {
    if (!node.culled) {
      return
    }
    node.culled = false
    for (const dep of node.dependencies) {
      this.uncull(dep)
    }
  }

  private computeLifetimes(nodes: FrameGraphNode[]): void {
    for (let i = 0; i < this.resources.size; i++) {
      const resource = this.resources.item(i)
      resource.firstUse = Infinity
      resource.lastUse = -Infinity
    }

    for (let i = 0; i < nodes.length; i++) {
      for (const resource of nodes[i].reads) {
        resource.firstUse = Math.min(resource.firstUse, i)
        resource.lastUse = Math.max(resource.lastUse, i)
      }
      for (const resource of nodes[i].writes) {
        resource.firstUse = Math.min(resource.firstUse, i)
        resource.lastUse = Math.max(resource.lastUse, i)
      }
    }
  }

  private computeSchedule(nodes: FrameGraphNode[]): void {
    for (const node of nodes) {
      node.acquire.length = 0
      node.release.length = 0
    }

    for (let i = 0; i < this.resources.size; i++) {
      const res = this.resources.item(i)
      if (res.imported) {
        continue
      }
      if (res.firstUse === Infinity || res.lastUse === -Infinity) {
        continue
      }
      if (res.firstUse < nodes.length) {
        nodes[res.firstUse].acquire.push(res)
      }
      if (res.exported) {
        continue
      }
      if (res.lastUse < nodes.length) {
        nodes[res.lastUse].release.push(res)
      }
    }
  }
}

function addDependency<T>(node: FrameGraphNode<T>, dep: FrameGraphNode<T>): void {
  if (node === dep) {
    return
  }
  if (node.dependencies.includes(dep)) {
    return
  }
  node.dependencies.push(dep)
}

function createTopoSorter<T extends { dependencies: T[] }>() {
  const visited: boolean[] = []
  const tempMark: boolean[] = []
  const stack: T[] = []
  const nodeToIndex = new Map<T, number>()
  let nodes: T[] = []

  function visit(node: T) {
    const i = nodeToIndex.get(node)
    if (visited[i] || i == null) {
      return
    }
    if (tempMark[i]) {
      throw new Error('Graph is not a DAG')
    }
    tempMark[i] = true
    for (const dep of node.dependencies) {
      visit(dep)
    }
    tempMark[i] = false
    visited[i] = true
    stack.push(node)
  }

  return function sort(input: T[]) {
    nodes = input
    stack.length = 0
    nodeToIndex.clear()

    const count = nodes.length
    for (let i = 0; i < count; ++i) {
      nodeToIndex.set(nodes[i], i)
      visited[i] = false
      tempMark[i] = false
    }

    for (const node of nodes) {
      visit(node)
    }

    for (let i = 0; i < count; ++i) {
      nodes[i] = stack[i]
    }
  }
}
