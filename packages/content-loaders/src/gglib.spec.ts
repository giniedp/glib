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
      loader: new Pipeline(),
    })
  })

  it('loads jpeg to Texture.Options', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Options).then((result: TextureOptions) => {
      expect(result).toEqual({ source: '/assets/textures/prototype/proto_gray.jpg' })
    })
    .catch(fail)
    .then(done)
  })

  it('loads png to Texture.Options', (done) => {
    manager.loader.register(loadPngToTextureOptions)
    manager.load('/assets/textures/prototype/proto_gray.png', Texture.Options).then((result: TextureOptions) => {
      expect(result).toEqual({ source: '/assets/textures/prototype/proto_gray.png' })
    })
    .catch(fail)
    .then(done)
  })

  it('loads jpeg to Texture', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.loader.register(loadTextureOptionsToTexture)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Texture2D).then((result) => {
      expect(result instanceof Texture).toBe(true)
      expect(result.image instanceof Image).toBe(true)
      // expect(result.ready).toBe(false) // may be both, depends on cache
      expect(result.type).toBe(TextureType.Texture2D)
    })
    .catch(fail)
    .then(done)
  })

  it('loads ImageData to Texture', (done) => {
    manager.loader.register(loadJpegToImageData)
    manager.loader.register(loadJpegToHTMLImageElement)
    manager.loader.register(loadImageDataToTextureOptions)
    manager.loader.register(loadTextureOptionsToTexture)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Texture2D).then((result) => {
      expect(result instanceof Texture).toBe(true)
      expect(result.ready).toBe(true)
      expect(result.image).toBeFalsy()
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
      expect(result.type).toBe(TextureType.Texture2D)
    })
    .catch(fail)
    .then(done)
  })

  it('loads Texture to MaterialOptions', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.loader.register(loadTextureOptionsToTexture)
    manager.loader.register(loadTextureToMaterialOptions)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Material.Options).then((result: MaterialOptions) => {
      expect(result.technique).toBe('default')
      expect(result.parameters.DiffuseMap).toBeDefined()
      expect(result.parameters.DiffuseMap instanceof Texture).toBe(true)
    })
    .catch(fail)
    .then(done)
  })

  it('loads ModelOptions to Model', (done) => {
    manager.loader.register(loadModelOptionsToModel)
    manager.loader.register(loadMaterialOptionsToMaterial)
    manager.loader.register(loadMaterialOptionsToMaterialArray)
    manager.loader.register(loadShaderEffectOptionsToShaderEffect)
    manager.loader.register(loadShaderEffectOptionsToShaderEffectArray)

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

    manager.loader.run(Model.Options, Model, modelOptions, {
      manager: manager,
      pipeline: manager.loader,
      source: '',
      target: Model,
    }).then((result: Model) => {
      expect(result instanceof Model).toBe(true)
      expect(result.meshes[0] instanceof ModelMesh).toBe(true)
      expect(result.meshes[0].materials.length).toBe(2)
    })
    .catch(fail)
    .then(done)
  })

  it('loads MaterialOptions[] to Material[]', (done) => {
    manager.loader.register(loadMaterialOptionsToMaterial)
    manager.loader.register(loadMaterialOptionsToMaterialArray)
    manager.loader.register(loadShaderEffectOptionsToShaderEffect)
    manager.loader.register(loadShaderEffectOptionsToShaderEffectArray)

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

    manager.loader.run(Material.OptionsArray, Material.Array, materialOptions, {
      manager: manager,
      pipeline: manager.loader,
      source: '',
      target: Material.Array,
    }).then((result: Material[]) => {
      expect(result[0] instanceof Material).toBe(true)
      expect(result[0].effect instanceof ShaderEffect).toBe(true)
    })
    .catch(fail)
    .then(done)
  })

  it('loads ShaderEffectOptions[] to ShaderEffect[]', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.loader.register(loadTextureOptionsToTexture)

    manager.loader.register(loadShaderEffectOptionsToShaderEffect)
    manager.loader.register(loadShaderEffectOptionsToShaderEffectArray)

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

    manager.loader.run(ShaderEffect.OptionsArray, ShaderEffect.Array, options, {
      manager: manager,
      pipeline: manager.loader,
      source: '',
      target: ShaderEffect.Array,
    }).then((result: ShaderEffect[]) => {
      expect(result[0] instanceof ShaderEffect).toBe(true)
      expect(result[0].name).toBe('the name')
      expect(result[0].parameters.DiffuseMap instanceof Texture).toBe(true)
    })
    .catch(fail)
    .then(done)
  })

  describe('ggfx', () => {

    let device: DeviceGL
    let manager: ContentManager

    afterAll(clearScripts)

    beforeAll(() => {
      device = new DeviceGL()
      manager = new ContentManager(device)
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
      it('loads from DOM', (done) => {
        manager.load('effect.ggfx', ShaderEffect).then((result: ShaderEffect) => {
          expect(result).toBeDefined()
          expect(result.device).toBe(device)
          expect(result.name).toBe('effect name')
          expect(result.techniques.length).toBe(1)
          expect(result.techniques[0].name).toBe('technique name')
          expect(result.techniques[0].passes[0].name).toBe('pass name')
          done()
        }).catch((e) => {
          fail(e)
          done()
        })
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
        effect: 'effect.ggfx',
        parameters: {},
      }))
    })

    describe('jsonMaterial', () => {
      it('loads Material from DOM', (done) => {
        manager.load('material.ggmat', Material).then((result: Material) => {
          expect(result).toBeDefined()
          expect(result.device).toBe(device)
          expect(result.effect.techniques.length).toBe(1)
          expect(result.effect.techniques[0].name).toBe('TECHNIQUE0')
          expect(result.effect.techniques[0].passes.length).toBe(1)
          expect(result.effect.techniques[0].passes[0].name).toBe('PASS0')
        })
        .then(done)
        .catch(fail)
      })

      it('loads Material[] from DOM', (done) => {
        manager.load('material.ggmat', Material.Array).then((result: Material[]) => {
          expect(result[0]).toBeDefined()
          expect(result[0].device).toBe(device)
          expect(result[0].effect.techniques.length).toBe(1)
          expect(result[0].effect.techniques[0].name).toBe('TECHNIQUE0')
          expect(result[0].effect.techniques[0].passes.length).toBe(1)
          expect(result[0].effect.techniques[0].passes[0].name).toBe('PASS0')
        })
        .then(done)
        .catch(fail)
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
        effect: 'effect.ggfx',
        parameters: {},
      }))

      defineScript('cube.ggmod', 'application/json;format=ggmod', JSON.stringify({
        name: 'triangle model',
        boundingBox: [0, 0, 0, 1, 1, 1],
        boundingSphere: [0.5, 0.5, 0.5, 1],
        materials: ['material.ggmat', {
          name: 'material2',
          effect: 'effect.ggfx',
          parameters: {},
        }],
        meshes: [{
          name: 'triangle mesh',
          boundingBox: [0, 0, 0, 1, 1, 1],
          boundingSphere: [0.5, 0.5, 0.5, 1],
          materialId: 0,
          indexBuffer: [0, 1, 2, 1, 2, 3],
          vertexBuffer: {
            layout: {
              position: {
                type: 'float32', offset: 0, elements: 3,
              },
            },
            data: [
              -0.5, -0.5, 0.0,
              0.5, -0.5, 0.0,
              0.0,  0.5, 0.0,
            ],
          },
        }],
      }))
    })

    describe('jsonModel', () => {
      it('loads Model from DOM', (done) => {
        manager.load('cube.ggmod', Model).then((result: Model) => {
          expect(result).toBeDefined()
          expect(result.device).toBe(device)
          expect(result.meshes[0].materials[0].effect.techniques.length).toBe(1)
          expect(result.meshes[0].materials[0].effect.techniques[0].name).toBe('TECHNIQUE0')
          expect(result.meshes[0].materials[0].effect.techniques[0].passes.length).toBe(1)
          expect(result.meshes[0].materials[0].effect.techniques[0].passes[0].name).toBe('PASS0')
        }).catch(fail)
          .then(done)
      })
    })
  })

})
