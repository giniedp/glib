import { buildShader } from './builder'
import { glsl } from './glsl'

describe('@gglib/effects/builder', () => {
  const template = glsl`
    #pragma block:foo

    #pragma block:bar
  `

  const blocks = [{
    foo: glsl`
      foo1
    `,
    bar: glsl`
      bar1
    `,
  }, {
    foo: glsl`
      foo2
    `,
    bar: glsl`
      function bar() {
        #pragma block:baz
      }
    `,
  }, {
    baz: glsl`
      baz
    `,
  }]

  it('builds from template', () => {
    expect(buildShader(template, blocks)).toBe(`foo1
foo2
bar1
function bar() {
  baz
}

`)
  })
})
