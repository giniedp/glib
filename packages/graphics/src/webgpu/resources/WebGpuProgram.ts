import type { InputValueType, ProgramInputBlock, ProgramOptions } from '../../resources'
import { Program } from '../../resources'
import { ShaderAnnotations } from '../../shader'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslProgramInfo, WgslResourceInfo } from '../wgsl'
import { WebGpuProgramInput } from './WebGpuProgramInput'
import type { WebGpuShaderModule } from './WebGpuShaderModule'
import { WebGpuShaderResource } from './WebGpuShaderResource'

export interface WebGpuParameterSetOptions extends ProgramOptions {
  layouts?: ReadonlyArray<GPUBindGroupLayout>
}

export class WebGpuProgram extends Program {
  public readonly module: WebGpuShaderModule
  public readonly sharedBlocks: ReadonlyArray<string>
  public readonly perInstanceTransformBlock: string | null
  public readonly perInstanceDataBlock: string | null

  private device: WebGpuDevice

  private info: WgslProgramInfo
  private inputMap: Record<string, WebGpuProgramInput> = {}
  private sourceState: Record<string, { source: ProgramInputBlock; version: number }> = {}
  private resources: WebGpuShaderResource[]
  private ownedResources: WebGpuShaderResource[]

  public readonly bindGroupLayouts: ReadonlyArray<GPUBindGroupLayout>
  public get bindGroups(): ReadonlyArray<GPUBindGroup> {
    if (this.changed || !this.gpuBindGroups) {
      this.updateBindGroups()
    }
    return this.gpuBindGroups
  }

  private changed = true
  private gpuBindGroups: GPUBindGroup[]
  private gpuBindGroupDescriptors: GPUBindGroupDescriptor[]

  public constructor(shader: WebGpuShaderModule, info: WgslProgramInfo, options?: WebGpuParameterSetOptions) {
    super()
    this.module = shader
    this.device = shader.device
    this.info = info
    this.sharedBlocks = [...(options?.sharedBlocks || [])]
    this.perInstanceDataBlock = options?.perInstanceDataBlock ?? null
    this.perInstanceTransformBlock = options?.perInstanceTransformBlock ?? null

    // module.program is null when this is the default module
    const sharedResources = this.module.program?.getResourceBlocks(this.sharedBlocks) || []
    const resources = createResources(this.device, info, sharedResources)
    this.resources = [...resources.shared, ...resources.owned]
    this.ownedResources = resources.owned

    this.bindGroupLayouts =
      options?.layouts || createBindGroupLayouts(this.device, shader.gpuObject.label, this.resources)
    this.createBindGroupDescriptors()
  }

  public applyBlock(block: ProgramInputBlock, force?: boolean): boolean {
    const state = this.sharedBlocks.includes(block.name) ? this.module.program.sourceState : this.sourceState
    state[block.name] ||= { source: block, version: -1 }
    const record = state[block.name]

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

  private getResourceBlocks(names: readonly string[]) {
    if (!names?.length) {
      return []
    }

    const result: WebGpuShaderResource[] = []
    for (const name of names) {
      for (const resource of this.module.program.resources) {
        if (resource.block === name) {
          result.push(resource)
        }
      }
    }

    return result
  }

  public commit() {
    for (const resource of this.resources) {
      resource.commit()
    }
  }

  public dispose(): void {
    for (const resource of this.ownedResources) {
      resource.dispose()
    }
    this.ownedResources = []
    this.resources = []
    this.inputMap = {}
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
      resources.forEach((resource, index) => {
        const entry: GPUBindGroupEntry = {
          binding: resource.info.binding,
          resource: resource.bindingResource,
        }
        group.entries[index] = entry
        resource.onResourceChanged(() => {
          entry.resource = resource.bindingResource
          if (this.gpuBindGroups) {
            this.gpuBindGroups[groupId] = undefined
          }
          this.changed = true
        })
      })
    })
  }

  private updateBindGroups() {
    this.gpuBindGroups ||= []
    let data: GPUBindGroupDescriptor
    for (let groupId = 0; groupId < this.gpuBindGroupDescriptors.length; groupId++) {
      data = this.gpuBindGroupDescriptors[groupId]
      if (data && !this.gpuBindGroups[groupId]) {
        this.gpuBindGroups[groupId] = this.device.gpu.createBindGroup(data)
      }
    }
  }
}

function createResources(
  device: WebGpuDevice,
  info: WgslProgramInfo,
  sharedResources?: ReadonlyArray<WebGpuShaderResource>,
) {
  const shared: WebGpuShaderResource[] = []
  const owned: WebGpuShaderResource[] = []
  const isCompute = info.entryPoints.some((it) => it.stage === 'compute')
  for (const param of info.resources) {
    if (param.binding == null) {
      continue
    }

    const resource = sharedResources?.find((it) => it.info.name === param.name)
    if (resource) {
      shared.push(resource)
    } else {
      owned.push(new WebGpuShaderResource(device, param, isCompute))
    }
  }
  return {
    owned,
    shared,
  }
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
    const resource = findTextureOrSamplerInBlock(resources, parts[0], parts[1])
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

function findTextureOrSamplerInBlock(
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
    if ((item.isTexture || item.isSampler) && isBlockOrName(item.info, block) && isAliasOrName(item.info, name)) {
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
