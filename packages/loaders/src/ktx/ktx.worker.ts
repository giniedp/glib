import type { TextureCompression } from '@gglib/graphics'
import { jsonRpcHandler } from '@gglib/utils'
import { TextureData, transcodeKtx, transcoderModule } from './transcoder/transcode'
import type { TranscoderModule, TranscoderOptions } from './transcoder/types'

let module: TranscoderModule
jsonRpcHandler(
  self,
  async (request) => {
    if (request.method === 'init') {
      module = await transcoderModule(request.params[0] as TranscoderOptions)
      return null
    }
    if (!module) {
      throw new Error('Transcoder module is not initialized')
    }
    if (request.method === 'transcode') {
      const data = request.params[0] as Uint8Array
      const compression = request.params[1] as TextureCompression[]
      return transcodeKtx(module, data, compression)
    }
    return null
  },
  {
    // the transcoded images go back without a copy
    transfer: (result, request) => {
      if (request.method !== 'transcode' || !result) {
        return []
      }
      const transfer: Transferable[] = []
      for (const level of (result as TextureData).levelImages) {
        for (const layer of level.layers) {
          for (const face of layer.faces) {
            transfer.push(face.buffer)
          }
        }
      }
      return transfer
    },
  },
)
