import { ShaderEffect, ShaderEffectOptions, ShaderPassOptions, ShaderTechniqueOptions } from '@gglib/graphics'

import { YML } from '../../formats/yml'
import { PipelineContext  } from '../../PipelineContext'
import { loader, resolveUri } from '../../utils'

interface GlFxDocument {
  name: string
  program: string
  technique: GlFxTechnqiue | GlFxTechnqiue[]
}

interface GlFxTechnqiue {
  name: string
  pass: GlFxPass | GlFxPass[]
}

interface GlFxPass {
  name: string,
  vertexShader: string,
  fragmentShader: string,
}

export const ggfxToShaderEffectOptions = loader<null, ShaderEffectOptions>({
  input: ['.ggfx', 'application/x-yaml'],
  output: ShaderEffect.Options,
  handle: async (_, context) => {
    const text = (await context.manager.downloadText(context.source)).content
    const includeHandler = createIncludeHandler(context)
    const doc = YML.parse(text) as GlFxDocument
    const result = {
      name: doc.name,
      techniques: await mapTechnqiues(doc, doc.technique, includeHandler),
    }
    return result
  },
})

async function mapTechnqiues(
  doc: GlFxDocument,
  techniques: GlFxTechnqiue | GlFxTechnqiue[],
  includeHandler: (includePath: string) => Promise<string>,
): Promise<ShaderTechniqueOptions[]> {
  techniques = Array.isArray(techniques) ? techniques : [techniques]
  return Promise.all(techniques
    .filter((it) => !!it)
    .map(async (it) => {
      return {
        name: it.name,
        passes: await mapPasses(doc, it.pass, includeHandler),
      }
    }))
}

async function  mapPasses(
  doc: GlFxDocument,
  passes: GlFxPass | GlFxPass[],
  includeHandler: (includePath: string) => Promise<string>,
): Promise<ShaderPassOptions[]> {
  passes = Array.isArray(passes) ? passes : [passes]
  return Promise.all(passes
    .filter((it) => !!it)
    .map(async (it) => {
      return {
        name: it.name,
        program: await processProgram(
          ['#define VERTEX_SHADER', doc.program, it.vertexShader].join('\n'),
          ['#define FRAGMENT_SHADER', doc.program, it.fragmentShader].join('\n'),
          includeHandler,
        ),
      }
    }))
}

let regInclude = /#include\s+<(.*)>/
let charNewLine = '\n'

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n')
}

function processProgram(vertexShader: string, fragmentShader: string, include: (includePath: string) => Promise<string>) {
  // solve all preprocessor directives
  return Promise.all([
    processShader(vertexShader, include),
    processShader(fragmentShader, include),
  ]).then(([ vSource, fSource ]) => {
    return {
      vertexShader: vSource,
      // attribute declaration is only allowed in vertex shader
      fragmentShader: fSource.replace(/attribute.*;/g, ''),
    }
  })
}

function processShader(source: string, include: (includePath: string) => Promise<string>): Promise<string> {
  return Promise.all(getLines(source).map((line) => {
    const includeMatch = line.match(regInclude)
    return includeMatch ? include(includeMatch[1]) : line
  })).then((lines) => {
    return lines.join(charNewLine)
  })
}

function createIncludeHandler(context: PipelineContext): (includePath: string) => Promise<string> {
  return (includePath: string) => {
    const url = resolveUri(includePath, context)
    const cache = context.options.includeCache || {}
    context.options.includeCache = cache
    return cache[url] = cache[url] || context.manager.download(url).then((res) => res.content)
  }
}
