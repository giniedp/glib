import { beforeEach, describe, it } from 'vitest'
import { transcoder } from './transcode'

describe('transcode', () => {

  it('should initialize', async () => {
    await transcoder({
      // wasmBinary,
      // @ts-ignore
      wasmUrl: await import('/libs/basis_transcoder.wasm?url').then((m) => m.default),
    })
  })
})
