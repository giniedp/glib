import { extend, Http, HttpOptions, Log, WebWorker } from '@glib/core'
import { Model, ModelBuilder } from '@glib/graphics'
import { FBX } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelineLoader, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'
import { RawAsset } from './../Manager'

pipelineLoader(['.fbx'], [Model, 'Model'], (context: PipelineContext) => {
  const ajax: HttpOptions = {
    xhr: Http.createXMLHttpRequest(),
    url: context.source,
  }
  ajax.xhr.responseType = 'arraybuffer'

  return context.manager.download(ajax).then((res) => {
    context.result = FBX.parse(res.content)
  })
})
