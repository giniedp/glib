import { ContentLoader, type AssetContainer, type AssetLoader, type AssetType, type LoadContext } from '@gglib/content'
import { Geometry } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import type { NodeData } from '@gglib/model'
import { buildCgfGeometryOptions, type CgfGeometryOptions } from './geometry'
import { CGF_HEAP_AFTER_PARSE } from '../../constants'
import { parseCgf } from './parse'
import type { CgfFile } from './types'

/**
 * The static geometry of a `.cgf` file on the GPU, without materials
 *
 * @remarks
 * Created once per file and shared by all models that use the file, with any material.
 * The buffers are shared by the geometries of a mesh, do not dispose them while the content loader caches this asset.
 */
export interface CgfGeometry {
  /**
   * Material reference of the file (asset id or path), the material used when the caller has no override
   */
  mtlRef: string | null
  nodes: NodeData[]
  roots: number[]
  meshes: CgfGeometryMesh[]
  /**
   * Node hierarchies of the inline levels of detail, index 0 is level 1, see {@link CgfGeometryOptions.inlineLods}
   */
  inlineLods: NodeData[][]
  /**
   * Whether the file has levels of detail in sibling files, see {@link CgfGeometryOptions.haveAutoLods}
   */
  haveAutoLods: boolean
  /**
   * Geometric mean of the triangle areas of all rendered meshes
   */
  geometricMeanFaceArea: number
}

export interface CgfGeometryMesh {
  name: string
  boundingBox: BoundingBox
  /**
   * One geometry per subset
   */
  geometries: Geometry[]
  /**
   * Material index per geometry, into the material collection of the `.mtl` file
   */
  materialIds: number[]
}

/**
 * Asset type of {@link CgfGeometry}, loaded from `.cgf` urls
 */
export const CgfGeometryAssetType = 'nw-cgf-geometry' as AssetType<CgfGeometryOptions, CgfGeometry>

/**
 * Registers the `.cgf` loader and the {@link CgfGeometry} creator on a content loader
 */
export function registerCgf(content: ContentLoader) {
  content.registerLoader(CgfLoader)
  content.registerCreator(CgfGeometryAssetType, createCgfGeometry)
}

/**
 * Loads `.cgf` files together with their `.cgfheap`
 */
export class CgfLoader implements AssetLoader {
  public static extensions = ['.cgf']
  public static mimeTypes: string[] = []
  public static create = () => new CgfLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(CgfLoader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const fetchHeap = () =>
      context.content
        .fetch(heapUrl(url), { responseType: 'arraybuffer', signal: context.signal })
        .then((res) => res.body)
        // the old format has no heap file (404), its vertex data is inline
        .catch(() => null)

    // level of detail siblings are probed and may not exist, their heap is only requested when the file exists
    if (CGF_HEAP_AFTER_PARSE || isSiblingLodUrl(url)) {
      // one more round trip, but no heap request for files with inline vertex data
      const res = await context.content.fetch(url, { responseType: 'arraybuffer', signal: context.signal })
      const cgf = parseCgf(res.body)
      const heap = cgf.dataRefs.size ? await fetchHeap() : null
      return new CgfContainer(url, cgf, heap)
    }
    const [res, heap] = await Promise.all([
      context.content.fetch(url, { responseType: 'arraybuffer', signal: context.signal }),
      fetchHeap(),
    ])
    return new CgfContainer(url, parseCgf(res.body), heap)
  }
}

function isSiblingLodUrl(url: string) {
  return /_lod\d+\.cgf(\?|$)/i.test(url)
}

function heapUrl(url: string) {
  const query = url.indexOf('?')
  return query < 0 ? url + 'heap' : url.slice(0, query) + 'heap' + url.slice(query)
}

export class CgfContainer implements AssetContainer {
  public readonly url: string
  private data: { cgf: CgfFile; heap: ArrayBuffer | null } | null

  public constructor(url: string, cgf: CgfFile, heap: ArrayBuffer | null) {
    this.url = url
    this.data = { cgf, heap }
  }

  public count(asset: AssetType<any, any>): number {
    return asset === CgfGeometryAssetType ? 1 : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== CgfGeometryAssetType || index !== 0) {
      throw new Error(`Asset ${asset}#${index} not supported by this container: ${this.url}`)
    }
    if (!this.data) {
      throw new Error(`Geometry of ${this.url} was already loaded, its file data is released`)
    }
    const { cgf, heap } = this.data
    // the content loader caches the created asset, the raw file data is not needed anymore
    this.data = null
    return buildCgfGeometryOptions(cgf, heap ? new Uint8Array(heap) : null, this.url)
  }
}

/**
 * Uploads the buffers of each mesh once and creates a geometry per subset
 */
export function createCgfGeometry(content: ContentLoader, options: CgfGeometryOptions): CgfGeometry {
  const device = content.device
  return {
    mtlRef: options.mtlRef,
    nodes: options.nodes,
    roots: options.roots,
    inlineLods: options.inlineLods,
    haveAutoLods: options.haveAutoLods,
    geometricMeanFaceArea: options.geometricMeanFaceArea,
    meshes: options.meshes.map((mesh) => {
      const vertexBuffer = device.createVertexBuffer(mesh.vertexBuffer)
      const indexBuffer = device.createIndexBuffer(mesh.indexBuffer)
      const box = BoundingBox.convert(mesh.boundingBox)
      const sphere = BoundingSphere.createFromBox(box)
      return {
        name: mesh.name,
        boundingBox: box,
        materialIds: mesh.subsets.map((s) => s.materialId),
        geometries: mesh.subsets.map(
          (subset) =>
            new Geometry(device, {
              name: mesh.name,
              vertexBuffer,
              indexBuffer,
              indexOffset: subset.indexOffset,
              indexCount: subset.indexCount,
              vertexCount: mesh.vertexCount,
              // TODO: subsets cover parts of the mesh, the mesh bounds are not tight
              boundingBox: box,
              boundingSphere: sphere,
            }),
        ),
      }
    }),
  }
}
