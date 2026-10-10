import { AssetType, BoundedAsyncExecutor, ContentLoader } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { Device, Material, Texture } from '@gglib/graphics'
import { Model } from '@gglib/model'
import { addItemIfAbsent, type Type } from '@gglib/utils'
import { fetchTypedRequest, type TypedRequest, type ViewerSlice } from '../api'
import { PARTIAL_TEXTURE_SIZE, PARTIAL_TEXTURES } from '../constants'
import { RnrAssetType, type RnrAsset } from '../formats/rnr'

// Global engine texture keys
export const Noise3DKey = Symbol('noise3d')
export const Noise2DKey = Symbol('noise2d')
export const FoamMapKey = Symbol('FoamMap')
export const FoamNormalMapKey = Symbol('FoamNormalMap')
export const GlossMapKey = Symbol('GlossMap')
export const WhiteTextureKey = Symbol('WhiteTexture')
export const GrayTextureKey = Symbol('GrayTexture')
export const BlackTextureKey = Symbol('BlackTexture')

export class ContentService extends GameSystem {
  public loader: ContentLoader
  public device: Device

  private modelCache = new Map<string, Promise<Model>>()

  // empty: same origin (vite proxy), otherwise the nwbt server directly, e.g. https://localhost:8443 for HTTP/2
  public nwbtUrl: string = import.meta.env.VITE_NWBT_URL ?? ''

  public get nwbtFileUrl() {
    return `${this.nwbtUrl}/files/`
  }

  public slices = new Map<string, ViewerSlice>()

  public whitePixel: Texture
  public grayPixel: Texture
  public blackPixel: Texture
  public noise2d: Texture
  public noise3d: Texture
  public waterFoamMap: Texture
  public waterFoamNormalMap: Texture
  public waterGlossMap: Texture
  public nullHeightmapArray: Texture

  private engineAssets = Promise.withResolvers()
  public get whenLoaded() {
    return this.engineAssets.promise
  }

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.loader = world.getSystem(ContentLoader)
    this.loader.executor = new BoundedAsyncExecutor(20)

    if (PARTIAL_TEXTURES) {
      const resolve = this.loader.uriResolver
      this.loader.uriResolver = (uri, options) => {
        return toPartialTextureUrl(resolve(uri, options))
      }
    }

    this.loadEngineTextures().then(this.engineAssets.resolve).catch(this.engineAssets.reject)
  }

  private async loadEngineTextures() {
    const device = this.device

    this.whitePixel = device.acquireTexture({
      key: WhiteTextureKey,
      name: 'whitePixel',
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      source: new Uint8Array([255, 255, 255, 255]),
    })

    this.grayPixel = device.acquireTexture({
      key: GrayTextureKey,
      name: 'grayPixel',
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      source: new Uint8Array([128, 128, 128, 255]),
    })

    this.blackPixel = device.acquireTexture({
      key: BlackTextureKey,
      name: 'blackPixel',
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      source: new Uint8Array([0, 0, 0, 0]),
    })

    this.nullHeightmapArray = device.createTexture({
      name: 'nullHeightmap',
      width: 1,
      height: 1,
      depth: 4,
      type: '2d-array',
      format: 'r16float',
      mipLevelCount: 1,
    })

    const loads: Array<() => Promise<void>> = []

    const loadEngineTexture = async (key: any, path: string) => {
      const asset = await this.loadAsset(path)
      const options = await asset.load(AssetType.Texture, 0, { content: this.loader })
      return this.device.acquireTexture({
        ...options,
        key: key,
      })
    }

    loads.push(async () => {
      this.noise3d = await loadEngineTexture(Noise3DKey, `engineassets/textures/noise3d.dds`)
    })

    loads.push(async () => {
      this.noise2d = await loadEngineTexture(Noise2DKey, `engineassets/textures/perlinnoise2d.dds`)
    })

    loads.push(async () => {
      this.waterFoamMap = await loadEngineTexture(FoamMapKey, `engineassets/shading/waterfoam.dds`)
    })

    loads.push(async () => {
      this.waterFoamNormalMap = await loadEngineTexture(FoamNormalMapKey, `engineassets/shading/waterfoam2_ddn.dds`)
    })

    loads.push(async () => {
      this.waterGlossMap = await loadEngineTexture(GlossMapKey, `engineassets/textures/water_gloss.dds`)
    })

    await Promise.all(loads.map((it) => it()))
  }

  public loadModel(model: string, material: string) {
    const source = modelSource(model, material, this.nwbtFileUrl)
    if (this.modelCache.has(source.url)) {
      return this.modelCache.get(source.url)
    }
    const result = this.loader.loadModel(source.url, {
      baseUrl: source.rootUrl,
    })
    this.modelCache.set(source.url, result)
    return result
  }

  /**
   * Loads a RockNRoll `.rnr` collision shape asset, cached by the content loader
   *
   * @param url - file path relative to the nwbt file root
   */
  public loadCollisionShape(url: string): Promise<RnrAsset> {
    return this.loader.load(RnrAssetType, url, {
      baseUrl: this.nwbtFileUrl,
    })
  }

  public loadTexture(url: string) {
    return this.loader.loadTexture(url, {
      baseUrl: this.nwbtFileUrl,
    })
  }

  public loadMaterialAsset(url: string, entity?: GameEntity) {
    return this.loader.loadMaterial(url, {
      baseUrl: this.nwbtFileUrl,
    })
  }
  public loadAsset(url: string, entity?: GameEntity) {
    return this.loader.loadContainer(url, {
      baseUrl: this.nwbtFileUrl,
    })
  }

  public fetchTypedRequest<T>(url: TypedRequest<T>): Promise<T> {
    return fetchTypedRequest(this.nwbtUrl, url)
  }

  public destroy(): void {
    //
  }

  public updateSlices(sliceSet: Record<string, ViewerSlice>) {
    for (const key in sliceSet) {
      if (!this.slices.has(key)) {
        this.slices.set(key, sliceSet[key])
      }
    }
  }
}

export type ContentSchema = {
  [key: string]: AssetSource
}

export type AssetSource<T extends Type<Texture> | Type<Material> | Type<Model> | unknown = unknown> = {
  url: string
  type: T
}

export interface ModelSource {
  url: string
  rootUrl?: string
}
const buckets: Record<string, string[]> = {}
window['__nw_viewer_buckets'] = buckets
function modelSource(modelFile: string, materialFile: string, rootUrl: string): ModelSource | null {
  if (!modelFile) {
    return null
  }
  switch (extName(modelFile)) {
    case '.cgf':
    case '.cdf':
    case '.caf':
    case '.dynamicslice':
      modelFile = modelFile + '.glb'
      break
    case '.gtlf':
    case '.glb':
      // ok
      break
    default:
      console.warn('Unknown model type', modelFile)
      return null
  }
  if (!rootUrl.endsWith('/')) {
    rootUrl = rootUrl + '/'
  }
  if (modelFile.startsWith('/')) {
    modelFile = modelFile.substring(1)
  }
  if (materialFile) {
    buckets[modelFile] = buckets[modelFile] || []
    addItemIfAbsent(buckets[modelFile], materialFile)
    if (modelFile.includes('?')) {
      modelFile += `&material=${materialFile}`
    } else {
      modelFile += `?material=${materialFile}`
    }
  }
  if (modelFile.includes('?')) {
    modelFile += `&no-lod=1`
  } else {
    modelFile += `?no-lod=1`
  }

  return {
    url: modelFile,
    rootUrl: rootUrl,
  }
}

function extName(url: string) {
  const path = new URL(url, location.origin).pathname
  const index = path.lastIndexOf('.')
  if (index === -1) {
    return null
  }
  return path.substring(index)
}

/**
 * Textures that are always loaded in full: cubemaps (partial files are only supported for single images),
 * impostors (region and POI impostors) and terrain materials.
 */
const FULL_TEXTURE_PATTERN = /cubemaps\/|_cm\.dds|impostors\/|(^|\/)terrain\//

/**
 * Requests only the mips up to PARTIAL_TEXTURE_SIZE of a split DDS texture, with the original header
 */
function toPartialTextureUrl(url: string) {
  if (!url.includes('merge=true') || !/\.dds(\.a\.dds)?\?/.test(url) || FULL_TEXTURE_PATTERN.test(url)) {
    return url
  }
  return url.replace('merge=true', 'merge=partial').replace(/([?&])size=\d+/, `$1size=${PARTIAL_TEXTURE_SIZE}`)
}
