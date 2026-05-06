import { AssetContainer, AssetLoader, ContentLoader, LoaderContext, ResourceGraph, ResourceNode } from '@gglib/content'
import { CommonMaterialProps, MaterialOptions, TextureOptions } from '@gglib/graphics'
import { ModelOptions } from '@gglib/model'
import { Document, TextureData, parse } from './format'

export interface LoaderOptions {}

export interface MtlPlugin {
  applyMaterial?(asset: MtlAsset, node: ResourceNode<MaterialOptions>, mtl: Document): void
  applyTexture?(asset: MtlAsset, node: ResourceNode<TextureOptions>, tex: TextureData): void
}

export function registerPlugin(plugin: MtlPlugin): void {
  if (Loader.PLUGINS.indexOf(plugin) < 0) {
    Loader.PLUGINS.push(plugin)
  }
}

export class Loader implements AssetLoader {
  public static extensions = ['.mtl']
  public static mimeTypes = ['application/x-mtl']
  public static create = () => new Loader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(Loader)
  }

  public static PLUGINS: MtlPlugin[] = []

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
    })
    const document = parse(response.body)
    return new MtlAsset(url, document, Loader.PLUGINS)
  }
}

export class MtlAsset extends AssetContainer {
  public readonly url: string
  public readonly graph = new ResourceGraph()
  public readonly document: Document[]
  public readonly plugins: MtlPlugin[]

  public override readonly modelCount: number = 0
  public override readonly textureCount: number = 0
  public override readonly materialCount: number

  public constructor(url: string, document: Document[], plugins: MtlPlugin[]) {
    super()
    this.url = url
    this.document = document
    this.plugins = plugins
    this.materialCount = document.length
  }

  public override loadModel(index: number, context: LoaderContext): Promise<ModelOptions> {
    throw new Error('Method not implemented.')
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    const node = this.materialNode(index)
    return this.graph.load(node, context)
  }

  public override loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    let map: TextureData = this.findTexture(index)
    if (!map) {
      throw new Error(`Texture with index ${index} not found in document`)
    }
    const node = this.textureNode(map)
    return this.graph.load(node, context)
  }

  private findTexture(index: number): TextureData | undefined {
    let count = 0
    for (const mtl of this.document) {
      if (mtl.map_Ka?.file) {
        if (index === count) {
          return mtl.map_Ka
        }
        count++
      }
      if (mtl.map_Kd?.file) {
        if (index === count) {
          return mtl.map_Kd
        }
        count++
      }
      if (mtl.map_Ks?.file) {
        if (index === count) {
          return mtl.map_Ks
        }
        count++
      }
      if (mtl.map_d?.file) {
        if (index === count) {
          return mtl.map_d
        }
        count++
      }
      if (mtl.bump?.file) {
        if (index === count) {
          return mtl.bump
        }
        count++
      }
      if (mtl.disp?.file) {
        if (index === count) {
          return mtl.disp
        }
        count++
      }
      if (mtl.refl?.file) {
        if (index === count) {
          return mtl.refl
        }
        count++
      }
    }
    return undefined
  }

  public materialNode(index: number) {
    const data = this.document[index]
    if (!data) {
      throw new Error(`Material with index ${index} not found in document`)
    }
    const node = this.graph.node<MaterialOptions>(`material:${index}`, {
      name: data.name,
      meta: {},
      properties: {},
    })
    const params: CommonMaterialProps = node.data.properties

    for (const plugin of this.plugins) {
      if (!plugin.applyMaterial) {
        continue
      }

      // apply first plugin
      plugin.applyMaterial(this, node, data)

      // and skip default processing
      return node
    }

    // default processing if no plugin has handled this material
    this.appluyMaterialCommons(node, data, params)

    return node
  }

  public textureNode(map: TextureData): ResourceNode<TextureOptions> {
    const key = `texture:${map.file}`
    const node = this.graph.node(key, {})

    for (const plugin of this.plugins) {
      if (!plugin.applyTexture) {
        continue
      }

      // apply first plugin
      plugin.applyTexture(this, node, map)

      // and skip default processing
      return node
    }

    node.build = async (context: LoaderContext) => {
      const url = context.content.resolveUrl(map.file, this.url)
      const asset = await context.content.load(url, context)
      return asset.loadTexture(0, context)
    }

    return node
  }

  public appluyMaterialCommons(node: ResourceNode<MaterialOptions>, data: Document, params: CommonMaterialProps) {
    if (data.Ka) {
      params.AmbientColor = data.Ka
    }

    if (data.Kd) {
      params.BaseColor = data.Kd
    }

    if (data.Ks) {
      params.SpecularColor = data.Ks
    }

    //params.Blend = false
    if (data.d != null) {
      params.Opacity = data.d
      //params.Blend = true
    }

    if (data.Ni != null) {
      // params.refraction = m.Ni
    }

    if (data.Ns != null) {
      params.Roughness = data.Ns
      if (params.Roughness > 1) {
        params.Roughness = Math.sqrt(2 / (params.Roughness + 2))
      }
    }

    if (data.map_Ka?.file) {
      this.graph.assign(node, this.textureNode(data.map_Ka), (material, texture) => {
        params.OcclusionMap = texture
      })
    }

    if (data.map_Kd?.file) {
      this.graph.assign(node, this.textureNode(data.map_Kd), (material, texture) => {
        params.BaseColorMap = texture
      })
    }

    if (data.map_Ks?.file) {
      this.graph.assign(node, this.textureNode(data.map_Ks), (material, texture) => {
        params.SpecularColorMap = texture
      })
    }

    if (data.map_d?.file) {
      this.graph.assign(node, this.textureNode(data.map_d), (material, texture) => {
        params.OpacityMap = texture
      })
    }

    if (data.bump?.file) {
      this.graph.assign(node, this.textureNode(data.bump), (material, texture) => {
        params.NormalMap = texture
      })
    }

    if (data.disp?.file) {
      this.graph.assign(node, this.textureNode(data.disp), (material, texture) => {
        params.DisplacementMap = texture
      })
    }

    if (data.refl?.file) {
      this.graph.assign(node, this.textureNode(data.refl), (material, texture) => {
        params.EnvironmentMap = texture
      })
    }
  }
}

function getTextureOffsetScale(tex: TextureData): [number, number, number, number] {
  const options = tex.options
  if (!options || (!options.s && !options.o)) {
    return [1, 1, 0, 0]
  }
  const offsetScale: [number, number, number, number] = [1, 1, 0, 0]
  if (options.s) {
    offsetScale[0] = options.s[0]
    offsetScale[1] = options.s[1]
  }
  if (options.o) {
    offsetScale[2] = options.o[0] || 0
    offsetScale[3] = options.o[1] || 0
  }
  return offsetScale
}
