import type { InputValueType, ProgramInputBlock, ProgramOptions } from '../../resources'
import { Program } from '../../resources'
import { ShaderAnnotations } from '../../shader'
import type { WebGpuBlockState, WebGpuDevice } from '../WebGpuDevice'
import type { WgslProgramInfo, WgslResourceInfo } from '../wgsl'
import { WebGpuProgramInput } from './WebGpuProgramInput'
import type { WebGpuShaderModule } from './WebGpuShaderModule'
import { WebGpuShaderResource } from './WebGpuShaderResource'

export interface WebGpuParameterSetOptions extends ProgramOptions {
  layouts?: GPUBindGroupLayout[]
}

export class WebGpuProgram extends Program {
  public readonly module: WebGpuShaderModule
  public readonly sharedBlocks: ReadonlyArray<string>
  public readonly perInstanceTransformBlock: string | null
  public readonly perInstanceDataBlock: string | null

  private device: WebGpuDevice

  private info: WgslProgramInfo
  private inputMap: Record<string, WebGpuProgramInput> = {}
  private sourceState: Record<string, WebGpuBlockState> = {}
  /**
   * Applied block versions of the shared blocks, shared with all programs that use the same resources
   */
  private sharedState: Record<string, WebGpuBlockState> = {}
  private resources: WebGpuShaderResource[]
  private ownedResources: WebGpuShaderResource[]
  /**
   * The resources with a managed buffer, the only ones {@link commit} writes
   */
  private bufferResources: WebGpuShaderResource[]
  /**
   * The resource change handlers of this program, removed when it is destroyed (shared resources outlive it)
   */
  private resourceHandlers: Array<{ resource: WebGpuShaderResource; handler: () => void }> = []
  /**
   * {@link WebGpuDevice.bindingEpoch} of the last source sync, see {@link bindGroups}
   */
  private syncedEpoch = -1

  public bindGroupLayouts: GPUBindGroupLayout[]
  public get bindGroups(): GPUBindGroup[] {
    // buffer and texture objects may have replaced their GPU resource since they were bound (e.g. grown instance
    // buffers, loaded textures). They count every replacement in the device epoch, so most draws skip the sync
    const epoch = this.device.bindingEpoch
    if (this.syncedEpoch !== epoch) {
      this.syncedEpoch = epoch
      for (const resource of this.resources) {
        resource.syncSource()
      }
    }
    if (this.changed || !this.gpuBindGroups) {
      this.updateBindGroups()
      this.changed = false
    }
    return this.gpuBindGroups
  }

  private changed = true
  private gpuBindGroups: GPUBindGroup[]
  private gpuBindGroupDescriptors: GPUBindGroupDescriptor[]
  /**
   * Identifies the layout entries per group, see {@link WebGpuDevice.acquireBindGroup}
   */
  private layoutKeys: string[] = []

  public constructor(shader: WebGpuShaderModule, info: WgslProgramInfo, options?: WebGpuParameterSetOptions) {
    super()
    this.module = shader
    this.device = shader.device
    this.info = info
    this.sharedBlocks = [...(options?.sharedBlocks || [])]
    this.perInstanceDataBlock = options?.perInstanceDataBlock ?? null
    this.perInstanceTransformBlock = options?.perInstanceTransformBlock ?? null

    const resources = createResources(this.device, info, this.sharedBlocks)
    this.resources = [...resources.shared, ...resources.owned]
    this.ownedResources = resources.owned
    this.bufferResources = this.resources.filter((it) => it.isBuffer)
    this.sharedState = getSharedStates(this.device, this.sharedBlocks, resources.shared)

    this.bindGroupLayouts = options?.layouts || createBindGroupLayouts(this.device, shader.name, this.resources)
    this.createBindGroupDescriptors()
  }

  public applyBlock(block: ProgramInputBlock, force?: boolean): boolean {
    const record = this.sharedState[block.name] || (this.sourceState[block.name] ||= { source: block, version: -1 })

    if (!force && record.source === block && record.version === block.version) {
      return false
    }

    record.source = block
    record.version = block.version
    this.applyInputs(block.values)

    return true
  }

  public applyInputs(inputs: Record<string, InputValueType>): void {
    for (const key in inputs) {
      this.set(key, inputs[key])
    }
  }

  public get(path: string): WebGpuProgramInput | null {
    if (path in this.inputMap) {
      return this.inputMap[path as string]
    }
    this.inputMap[path as string] = resolveInput(this.resources, path as string) || null
    return this.inputMap[path as string]
  }

  public set(path: string, value: InputValueType): boolean {
    const parameter = this.get(path as string)
    if (!parameter) {
      return false
    }
    parameter.set(value)
    return true
  }

  public clone(options?: ProgramOptions): WebGpuProgram {
    return new WebGpuProgram(this.module, this.info, {
      layouts: this.bindGroupLayouts,
      sharedBlocks: options?.sharedBlocks ?? this.sharedBlocks,
      perInstanceDataBlock: options?.perInstanceDataBlock ?? this.perInstanceDataBlock,
      perInstanceTransformBlock: options?.perInstanceTransformBlock ?? this.perInstanceTransformBlock,
    })
  }

  public commit() {
    const resources = this.bufferResources
    for (let i = 0; i < resources.length; i++) {
      resources[i].commit()
    }
  }

  protected destroy(): void {
    for (const { resource, handler } of this.resourceHandlers) {
      resource.offResourceChanged(handler)
    }
    this.resourceHandlers = []
    for (const resource of this.ownedResources) {
      resource.dispose()
    }
    for (const cache of this.bindGroupCache) {
      for (const item of cache || []) {
        this.device.releaseBindGroup(item.key)
      }
    }
    this.ownedResources = []
    this.bufferResources = []
    this.resources = []
    this.inputMap = {}
    this.bindGroupCache = []
  }

  private createBindGroupDescriptors() {
    this.gpuBindGroupDescriptors = []
    this.bindGroupLayouts.forEach((layout, groupId) => {
      const resources = this.resources.filter((it) => it.info.group === groupId)
      const group: GPUBindGroupDescriptor = {
        layout,
        entries: [],
      }
      this.gpuBindGroupDescriptors[groupId] = group
      this.layoutKeys[groupId] = JSON.stringify(resources.map((it) => it.layoutEntry))
      resources.forEach((resource, index) => {
        const entry: GPUBindGroupEntry = {
          binding: resource.info.binding,
          resource: resource.bindingResource,
        }
        group.entries[index] = entry
        const handler = () => {
          entry.resource = resource.bindingResource
          if (this.gpuBindGroups) {
            this.gpuBindGroups[groupId] = undefined
          }
          this.changed = true
        }
        resource.onResourceChanged(handler)
        this.resourceHandlers.push({ resource, handler })
      })
    })
  }

  private updateBindGroups() {
    this.gpuBindGroups ||= []
    let data: GPUBindGroupDescriptor
    for (let groupId = 0; groupId < this.gpuBindGroupDescriptors.length; groupId++) {
      data = this.gpuBindGroupDescriptors[groupId]
      if (data && !this.gpuBindGroups[groupId]) {
        this.gpuBindGroups[groupId] = this.getOrCreateBindGroup(groupId, data)
      }
    }
  }

  /**
   * Recently used bind groups per group, keyed by the identity of their entry resources
   *
   * @remarks
   * Effects that rebind per draw (e.g. a mip chain with alternating inputs) would otherwise create new bind groups
   * every frame. Those are freed only when the GC collects their wrappers, and pile up in the GPU process meanwhile.
   * Each entry holds a reference on a device bind group, which programs with equal entries share.
   */
  private bindGroupCache: Array<Array<{ keys: GPUBindingResource[]; group: GPUBindGroup; key: string }>> = []
  private bindGroupCacheNext: number[] = []

  private getOrCreateBindGroup(groupId: number, data: GPUBindGroupDescriptor): GPUBindGroup {
    const entries = data.entries as GPUBindGroupEntry[]
    const cache = (this.bindGroupCache[groupId] ||= [])
    for (const item of cache) {
      if (sameResources(item.keys, entries)) {
        return item.group
      }
    }
    this.reportUnfilterableTextures(groupId)
    const shared = this.device.acquireBindGroup(this.layoutKeys[groupId], data)
    const item = { keys: entries.map((it) => it.resource), group: shared.group, key: shared.key }
    if (cache.length < BIND_GROUP_CACHE_SIZE) {
      cache.push(item)
    } else {
      // replace round robin
      const next = this.bindGroupCacheNext[groupId] ?? 0
      this.device.releaseBindGroup(cache[next].key)
      cache[next] = item
      this.bindGroupCacheNext[groupId] = (next + 1) % BIND_GROUP_CACHE_SIZE
    }
    return item.group
  }

  /**
   * Logs the 32 bit float textures a device without `float32-filterable` rejects in this group. The WebGPU error of the
   * bind group names neither the program nor the texture binding.
   */
  private reportUnfilterableTextures(groupId: number) {
    if (this.device.capabilities.canFilterR32F) {
      return
    }
    for (const resource of this.resources) {
      if (resource.info.group !== groupId || resource.layoutEntry.texture?.sampleType !== 'float') {
        continue
      }
      if (!isFloat32Format(resource.textureFormat)) {
        continue
      }
      const key = `${this.module.name}:${groupId}:${resource.info.binding}`
      if (!REPORTED_UNFILTERABLE.has(key)) {
        REPORTED_UNFILTERABLE.add(key)
        console.error(
          `Program '${this.module.name}': texture '${resource.nameInShader}' (group ${groupId}, binding ${resource.info.binding}) has the format ${resource.textureFormat}, which this device can't filter. Read it with textureLoad and annotate it with '// @${ShaderAnnotations.Unfilterable}'`,
        )
      }
    }
  }
}

/**
 * Bindings that were already reported, see {@link WebGpuProgram} reportUnfilterableTextures
 */
const REPORTED_UNFILTERABLE = new Set<string>()

function isFloat32Format(format: GPUTextureFormat | null): boolean {
  return format === 'r32float' || format === 'rg32float' || format === 'rgba32float'
}

/**
 * Bind groups kept per group of a program, see {@link WebGpuProgram} bindGroupCache
 */
const BIND_GROUP_CACHE_SIZE = 16

function sameResources(keys: GPUBindingResource[], entries: GPUBindGroupEntry[]) {
  if (keys.length !== entries.length) {
    return false
  }
  for (let i = 0; i < entries.length; i++) {
    if (keys[i] !== entries[i].resource) {
      return false
    }
  }
  return true
}

function createResources(device: WebGpuDevice, info: WgslProgramInfo, sharedBlocks: ReadonlyArray<string>) {
  const shared: WebGpuShaderResource[] = []
  const owned: WebGpuShaderResource[] = []
  const isCompute = info.entryPoints.some((it) => it.stage === 'compute')
  for (const param of info.resources) {
    if (param.binding == null) {
      continue
    }
    const block = param.annotations[ShaderAnnotations.Block] || param.name
    if (sharedBlocks.includes(block)) {
      shared.push(device.getSharedShaderResource(param, isCompute))
    } else {
      owned.push(new WebGpuShaderResource(device, param, isCompute))
    }
  }
  return {
    owned,
    shared,
  }
}

/**
 * The applied version records of the shared blocks, keyed by the identity of each block's shared resources
 */
function getSharedStates(
  device: WebGpuDevice,
  sharedBlocks: ReadonlyArray<string>,
  shared: ReadonlyArray<WebGpuShaderResource>,
): Record<string, WebGpuBlockState> {
  const result: Record<string, WebGpuBlockState> = {}
  for (const name of sharedBlocks) {
    let key = name + '#'
    let count = 0
    for (const resource of shared) {
      if (resource.block === name) {
        key += device.objectId(resource) + ','
        count++
      }
    }
    if (count) {
      result[name] = device.getSharedBlockState(key)
    }
  }
  return result
}

function createBindGroupLayouts(device: WebGpuDevice, label: string, resources: WebGpuShaderResource[]) {
  const result: GPUBindGroupLayout[] = []
  const groupIds = Array.from(new Set<number>(resources.map((it) => it.info.group)))
  for (const groupId of groupIds) {
    const groupResources = resources.filter((it) => it.info.group === groupId)
    result[groupId] = device.gpu.createBindGroupLayout({
      label: `${label || ''} BindGroupLayout${groupId}`,
      entries: groupResources.map((it) => it.layoutEntry),
    })
  }
  return result
}

/**
 * Resolves a dot-separated input path to a concrete {@link WebGpuProgramInput},
 * walking the reflected shader resource tree to find the matching buffer offset
 * or texture/sampler binding.
 *
 * Path format: `"<block>.<member>[<index>]"`
 *
 * - The first segment identifies the resource (uniform block, texture, or sampler)
 *   by its WGSL variable name or its `@block` annotation value.
 * - Subsequent segments walk struct members, each resolved by field name or
 *   `@alias` annotation value.
 * - Array indices (`[n]`) are supported on both resources and struct members.
 *
 * Examples:
 * ```
 * "view.viewMatrix"            // struct member in a uniform block
 * "object.bones[2]"            // indexed array member
 * "baseColorMap"               // top-level texture (no block prefix)
 * "material.baseColorMap"      // texture declared under a `@block` annotation
 * ```
 *
 * Returns `null` if any segment fails to resolve.
 */
function resolveInput(resources: ReadonlyArray<WebGpuShaderResource>, path: string): WebGpuProgramInput | null {
  const isIndexed = path.includes('[')
  const parts = path.split('.')

  if (!parts.length) {
    return null
  }

  if (!isIndexed && parts.length === 1) {
    let resource = findUniformBlock(resources, parts[0])
    resource ||= findNonUniformByShaderName(resources, parts[0])

    if (!resource) {
      return null
    }

    return new WebGpuProgramInput(path, resource, resource.info)
  }

  if (!isIndexed && parts.length === 2) {
    const resource = findResourceInBlock(resources, parts[0], parts[1])
    if (resource) {
      return new WebGpuProgramInput(path, resource, resource.info)
    }

    // fall through to uniform block member walk
  }

  let resource: WebGpuShaderResource
  let info: WgslResourceInfo
  let offset = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const [key, index] = part.split(/[[\]]/)

    if (i === 0) {
      // first segment: find the uniform block by name
      resource = findUniformBlock(resources, key)

      if (!resource) {
        return null
      }
      info = resource.info
      if (info.container === 'array' && index != null) {
        offset = info.elementStride * Number(index)
      } else if (index != null) {
        console.warn(`Trying to index non-array resource ${key} in path ${path}`)
      }
      continue
    }

    // Subsequent segments: walk struct members.
    // Each member is matched by field name or @alias annotation value.

    info = findMember(info.members, key)
    if (!info) {
      return null
    }
    offset += info.offset
    if (info.container === 'array') {
      offset += info.elementStride * (Number(index) || 0)
    } else if (index != null) {
      console.warn(`Trying to index non-array resource ${key} in path ${path}`)
    }
  }

  return new WebGpuProgramInput(path, resource, {
    ...info,
    offset,
  })
}

function findUniformBlock(list: ReadonlyArray<WebGpuShaderResource>, name: string): WebGpuShaderResource | null {
  name = name.toLowerCase()
  if (!list) {
    return null
  }
  // prefer the resource whose variable name is the block name.
  // Other resources may be annotated with the same block (e.g. storage buffers in a shared block)
  for (const item of list) {
    if (item.isBuffer && isShaderName(item.info, name) && isBlockOrName(item.info, name)) {
      return item
    }
  }
  for (const item of list) {
    if (item.isBuffer && isBlockOrName(item.info, name)) {
      return item
    }
  }
  return null
}

function findNonUniformByShaderName(
  list: ReadonlyArray<WebGpuShaderResource>,
  name: string,
): WebGpuShaderResource | null {
  name = name.toLowerCase()
  if (!list) {
    return null
  }
  for (const item of list) {
    if (!item.isBuffer && isShaderName(item.info, name)) {
      return item
    }
  }
  return null
}

/**
 * Finds a texture, sampler or buffer resource that is annotated with the given `@block`
 * and has the given variable name (or `@alias`).
 *
 * @remarks
 * A buffer is only matched if it is not the block root itself (block name differs from variable name),
 * so that paths into uniform block members keep resolving through the member walk.
 */
function findResourceInBlock(
  list: ReadonlyArray<WebGpuShaderResource>,
  block: string,
  name: string,
): WebGpuShaderResource | null {
  block = block.toLowerCase()
  name = name.toLowerCase()
  if (!list) {
    return null
  }
  for (const item of list) {
    if (!isBlockOrName(item.info, block) || !isAliasOrName(item.info, name)) {
      continue
    }
    if (item.isTexture || item.isSampler) {
      return item
    }
    if (item.isBuffer && !isShaderName(item.info, block)) {
      return item
    }
  }
  return null
}

/**
 * Finds a top-level shader resource by name or `@block` annotation value.
 * Matching is case-insensitive.
 */
function findMember(list: ReadonlyArray<WgslResourceInfo>, name: string): WgslResourceInfo | null {
  if (!list) {
    return null
  }
  name = name.toLowerCase()
  for (const member of list) {
    if (isAliasOrName(member, name)) {
      return member
    }
  }
  return null
}

function isBlockOrName(info: WgslResourceInfo, name: string) {
  const block = info.annotations[ShaderAnnotations.Block]
  if (block != null) {
    return block.toLowerCase() === name
  }
  return info.name.toLowerCase() === name
}

function isAliasOrName(info: WgslResourceInfo, name: string) {
  const alias = info.annotations[ShaderAnnotations.Alias]
  if (alias != null) {
    return alias.toLowerCase() === name
  }
  return info.name.toLowerCase() === name
}

function isShaderName(info: WgslResourceInfo, name: string) {
  return info.name.toLowerCase() === name
}
