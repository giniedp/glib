import type { TextureCompression } from '@gglib/graphics'
import type { JsonRpcRequest, JsonRpcResponse } from '@gglib/utils'
import { transcodeKtx, transcoderModule } from './transcode'
import type { TranscoderModule, TranscoderOptions } from './types'

let module: TranscoderModule

self.onmessage = async (event: MessageEvent<JsonRpcRequest>) => {
  const request = event.data
  try {
    const result = await handleRequest(request)
    self.postMessage({
      id: request.id,
      error: null,
      result: result,
    } satisfies JsonRpcResponse)
  } catch (error) {
    self.postMessage({
      id: request.id,
      error: {
        code: -32000,
        message: (error as Error)?.message ?? String(error),
      },
      result: null,
    } satisfies JsonRpcResponse)
  }
}

async function handleRequest(request: JsonRpcRequest): Promise<any> {
  if (request.method === 'init') {
    module = await transcoderModule(request.params[0] as TranscoderOptions)
    return
  }
  if (!module) {
    throw new Error('Transcoder module is not initialized')
  }
  if (request.method === 'transcode') {
    const data = request.params[0] as Uint8Array
    const compression = request.params[1] as TextureCompression[]
    return transcodeKtx(module, data, compression)
  }
}
