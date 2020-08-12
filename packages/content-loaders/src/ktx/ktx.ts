import { loader } from '@gglib/content'
import { KTX } from './format'

/**
 * Downloads an array buffer from source and parses with the KTX parser
 * @public
 */
export const loadKtxToKtx = loader({
  input: ['.ktx', '.ktx2', 'image/ktx2', 'image/ktx'],
  output: KTX,
  handle: async (_, context) => {
    return context.manager.downloadArrayBuffer(context.source).then((res) => KTX.parse(res.content))
  },
})
