import type { Token } from '../shader'

export type GlslProgram = Array<GlslDirective | GlslGlobalDeclaration | GlslUnknown>

export type GlslGlobalDeclaration = GlslVariableDeclaration | GlslStructDeclaration | GlslInterfaceDeclaration

export type GlslLayoutQualifier = Record<string, number | undefined>

export type GlslDirective = {
  kind: 'directive'
  name: string
  text: string
}
export function glslDirective(name: string, text: string): GlslDirective {
  return {
    kind: 'directive',
    name,
    text,
  }
}

export type GlslTypeSpecifier = {
  kind: 'type'
  name: string
  arraySize: Token[]
}
export function glslTypeRefence(name: string, arraySize: Token[]): GlslTypeSpecifier {
  return {
    kind: 'type',
    name,
    arraySize,
  }
}

export type GlslStructDeclaration = {
  kind: 'struct'
  comments: string[]
  qualifier?: string[]
  name: string
  member: GlslStructMember[]
}

export function glslStruct(comments: string[], name: string, member: GlslStructMember[]): GlslStructDeclaration {
  return {
    kind: 'struct',
    comments,
    name,
    member,
  }
}

export type GlslStructMember = {
  comments: string[]
  qualifier: string[]
  name: string
  type: GlslTypeSpecifier
}
export function glslStructMember(
  comments: string[],
  qualifier: string[],
  name: string,
  type: GlslTypeSpecifier,
): GlslStructMember {
  return {
    comments,
    qualifier,
    name,
    type,
  }
}

export type GlslInterfaceDeclaration = {
  kind: 'interface'
  comments: string[]
  layout: Record<string, number | undefined>
  name: string
  member: GlslStructMember[]
  instanceName: string
}

export function glslInterface(
  comments: string[],
  layout: Record<string, number | undefined>,
  name: string,
  member: GlslStructMember[],
  instanceName: string,
): GlslInterfaceDeclaration {
  return {
    kind: 'interface',
    comments,
    layout,
    name,
    member,
    instanceName,
  }
}

export type GlslVariableDeclaration = {
  kind: 'variable'
  comments?: string[]
  qualifier?: string[]
  layout?: Record<string, number | undefined>
  name: string
  type: GlslTypeSpecifier
  initializer: Token[]
}

export function glslVariableDeclaration(
  comments: string[],
  qualifier: string[],
  layout: Record<string, number | undefined>,
  name: string,
  type: GlslTypeSpecifier,
  initializer: Token[],
): GlslVariableDeclaration {
  return {
    kind: 'variable',
    comments,
    qualifier,
    layout,
    name,
    type,
    initializer,
  }
}

export type GlslUnknown = {
  kind: 'unknown'
  name?: never
  token: Token
}
