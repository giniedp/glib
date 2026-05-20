import { preprocess, printTokens, TokenReader } from '../../shader'
import {
  wgslAssert,
  wgslAttribute,
  wgslDirective,
  wgslFunction,
  wgslFunctionParam,
  wgslFunctionReturnType,
  wgslStruct,
  wgslStructMember,
  wgslTypeAlias,
  wgslTypeRefence,
  type WgslAssert,
  type WgslAttribute,
  type WgslDirective,
  type WgslFunction,
  type WgslFunctionParam,
  type WgslProgram,
  type WgslStruct,
  type WgslStructMember,
  type WgslTypeAlias,
  type WgslTypeReference,
  type WgslUnknown,
  type WgslVarOrValueDeclaration,
} from './wgsl-ast'
import { detectTemplateLists, tokenizeWgsl, type TemplateList, type WgslToken } from './wgsl-tokenize'

export type WgslTokenReader = TokenReader<WgslToken>
export function parseWgsl(source: string) {
  const tokens = preprocess(tokenizeWgsl(source), tokenizeWgsl)
  const wgslTokens = detectTemplateLists(tokens)
  return parseWgslTokens(wgslTokens)
}

export function parseWgslTokens(program: WgslToken[]) {
  const reader = new TokenReader<WgslToken>(program)
  return readWgslProgram(reader)
}

export function readWgslProgram(reader: WgslTokenReader): WgslProgram {
  const result: WgslProgram = []
  let comments: string[] = []
  let attributes: WgslAttribute[] = []
  while (reader.canRead) {
    if (reader.is('symbol', ';')) {
      reader.next()
      continue
    }
    if (reader.is('comment')) {
      comments.push(reader.read('comment'))
      continue
    }
    if (reader.is('symbol', '@')) {
      attributes.push(readWgslAttribute(reader))
      continue
    }

    switch (reader.tokenValue) {
      case 'enable':
      case 'requires':
      case 'diagnostic': {
        result.push(readWgslDirective(reader))
        continue
      }
      case 'const_assert': {
        result.push(readWgslAssert(reader))
        continue
      }
      case 'fn': {
        result.push(readWgslFunction(reader, comments, attributes))
        comments = []
        attributes = []
        continue
      }
      case 'struct': {
        result.push(readWgslStruct(reader, comments, attributes))
        comments = []
        attributes = []
        continue
      }
      case 'alias': {
        result.push(readWgslTypeAlias(reader, comments))
        comments = []
        attributes = []
        continue
      }
      case 'var':
      case 'let':
      case 'const':
      case 'override': {
        result.push(readVarOrValueDeclaration(reader, comments, attributes))
        comments = []
        attributes = []
        continue
      }
    }
    console.warn('unknown wgsl sequence\n', reader.createLog())
    result.push({
      kind: 'unknown',
      token: reader.token,
    } satisfies WgslUnknown)
    reader.next()
  }
  return result
}

export function readWgslDirective(reader: WgslTokenReader): WgslDirective {
  const keyword = reader.read('keyword') // enable, requires, diagnostic
  const tokens = reader.readUntil('symbol', ';')
  reader.read('symbol', ';')
  return wgslDirective(keyword, printTokens(tokens))
}

export function readWgslAssert(reader: WgslTokenReader): WgslAssert {
  const keyword = reader.read('keyword') // const_assert
  const tokens = reader.readUntil('symbol', ';')
  reader.read('symbol', ';')
  return wgslAssert(keyword, printTokens(tokens))
}

export function readWgslAttribute(reader: WgslTokenReader): WgslAttribute {
  reader.read('symbol', '@')

  const identifier = reader.read('identifier')
  const result = wgslAttribute(identifier)

  if (reader.is('symbol', '(')) {
    result.params = reader.readBlockText('(', ')')
  }
  return result
}

export function readWgslFunction(
  reader: WgslTokenReader,
  comments: string[],
  attributes: WgslAttribute[],
): WgslFunction {
  reader.read('keyword', 'fn')
  reader.skipType('comment')

  const identifier = reader.read('identifier')
  reader.skipType('comment')

  const params = readWgslFunctionParams(reader)
  reader.skipType('comment')

  const returns = reader.is('symbol', '-') ? readWgslFunctionReturnType(reader) : null
  reader.readUntil('symbol', '{')
  const body = reader.readBlock('{', '}')
  return wgslFunction(comments, attributes, identifier, params, returns, body)
}

function readWgslFunctionParams(reader: WgslTokenReader) {
  const result: WgslFunctionParam[] = []
  let attributes: WgslAttribute[] = []
  let comments: string[] = []

  reader.read('symbol', '(')
  while (reader.canRead) {
    if (reader.is('comment')) {
      comments.push(reader.read('comment'))
      continue
    }
    if (reader.is('symbol', '@')) {
      attributes.push(readWgslAttribute(reader))
      continue
    }
    if (reader.is('symbol', ',')) {
      reader.next()
      comments = []
      attributes = []
      continue
    }
    if (reader.is('symbol', ')')) {
      reader.next()
      comments = []
      attributes = []
      break
    }
    if (reader.is('identifier')) {
      const name = reader.read('identifier')
      reader.read('symbol', ':')
      const type = readWgslTypeReference(reader)
      result.push(wgslFunctionParam(comments, attributes, name, type))
      comments = []
      attributes = []
      continue
    }

    throw new Error(`Unexpected token in function parameters:\n${reader.createLog()}`)
  }
  return result
}

function readWgslFunctionReturnType(reader: WgslTokenReader) {
  reader.read('symbol', '-')
  reader.read('symbol', '>')
  let attributes: WgslAttribute[] = []
  let comments: string[] = []
  while (reader.canRead) {
    if (reader.is('comment')) {
      comments.push(reader.read('comment'))
      continue
    }
    if (reader.is('symbol', '@')) {
      attributes.push(readWgslAttribute(reader))
      continue
    }
    break
  }
  const type = readWgslTypeReference(reader)
  return wgslFunctionReturnType(comments, attributes, type)
}

export function readWgslTypeAlias(reader: WgslTokenReader, comments: string[]): WgslTypeAlias {
  reader.read('keyword', 'alias')
  reader.skipType('comment')

  const identifier = reader.read('identifier')
  reader.skipType('comment')

  reader.read('symbol', '=')
  reader.skipType('comment')

  const type = readWgslTypeReference(reader)
  return wgslTypeAlias(comments, identifier, type)
}

export function readWgslTypeReference(reader: WgslTokenReader): WgslTypeReference {
  const identifier = reader.read('identifier')
  reader.skipType('comment')

  let template: TemplateList = null
  if (reader.is('templatelist')) {
    template = reader.token as TemplateList
    reader.next()
  }

  return wgslTypeRefence(identifier, template)
}

export function readWgslStruct(reader: WgslTokenReader, comments: string[], attributes: WgslAttribute[]): WgslStruct {
  reader.read('keyword', 'struct')
  reader.skipType('comment')

  const identifier = reader.read('identifier')
  reader.skipType('comment')

  const tokens = reader.readBlock('{', '}')
  const member = readWgslStructBody(new TokenReader(tokens))
  return wgslStruct(comments, attributes, identifier, member)
}

function readWgslStructBody(reader: WgslTokenReader) {
  const member: WgslStructMember[] = []
  let attributes: WgslAttribute[] = []
  let comments: string[] = []
  while (reader.canRead) {
    if (reader.is('comment')) {
      comments.push(reader.read('comment'))
      continue
    }
    if (reader.is('symbol', '@')) {
      attributes.push(readWgslAttribute(reader))
      continue
    }
    if (reader.is('identifier')) {
      const identifier = reader.read('identifier')
      reader.read('symbol', ':')
      const type = readWgslTypeReference(reader)
      member.push(wgslStructMember(comments, attributes, identifier, type))
      attributes = []
      comments = []
      continue
    }
    if (reader.is('symbol', ',')) {
      reader.next()
      attributes = []
      comments = []
      continue
    }
    throw new Error(`Invalid struct syntax at:\n${reader.createLog()}`)
  }
  return member
}

function readVarOrValueDeclaration(
  reader: WgslTokenReader,
  comments: string[],
  attributes: WgslAttribute[],
): WgslVarOrValueDeclaration {
  // attribute* 'var' template? ident (':' ident template?)? ('=' expression)? ';'
  // https://www.w3.org/TR/WGSL/#var-and-value
  const result: WgslVarOrValueDeclaration = {
    attributes,
    comments,
    kind: null,
    options: [],
    name: null,
    type: null,
    initializer: null,
  }
  result.kind = reader.read('keyword') as any
  reader.skipType('comment')

  if (reader.is('templatelist')) {
    for (const token of (reader.token as TemplateList).tokens) {
      if (token.type === 'identifier') {
        result.options.push(token.value)
      }
    }
    reader.next()
    reader.skipType('comment')
  }

  result.name = reader.read('identifier')
  reader.skipType('comment')

  if (reader.is('symbol', ':')) {
    reader.next()
    reader.skipType('comment')
    result.type = readWgslTypeReference(reader)
  }

  if (reader.is('symbol', '=')) {
    reader.next()
    reader.skipType('comment')
    result.initializer = reader.readUntil('symbol', ';')
  }

  reader.read('symbol', ';')
  return result
}

export function isWgslInt(expression: string) {
  return expression.match(/^(0x)?\d+[iu]?$/) !== null
}

export function parseWgslInt(expression: string) {
  if (expression.startsWith('0x')) {
    return parseInt(expression.slice(2).replace(/[iu]$/, ''), 16)
  }
  return parseInt(expression.replace(/[iu]$/, ''), 10)
}

export function getWgslTemplateParameter(template: TemplateList, index: number): WgslToken[] {
  if (!template || !template.tokens.length) {
    return []
  }
  const result: WgslToken[] = []
  let paramIndex = 0
  for (let i = 0; i < template.tokens.length; i++) {
    const token = template.tokens[i]
    if (token.value === ',') {
      paramIndex++
      continue
    }
    if (paramIndex === index) {
      result.push(token)
    }
  }
  return result
}
