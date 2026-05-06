import type { TemplateList, WgslToken } from './wgsl-tokenize'

export type WgslProgram = Array<WgslDirective | WgslAssert | WgslGlobalDeclaration | WgslUnknown>

export type WgslGlobalDeclaration = WgslVarOrValueDeclaration | WgslTypeAlias | WgslStruct | WgslFunction

export type WgslDirective = {
  kind: 'directive'
  name: string
  text: string
}
export function wgslDirective(name: string, text: string): WgslDirective {
  return {
    kind: 'directive',
    name,
    text,
  }
}

export type WgslAttribute = {
  kind: 'attribute'
  name: string
  params: string
}
export function wgslAttribute(name: string, params: string = null): WgslAttribute {
  return {
    kind: 'attribute',
    name,
    params,
  }
}

export type WgslAssert = {
  kind: 'assert'
  name: string
  expression: string
}
export function wgslAssert(name: string, expression: string): WgslAssert {
  return {
    kind: 'assert',
    name,
    expression,
  }
}

export type WgslTypeAlias = {
  kind: 'alias'
  comments: string[]
  name: string
  type: WgslTypeReference
}
export function wgslTypeAlias(comments: string[], name: string, type: WgslTypeReference): WgslTypeAlias {
  return {
    kind: 'alias',
    comments,
    name,
    type,
  }
}

export type WgslTypeReference = {
  kind: 'type'
  name: string
  template: TemplateList
}
export function wgslTypeRefence(name: string, template: TemplateList): WgslTypeReference {
  const result: WgslTypeReference = {
    kind: 'type',
    name,
    template,
  }
  return result
}

export type WgslStruct = {
  kind: 'struct'
  comments: string[]
  attributes: WgslAttribute[]
  name: string
  member: WgslStructMember[]
}
export function wgslStruct(
  comments: string[],
  attributes: WgslAttribute[],
  name: string,
  member: WgslStructMember[],
): WgslStruct {
  return {
    kind: 'struct',
    comments,
    attributes,
    name,
    member,
  }
}

export type WgslStructMember = {
  comments: string[]
  attributes: WgslAttribute[]
  name: string
  type: WgslTypeReference
}
export function wgslStructMember(
  comments: string[],
  attributes: WgslAttribute[],
  name: string,
  type: WgslTypeReference,
): WgslStructMember {
  return {
    comments,
    attributes,
    name,
    type,
  }
}

export type WgslFunction = {
  comments?: string[]
  attributes?: WgslAttribute[]
  kind: 'function'
  name: string
  params: WgslFunctionParam[]
  returns: WgslFunctionReturnType
  body: WgslToken[]
}
export function wgslFunction(
  comments: string[],
  attributes: WgslAttribute[],
  name: string,
  params: WgslFunctionParam[],
  returns: WgslFunctionReturnType,
  body: WgslToken[],
): WgslFunction {
  return {
    kind: 'function',
    comments,
    attributes,
    name,
    params,
    returns,
    body,
  }
}

export type WgslFunctionParam = {
  comments: string[]
  attributes: WgslAttribute[]
  name: string
  type: WgslTypeReference
}
export function wgslFunctionParam(
  comments: string[],
  attributes: WgslAttribute[],
  name: string,
  type: WgslTypeReference,
): WgslFunctionParam {
  return {
    comments,
    attributes,
    name,
    type,
  }
}

export type WgslFunctionReturnType = {
  comments?: string[]
  attributes?: WgslAttribute[]
  type: WgslTypeReference
}
export function wgslFunctionReturnType(
  comments: string[],
  attributes: WgslAttribute[],
  type: WgslTypeReference,
): WgslFunctionReturnType {
  return {
    comments,
    attributes,
    type,
  }
}

export type WgslDataDeclaration<T> = {
  comments?: string[]
  attributes?: WgslAttribute[]
  kind: T
  options: string[]
  name: string
  type: WgslTypeReference
  initializer: WgslToken[]
}

export type WgslVariable = WgslDataDeclaration<'var'>
export type WgslConstant = WgslDataDeclaration<'const'>
export type WgslOverride = WgslDataDeclaration<'override'>
export type WgslLet = WgslDataDeclaration<'let'>

export type WgslVarOrValueDeclaration = WgslVariable | WgslConstant | WgslOverride | WgslLet

export function wgslDataDeclaration(
  kind: WgslVarOrValueDeclaration['kind'],
  comments: string[],
  attributes: WgslAttribute[],
  options: string[],
  name: string,
  type: WgslTypeReference,
  initializer: WgslToken[],
): WgslVarOrValueDeclaration {
  return {
    kind,
    comments,
    attributes,
    name,
    options,
    type,
    initializer,
  }
}

export type WgslUnknown = {
  kind: 'unknown'
  name?: never
  token: WgslToken
}
