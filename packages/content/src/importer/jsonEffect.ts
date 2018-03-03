import { ShaderEffect, ShaderPassOptions, ShaderTechniqueOptions } from '@gglib/graphics'
import { JSON } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'

interface ShaderProgramInput {
  vertexShader?: string
  fragmentShader?: string
}

interface ShaderPassInput {
  name?: string
  vertexShader?: string
  fragmentShader?: string
  program?: ShaderProgramInput
}

pipelineImporter(['.json', 'application/json'], ShaderEffect, (context: PipelineContext): Promise<void> => {
  context.imported = JSON.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

pipelineProcessor(ShaderEffect, (context: PipelineContext): Promise<void> => {
  context.result = new ShaderEffect(context.manager.device, context.imported)
  return Promise.resolve()
})

pipelinePreprocessor(ShaderEffect, (context: PipelineContext): Promise<void> => {

  let json: any = context.imported

  // get the shared source code (if any)
  let sharedCode: string = getProgram(json)
  // get technique specifications
  let techniques: any[] = getTechniques(json)

  //
  techniques.forEach((technique, index) => {
    convertTechnique(sharedCode, technique, index)
  })

  // the include hanlder to solve #include<> directives
  if (!context.options.includeHandler) {
    context.options.includeHandler = createIncludeHandler(context)
  }

  return Promise.all(techniques.map((technique: any) => {
    return Promise.all(getPasses(technique).map((pass: any, index: number) => {
      return processPass(pass, context)
    }))
  })).then(() => {
    // delete processed data
    delete json.program
    delete json.programs
    delete json.technique
    delete json.techniques
    // attach processed data
    json.techniques = techniques
  })
})

import { extend, Uri } from '@gglib/core'

let regInclude = /#include\s+<(.*)>/
let charNewLine = '\n'

function isObject(item: any) {
  return item != null && typeof item === 'object'
}

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n')
}

function getProgram(content: any): string {
  if (!content.program) {
    return ''
  }

  let result = Array.isArray(content.program)
    ? content.program.join(charNewLine)
    : content.program
  if (typeof result !== 'string') {
    throw new Error('Invalid effect file. "program" property is not a string.')
  }
  return result
}

function getTechniques(content: any) {
  let result: any[] = content.technique || content.techniques
  if (!result) {
    throw new Error('Invalid effect file. "techniques" property is missing.')
  }
  return Array.isArray(result)
    ? result
    : [result]
}

function getPasses(content: any) {
  let result: any[] = content.pass || content.passes
  if (!result) {
    throw new Error('Invalid effect file. "passes" property is missing.')
  }
  return Array.isArray(result)
    ? result
    : [result]
}

function convertTechnique(source: string, technique: ShaderTechniqueOptions, tIndex: number) {
  let passes = technique['pass'] || technique.passes
  if (isObject(passes) && passes) {
    passes = [passes]
  }
  if (!Array.isArray(passes)) {
    throw new Error('Invalid effect file. "passes" property in technique is missing.')
  }
  delete technique['pass']
  technique.name = technique.name || 'TECHNIQUE' + tIndex
  technique.passes = passes
  technique.passes.forEach((pass, pIndex: number) => {
    convertPass(source, pass as ShaderPassInput, pIndex)
  })
  return technique
}

function convertPass(source: string, pass: ShaderPassInput, index: number) {
  let vertexSource = pass.vertexShader
  let fragmentSource = pass.fragmentShader
  if (!vertexSource && !fragmentSource) {
    throw new Error('Invalid effect file. Pass has no vertex and no fragment shader')
  }
  if (typeof vertexSource === 'string') {
    vertexSource = ['#define VERTEX_SHADER', source, vertexSource].join(charNewLine)
  }
  if (typeof fragmentSource === 'string') {
    fragmentSource = ['#define FRAGMENT_SHADER', source, fragmentSource].join(charNewLine)
  }
  pass.name = pass.name || 'PASS' + index
  pass.program = {
    vertexShader: vertexSource,
    fragmentShader: fragmentSource,
  }
  delete pass.vertexShader
  delete pass.fragmentShader
  return pass
}

function processPass(pass: ShaderPassInput, context: PipelineContext) {

  // solve all preprocessor directives
  return Promise.all([
    processShader(pass.program.vertexShader, context),
    processShader(pass.program.fragmentShader, context),
  ]).then((res) => {
    let vSource = res[0]
    let fSource = res[1]

    // attribute declaration is only allowed in vertex shader
    fSource = fSource.replace(/attribute.*;/g, '')

    pass.program.vertexShader = vSource
    pass.program.fragmentShader = fSource
    return pass
  })
}

function processShader(source: string, context: PipelineContext): Promise<string> {
  return Promise.all(getLines(source).map((line) => {
    let includeMatch = line.match(regInclude)
    return includeMatch ? context.options.includeHandler(includeMatch[1]) : line
  })).then((lines) => {
    return lines.join(charNewLine)
  })
}

function createIncludeHandler(context: PipelineContext): (p: string) => Promise<void> {
  return (thePath: string) => {
    let url = Uri.merge(context.source, thePath)
    let cache = context.options.includeCache || {}
    context.options.includeCache = cache
    return cache[url] = cache[url] || context.manager.download(url).then((res) => res.content)
  }
}
