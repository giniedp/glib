import {
  Device,
  Effect,
  Geometry,
  Material,
  ShaderConstants,
  type Buffer,
  type RenderEncoder,
  type RenderVariant,
  type WebGpuShaderModule,
} from '@gglib/graphics'

// indexCount|vertexCount, instanceCount, firstIndex|firstVertex, baseVertex|firstInstance, firstInstance|unused
export const WORDS_PER_DRAW = 5
export const BYTES_PER_DRAW = WORDS_PER_DRAW * 4

export interface IndirectArgsSource {
  getArgsBuffer(): Buffer
}

/**
 * Returns the static indirect draw arguments for the given geometry. The instance count is left at 0,
 * it is written by a compute pass.
 */
export function indirectDrawArgs(geometry: Geometry, firstInstance: number): number[] {
  if (geometry.indexBuffer) {
    return [geometry.indexCount, 0, geometry.indexOffset, geometry.baseVertex >>> 0, firstInstance]
  }
  return [geometry.vertexCount, 0, geometry.vertexOffset, firstInstance, 0]
}

/**
 * Shares the vertex and index buffers of the source geometry and renders with indirect draw arguments
 */
export class IndirectGeometry extends Geometry {
  private source: IndirectArgsSource
  private drawIndex: number

  public constructor(device: Device, geometry: Geometry, source: IndirectArgsSource, drawIndex: number) {
    super(device, {
      name: geometry.name,
      boundingBox: geometry.boundingBox,
      boundingSphere: geometry.boundingSphere,
      primitiveType: geometry.primitiveType,
      indexBuffer: geometry.indexBuffer,
      vertexBuffer: geometry.vertexBuffer,
      indexOffset: geometry.indexOffset,
      indexCount: geometry.indexCount,
      vertexOffset: geometry.vertexOffset,
      vertexCount: geometry.vertexCount,
      baseVertex: geometry.baseVertex,
    })
    this.source = source
    this.drawIndex = drawIndex
  }

  public override render(encoder: RenderEncoder): void {
    if (this.indexBuffer) {
      encoder.setIndexBuffer(this.indexBuffer)
    }
    encoder.setVertexBuffer(this.vertexBuffer)
    encoder.setPrimitiveType(this.primitiveType)
    if (this.indexBuffer) {
      encoder.drawIndexedIndirect(this.source.getArgsBuffer(), this.drawIndex * BYTES_PER_DRAW)
    } else {
      encoder.drawIndirect(this.source.getArgsBuffer(), this.drawIndex * BYTES_PER_DRAW)
    }
  }
}

/**
 * Wraps materials so that they hand out effects which read the instance transforms from a given buffer
 * (the output of a culling compute pass). The wrappers share all other state with the original material.
 */
export class IndirectMaterials {
  private device: Device
  private transforms: Buffer
  private fragmentConstants: Record<string, number> | null
  private effects = new Map<Effect, Effect | null>()
  private proxies = new Map<Material, Material>()

  /**
   * @param fragmentConstants - additional fragment shader constants for the wrapped effects, e.g. the dither fade
   *   (ditherFadeConstants). Only applied to shaders that use ditherFade.
   */
  public constructor(device: Device, transforms: Buffer, fragmentConstants?: Record<string, number>) {
    this.device = device
    this.transforms = transforms
    this.fragmentConstants = fragmentConstants || null
  }

  public get(material: Material): Material {
    let result = this.proxies.get(material)
    if (!result) {
      result = Object.create(material) as Material
      result.getEffect = (variant: RenderVariant) => this.getEffect(material.getEffect(variant))
      this.proxies.set(material, result)
    }
    return result
  }

  private getEffect(effect: Effect | null): Effect | null {
    if (!effect) {
      return null
    }
    if (this.effects.has(effect)) {
      return this.effects.get(effect)
    }
    const options = effect.cloneOptions()
    const transformBlock = options.program.perInstanceTransformBlock
    if (!transformBlock) {
      // effect does not read instance transforms from a buffer, can't be used for instancing
      this.effects.set(effect, null)
      return null
    }
    const clone = new Effect(this.device, {
      ...options,
      program: {
        ...options.program,
        shader: this.withConstants(options.program.shader as WebGpuShaderModule),
        // opt out of render list batching, instance transforms are provided by the transform buffer
        perInstanceTransformBlock: null,
      },
    })
    clone.program.mustGet(transformBlock).setBuffer(this.transforms)
    this.effects.set(effect, clone)
    return clone
  }

  private withConstants(module: WebGpuShaderModule) {
    if (!this.fragmentConstants || !module.source?.includes('ditherFade(')) {
      return module
    }
    return {
      wgsl: {
        source: module.source,
        vertexConstants: module.vertexConstants,
        fragmentConstants: ShaderConstants.get({
          ...(module.fragmentConstants?.state || {}),
          ...this.fragmentConstants,
        }),
      },
      glsl: null,
    }
  }

  public dispose() {
    for (const effect of this.effects.values()) {
      effect?.dispose()
    }
    this.effects.clear()
    this.proxies.clear()
  }
}
