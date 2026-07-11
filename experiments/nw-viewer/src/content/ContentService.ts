import { BoundedAsyncExecutor, ContentLoader } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { Color, Device, Material, Texture } from '@gglib/graphics'
import { Model } from '@gglib/model'
import type { Type } from '@gglib/utils'
import { fetchTypedRequest, type TypedRequest, type ViewerSlice } from '../api'

export const Noise3DKey = Symbol('noise3d')
export const Noise2DKey = Symbol('noise2d')

export class ContentService extends GameSystem {
  public loader: ContentLoader
  public device: Device

  private modelCache = new Map<string, Promise<Model>>()

  public nwbtUrl: string = '' // window.location.origin

  public get nwbtFileUrl() {
    return `${this.nwbtUrl}/files/`
  }

  public slices = new Map<string, ViewerSlice>()
  public whitePixel: Texture
  public blackPixel: Texture
  public nullHeightmap: Texture
  public nullHeightmapArray: Texture
  public nullBaseMap: Texture
  public nullNormalMap: Texture
  public nullSpecularMap: Texture
  public nullSmoothnessMap: Texture

  public nullPathMap1: Texture
  public nullPathMap2: Texture
  public noise3d: Texture
  public noise2d: Texture

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.loader = world.getSystem(ContentLoader)
    this.loader.executor = new BoundedAsyncExecutor(10)

    const device = world.getSystem(Device)
    this.whitePixel = device.createTexture({
      name: 'whitePixel',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.White),
    })
    this.blackPixel = device.createTexture({
      name: 'blackPixel',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.TransparentBlack),
    })

    this.nullBaseMap = device.createTexture({
      name: 'nullBaseMap',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.Black),
    })
    this.nullNormalMap = device.createTexture({
      name: 'nullNormalMap',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.LimeGreen),
    })
    this.nullSpecularMap = this.whitePixel
    this.nullSmoothnessMap = this.whitePixel

    this.nullPathMap1 = device.createTexture({
      name: 'nullPathMap1',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.fromBytes(255, 255, 255, 0)),
    })
    this.nullPathMap2 = device.createTexture({
      name: 'nullPathMap2',
      width: 1,
      height: 1,
      format: 'RGBA8_UNORM',
      source: Color.toByteArray(Color.fromBytes(0, 0, 0, 0)),
    })
    this.nullHeightmap = device.createTexture({
      name: 'nullHeightmap',
      width: 1,
      height: 1,
      format: 'R16_FLOAT',
    })
    this.nullHeightmapArray = device.createTexture({
      name: 'nullHeightmap',
      width: 1,
      height: 1,
      depth: 4,
      type: 'Texture2DArray',
      format: 'R16_FLOAT',
      mipLevelCount: 1,
    })

    this.noise3d = device.createTexture({
      name: 'noise3d',
      width: 4,
      height: 4,
      depth: 4,
      format: 'RGBA8_UNORM',
    })
    this.device[Noise3DKey] = this.noise3d
    this.loadTexture(`engineassets/textures/noise3d.dds`).then((texture) => {
      this.noise3d = texture
      this.device[Noise3DKey] = this.noise3d
      console.log('Loaded noise3d texture', texture)
    })

    this.noise2d = device.createTexture({
      name: 'noise2d',
      width: 4,
      height: 4,
      depth: 1,
      format: 'RGBA8_UNORM',
    })
    this.device[Noise2DKey] = this.noise2d
    this.loadTexture(`engineassets/textures/perlinnoise2d.dds`).then((texture) => {
      this.noise2d = texture
      this.device[Noise2DKey] = this.noise2d
      console.log('Loaded noise2d texture', texture)
    })
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
    return this.loader.load(url, {
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
    modelFile += `?material=${materialFile}`
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
