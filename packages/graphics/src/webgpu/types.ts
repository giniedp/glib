export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export interface GpuResource<T> {
  readonly gpuObject: GpuObject<T>
}

export type GpuObject<T> = T & {
  gpuObject?: never
}

export function isWebGpuResource<T>(value: any): value is GpuResource<T> {
  return value && typeof value === 'object' && 'gpuObject' in value
}
