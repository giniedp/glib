import type { ContentLoader } from '@gglib/content'

/**
 * Resolves an asset id (`{guid}` or `{guid}:subid`) to the normalized file path of the asset, null if unknown
 */
export type AssetIdResolver = (assetId: string) => Promise<string | null>

/**
 * Creates a resolver that looks up asset ids with the nwbt catalog (`GET /assets/{id}`), one request per distinct id
 *
 * @remarks
 * TODO(cgf-mtl-resolve): replace the per id request with a filtered catalog (guid -> path, ~0.6 MB brotli for .mtl)
 * or resolved paths in a region bundle, see tmp/cgf-models/plan.md "Removing the asset id lookup"
 */
export function createAssetIdResolver(loader: ContentLoader, nwbtUrl: string): AssetIdResolver {
  const cache = new Map<string, Promise<string | null>>()
  return (assetId) => {
    if (!cache.has(assetId)) {
      const url = `${nwbtUrl}/assets/${encodeURIComponent(assetId)}`
      const task = loader
        .fetch<{ asset?: { file?: string } }>(url, { responseType: 'json' })
        .then((res) => (res.body?.asset?.file ? normalizeAssetPath(res.body.asset.file) : null))
        .catch((err) => {
          console.warn('asset id not resolved', assetId, err)
          return null
        })
      cache.set(assetId, task)
    }
    return cache.get(assetId)
  }
}

/**
 * Normalizes a game asset path like nwbt does (lowercase, forward slashes, no leading slash),
 * so that differently spelled references share the same content cache entry
 */
export function normalizeAssetPath(path: string) {
  return path
    .trim()
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '')
}

/**
 * Whether the path can be a file in the game archive, false for absolute paths of the authoring machine
 * (e.g. `C:/users/…`) and urls
 */
export function isArchivePath(path: string) {
  return !/^[a-z]:\//i.test(path) && !path.includes('://')
}

/**
 * Normalized `.mtl` path of a material reference, a few references omit the extension
 */
export function materialAssetPath(material: string) {
  const path = normalizeAssetPath(material)
  return /\.mtl$/.test(path) ? path : path + '.mtl'
}
