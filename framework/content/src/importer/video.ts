import { PipelineContext, pipelineLoader } from '../Pipeline'

pipelineLoader('*', ['Video', HTMLVideoElement], (context: PipelineContext) => {
  let video = document.createElement('video')
  video.src = context.source
  context.result = video
  // skips the 'importer' and 'processor' stages
})
