import type { LevelIndex, LevelInfo, RegionCapitalsData, RegionInfo } from './types'

export type TypedRequest<T> = {
  url: string
  type: 'json' | 'arraybuffer'
  __type?: T
}

export class NwbtApiClient {
  public readonly baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl || ''
  }

  public async getLevelList() {
    return this.fetch(getLevelListUrl())
  }

  public async getLevelInfo(levelName: string) {
    return this.fetch(getLevelInfoUrl(levelName))
  }

  public async getRegionInfo(levelName: string, regionName: string) {
    return this.fetch(getRegionInfoUrl(levelName, regionName))
  }

  public async getRegionCapitals(levelName: string, regionName: string) {
    return this.fetch(getRegionCapitalsUrl(levelName, regionName))
  }

  public async fetch<T>(request: TypedRequest<T>): Promise<T> {
    return fetchTypedRequest(this.baseUrl, request)
  }
}

export async function fetchTypedRequest<T>(baseUrl: string, request: TypedRequest<T>): Promise<T> {
  return fetch((baseUrl || '') + request.url).then(async (it) => {
    if (!it.ok) {
      throw new Error(`Failed to fetch ${request.url}: ${it.status} ${it.statusText}`)
    }

    if (request.type === 'json') {
      return it.json() as Promise<T>
    }

    if (request.type === 'arraybuffer') {
      const buffer = await it.arrayBuffer()
      return buffer as any as T
    }

    throw new Error(`Unsupported request type: ${request.type}`)
  })
}

export function getRegionName(x: number, y: number): string {
  return `r_+${x.toString().padStart(2, '0')}_+${y.toString().padStart(2, '0')}`
}

export function getLevelListUrl(): TypedRequest<LevelIndex> {
  return { url: `/levels/list.json`, type: 'json' }
}

export function getLevelInfoUrl(levelName: string): TypedRequest<LevelInfo> {
  return { url: `/levels/${levelName}/info.json`, type: 'json' }
}

export function getRegionInfoUrl(levelName: string, regionName: string): TypedRequest<RegionInfo> {
  return { url: `/levels/${levelName}/${regionName}/info.json`, type: 'json' }
}

export function getRegionCapitalsUrl(levelName: string, regionName: string): TypedRequest<RegionCapitalsData> {
  return { url: `/levels/${levelName}/${regionName}/capitals.json`, type: 'json' }
}

export function getRegionHeightmapUrl(levelName: string, regionName: string): TypedRequest<Float16Array> {
  return { url: `/levels/${levelName}/${regionName}/heightmap.r16`, type: 'arraybuffer' }
}

export function getRegionWatermapUrl(levelName: string, regionName: string): TypedRequest<Float16Array> {
  return { url: `/levels/${levelName}/${regionName}/watermap.r16`, type: 'arraybuffer' }
}
