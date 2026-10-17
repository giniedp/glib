import { Device, WebglDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { IblSampler } from './ibl'
import { TonemapEffect } from './image/tonemap'

describe('effects ownership', () => {
  let device: Device

  beforeEach(async () => {
    device = await new WebglDevice({}).ready
  })

  it('finalizes the program but keeps the shared shader module', () => {
    const effect = new TonemapEffect(device)
    const program = effect.program
    const shader = program.module
    effect.dispose()
    expect(program.ownership.isFinalized).toBe(true)
    expect(shader.ownership.isFinalized).toBe(false)
  })

  it('shares one shader module between instances', () => {
    const a = new TonemapEffect(device)
    const b = new TonemapEffect(device)
    expect(a.program.module).toBe(b.program.module)
    expect(a.program).not.toBe(b.program)
  })

  it('is finalized with its scope', () => {
    const scope = device.createScope('test')
    const effect = scope.adopt(new TonemapEffect(device))
    const shader = effect.program.module
    expect(Array.from(scope.walk())).toContain(shader)
    scope.dispose()
    expect(effect.ownership.isFinalized).toBe(true)
    expect(effect.program.ownership.isFinalized).toBe(true)
    // shader modules acquired without a scope stay with the device
    expect(device.scope.has(shader)).toBe(true)
    expect(shader.ownership.isFinalized).toBe(false)
  })

  it('finalizes nested effects and render targets', () => {
    const sampler = new IblSampler(device, { envSize: 4, lutSize: 4 })
    const { envMapGGX, lutMapGGX } = sampler
    sampler.dispose()
    expect(envMapGGX.ownership.isFinalized).toBe(true)
    expect(lutMapGGX.ownership.isFinalized).toBe(true)
  })
})
