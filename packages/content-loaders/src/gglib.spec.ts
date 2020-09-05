import {
  ContentManager,
  Pipeline,
} from '@gglib/content'

import {
  buildCube,
  DeviceGL,
  Material,
  MaterialOptions,
  Model,
  ModelBuilder,
  ShaderEffect,
  ShaderEffectOptions,
  Texture,
  TextureOptions,
  TextureType,
  ModelMesh,
} from '@gglib/graphics'

import {
  loadImageDataToTextureOptions,
  loadJpegToHTMLImageElement,
  loadJpegToImageData,
  loadJpegToTextureOptions,
  loadMaterialOptionsToMaterial,
  loadMaterialOptionsToMaterialArray,
  loadModelOptionsToModel,
  loadPngToTextureOptions,
  loadShaderEffectOptionsToShaderEffect,
  loadShaderEffectOptionsToShaderEffectArray,
  loadTextureOptionsToTexture,
  loadTextureToMaterialOptions,
} from './index'

import { defineScript, clearScripts } from './test'

describe('content/loader/native', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      pipeline: new Pipeline(),
    })
  })

  it('loads jpeg to Texture.Options', async () => {
    manager.pipeline.register(loadJpegToTextureOptions)
    const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Options)
    expect(result).toEqual({ source: '/assets/textures/prototype/proto_gray.jpg' })
  })

  it('loads png to Texture.Options', async () => {
    manager.pipeline.register(loadPngToTextureOptions)
    const result = await manager.load('/assets/textures/prototype/proto_gray.png', Texture.Options)
    expect(result).toEqual({ source: '/assets/textures/prototype/proto_gray.png' })
  })

  it('loads jpeg to Texture', async () => {
    manager.pipeline.register(loadJpegToTextureOptions)
    manager.pipeline.register(loadTextureOptionsToTexture)
    const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Texture2D)
    expect(result instanceof Texture).toBe(true)
    expect(result.type).toBe(TextureType.Texture2D)
  })

  it('loads ImageData to Texture', async () => {
    manager.pipeline.register(loadJpegToImageData)
    manager.pipeline.register(loadJpegToHTMLImageElement)
    manager.pipeline.register(loadImageDataToTextureOptions)
    manager.pipeline.register(loadTextureOptionsToTexture)
    const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Texture2D)
      expect(result instanceof Texture).toBe(true)
      expect(result.ready).toBe(true)
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
      expect(result.type).toBe(TextureType.Texture2D)
  })

  it('loads Texture to MaterialOptions', async () => {
    manager.pipeline.register(loadJpegToTextureOptions)
    manager.pipeline.register(loadTextureOptionsToTexture)
    manager.pipeline.register(loadTextureToMaterialOptions)
    const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', Material.Options)
    expect(result.technique).toBe('default')
    expect(result.parameters.DiffuseMap).toBeDefined()
    expect(result.parameters.DiffuseMap instanceof Texture).toBe(true)
  })

  it('loads ModelOptions to Model', async () => {
    manager.pipeline.register(loadModelOptionsToModel)
    manager.pipeline.register(loadMaterialOptionsToMaterial)
    manager.pipeline.register(loadMaterialOptionsToMaterialArray)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffect)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffectArray)

    const modelOptions = ModelBuilder.begin()
      .append(buildCube)
      .closeMesh({
        materials: [new Material(device, {
          name: 'material instance',
          effect: {
            program: device.createProgram({
              fragmentShader: 'void main() {}',
              vertexShader: 'void main() {}',
            }),
          },
          parameters: {},
        }), {
          name: 'material options',
          effect: {
            program: device.createProgram({
              fragmentShader: 'void main() {}',
              vertexShader: 'void main() {}',
            }),
          },
          parameters: {},
        }],
      })
      .endModel()

      const result = await manager.pipeline.run(Model.Options, Model, modelOptions, {
      manager: manager,
      pipeline: manager.pipeline,
      source: '',
      target: Model,
    })
    expect(result instanceof Model).toBe(true)
    expect(result.meshes[0] instanceof ModelMesh).toBe(true)
    expect(result.meshes[0].materials.length).toBe(2)
  })

  it('loads MaterialOptions[] to Material[]', async () => {
    manager.pipeline.register(loadMaterialOptionsToMaterial)
    manager.pipeline.register(loadMaterialOptionsToMaterialArray)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffect)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffectArray)

    const materialOptions: MaterialOptions[] = [{
      name: 'material options',
      effect: {
        program: device.createProgram({
          fragmentShader: 'void main() {}',
          vertexShader: 'void main() {}',
        }),
      },
      parameters: {},
    }]

    const result = await manager.pipeline.run(Material.OptionsArray, Material.Array, materialOptions, {
      manager: manager,
      pipeline: manager.pipeline,
      source: '',
      target: Material.Array,
    })
    expect(result[0] instanceof Material).toBe(true)
    expect(result[0].effect instanceof ShaderEffect).toBe(true)
  })

  it('loads ShaderEffectOptions[] to ShaderEffect[]', async () => {
    manager.pipeline.register(loadJpegToTextureOptions)
    manager.pipeline.register(loadTextureOptionsToTexture)

    manager.pipeline.register(loadShaderEffectOptionsToShaderEffect)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffectArray)

    const options: ShaderEffectOptions[] = [{
      name: 'the name',
      program: device.createProgram({
        fragmentShader: 'void main() {}',
        vertexShader: 'void main() {}',
      }),
      parameters: {
        DiffuseMap: '/assets/textures/prototype/proto_gray.jpg',
      },
    }]

    const result = await manager.pipeline.run(ShaderEffect.OptionsArray, ShaderEffect.Array, options, {
      manager: manager,
      pipeline: manager.pipeline,
      source: '',
      target: ShaderEffect.Array,
    })
    expect(result[0] instanceof ShaderEffect).toBe(true)
    expect(result[0].name).toBe('the name')
    expect(result[0].parameters.DiffuseMap instanceof Texture).toBe(true)
  })

  describe('ggfx', () => {

    let device: DeviceGL
    let manager: ContentManager

    afterAll(clearScripts)

    beforeAll(() => {
      device = new DeviceGL()
      manager = new ContentManager(device)
      manager.pipeline.register({
        input: Material.OptionsTechnique,
        output: Material.Options,
        handle: async (input: MaterialOptions, context) => {
          if (!input?.technique) {
            return null
          }
          return {
            ...input,
            effect: await context.manager.load('effect.ggfx', ShaderEffect.Options)
          }
        }
      })
      defineScript('effect.ggfx', 'text/yml', `
  name: effect name
  program:
  // comment
  technique:
    name: technique name
    pass:
      name: pass name
      vertexShader:
        void main(void) {
          gl_Position = vec4(0, 0, 0, 0);
        }
      fragmentShader:
        void main(void) {
          gl_FragColor = vec4(0, 0, 0, 2);
        }
      `)
    })

    describe('ymlEffect', () => {
      it('loads from DOM', async () => {
        const result = await manager.load('effect.ggfx', ShaderEffect)
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.name).toBe('effect name')
        expect(result.techniques.length).toBe(1)
        expect(result.techniques[0].name).toBe('technique name')
        expect(result.techniques[0].passes[0].name).toBe('pass name')
      })
    })
  })

  describe('content loader ggmat', () => {

    let device: DeviceGL
    let manager: ContentManager

    afterAll(clearScripts)

    beforeAll(() => {
      device = new DeviceGL()
      manager = new ContentManager(device)
      manager.pipeline.register({
        input: Material.OptionsTechnique,
        output: Material.Options,
        handle: async (input: MaterialOptions, context) => {
          if (!input?.technique) {
            return null
          }
          return {
            ...input,
            effect: await context.manager.load('effect.ggfx', ShaderEffect.Options)
          }
        }
      })
      defineScript('effect.ggfx', 'application/json', `
  name: effect name
  program:
  // comment
  technique:
    name: TECHNIQUE0
    pass:
      name: PASS0
      vertexShader:
        void main(void) {
          gl_Position = vec4(0, 0, 0, 0);
        }
      fragmentShader:
        void main(void) {
          gl_FragColor = vec4(0, 0, 0, 2);
        }
      `)

      defineScript('material.ggmat', 'application/json', JSON.stringify({
        name: 'material name',
        effectUri: 'effect.ggfx',
        parameters: {},
      }))
    })

    describe('jsonMaterial', () => {
      it('loads Material from DOM', async () => {
        const result = await manager.load('material.ggmat', Material)
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.effect.techniques.length).toBe(1)
        expect(result.effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result.effect.techniques[0].passes.length).toBe(1)
        expect(result.effect.techniques[0].passes[0].name).toBe('PASS0')
      })

      it('loads Material[] from DOM', async () => {
        const result = await manager.load('material.ggmat', Material.Array)
        expect(result[0]).toBeDefined()
        expect(result[0].device).toBe(device)
        expect(result[0].effect.techniques.length).toBe(1)
        expect(result[0].effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result[0].effect.techniques[0].passes.length).toBe(1)
        expect(result[0].effect.techniques[0].passes[0].name).toBe('PASS0')
      })
    })
  })


  describe('content loader ggmod', () => {

    let device: DeviceGL
    let manager: ContentManager

    afterAll(clearScripts)

    beforeAll(() => {
      device = new DeviceGL()
      manager = new ContentManager(device)
      manager.pipeline.register({
        input: Material.OptionsTechnique,
        output: Material.Options,
        handle: async (input: MaterialOptions, context) => {
          if (!input?.technique) {
            return null
          }
          return {
            ...input,
            effect: await context.manager.load('effect.ggfx', ShaderEffect.Options)
          }
        }
      })
      defineScript('effect.ggfx', 'application/x-yml', `
  name: effect name
  program:
  // comment
  technique:
    name: TECHNIQUE0
    pass:
      name: PASS0
      vertexShader:
        void main(void) {
          gl_Position = vec4(0, 0, 0, 0);
        }
      fragmentShader:
        void main(void) {
          gl_FragColor = vec4(0, 0, 0, 2);
        }
      `)

      defineScript('material.ggmat', 'application/json;format=ggmat', JSON.stringify({
        name: 'material1',
        effectUri: 'effect.ggfx',
        parameters: {},
      }))

      defineScript('cube.ggmod', 'application/json;format=ggmod', JSON.stringify({
        name: 'triangle model',
        boundingBox: [0, 0, 0, 1, 1, 1],
        boundingSphere: [0.5, 0.5, 0.5, 1],
        meshes: [{
          materials: ['material.ggmat', {
            name: 'material2',
            effectUri: 'effect.ggfx',
            parameters: {},
          }],
          meshParts: [{
            name: 'triangle mesh',
            boundingBox: [0, 0, 0, 1, 1, 1],
            boundingSphere: [0.5, 0.5, 0.5, 1],
            materialId: 0,
            indexBuffer: [0, 1, 2, 1, 2, 3],
            vertexBuffer: {
              layout: {
                position: {
                  type: 'float', offset: 0, elements: 3,
                },
              },
              data: [
                -0.5, -0.5, 0.0,
                0.5, -0.5, 0.0,
                0.0,  0.5, 0.0,
              ],
            },
          }]
        }],
      }))
    })

    describe('jsonModel', () => {
      it('loads Model from DOM', async () => {
        const result = await manager.load('cube.ggmod', Model)
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes[0].materials[0].effect.techniques.length).toBe(1)
        expect(result.meshes[0].materials[0].effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result.meshes[0].materials[0].effect.techniques[0].passes.length).toBe(1)
        expect(result.meshes[0].materials[0].effect.techniques[0].passes[0].name).toBe('PASS0')
      })
    })
  })

})
