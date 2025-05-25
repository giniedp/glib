export interface Resource {
  handle: WebGLTexture
  refcount: number
}

export function diposeTextureResource(gl: WebGL2RenderingContext, resource: Resource): void {
  if (resource.refcount > 0) {
    resource.refcount--
  }
  if (resource.refcount <= 0) {
    gl.deleteTexture(resource.handle)
    resource.handle = null
  }
}
