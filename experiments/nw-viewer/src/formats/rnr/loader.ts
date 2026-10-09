import { ContentLoader, type AssetContainer, type AssetLoader, type AssetType, type LoadContext } from '@gglib/content'
import { parseRnr } from './parse'
import type { RnrAsset } from './types'

/**
 * Asset type of a parsed RockNRoll shape asset. The parsed asset is used as is, no GPU resources are created.
 */
export const RnrAssetType = 'rnr' as AssetType<RnrAsset, RnrAsset>

/**
 * Registers the `.rnr` loader and the asset creator on a content loader
 */
export function registerRnr(content: ContentLoader) {
  content.registerLoader(RnrLoader)
  content.registerCreator(RnrAssetType, (_, asset) => asset)
}

/**
 * Loads RockNRoll `.rnr` shape assets
 */
export class RnrLoader implements AssetLoader {
  public static extensions = ['.rnr']
  public static mimeTypes: string[] = []
  public static create = () => new RnrLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(RnrLoader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    return new RnrContainer(parseRnr(response.body))
  }
}

export class RnrContainer implements AssetContainer {
  public readonly document: RnrAsset

  public constructor(document: RnrAsset) {
    this.document = document
  }

  public count(asset: AssetType<any, any>): number {
    return asset === RnrAssetType ? 1 : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number): Promise<any> {
    if (asset !== RnrAssetType || index !== 0) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
    return this.document
  }
}
