import { extend } from '@gglib/core'
import { ShaderEffectOptions } from '@gglib/graphics'
import { MTL, MtlData } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'

pipelineImporter(['.mtl', 'application/x-mtl'], 'Material', (context: PipelineContext) => {
  context.imported = MTL.parse(context.downloaded.content).map(convertMaterial)[0]
  return context.pipeline.process(context)
})

pipelineImporter(['.mtl', 'application/x-mtl'], 'Material[]', (context: PipelineContext) => {
  context.imported = MTL.parse(context.downloaded.content).map(convertMaterial)
  return context.pipeline.process(context)
})

function convertMaterial(mtl: MtlData) {
  let result: ShaderEffectOptions = {
    name: mtl.name,
    parameters: {},
  }

  if (mtl.Ka) {
    result.parameters.AmbientColor = mtl.Ka
  }
  if (mtl.Kd) {
    result.parameters.DiffuseColor = mtl.Kd
  }
  if (mtl.Ks) {
    result.parameters.SpecularColor = mtl.Ks
  }
  if (mtl.Ns) {
    result.parameters.SpecularPower = mtl.Ns
    if (result.parameters.SpecularPower > 1) {
      result.parameters.SpecularPower = Math.log(result.parameters.SpecularPower) / Math.log(2) / 10.5
    }
  }

  // if (m.Ni) result.parameters.refraction = m.Ni;
  if (mtl.map_Ka) {
    result.parameters.AmbientMap = mtl.map_Ka.file
    result.parameters.AmbientMapEnabled = true
  }
  if (mtl.map_Kd) {
    result.parameters.DiffuseMap = mtl.map_Kd.file
    result.parameters.DiffuseMapEnabled = true
  }
  if (mtl.bump) {
    result.parameters.NormalMap = mtl.bump.file
    result.parameters.NormalMapEnabled = true
  }
  if (mtl.map_Ks) {
    result.parameters.SpecularMap = mtl.map_Ks.file
    result.parameters.SpecularMapEnabled = true
  }
  if (mtl.map_d) {
    result.parameters.AlphaMap = mtl.map_d
    result.parameters.AlphaMapEnabled = true
  }
  if (mtl.disp) {
    result.parameters.DisplaceMap = mtl.disp
    result.parameters.DisplaceMapEnabled = true
  }
  if (mtl.refl) {
    result.parameters.ReflectionMap = mtl.refl
    result.parameters.ReflectionMapEnabled = true
  }
  if (mtl.d) {
    result.parameters.Alpha = mtl.d
  }

  result['effect'] = 'basicEffect'
  result.techniques = [{
    name: 'basicEffect',
    passes: [{
      name: 'basicEffect',
      blendState: mtl.d < 1 ? 'AlphaBlend' : 'Opaque',
    }],
  }]
  result.technique = mtl.illum === '0' ? 'basic' : 'pixelLighting'
  return result
}
