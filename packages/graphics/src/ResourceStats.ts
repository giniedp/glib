import { Effect } from './effects/Effect'
import { Material } from './effects/Material'
import { Geometry } from './geometry/Geometry'
import { Mesh } from './geometry/Mesh'
import { Buffer } from './resources/Buffer'
import { Program } from './resources/Program'
import type { Ownable } from './resources/ResourceOwnership'
import { ShaderModule } from './resources/ShaderModule'
import { Texture } from './resources/Texture'
import { VertexBuffer } from './resources/VertexBuffer'

/**
 * Counts and sizes of a set of resources, see {@link collectResourceStats}
 */
export interface ResourceStats {
  /**
   * Total number of resources
   */
  count: number
  textureCount: number
  /**
   * Estimated size of all textures in bytes
   */
  textureBytes: number
  /**
   * Number of buffers, a vertex buffer counts as one
   */
  bufferCount: number
  /**
   * Size of all buffers in bytes, including the buffers of vertex buffers
   */
  bufferBytes: number
  shaderCount: number
  programCount: number
  effectCount: number
  materialCount: number
  geometryCount: number
  meshCount: number
  /**
   * Number of resources by kind that are not one of the above, keyed by constructor name
   */
  other: Record<string, number>
}

/**
 * Collects counts and sizes of the given resources, e.g. `scope.walk()` of a {@link ResourceScope}
 *
 * @remarks
 * Iterating a scope directly yields only the resources it owns, {@link ResourceScope.walk} includes what they hold.
 */
export function collectResourceStats(resources: Iterable<Ownable>, out?: ResourceStats): ResourceStats {
  const result = out || ({} as ResourceStats)
  result.count = 0
  result.textureCount = 0
  result.textureBytes = 0
  result.bufferCount = 0
  result.bufferBytes = 0
  result.shaderCount = 0
  result.programCount = 0
  result.effectCount = 0
  result.materialCount = 0
  result.geometryCount = 0
  result.meshCount = 0
  result.other = {}
  for (const resource of resources) {
    result.count++
    if (resource instanceof Texture) {
      result.textureCount++
      result.textureBytes += resource.sizeInBytes
    } else if (resource instanceof Buffer) {
      result.bufferCount++
      result.bufferBytes += resource.size
    } else if (resource instanceof VertexBuffer) {
      result.bufferCount++
      for (const buffer of resource.buffers) {
        result.bufferBytes += buffer.size
      }
    } else if (resource instanceof ShaderModule) {
      result.shaderCount++
    } else if (resource instanceof Program) {
      result.programCount++
    } else if (resource instanceof Effect) {
      result.effectCount++
    } else if (resource instanceof Material) {
      result.materialCount++
    } else if (resource instanceof Geometry) {
      result.geometryCount++
    } else if (resource instanceof Mesh) {
      result.meshCount++
    } else {
      const name = resource?.constructor?.name || 'Object'
      result.other[name] = (result.other[name] ?? 0) + 1
    }
  }
  return result
}
