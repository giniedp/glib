import type { IVec2, IVec3, IVec4 } from '@gglib/math'
import type { ProgramOptions, ProgramInputs, Texture } from '../../resources'
import { Program } from '../../resources'
import type { SamplerState } from '../../states'
import type { WebGpuDevice } from '../WebGpuDevice'
import type { WgslProgramInfo, WgslResourceInfo } from '../wgsl'
import { WebGpuProgramInput } from './WebGpuProgramInput'
import type { WebGpuShaderModule } from './WebGpuShaderModule'
import { WebGpuShaderResource } from './WebGpuShaderResource'

export interface WebGpuParameterSetOptions {
  layouts?: ReadonlyArray<GPUBindGroupLayout>
  resources?: ReadonlyArray<WebGpuShaderResource>
}

export class WebGpuProgram<Params extends ProgramInputs = ProgramInputs> extends Program<Params> {
  public shared: readonly string[]

  public readonly module: WebGpuShaderModule
  private device: WebGpuDevice
  private info: WgslProgramInfo
  private params: Record<string, WebGpuProgramInput> = {}
  private resources: WebGpuShaderResource[]

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
    this.resources = createResources(this.device, info, options?.resources)
    this.bindGroupLayouts = options?.layouts || createBindGroupLayouts(this.device, this.resources)
    this.createBindGroupDescriptors()
  }
  public apply(parameters: Partial<Params>): void {
    for (const key in parameters) {
      this.set(key, parameters[key])
    }
  }
  public get(path: string): WebGpuProgramInput | null {
    if (path in this.params) {
      return this.params[path as string]
    }
    this.params[path as string] = resolveParameter(this.resources, path as string) || null
    return this.params[path as string]
  }

  public set<K extends keyof Params>(path: K, value: Params[K]): boolean {
    const parameter = this.get(path as string)
    if (!parameter) {
      return false
    }
    parameter.set(value)
    return true
  }

  public mustSet<K extends keyof Params>(path: K, value: Params[K]) {
    const parameter = this.get(path as string)
    if (!parameter) {
      throw new Error(`Parameter ${path as string} not found in program`)
    }
    parameter.set(value)
  }

  public setScalar(path: string, value: number) {
    this.get(path).setScalar(value)
  }

  public setArray(path: string, value: ArrayLike<number>, offset?: number) {
    this.get(path).setArray(value, offset)
  }

  public setVec2(path: string, value: IVec2 | ArrayLike<number>) {
    this.get(path).setVec2(value)
  }

  public setVec3(path: string, value: IVec3 | ArrayLike<number>) {
    this.get(path).setVec3(value)
  }

  public setVec4(path: string, value: IVec4 | ArrayLike<number>) {
    this.get(path).setVec4(value)
  }

  public setMat2x2(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat2x2(value)
  }

  public setMat3x3(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat3x3(value)
  }

  public setMat4x4(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat4x4(value)
  }

  public setTexture(path: string, value: Texture | GPUTexture | GPUTextureView | GPUExternalTexture): void {
    this.get(path).setTexture(value as any)
  }

  public setSampler(path: string, value: SamplerState): void {
    this.get(path).setSampler(value)
  }

  public clone(options?: ProgramOptions): WebGpuProgram {
    return new WebGpuProgram(this.module, this.info, {
      layouts: this.bindGroupLayouts,
      resources:
        options?.shared?.map((name) => {
          return this.module.program.resources.find((it) => it.info.name === name)
        }) || [],
    })
  }

  public commit() {
    for (const resource of this.resources) {
      if (resource.hasChanged) {
        resource.commit()
      }
    }
  }

  public dispose(): void {
    for (const resource of this.resources) {
      resource.dispose()
    }
    this.resources = []
    this.params = {}
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
          resource: resource.resource,
        }
        group.entries[index] = entry
        resource.onResourceChanged(() => {
          entry.resource = resource.resource
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
  const resources: WebGpuShaderResource[] = []
  for (const param of info.resources) {
    if (param.binding == null) {
      continue
    }
    const shared = sharedResources?.find((it) => it.info.name === param.name)
    if (shared) {
      // TODO: refcount shared resources to know when to dispose them
      resources.push(shared)
    } else {
      resources.push(new WebGpuShaderResource(device, param))
    }
  }
  return resources
}

function createBindGroupLayouts(device: WebGpuDevice, resources: WebGpuShaderResource[]) {
  const result: GPUBindGroupLayout[] = []
  const groupIds = Array.from(new Set<number>(resources.map((it) => it.info.group)))
  for (const groupId of groupIds) {
    const groupResources = resources.filter((it) => it.info.group === groupId)
    result[groupId] = device.gpu.createBindGroupLayout({
      entries: groupResources.map((it) => it.layoutEntry),
    })
  }
  return result
}

function resolveParameter(resources: ReadonlyArray<WebGpuShaderResource>, path: string) {
  const parts = path.split('.')
  let resource: WebGpuShaderResource
  let info: WgslResourceInfo
  let offset = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const [key, index] = part.split(/[[\]]/)

    // base resource path
    if (i === 0) {
      resource = findResource(resources, key)
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

    // member access
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
  return new WebGpuProgramInput(resource, {
    ...info,
    offset,
  })
}

function findResource(list: ReadonlyArray<WebGpuShaderResource>, name: string) {
  name = name.toLowerCase()
  if (!list) {
    return null
  }
  for (const item of list) {
    if ((item.info.alias || item.info.name).toLowerCase() === name) {
      return item
    }
  }
  return null
}

function findMember(list: ReadonlyArray<WgslResourceInfo>, name: string) {
  if (!list) {
    return null
  }
  name = name.toLowerCase()
  for (const member of list) {
    if ((member.alias || member.name).toLowerCase() === name) {
      return member
    }
  }
  return null
}
