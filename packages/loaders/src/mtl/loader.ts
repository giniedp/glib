import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { MaterialOptions, SamplerState, TextureOptions } from '@gglib/graphics'
import { Document, MtlTextureData, parse } from './format'

export interface LoaderOptions {}

export interface LoaderPlugin {
  convertMaterial?(mtl: Document, context: LoaderContext): Promise<MaterialOptions>
  loadTextureOptions?(map: MtlTextureData, context: LoaderContext): Promise<TextureOptions>
}

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export function registerPlugin(plugin: LoaderPlugin): void {
  if (Loader.PLUGINS.indexOf(plugin) < 0) {
    Loader.PLUGINS.push(plugin)
  }
}

export class Loader implements AssetLoader, LoaderPlugin {
  public static extensions = ['.mtl']
  public static mimeTypes = ['application/x-mtl']
  public static loader = Loader

  public static PLUGINS: LoaderPlugin[] = []

  public document: Document[]
  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    return this.loadFromText(response.body, context)
  }

  public async loadFromText(content: string, context: LoaderContext): Promise<AssetContainer> {
    this.document = parse(content)
    return this.convert(this.document, context)
  }

  public async convert(document: Document[], context: LoaderContext): Promise<AssetContainer> {
    const result: AssetContainer = {
      source: context.assetUrl,
    }

    const tasks: Promise<void>[] = []
    for (const mtl of document) {
      const material = await this.convertMaterial(mtl, context)
      if (material) {
        result.materials = result.materials || []
        result.materials.push(material)
      }
    }

    await Promise.all(tasks)

    return result
  }

  public async convertMaterial(mtl: Document, context: LoaderContext): Promise<MaterialOptions> {
    const plugin = Loader.PLUGINS.find((it) => it.convertMaterial)
    if (plugin?.convertMaterial) {
      return plugin.convertMaterial(mtl, context)
    }

    const tasks: Promise<void>[] = []

    const result: MaterialOptions = {
      name: mtl.name,
      effectName: 'BasicEffect',
      technique: 'default',
      parameters: {},
    }

    switch (mtl.illum) {
      case '0':
        result.technique = 'unlit'
        break
      case '1':
        result.technique = 'lambert'
        break
      case '2':
        result.technique = 'default'
        break
      default:
        result.technique = 'default'
        break
    }

    const params = result.parameters

    if (mtl.Ka) {
      params.AmbientColor = mtl.Ka
    }

    if (mtl.Kd) {
      params.BaseColor = mtl.Kd
    }

    if (mtl.Ks) {
      params.SpecularColor = mtl.Ks
    }

    params.Blend = false
    if (mtl.d != null) {
      params.Alpha = mtl.d
      params.Blend = true
    }

    if (mtl.Ni != null) {
      // params.refraction = m.Ni
    }

    if (mtl.Ns != null) {
      params.Roughness = Math.max(0.0, 1.0 - mtl.Ns)
      // TODO: convert to range [0:1]
      // if (result.parameters.SpecularSmoothness > 1) {
      //   result.parameters.SpecularSmoothness = Math.log(result.parameters.SpecularSmoothness) / Math.log(2) / 10.5
      // }
    }

    const setTexture = async (name: string, map: MtlTextureData) => {
      const texture = await this.loadTextureOptions(map, context)
      params[name] = texture
      if (map.options) {
        const options = map.options
        const offsetScale = [1, 1, 0, 0]
        if (options.s) {
          offsetScale[0] = options.s[0]
          offsetScale[1] = options.s[1]
        }
        if (options.o) {
          offsetScale[2] = options.o[0] || 0
          offsetScale[3] = options.o[1] || 0
        }
        if (options.o || options.s) {
          params[name + 'ScaleOffset'] = offsetScale
        }
      }
    }

    if (mtl.map_Ka?.file) {
      tasks.push(setTexture('AmbientColorMap', mtl.map_Ka))
    }
    if (mtl.map_Kd?.file) {
      tasks.push(setTexture('BaseColorMap', mtl.map_Kd))
    }
    if (mtl.map_Ks?.file) {
      tasks.push(setTexture('SpecularColorMap', mtl.map_Ks))
    }
    if (mtl.map_d?.file) {
      tasks.push(setTexture('AlphaMap', mtl.map_d))
    }
    if (mtl.bump?.file) {
      tasks.push(setTexture('NormalMap', mtl.bump))
    }
    if (mtl.disp?.file) {
      tasks.push(setTexture('DisplaceMap', mtl.disp))
    }
    if (mtl.refl?.file) {
      tasks.push(setTexture('EnvironmentMap', mtl.refl))
    }

    await Promise.all(tasks)

    return result
  }

  public async loadTextureOptions(map: MtlTextureData, context: LoaderContext): Promise<TextureOptions> {
    const plugin = Loader.PLUGINS.find((it) => it.loadTextureOptions)
    if (plugin?.loadTextureOptions) {
      return plugin.loadTextureOptions(map, context)
    }

    const url = context.content.resolveUrl(map.file, context)
    const asset = await context.content.loadAsset(url)
    return {
      ...asset.textures[0],
      sampler: SamplerState.LinearWrap,
      generateMipmap: true,
    }
  }
}
