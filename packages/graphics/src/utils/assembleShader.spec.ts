import { assembleShader } from './assembleShader'
import { glsl } from './glsl'

describe('@gglib/graphics/assembleShader', () => {
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
    expect(assembleShader(template, blocks)).toBe(`foo1
foo2
bar1
function bar() {
  baz
}

`)
  })
})
