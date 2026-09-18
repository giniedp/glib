import { AssetContainer, AssetLoader, ContentLoader, LoadContext } from '@gglib/content'
import { extname } from '@gglib/utils'
import { GltfAssetContainer, GltfMaterialExtension, GltfTextureExtension } from './asset'
import { Document, parseBinary } from './format'

export class Loader implements AssetLoader {
  public static extensions = ['.gltf', '.glb']
  public static mimeTypes = ['model/gltf+json', 'model/gltf-binary']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  private static gltfExtensions: Record<string, GltfMaterialExtension | GltfTextureExtension> = {}
  public static registerExtension(ext: GltfMaterialExtension | GltfTextureExtension) {
    this.gltfExtensions[ext.name] = ext
  }

  public static isBinary(type: string) {
    return type === 'model/gltf-binary' || type === 'application/octet-stream' || type === '.glb'
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const document = await this.loadDocument(url, context)
    return new GltfAssetContainer(url, document, {
      ...Loader.gltfExtensions,
    })
  }

  protected async loadDocument(url: string, context: LoadContext): Promise<Document> {
    if (Loader.isBinary(extname(url))) {
      const data = await context.content.fetch(url, {
        responseType: 'arraybuffer',
        signal: context.signal,
      })
      return parseBinary(data.body)
    }
    const data = await context.content.fetch<Document>(url, {
      responseType: 'json',
      signal: context.signal,
    })
    return data.body
  }
}
