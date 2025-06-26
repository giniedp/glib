import { TextureCompression } from '@gglib/graphics'
import { JsonRPCRequest, JsonRPCResponse, RpcTaskManager } from '@gglib/utils'
import { TextureData } from './transcode'
import { TranscoderOptions } from './types'

export class Transcoder {
  private worker = new Worker(new URL('./transcoder.worker.js', import.meta.url), {
    type: 'module',
  })
  private scheduler = new RpcTaskManager({
    schedule: this.schedule.bind(this),
  })

  private isInitialized: Promise<void>

  public constructor(options: TranscoderOptions) {
    this.worker.onmessage = this.onMessage.bind(this)
    this.isInitialized = this.scheduler.request({
      method: 'init',
      params: [options],
    })
  }

  public async transcode(data: ArrayBuffer, compression: TextureCompression[]): Promise<TextureData> {
    await this.isInitialized
    return await this.scheduler.request<TextureData>(
      {
        method: 'transcode',
        params: [data, compression],
      },
      [], // [data],
    )
  }

  private schedule(rpc: JsonRPCRequest, transfer: Transferable[]) {
    this.worker.postMessage(rpc, transfer || [])
  }

  private onMessage(event: MessageEvent<JsonRPCResponse>) {
    const response = event.data
    this.scheduler.response(response)
  }
}
