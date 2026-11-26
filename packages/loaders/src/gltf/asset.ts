import { AssetContainer, AssetType, ColorSpace, LoadContext, ResourceGraph, ResourceNode } from '@gglib/content'
import {
  CommonMaterialProps,
  Material as GraphicsMaterial,
  magFilterFromWebGL,
  MaterialOptions,
  MeshOptions,
  minFilterFromWebGL,
  mipFilterFromWebGL,
  SamplerState,
  TextureOptions,
  textureWrapModeFromWebGL,
} from '@gglib/graphics'
import { LightData, ModelOptions, NodeData, SkinData } from '@gglib/model'
import { removeItemUnordered } from '@gglib/utils'
import { Document, Material, Node, Texture } from './format'
import { Property } from './format/common'
import {
  EXT_mesh_gpu_instancing,
  getKhrExtension,
  KHR_lights_punctual,
  KHR_lights_punctual_node,
} from './format/KHR-Extensions'
import { loadAnimation } from './load-animation'
import { GLTFAccessorBase, loadAccessor, loadBuffer } from './load-buffer'
import { expandNodeInstances, loadNodeInstances } from './load-instancing'
import { loadMaterial } from './load-material'
import { loadMesh } from './load-mesh'
import { loadSkin } from './load-skin'
import { loadTexture } from './load-texture'

export type GltfExtension<T, N, R = N> = {
  name: string
  /**
   * Replaces the loading of the whole object.
   *
   * @remarks
   * Called before the object is processed. Return a load function to take over the object:
   * the object data is then not processed and no other extension is applied to it.
   * Return nothing to load the object as usual.
   */
  resolve?: (asset: GltfAssetContainer, data: T) => ((context: LoadContext) => Promise<R>) | undefined
  /**
   * Applies the extension to the resource node of the object
   */
  handler?: (asset: GltfAssetContainer, node: ResourceNode<N>, data: T) => void
}

/**
 * Material extension, a resolved material may be an instance, it is then shared by all meshes that reference it
 */
export type GltfMaterialExtension = GltfExtension<Material, MaterialOptions, MaterialOptions | GraphicsMaterial>
export type GltfTextureExtension = GltfExtension<Texture, TextureOptions & { gltf: Record<string, any> }>

export class GltfAssetContainer implements AssetContainer {
  public readonly url: string
  public readonly graph = new ResourceGraph()
  public readonly document: Document
  public readonly extensions: Record<string, GltfExtension<any, any>>

  public constructor(url: string, document: Document, extensions: Record<string, GltfExtension<any, any>> = {}) {
    this.url = url
    this.document = document
    this.extensions = extensions
  }

  public count(asset: AssetType<any, any>): number {
    switch (asset) {
      case AssetType.Texture: {
        return this.document.textures?.length ?? 0
      }
      case AssetType.Material: {
        return this.document.materials?.length ?? 0
      }
      case AssetType.Model: {
        return 1
      }
      default: {
        return 0
      }
    }
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    switch (asset) {
      case AssetType.Texture: {
        return this.graph.load(this.textureNode(index, context.color), context)
      }
      case AssetType.Material: {
        return this.graph.load(this.materialNode(index), context)
      }
      case AssetType.Model: {
        return this.graph.load(this.modelNode(), context)
      }
      default: {
        throw new Error(`AssetType not supported by this container: ${asset}`)
      }
    }
  }

  public getSampler(index: number): SamplerState {
    const sampler = this.document.samplers?.[index]
    return SamplerState.get({
      minFilter: minFilterFromWebGL(sampler?.minFilter),
      mipFilter: mipFilterFromWebGL(sampler?.minFilter),
      magFilter: magFilterFromWebGL(sampler?.magFilter),
      wrapU: textureWrapModeFromWebGL(sampler?.wrapS) ?? 'repeat',
      wrapV: textureWrapModeFromWebGL(sampler?.wrapT) ?? 'repeat',
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
      // the document's application data (glTF `extras`)
      meta: { ...(this.document.extras || {}) },
      meshes: [],
      animations: [],
      skins: [],
      nodes: (this.document.nodes || []).map((it) => toNodeData(it)),
      scene: this.document.scene || 0,
      scenes: (this.document.scenes || []).map((it) => JSON.parse(JSON.stringify(it))),
      lights: toLightData(this.document),
    })
    // the nodes that wait for their mesh, instanced nodes hand it over to their instance nodes first
    const meshNodes = [...node.data.nodes].filter((it) => typeof it.mesh === 'number')

    if (this.document.animations) {
      this.document.animations.forEach((_, i) => {
        this.graph.assign(node, loadAnimation(this, i), (model, anim) => {
          model.animations.push(anim)
        })
      })
    }

    if (this.document.skins) {
      this.document.skins.forEach((_, i) => {
        this.graph.assign(node, loadSkin(this, i), (model, skin) => {
          model.skins.push(skin)
        })
      })
    }

    // assigned before the meshes (assignments run in order): the instance nodes take part in the mesh assignment
    this.document.nodes?.forEach((gltf, i) => {
      if (getKhrExtension(gltf, EXT_mesh_gpu_instancing)) {
        this.graph.assign(node, loadNodeInstances(this, i), (model, instances) => {
          expandNodeInstances(model.nodes, i, instances, meshNodes)
        })
      }
    })

    if (this.document.meshes) {
      this.document.meshes.forEach((_, i) => {
        this.graph.assign(node, this.meshNode(i), (model, mesh) => {
          const nodesWithMesh = meshNodes.filter((it) => it.mesh === i)

          for (const node of nodesWithMesh) {
            node.mesh = model.meshes.length
            model.meshes.push(mesh)
          }

          for (const node of nodesWithMesh) {
            removeItemUnordered(meshNodes, node)
          }
        })
      })
    }

    return node
  }

  public applyExtensions<N, D extends Property>(node: ResourceNode<N>, gltf: D) {
    if (!gltf.extensions) {
      return
    }

    for (const extName in gltf.extensions) {
      const extension = this.extensions[extName]
      if (extension) {
        extension.handler?.(this, node, gltf)
        continue
      }
      if (this.document.extensionsRequired?.includes(extName)) {
        console.warn(`Required glTF extension ${extName} is not supported by the loader`)
      }
    }
  }

  /**
   * Returns the load function of the first extension that resolves the object, see {@link GltfExtension.resolve}
   */
  public resolveExtensions<R>(gltf: Property): ((context: LoadContext) => Promise<R>) | undefined {
    for (const extName in gltf.extensions) {
      const load = this.extensions[extName]?.resolve?.(this, gltf)
      if (load) {
        return load
      }
    }
    return undefined
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

  public textureNode(index: number, color: ColorSpace): ResourceNode<TextureOptions> {
    return loadTexture(this, index, color)
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

/**
 * A copy of the glTF node as model node, with the index of its KHR_lights_punctual light
 */
function toNodeData(gltf: Node): NodeData {
  const data: NodeData = JSON.parse(JSON.stringify(gltf))
  const light = (gltf.extensions?.[KHR_lights_punctual] as KHR_lights_punctual_node)?.light
  if (typeof light === 'number') {
    data.light = light
  }
  return data
}

/**
 * The KHR_lights_punctual lights of the document
 */
function toLightData(document: Document): LightData[] {
  const ext = getKhrExtension(document, KHR_lights_punctual)
  return (ext?.lights || []).map((it) => {
    return {
      name: it.name,
      type: it.type,
      color: it.color,
      intensity: it.intensity,
      range: it.range,
      innerConeAngle: it.spot?.innerConeAngle,
      outerConeAngle: it.spot?.outerConeAngle,
      extras: it.extras,
    }
  })
}
