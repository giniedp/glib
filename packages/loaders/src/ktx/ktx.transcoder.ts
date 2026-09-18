import { TextureCompression } from '@gglib/graphics'
import { JsonRpcWorker, jsonRpcWorker } from '@gglib/utils'
import { TextureData } from './transcoder/transcode'
import { TranscoderOptions } from './transcoder/types'

export class Transcoder {
  private rpc: JsonRpcWorker
  private isInitialized: Promise<void>

  public constructor(options: TranscoderOptions) {
    this.rpc = jsonRpcWorker({
      worker: getWorker(options),
    })

    options = { ...options }
    delete options.getWorker

    this.isInitialized = this.rpc.request({
      id: this.rpc.nextId(),
      method: 'init',
      params: [options],
    })
  }

  public async transcode(data: ArrayBuffer, compression: TextureCompression[]): Promise<TextureData> {
    await this.isInitialized
    return await this.rpc.request<TextureData>(
      {
        id: this.rpc.nextId(),
        method: 'transcode',
        params: [data, compression],
      },
      [], // [data],
    )
  }
}

function getWorker(options: TranscoderOptions) {
  let worker: Worker
  if (options.getWorker) {
    worker = options.getWorker()
  } else {
    worker = new Worker(new URL('./ktx.worker.js', import.meta.url), {
      type: 'module',
    })
  }
  return worker
}
