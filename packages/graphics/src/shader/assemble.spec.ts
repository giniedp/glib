import { describe, expect, it } from 'vitest'
import { assembleShader } from './assemble'

describe('@gglib/graphics/shader/assemble', () => {
  it('includes blocks by name', () => {
    const shader = assembleShader({
      template: `#pragma block:foo`,
      chunks: [
        {
          foo: 'foo block',
          bar: 'bar block',
        },
      ],
      defines: {},
    })
    expect(shader.trim()).toEqual(`foo block`)
  })

  it('includes meta blocks before and after', () => {
    const shader = assembleShader({
      template: `#pragma block:foo`,
      chunks: [
        {
          foo_before: 'foo before',
          foo_after: 'foo after',
          bar: 'bar block',
        },
      ],
      defines: {},
    })
    expect(shader.trim()).toEqual(`foo before\nfoo after`)
  })
})
