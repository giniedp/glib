import {
  AssetType,
  ContentLoader,
  type AssetContainer,
  type AssetLoader,
  type LoadContext,
} from '@gglib/content'
import type { MaterialOptions, MaterialProperties, Texture } from '@gglib/graphics'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { normalizeAssetPath } from '../../content'
import type { NwMaterialProps, TexMapName } from '../../material/GltfExtension'
import { nwMaterialFactory } from '../../material/nwMaterial'
import { parseMtl } from './parse'
import type { MtlDocument, MtlMaterial, MtlTexture } from './types'

/**
 * Registers the `.mtl` loader on a content loader
 *
 * @remarks
 * Registers on the instance, so it takes precedence over the Wavefront `.mtl` loader of `@gglib/loaders`.
 */
export function registerMtl(content: ContentLoader) {
  content.registerLoader(MtlLoader)
}

/**
 * Loads New World (CryEngine) `.mtl` material files
 */
export class MtlLoader implements AssetLoader {
  public static extensions = ['.mtl']
  public static mimeTypes: string[] = []
  public static create = () => new MtlLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(MtlLoader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
      signal: context.signal,
    })
    return new MtlContainer(url, parseMtl(response.body))
  }
}

/**
 * Holds the materials of an `.mtl` file, one per sub material
 *
 * @remarks
 * Textures are loaded by their file path relative to the `baseUrl` of the load context (the nwbt file root)
 */
export class MtlContainer implements AssetContainer {
  public readonly url: string
  public readonly document: MtlDocument

  public constructor(url: string, document: MtlDocument) {
    this.url = url
    this.document = document
  }

  public count(asset: AssetType<any, any>): number {
    return asset === AssetType.Material ? this.document.materials.length : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== AssetType.Material) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
    const material = this.document.materials[index]
    if (!material) {
      throw new Error(`Material index ${index} out of bounds for ${this.url} with ${this.document.materials.length} materials`)
    }
    return createMaterialOptions(material, context)
  }
}

async function createMaterialOptions(material: MtlMaterial, context: LoadContext): Promise<MaterialOptions> {
  const props: NwMaterialProps = {
    attrs: { ...material.attrs },
    params: { ...material.params },
    vertexDeform: material.vertexDeform ? JSON.parse(JSON.stringify(material.vertexDeform)) : undefined,
    textures: {},
    mods: {},
  }
  await Promise.all(
    material.textures.map(async (tex) => {
      const texture = await loadMtlTexture(tex, context)
      if (!texture) {
        return
      }
      props.textures[tex.Map] = texture
      if (tex.TexMod) {
        props.mods[tex.Map] = { ...tex.TexMod }
      }
    }),
  )
  return {
    name: material.attrs.Name,
    properties: props as unknown as MaterialProperties,
    factory: nwMaterialFactory(material.attrs.Shader, material.attrs.StringGenMask),
  }
}

/**
 * Loads the texture of a material, or returns null if it does not resolve (as nwbt drops such textures)
 */
async function loadMtlTexture(tex: MtlTexture, context: LoadContext): Promise<Texture | null> {
  const file = mtlTextureFile(tex)
  if (!file) {
    return null
  }
  const load = (path: string) =>
    context.content.loadTexture(mtlTextureUrl(path), {
      baseUrl: context.baseUrl,
      color: 'linear',
      signal: context.signal,
    })
  if (usesAttachedAlpha(tex.Map, file)) {
    // smoothness is stored in the attached alpha of the normal map (_ddna.dds.a), see nwbt LoadOrStoreMtlTexture
    const alpha = await load(`${file}.a.dds`).catch(() => null)
    if (alpha) {
      return alpha
    }
  }
  return load(file).catch((err) => {
    console.warn('mtl texture not loaded', file, err)
    return null
  })
}

/**
 * Texture type of engine bound environment probes (`TexType="7"`)
 */
const NEAREST_CUBE = 7

const SMOOTHNESS_MAPS: TexMapName[] = ['Smoothness', 'SecondSmoothness', '[5] Smoothness']

/**
 * Whether the texture slot binds the attached alpha (`.dds.a`) instead of the texture itself
 *
 * @remarks
 * nwbt binds the attached alpha for smoothness slots if it exists. We can not check the existence without a request,
 * but normal maps with smoothness (`_ddna`) have it: 10113 of 10114 in the game files.
 */
function usesAttachedAlpha(map: TexMapName, file: string) {
  return SMOOTHNESS_MAPS.includes(map) && /_ddna(_lod\d+)?\.dds$/.test(file)
}

/**
 * Returns the normalized `.dds` file path of a material texture, or null for engine textures and empty references
 *
 * @remarks
 * Texture references point to source files (`.tif`), the game files have the compiled `.dds` next to them.
 * Asset id only references are not resolved, they are rare (47 of 535k references, mostly characters).
 */
export function mtlTextureFile(tex: MtlTexture): string | null {
  let file = tex.File
  // `$…` names and `nearest_cubemap` (TexType 7, nearest cube) are bound by the engine at runtime
  if (!file || file.startsWith('$') || tex.TexType === NEAREST_CUBE || /^nearest_cubemap(\.\w+)?$/i.test(file)) {
    return null
  }
  file = normalizeAssetPath(file)
  const ext = /\.[^./]*$/.exec(file)?.[0]
  if (ext !== '.dds') {
    file = (ext ? file.slice(0, -ext.length) : file) + '.dds'
  }
  return file
}

/**
 * The url under which nwbt serves a material texture with merged mips, same as the image uris in its glTF files
 */
function mtlTextureUrl(file: string) {
  return `${file}?merge=true&size=${MATERIAL_TEXTURE_SIZE}`
}
