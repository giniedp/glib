import { TextureCompression } from '@gglib/graphics'
import { JsonRpcClient, JsonRpcResponse } from '@gglib/utils'
import { TextureData } from './transcode'
import { TranscoderOptions } from './types'

export class Transcoder {
  private worker = new Worker(new URL('./transcoder.worker.js', import.meta.url), {
    type: 'module',
  })
  private client = new JsonRpcClient((rpc, transfer) => {
    this.worker.postMessage(rpc, transfer || [])
  })

  private isInitialized: Promise<void>

  public constructor(options: TranscoderOptions) {
    this.worker.onmessage = this.onMessage.bind(this)
    this.isInitialized = this.client.sendRequest({
      id: this.client.nextId(),
      method: 'init',
      params: [options],
    })
  }

  public async transcode(data: ArrayBuffer, compression: TextureCompression[]): Promise<TextureData> {
    await this.isInitialized
    return await this.client.sendRequest<TextureData>(
      {
        id: this.client.nextId(),
        method: 'transcode',
        params: [data, compression],
      },
      [], // [data],
    )
  }

  private onMessage(event: MessageEvent<JsonRpcResponse>) {
    const response = event.data
    this.client.handleResponse(response)
  }
}
