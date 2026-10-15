import { Device, WebglDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { TonemapPass } from './post'
import { Renderer } from './Renderer'
import { RenderPipeline } from './RenderPipeline'

describe('render ownership', () => {
  let device: Device

  beforeEach(async () => {
    device = await new WebglDevice({}).ready
  })

  it('pipeline finalizes its passes', () => {
    const pass = new TonemapPass(device, {})
    const pipeline = new RenderPipeline({ passes: [pass] })
    pipeline.dispose()
    expect(pass.ownership.isFinalized).toBe(true)
  })

  it('pipeline finalizes cleared passes', () => {
    const pass = new TonemapPass(device, {})
    const pipeline = new RenderPipeline({ passes: [pass] })
    pipeline.clear()
    expect(pass.ownership.isFinalized).toBe(true)
    expect(pipeline.ownership.isFinalized).toBe(false)
  })

  it('renderer finalizes the pipeline it created', () => {
    const renderer = new Renderer(device)
    const pipeline = renderer.pipeline
    renderer.dispose()
    expect(pipeline.ownership.isFinalized).toBe(true)
  })

  it('renderer does not finalize a borrowed pipeline', () => {
    const pipeline = new RenderPipeline({ passes: [] })
    const renderer = new Renderer(device, { pipeline })
    renderer.dispose()
    expect(pipeline.ownership.isFinalized).toBe(false)
  })
})
