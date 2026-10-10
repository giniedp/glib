import { AssetType, BoundedAsyncExecutor, ContentLoader } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { Device, Material, Texture } from '@gglib/graphics'
import { Model } from '@gglib/model'
import { fetchTypedRequest, type TypedRequest, type ViewerSlice } from '../api'
import { PARTIAL_TEXTURE_SIZE, PARTIAL_TEXTURES } from '../constants'
import { CgfGeometryAssetType, isAssetIdRef } from '../formats/cgf'
import { MtlLoader } from '../formats/mtl'
import { createAssetIdResolver, normalizeAssetPath, type AssetIdResolver } from './assetIds'
import { RnrAssetType, type RnrAsset } from '../formats/rnr'

/**
 * Material used when a model has none, same as nwbt (game/resolvers.go)
 */
const DEFAULT_MATERIAL = 'materials/references/base_colors/purple_trans_glowing.mtl'

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

  /**
   * Resolves asset ids with the nwbt catalog, see {@link createAssetIdResolver}
   */
  public resolveAssetId: AssetIdResolver

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
    this.resolveAssetId = createAssetIdResolver(this.loader, this.nwbtUrl)
    // textures of .mtl files that only resolve by their asset id
    MtlLoader.resolveAssetId = this.resolveAssetId

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

  /**
   * Loads a static model (`.cgf`) with its material
   *
   * @param model - path of the `.cgf` file
   * @param material - path of the `.mtl` file (override), empty to use the material of the `.cgf` file
   */
  public loadModel(model: string, material: string): Promise<Model> {
    if (!model || extName(model) !== '.cgf') {
      return Promise.reject(new Error(`unsupported model type: ${model}`))
    }
    return this.loadCgfModel(model, material)
  }

  /**
   * Assembles a model from the original `.cgf` (+ `.cgfheap`) and `.mtl` files
   *
   * @remarks
   * Geometry is loaded and uploaded once per `.cgf`, materials once per `.mtl` sub material.
   * Each model+material pair gets its own (cheap) Model and Mesh objects that share them.
   *
   * Material precedence: the given material (override of the slice), else the material of the `.cgf` file,
   * else the default material.
   */
  private loadCgfModel(model: string, material: string): Promise<Model> {
    model = normalizeAssetPath(model)
    material = material ? normalizeAssetPath(material) : ''
    const key = `cgf:${model}|${material}`
    if (!this.modelCache.has(key)) {
      this.modelCache.set(key, this.assembleCgfModel(model, material))
    }
    return this.modelCache.get(key)
  }

  private async assembleCgfModel(model: string, override: string): Promise<Model> {
    const geometryTask = this.loader.load(CgfGeometryAssetType, model, { baseUrl: this.nwbtFileUrl })
    // the override is known upfront, load its xml along with the geometry
    const overrideTask = override ? this.materialCount(override) : null
    const geometry = await geometryTask
    let material = override
    let count = await overrideTask
    if (!count) {
      material = (await this.resolveCgfMaterial(model, geometry.mtlRef)) || DEFAULT_MATERIAL
      count = await this.materialCount(material)
    }
    // models with and without override that end up with the same material share the Model
    const key = `cgf:${model}|${material}`
    if (override !== material && this.modelCache.has(key)) {
      return this.modelCache.get(key)
    }

    // only the sub materials that are used by the subsets, an .mtl file often holds more
    const used: number[] = []
    const partMaterial = (id: number) => {
      // like nwbt: material ids out of range use the first material
      id = id >= 0 && id < count ? id : 0
      if (!used.includes(id)) {
        used.push(id)
      }
      return used.indexOf(id)
    }
    const parts = geometry.meshes.map((mesh) =>
      mesh.materialIds.map((id, i) => ({ geometryIndex: i, materialIndex: partMaterial(id) })),
    )
    const materials = await Promise.all(
      used.map((index) => this.loader.loadMaterial(material, { baseUrl: this.nwbtFileUrl, index })),
    )

    const result = this.loader.createModel({
      name: model,
      nodes: structuredClone(geometry.nodes),
      scenes: [{ nodes: [...geometry.roots] }],
      scene: 0,
      meshes: geometry.meshes.map((mesh, i) => ({
        name: mesh.name,
        boundingBox: mesh.boundingBox,
        geometries: mesh.geometries,
        materials: materials,
        parts: parts[i],
      })),
    })
    if (override !== material) {
      this.modelCache.set(key, Promise.resolve(result))
    }
    return result
  }

  /**
   * Number of sub materials of an `.mtl` file, loads and parses the file (cached by the content loader)
   */
  private async materialCount(file: string): Promise<number> {
    const container = await this.loader.loadContainer(file, { baseUrl: this.nwbtFileUrl })
    const count = container.count(AssetType.Material)
    if (!count) {
      throw new Error(`no materials in ${file}`)
    }
    return count
  }

  /**
   * Resolves the material reference of a `.cgf` file (MtlName chunk) to an `.mtl` path
   *
   * @remarks
   * Paths resolve like nwbt `ResolveMtlFromCgf`: with a directory relative to the asset root, a plain file name relative
   * to the directory of the `.cgf`. Asset ids are resolved by the nwbt catalog (one request per distinct id).
   */
  private resolveCgfMaterial(model: string, ref: string | null): Promise<string | null> {
    if (!ref) {
      return Promise.resolve(null)
    }
    if (!isAssetIdRef(ref)) {
      let file = normalizeAssetPath(ref)
      if (!file.includes('/')) {
        file = model.slice(0, model.lastIndexOf('/') + 1) + file
      }
      if (!/\.[^./]+$/.test(file)) {
        file += '.mtl'
      }
      return Promise.resolve(file)
    }
    return this.resolveAssetId(ref)
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
