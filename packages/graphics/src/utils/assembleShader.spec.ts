import { describe, expect, it } from 'vitest'
import { assembleProgram } from './assembleShader'
import { glsl } from './glsl'

describe('@gglib/graphics/assembleShader', () => {
  const template = glsl`
    #pragma block:foo

    #pragma block:bar
  `

  const blocks = [
    {
      foo: glsl`
        foo1
      `,
      bar: glsl`
        bar1
      `,
    },
    {
      foo: glsl`
        foo2
      `,
      bar: glsl`
        function bar() {
          #pragma block:baz
        }
      `,
    },
    {
      baz: glsl`
        baz
      `,
    },
  ]

  it ('includes blocks by name', () => {
    const program = assembleProgram({
      template: `#pragma block:foo`,
      chunks: [{
        foo: 'foo block',
        bar: 'bar block',
      }]
    })
    expect(program.vertexShader.trim()).toEqual(`foo block`)
    expect(program.fragmentShader.trim()).toEqual(`foo block`)
  })

  it ('includes meta blocks before and after', () => {
    const program = assembleProgram({
      template: `#pragma block:foo`,
      chunks: [{
        foo_before: 'foo before',
        foo_after: 'foo after',
        bar: 'bar block',
      }]
    })
    expect(program.vertexShader.trim()).toEqual(`foo before\nfoo after`)
    expect(program.fragmentShader.trim()).toEqual(`foo before\nfoo after`)
  })
})
