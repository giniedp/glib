import type {
  AssetReference,
  CatalogAssetData,
  DistributionData,
  EntityData,
  LevelData,
  RegionData,
  TerrainData,
  ViewerSlice,
} from './types'

export type TypedRequest<T> = {
  url: string
}

export class NwbtApiClient {
  public readonly baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl || ''
  }

  public async getLevelInfo(levelName: string): Promise<LevelData> {
    return this.fetch(getLevelInfoUrl(levelName))
  }

  public async getRegionInfo(levelName: string, regionName: string): Promise<RegionData> {
    return this.fetch(getRegionInfoUrl(levelName, regionName))
  }

  public async getCapitalEntities(levelName: string, regionName: string, capitalId: string): Promise<EntityData[]> {
    return this.fetch(getCapitalEntities(levelName, regionName, capitalId))
  }

  public async getHeightmapInfo(levelName: string): Promise<TerrainData> {
    return this.fetch(getHeightmapInfoUrl(levelName))
  }

  public async fetch<T>(request: TypedRequest<T>): Promise<T> {
    return fetchTypedRequest(this.baseUrl, request)
  }
}

export async function fetchTypedRequest<T>(baseUrl: string, url: TypedRequest<T>): Promise<T> {
  return fetch((baseUrl || '') + url.url).then((it) => it.json())
}

export function getRegionName(x: number, y: number): string {
  return `r_+${y.toString().padStart(2, '0')}_+${x.toString().padStart(2, '0')}`
}

export function getSliceUrl(ref: AssetReference): TypedRequest<ViewerSlice> {
  return { url: `/level/slice/${ref.guid}_${ref.subId}.json` }
}

export function getLevelsUrl(): TypedRequest<LevelData[]> {
  return { url: `/level` }
}

export function getLevelInfoUrl(levelName: string): TypedRequest<LevelData> {
  return { url: `/level/${levelName}` }
}

export function getLevelMissionUrl(levelName: string): TypedRequest<EntityData[]> {
  return { url: `/level/${levelName}/mission` }
}

export function getRegionInfoUrl(levelName: string, regionName: string): TypedRequest<RegionData> {
  return { url: `/level/${levelName}/region/${regionName}` }
}

export function getHeightmapInfoUrl(levelName: string): TypedRequest<TerrainData> {
  return { url: `/level/${levelName}/heightmap` }
}

export function getRegionEntitiesUrl(
  levelName: string,
  regionName: string,
): TypedRequest<Record<string, Record<string, EntityData[]>>> {
  return { url: `/level/${levelName}/region/${regionName}/entities` }
}

export function getRegionDistributionUrl(levelName: string, regionName: string): TypedRequest<DistributionData> {
  return { url: `/level/${levelName}/region/${regionName}/distribution` }
}

export function getCatalogAssetInfo(assetId: string): TypedRequest<CatalogAssetData> {
  return { url: `/catalog/${encodeURIComponent(assetId)}` }
}

export function getCapitalEntities(
  levelName: string,
  regionName: string,
  capitalId: string,
): TypedRequest<EntityData[]> {
  return { url: `/level/${levelName}/region/${regionName}/capital/${capitalId}` }
}
