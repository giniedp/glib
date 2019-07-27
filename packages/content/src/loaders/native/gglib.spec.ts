import {
  ContentManager,
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
  Pipeline,
} from '@gglib/content'

import {
  buildCube,
  Device,
  Material,
  MaterialOptions,
  Model,
  ModelBuilder,
  ShaderEffect,
  ShaderEffectOptions,
  Texture,
  TextureOptions,
  TextureType,
} from '@gglib/graphics'

describe('content/loader/native', () => {

  let device: Device
  let manager: ContentManager

  beforeEach(() => {
    device = new Device()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  it('loads jpeg to Texture.Options', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture.Options).then((result: TextureOptions) => {
      expect(result).toEqual({ data: '/assets/textures/prototype/proto_gray.jpg' })
    })
    .catch(fail)
    .then(done)
  })

  it('loads png to Texture.Options', (done) => {
    manager.loader.register(loadPngToTextureOptions)
    manager.load('/assets/textures/prototype/proto_gray.png', Texture.Options).then((result: TextureOptions) => {
      expect(result).toEqual({ data: '/assets/textures/prototype/proto_gray.png' })
    })
    .catch(fail)
    .then(done)
  })

  it('loads jpeg to Texture', (done) => {
    manager.loader.register(loadJpegToTextureOptions)
    manager.loader.register(loadTextureOptionsToTexture)
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture).then((result) => {
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
    manager.load('/assets/textures/prototype/proto_gray.jpg', Texture).then((result) => {
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
      expect(result.effect).toBe('default')
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
      .tap((b) => buildCube(b))
      .endModel({
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

    manager.loader.run(Model.Options, Model, modelOptions, {
      manager: manager,
      pipeline: manager.loader,
      source: '',
      target: Model,
    }).then((result: Model) => {
      expect(result instanceof Model).toBe(true)
      expect(result.materials.length).toBe(2)
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
})
