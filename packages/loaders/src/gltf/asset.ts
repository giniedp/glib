import { AssetContainer, LoaderContext, ResourceGraph, ResourceNode } from '@gglib/content'
import {
  CommonMaterialProps,
  magFilterFromWebGL,
  MaterialOptions,
  MeshOptions,
  minFilterFromWebGL,
  mipFilterFromWebGL,
  SamplerState,
  TextureOptions,
  textureWrapModeFromWebGL,
} from '@gglib/graphics'
import { ModelOptions, SkinData } from '@gglib/model'
import { Document, Material, Texture } from './format'
import { Property } from './format/common'
import { GLTFAccessorBase, loadAccessor, loadBuffer } from './load-buffer'
import { loadMaterial } from './load-material'
import { loadMesh } from './load-mesh'
import { loadSkin } from './load-skin'
import { loadTexture } from './load-texture'

export type GltfExtension<T, N> = {
  name: string
  handler: (asset: GltfAssetContainer, node: ResourceNode<N>, data: T) => void
}

export type GltfMaterialExtension = GltfExtension<Material, MaterialOptions>
export type GltfTextureExtension = GltfExtension<Texture, TextureOptions>

export class GltfAssetContainer extends AssetContainer {
  public override modelCount: number
  public override materialCount: number
  public override textureCount: number
  public readonly url: string
  public readonly graph = new ResourceGraph()
  public readonly document: Document
  public readonly extensions: Record<string, GltfExtension<any, any>>

  public constructor(url: string, document: Document, extensions: Record<string, GltfExtension<any, any>> = {}) {
    super()
    this.url = url
    this.document = document
    this.modelCount = 1
    this.materialCount = document.materials?.length || 0
    this.textureCount = document.textures?.length || 0
    this.extensions = extensions
  }

  public override loadModel(index: number, context: LoaderContext): Promise<ModelOptions> {
    return this.graph.load(this.modelNode(), context)
  }

  public override loadMaterial(index: number, context: LoaderContext): Promise<MaterialOptions> {
    return this.graph.load(this.materialNode(index), context)
  }

  public override loadTexture(index: number, context: LoaderContext): Promise<TextureOptions> {
    return this.graph.load(this.textureNode(index), context)
  }

  public getSampler(index: number): SamplerState {
    const sampler = this.document.samplers?.[index]
    return SamplerState.get({
      minFilter: minFilterFromWebGL(sampler?.minFilter),
      mipFilter: mipFilterFromWebGL(sampler?.minFilter),
      magFilter: magFilterFromWebGL(sampler?.magFilter),
      wrapU: textureWrapModeFromWebGL(sampler?.wrapS) ?? 'Repeat',
      wrapV: textureWrapModeFromWebGL(sampler?.wrapT) ?? 'Repeat',
    })
  }

  public getTextureSampler(index: number): SamplerState {
    const texture = this.document.textures?.[index]
    return this.getSampler(texture?.sampler)
  }

  public modelNode(): ResourceNode<ModelOptions> {
    const key = `model`
    if (this.graph.has(key)) {
      return this.graph.get(key)!
    }
    const node = this.graph.node<ModelOptions>(key, {
      meshes: [],
      animations: [],
      skins: [],
      nodes: (this.document.nodes || []).map((it) => JSON.parse(JSON.stringify(it))),
      scene: this.document.scene || 0,
      scenes: (this.document.scenes || []).map((it) => JSON.parse(JSON.stringify(it))),
    })

    this.document.meshes?.forEach((_, i) => {
      this.graph.assign(node, this.meshNode(i), (model, mesh) => {
        model.meshes[i] = mesh
      })
    })

    return node
  }

  public applyExtensions<N, D extends Property>(node: ResourceNode<N>, gltf: D) {
    if (!gltf.extensions) {
      return
    }

    for (const extName in gltf.extensions) {
      const extension = this.extensions[extName]
      if (extension) {
        extension.handler(this, node, gltf)
        continue
      }
      if (this.document.extensionsRequired?.includes(extName)) {
        console.warn(`Required glTF extension ${extName} is not supported by the loader`)
      }
    }
  }

  public materialNode(index: number): ResourceNode<MaterialOptions> {
    return loadMaterial(this, index)
  }

  public defaultMaterialNode(): ResourceNode<MaterialOptions> {
    const key = `material:default`
    if (this.graph.has(key)) {
      return this.graph.get(key) as ResourceNode<MaterialOptions>
    }
    return this.graph.node<MaterialOptions>(key, {
      properties: {} satisfies CommonMaterialProps,
    })
  }

  public textureNode(index: number): ResourceNode<TextureOptions> {
    return loadTexture(this, index)
  }

  public bufferNode(index: number): ResourceNode<ArrayBuffer> {
    return loadBuffer(this, index)
  }

  public accessorNode(index: number): ResourceNode<GLTFAccessorBase> {
    return loadAccessor(this, index)
  }

  public skinNode(index: number): ResourceNode<SkinData> {
    return loadSkin(this, index)
  }

  public meshNode(index: number): ResourceNode<MeshOptions> {
    return loadMesh(this, index)
  }
}
