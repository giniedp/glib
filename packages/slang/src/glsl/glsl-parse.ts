import { preprocess, TokenReader, type Token } from '../shader'
import {
  glslInterface,
  glslStruct,
  glslStructMember,
  glslTypeRefence,
  glslVariableDeclaration,
  type GlslInterfaceDeclaration,
  type GlslLayoutQualifier,
  type GlslProgram,
  type GlslStructDeclaration,
  type GlslStructMember,
  type GlslTypeSpecifier,
  type GlslVariableDeclaration,
} from './glsl-ast'
import { isGlslQualifier, isGlslType, isUnclassified } from './glsl-keywords'
import { tokenizeGlsl } from './glsl-tokenize'

export type GlslTokenReader = TokenReader<Token>
export function parseGlsl(source: string) {
  const tokens = preprocess(tokenizeGlsl(source), tokenizeGlsl)
  return parseGlslTokens(tokens)
}

export function parseGlslTokens(program: Token[]) {
  const reader = new TokenReader<Token>(program)
  return readGlslProgram(reader)
}

export function readGlslProgram(reader: GlslTokenReader): GlslProgram {
  const result: GlslProgram = []
  let decl = glslPredeclaration()

  while (reader.canRead) {
    reader.skipComments = false
    if (reader.is('symbol', ';')) {
      decl = glslPredeclaration()
      reader.next()
      continue
    }
    if (reader.is('comment')) {
      decl.comments.push(reader.read('comment'))
      continue
    }
    if (reader.is('keyword')) {
      switch (reader.tokenValue) {
        case 'layout': {
          decl.layout = readLayoutQualifier(reader)
          continue
        }
        case 'struct': {
          result.push(...readGlslStruct(reader, decl))
          decl = glslPredeclaration()
          continue
        }
      }
      if (isGlslQualifier(reader.tokenValue)) {
        decl.qualifier.push(reader.read('keyword'))
        continue
      }
      if (isGlslType(reader.tokenValue)) {
        decl.type = readGlslTypeSpecifier(reader)
        continue
      }
      if (isUnclassified(reader.tokenValue)) {
        reader.next()
        continue
      }
    }

    if (reader.is('identifier')) {
      const isInterface = decl.qualifier.includes('uniform') && reader.peekValue(1) === '{'
      if (!isInterface && !decl.type) {
        decl.type = readGlslTypeSpecifier(reader)
      } else {
        result.push(...readGlslDeclaration(reader, decl))
        decl = glslPredeclaration()
      }
      continue
    }
    console.warn('unknown glsl sequence\n', reader.token, reader.createLog())
    reader.next()
  }
  return result
}

interface GlslPredeclaration {
  comments: string[]
  qualifier: string[]
  layout?: GlslLayoutQualifier
  type?: GlslTypeSpecifier
}
function glslPredeclaration(): GlslPredeclaration {
  return {
    comments: [],
    qualifier: [],
    layout: null,
    type: null,
  }
}

function readLayoutQualifier(reader: GlslTokenReader): GlslLayoutQualifier {
  const layout: GlslLayoutQualifier = {}
  const skipComments = reader.skipComments
  reader.skipComments = true
  reader.read('keyword', 'layout')
  for (const item of reader.readBlockText('(', ')').split(',')) {
    const [key, value] = item.trim().split('=')
    layout[key.trim()] = value ? Number(value.trim()) : undefined
  }
  reader.skipComments = skipComments
  return layout
}

function readGlslStruct(
  reader: GlslTokenReader,
  decl: GlslPredeclaration,
): Array<GlslStructDeclaration | GlslVariableDeclaration> {
  reader.read('keyword', 'struct')
  const name = reader.read('identifier')
  const struct = glslStruct(decl.comments, name, [])
  const result: Array<GlslStructDeclaration | GlslVariableDeclaration> = [struct]
  while (reader.is('comment')) {
    reader.next()
  }

  const block = reader.readBlock('{', '}') //
  const blockReader = new TokenReader<Token>(block)
  while (blockReader.canRead) {
    struct.member.push(...readGlslStructMember(blockReader))
  }

  decl.comments = []
  while (reader.is('comment')) {
    decl.comments.push(reader.read('comment'))
  }

  if (reader.is('identifier')) {
    const varName = reader.read('identifier')
    const varType = glslTypeRefence(struct.name, readArraySize(reader))
    const varInit = reader.is('symbol', '=') ? reader.readUntil('symbol', ';') : null
    result.push(glslVariableDeclaration(decl.comments, decl.qualifier, decl.layout, varName, varType, varInit))
  }
  return result
}

function readGlslStructMember(reader: GlslTokenReader): GlslStructMember[] {
  const skipComments = reader.skipComments
  const result: GlslStructMember[] = []

  reader.skipComments = false
  const decl = glslPredeclaration()
  while (reader.is('comment')) {
    decl.comments.push(reader.read('comment'))
  }
  if (!reader.canRead) {
    return result
  }
  reader.skipComments = true

  while (isGlslQualifier(reader.tokenValue)) {
    decl.qualifier.push(reader.read('keyword'))
  }

  decl.type = readGlslTypeSpecifier(reader)
  {
    const name = reader.read('identifier')
    decl.type = glslTypeRefence(decl.type.name, readArraySize(reader) || decl.type.arraySize)
    result.push(glslStructMember(decl.comments, decl.qualifier, name, decl.type))
  }

  while (reader.is('symbol', ',')) {
    const name = reader.read('identifier')
    decl.type = glslTypeRefence(decl.type.name, readArraySize(reader) || decl.type.arraySize)
    result.push(glslStructMember(decl.comments, decl.qualifier, name, decl.type))
  }

  reader.skipComments = skipComments
  while (reader.is('comment')) {
    reader.next()
  }
  reader.read('symbol', ';')
  return result
}

function readArraySize(reader: GlslTokenReader): Token[] {
  if (!reader.is('symbol', '[')) {
    return null
  }
  const result: Token[] = []
  while (reader.is('symbol', '[')) {
    result.push(...reader.readBlock('[', ']'))
  }
  return result
}

function readGlslTypeSpecifier(reader: GlslTokenReader) {
  const result = glslTypeRefence(null, null)
  if (reader.is('identifier')) {
    // struct type
    result.name = reader.read('identifier')
  } else {
    result.name = reader.read('keyword')
    if (!isGlslType(result.name)) {
      throw new Error(`Invalid GLSL type:\n${reader.createLog()}`)
    }
  }
  const arraySize = readArraySize(reader)
  if (arraySize) {
    result.arraySize = arraySize
  }
  return result
}

function readGlslDeclaration(reader: GlslTokenReader, decl: GlslPredeclaration) {
  const skipComments = reader.skipComments
  reader.skipComments = true
  const result: Array<GlslVariableDeclaration | GlslInterfaceDeclaration> = []
  while (reader.canRead) {
    const name = reader.read('identifier')
    if (reader.is('symbol', '(')) {
      // Function declaration
      reader.readBlock('(', ')')
      reader.readBlock('{', '}')
      break
    }
    if (reader.is('symbol', '{')) {
      // Interface block
      const blockReader = new TokenReader<Token>(reader.readBlock('{', '}'))

      const block = glslInterface(decl.comments, decl.layout, name, [], null)
      while (blockReader.canRead) {
        block.member.push(...readGlslStructMember(blockReader))
      }

      if (reader.is('identifier')) {
        block.instanceName = reader.read('identifier')
      }
      result.push(block)
      break
    }
    // Variable declaration
    const variable = glslVariableDeclaration(decl.comments, decl.qualifier, decl.layout, name, decl.type, null)
    variable.type = glslTypeRefence(variable.type.name, readArraySize(reader) || variable.type.arraySize)
    if (reader.is('symbol', '=')) {
      reader.next()
      variable.initializer = readAssignment(reader)
    }
    result.push(variable)

    if (!reader.is('symbol', ',')) {
      break
    }
  }

  reader.skipComments = skipComments
  return result
}

function readAssignment(reader: GlslTokenReader) {
  const result: Token[] = []
  let depth = 0
  while (reader.canRead) {
    if (!depth && (reader.is('symbol', ';') || reader.is('symbol', ','))) {
      break
    }
    if (reader.is('symbol')) {
      if (reader.tokenValue === '(' || reader.tokenValue === '{' || reader.tokenValue === '[') {
        depth++
      }
      if (reader.tokenValue === ')' || reader.tokenValue === '}' || reader.tokenValue === ']') {
        depth--
      }
    }
    result.push(reader.token)
    reader.next()
  }
  return result
}

export function isGlslInt(expression: string) {
  return expression.match(/^(0x)?\d+[iu]?$/) !== null
}

export function parseGlslInt(expression: string) {
  if (expression.startsWith('0x')) {
    return parseInt(expression.slice(2).replace(/[iu]$/, ''), 16)
  }
  return parseInt(expression.replace(/[iu]$/, ''), 10)
}
