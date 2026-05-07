import { SchedulerSystem, type ScheduledTask } from '@gglib/components'
import { BoundedAsyncExecutor, ContentLoader } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { Color, Device, Material, Texture } from '@gglib/graphics'
import { Model } from '@gglib/model'
import type { Type } from '@gglib/utils'

export class ContentService extends GameSystem {
  public loader: ContentLoader
  public device: Device

  private modelCache = new Map<string, Promise<Model>>()
  public scheduler: SchedulerSystem

  public nwbtUrl: string = 'http://localhost:8000'

  public get nwbtFileUrl() {
    return `${this.nwbtUrl}/file/`
  }

  public whitePixel: Texture
  public blackPixel: Texture
  public nullBaseMap: Texture
  public nullNormalMap: Texture
  public nullSpecularMap: Texture
  public nullSmoothnessMap: Texture

  public nullPathMap1: Texture
  public nullPathMap2: Texture

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.loader = world.getSystem(ContentLoader)
    this.scheduler = world.getSystem(SchedulerSystem)
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
  }

  public loadModel(model: string, material: string, entity?: GameEntity) {
    const source = modelSource(model, material, this.nwbtFileUrl)
    if (this.modelCache.has(source.url)) {
      return this.modelCache.get(source.url)
    }
    const result = this.scheduler.scheduleAsync(entity, () => {
      return this.loader.loadModel(source.url, {
        baseUrl: source.rootUrl,
      })
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
    // return this.scheduler.scheduleAsync(entity, () => {
    // })
  }
  public loadAsset(url: string, entity?: GameEntity) {
    return this.loader.load(url, {
      baseUrl: this.nwbtFileUrl,
    })
    // return this.scheduler.scheduleAsync(entity, () => {
    // })
  }

  public schedule<T extends ScheduledTask>(task: T): T {
    return this.scheduler.schedule(task)
  }

  public destroy(): void {
    //
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
      modelFile = modelFile + '.glb'
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
  const index = url.lastIndexOf('.')
  if (index === -1) {
    return null
  }
  return url.substring(index)
}
