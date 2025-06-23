import { AssetContainer } from './AssetContainer'
import type { ContentLoader, LoaderContext } from './ContentLoader'

export class LoaderTypeRegistry {
  private loaders: LoaderTypeDescriptor[] = []
  public register(spec: LoaderTypeDescriptor) {
    this.loaders.push(spec)
  }

  public findLoaderType(type: string) {
    if (!type) {
      return null
    }
    for (const loader of this.loaders) {
      if (loader.extensions.includes(type) || loader.mimeTypes.includes(type)) {
        return loader.loader
      }
    }
    return null
  }
}

export interface AssetLoader {
  load(url: string | Blob, context: LoaderContext): Promise<AssetContainer>
}

export type LoaderType = new (content: ContentLoader) => AssetLoader

export interface LoaderTypeDescriptor {
  extensions: string[]
  mimeTypes: string[]
  loader: LoaderType
}
