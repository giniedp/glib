import { Http, HttpOptions, Log } from '@gglib/core'
import { Texture } from '@gglib/graphics'
import { Pipeline, PipelineContext, pipelineImporter, pipelineLoader, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'
import { XhrAsset } from './../Manager'
import { TGA } from './../parser/TGA'

pipelineLoader(
  ['.jpg', '.jpeg', '.png', '.bmp', 'image/jpg', 'image/png'], [Texture, 'Texture2D', 'TextureCube'], (context: PipelineContext) => {
  // images do not need to be downloaded
  // image src can be passed as url to the texture
  context.imported = { data: context.source }
  // skip the 'import' stage and go directly to 'process' stage
  return context.pipeline.process(context)
})

pipelineLoader(['.tga', 'image/x-tga'], [Texture, 'Texture2D', 'TextureCube'], (context: PipelineContext) => {
  return context.manager.load(ImageData, context.source).then((result) => {
    context.imported = result
    return context.pipeline.process(context)
  })
})

pipelineProcessor(Texture, (context: PipelineContext) => {
  context.result = context.manager.device.createTexture(context.imported)
})
pipelineProcessor('Texture2D', (context: PipelineContext) => {
  context.result = context.manager.device.createTexture2D(context.imported)
})
pipelineProcessor('TextureCube', (context: PipelineContext) => {
  context.result = context.manager.device.createTextureCube(context.imported)
})
