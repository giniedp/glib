import { AssetContainer } from './AssetContainer'
import type { ContentLoader, LoaderContext } from './ContentLoader'

export class AssetLoaderRegistry {
  private loaders: LoaderEntry[] = []

  public register(spec: LoaderEntry | LoaderByExtension) {
    if ('match' in spec) {
      this.loaders.push(spec)
    } else {
      this.loaders.push({
        match: (type) => spec.extensions.includes(type) || spec.mimeTypes.includes(type),
        create: spec.create,
      })
    }
  }

  public find(type: string): LoaderFactory<any> | null {
    if (!type) {
      return null
    }
    for (const loader of this.loaders) {
      if (loader.match(type)) {
        return loader.create
      }
    }
    return null
  }
}

export interface AssetLoader {
  load(url: string | Blob, context: LoaderContext): Promise<AssetContainer>
}

export type LoaderFactory<T = unknown> = (content: ContentLoader, options?: T) => AssetLoader | Promise<AssetLoader>

export interface LoaderByExtension<T = unknown> {
  extensions: string[]
  mimeTypes: string[]
  create: LoaderFactory<T>
}

export interface LoaderEntry {
  match: (type: string) => boolean
  create: LoaderFactory<void>
}
