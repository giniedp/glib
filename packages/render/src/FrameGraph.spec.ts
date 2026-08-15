import { beforeEach, describe, expect, it } from 'vitest'
import { FrameGraph } from './FrameGraph'
import { createRenderChannelSchema, renderChannel } from './RenderChannel'

const channels = {
  Depth: renderChannel('depth'),
  Color: renderChannel('color'),
  Normals: renderChannel('normals'),
}

describe('FrameGraph', () => {
  let graph: FrameGraph<string>
  beforeEach(() => {
    graph = new FrameGraph<string>()
    graph.setDescriptors(createRenderChannelSchema(null))
  })

  it('accepts read/write before end and trhows after', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    expect(() => graph.read(channels.Color)).toThrow() // no producers
    expect(() => graph.write(channels.Color)).not.toThrow()

    graph.addPass('B')
    expect(() => graph.read(channels.Color)).not.toThrow()
    expect(() => graph.write(channels.Color)).not.toThrow()

    graph.compile()

    expect(() => graph.read(channels.Color)).toThrow()
    expect(() => graph.write(channels.Color)).toThrow()
    expect(() => graph.addPass('C')).toThrow()
  })

  it('culls passes that do not write to any output', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    graph.write(channels.Depth) // not an output, so A is culled

    graph.addPass('B')
    graph.write(channels.Color)

    graph.addPass('C')
    graph.write(channels.Normals) // not an output, so A is culled

    graph.compile()

    expect(graph.nodes.map((it) => it.pass)).toEqual(['B'])
  })

  it('overrides write after write', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    graph.write(channels.Color)

    graph.addPass('B')
    graph.write(channels.Color) // overrides A, so A is culled

    graph.addPass('C')
    graph.read(channels.Color) // depends on B, but does not write

    graph.compile()

    expect(graph.nodes.map((it) => it.pass)).toEqual(['B'])
  })

  it('keeps read after write dependencies', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    graph.write(channels.Depth)

    graph.addPass('B')
    graph.read(channels.Depth)
    graph.write(channels.Color)

    graph.addPass('C')
    graph.read(channels.Color) // depends on B, but does not write, culled

    graph.compile()

    expect(graph.nodes.map((it) => it.pass)).toEqual(['A', 'B'])
  })

  it('keeps modify after write dependencies', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    graph.write(channels.Color)

    graph.addPass('B')
    graph.modify(channels.Color) // modify -> read + write

    graph.addPass('C')
    graph.read(channels.Color) // depends on A, but does not write, culled

    graph.compile()

    expect(graph.nodes.map((it) => it.pass)).toEqual(['A', 'B'])
  })

  it('imports initial targets', () => {
    graph.begin([channels.Color], 1, 1)

    graph.addPass('A')
    graph.write(channels.Color)

    graph.addPass('B')
    graph.modify(channels.Color) // modify -> read + write

    graph.addPass('C')
    graph.read(channels.Color) // depends on A, but does not write, culled

    graph.compile()

    expect(graph.nodes.map((it) => it.pass)).toEqual(['A', 'B'])
  })
})
