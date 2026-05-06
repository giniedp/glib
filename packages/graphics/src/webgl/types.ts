export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export interface WebglResource<T> {
  readonly glHandle: WebGLHandle<T>
}

export type WebGLHandle<T> = T & {
  glHandle?: never
}

export function isWebglResource<T>(value: any): value is WebglResource<T> {
  return value && typeof value === 'object' && 'glResource' in value
}
