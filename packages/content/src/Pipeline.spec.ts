import { ContentManager } from './ContentManager'
import { Pipeline } from './Pipeline'
import { PipelineContext } from './PipelineContext'

const Model = Symbol('Model')

describe('Content.Loader', () => {
  let loader: Pipeline
  let manager: ContentManager

  beforeEach(() => {
    loader = new Pipeline()
    loader.register({
      input: '.json',
      output: Object,
      handle: async (input: any, context: PipelineContext) => {
        const data = await context.manager.download(context.source)
        return JSON.parse(data.content as string)
      },
    })

    loader.register({
      input: Object,
      output: Model,
      handle: async (input: any, context: PipelineContext) => {
        if (input.format === 'format1') {
          return input.format
        }
      },
    })

    loader.register({
      input: Object,
      output: Model,
      handle: async (input: any, context: PipelineContext) => {
        if (input.format === 'format2') {
          return input.format
        }
      },
    })

    loader.register({
      input: Object,
      output: Model,
      handle: async (input: any, context: PipelineContext) => {
        if (input.format === 'format3') {
          return input.format
        }
      },
    })

    const downloads = {
      'url/format1.json': { content: '{ "format": "format1" }' },
      'url/format2.json': { content: '{ "format": "format2" }' },
      'url/format3.json': { content: '{ "format": "format3" }' },
    }
    manager = {
      download: (source: string) => Promise.resolve(downloads[source]),
    } as any
  })

  it('takes a fallback route if a loader returns null', async () => {
    const result = await Pipeline.run({
      manager: manager,
      source: 'url/format1.json',
      target: Model,
      pipeline: loader,
    })
    expect(result).toBe('format1')
  })

  it('takes a fallback route if a loader returns null', async () => {
    const result = await Pipeline.run({
      manager: manager,
      source: 'url/format2.json',
      target: Model,
      pipeline: loader,
    })
    expect(result).toBe('format2')
  })

  it('takes a fallback route if a loader returns null', async () => {
    const result = await Pipeline.run({
      manager: manager,
      source: 'url/format3.json',
      target: Model,
      pipeline: loader,
    })
    expect(result).toBe('format3')
  })
})
