export type Token =
  | DirectiveToken
  | CommentToken
  | IntegerToken
  | FloatToken
  | BooleanToken
  | KeywordToken
  | IdentifierToken
  | SymbolToken
  | UnknownToken

export type TypedToken<T extends string> = {
  type: T
  value: string
}
export type DirectiveToken = TypedToken<'directive'>
export type CommentToken = TypedToken<'comment'> & { kind?: 'end' | 'block' | 'line' }
export type IntegerToken = TypedToken<'integer'>
export type FloatToken = TypedToken<'float'>
export type BooleanToken = TypedToken<'boolean'>
export type KeywordToken = TypedToken<'keyword'>
export type IdentifierToken = TypedToken<'identifier'>
export type SymbolToken = TypedToken<'symbol'>
export type UnknownToken = TypedToken<'unknown'>

export function token$<T extends Token['type']>(type: T, value: string): TypedToken<T> {
  return { type, value }
}
export function directive$(value: string): DirectiveToken {
  return token$('directive', value)
}
export function comment$(value: string, kind?: CommentToken['kind']): CommentToken {
  const token: CommentToken = token$('comment', value)
  if (kind) {
    token.kind = kind
  }
  return token
}
export function integer$(value: string): IntegerToken {
  return token$('integer', value)
}
export function float$(value: string): FloatToken {
  return token$('float', value)
}
export function boolean$(value: string): BooleanToken {
  return token$('boolean', value)
}
export function keyword$(value: string): KeywordToken {
  return token$('keyword', value)
}
export function identifier$(value: string): IdentifierToken {
  return token$('identifier', value)
}
export function symbol$(value: string): SymbolToken {
  return token$('symbol', value)
}
export function unknown$(value: string): UnknownToken {
  return token$('unknown', value)
}
