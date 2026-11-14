import { describe, expect, it } from 'vitest'
import { dispositionFileName, exportActions, exportOptionNames, type ExportOptions } from './export'

const options: ExportOptions = {
  textures: 'png',
  textureSize: '2048',
  normals: 'bc5',
  yUp: true,
  quantize: false,
  allLods: false,
  keepNoDraw: false,
}
const query = (url: string) => url.slice(url.indexOf('?') + 1)
const groups = (path: string) => exportActions(path, options).map((it) => `${it.group}:${it.id}`)

describe('exportActions', () => {
  it('exports a texture as png, downloads the stored and merged dds', () => {
    const actions = exportActions('objects/x_diff.dds', options)
    expect(actions.map((it) => `${it.group}:${it.id}`)).toEqual(['export:png', 'download:dds-raw', 'download:dds-merged'])
    expect(actions[0].url).toMatch(/\/files\/objects\/x_diff\.dds\.png\?size=2048&download=1$/)
    expect(actions[0].fileName).toBe('x_diff.png')
    expect(actions[1].url).toMatch(/\/files\/objects\/x_diff\.dds\?merge=false&download=1$/)
  })

  it('names the png of an attached alpha', () => {
    expect(exportActions('objects/x_ddna.dds.a', options)[0].fileName).toBe('x_ddna_a.png')
  })

  it('exports models with png textures and the options', () => {
    const glb = exportActions('objects/chair.cgf', { ...options, quantize: true, allLods: true, textureSize: 'full' })[0]
    expect(glb.url).toContain('/files/objects/chair.cgf.glb?')
    expect(query(glb.url)).toBe('yup&quantize=1&lod=all&textures=embed&download=1')
    expect(glb.fileName).toBe('chair.glb')
  })

  it('leaves out yup when the model stays Z up', () => {
    const glb = exportActions('objects/chair.cgf', { ...options, yUp: false })[0]
    expect(query(glb.url)).toBe('size=2048&textures=embed&download=1')
  })

  it('exports glb and glTF zip, downloads the raw zip and the file of models', () => {
    expect(groups('objects/chair.skin')).toEqual(['export:glb', 'export:gltf-zip', 'download:raw-zip', 'download:raw'])
    expect(groups('objects/chair.mtl')).toEqual(['export:glb', 'download:raw'])
    expect(groups('levels/x/region.json')).toEqual(['download:raw'])
  })

  it('exports models with the original DDS textures for Blender', () => {
    const dds = (opts: Partial<ExportOptions>) =>
      exportActions('objects/chair.cgf', { ...options, textures: 'dds', ...opts }, 'objects/chair_mat.mtl')
    const [glb, zip] = dds({})
    expect(query(glb.url)).toBe('material=objects%2Fchair_mat.mtl&yup&size=2048&textures=dds&download=1')
    expect(zip.url).toContain('/files/objects/chair.cgf.gltf.zip?')
    expect(query(dds({ normals: 'rgba8' })[1].url)).toBe(
      'material=objects%2Fchair_mat.mtl&yup&size=2048&textures=dds&normals=rgba8&download=1',
    )
    // the normals option only applies to DDS textures
    expect(query(exportActions('objects/chair.cgf', { ...options, normals: 'rgba8' })[0].url)).not.toContain('normals')
  })
})

describe('exportOptionNames', () => {
  it('shows only the options that apply', () => {
    expect(exportOptionNames('objects/x_diff.dds', options)).toEqual(['textureSize'])
    expect(exportOptionNames('objects/x_ddna.dds.a', options)).toEqual(['textureSize'])
    expect(exportOptionNames('objects/chair.cgf', options)).toEqual([
      'textures',
      'textureSize',
      'yUp',
      'quantize',
      'allLods',
      'keepNoDraw',
    ])
    expect(exportOptionNames('objects/chair.mtl', { ...options, textures: 'dds' })).toEqual([
      'textures',
      'normals',
      'textureSize',
      'yUp',
      'quantize',
      'keepNoDraw',
    ])
    expect(exportOptionNames('project.json', options)).toEqual([])
  })
})

describe('audio exports', () => {
  it('decodes a media file to WAV in the page, downloads the file', () => {
    expect(groups('sounds/wwise/media/1.wem')).toEqual(['export:wav', 'download:raw'])
    const [wav] = exportActions('sounds/wwise/media/1.wem', options)
    expect(wav.url).toBeNull()
    expect(wav.create).toBeTypeOf('function')
    expect(wav.fileName).toBe('1.wav')
  })

  it('zips the media of a bank as WAV or as stored, downloads the file', () => {
    expect(groups('sounds/wwise/ambiences.bnk')).toEqual(['export:wav-zip', 'download:wem-zip', 'download:raw'])
    expect(exportActions('sounds/wwise/ambiences.bnk', options).map((it) => it.fileName)).toEqual([
      'ambiences.wav.zip',
      'ambiences.wem.zip',
      'ambiences.bnk',
    ])
  })

  it('has no export options', () => {
    expect(exportOptionNames('sounds/wwise/ambiences.bnk', options)).toEqual([])
  })
})

describe('dispositionFileName', () => {
  it('reads plain and quoted names', () => {
    expect(dispositionFileName('attachment; filename=x.glb')).toBe('x.glb')
    expect(dispositionFileName('attachment; filename="x y.glb"')).toBe('x y.glb')
    expect(dispositionFileName(null)).toBeNull()
  })
})
