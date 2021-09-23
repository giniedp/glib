
import { GlslInterface, GlslParser, GlslStruct, GlslVariable } from './GlslParser'
import { Keywords } from './keywords'
import { preprocess } from './preprocess'
import { GlslTokenKind, tokenize } from './tokenize'

export interface GlslScanResult {
  variables: Record<string, GlslVariable>
  structs: Record<string, GlslStruct>
  interfaces: Record<string, GlslInterface>
}

export function scan(shader: string): GlslScanResult {
  const r = new GlslParser(preprocess(tokenize(shader)))
  const result: GlslScanResult = {
    variables: {},
    structs: {},
    interfaces: {},
  }

  let comment: string = null
  let typeName: string = null
  let qualifier: Record<string, boolean> = {}

  function reset() {
    comment = null
    typeName = null
    qualifier = {}
  }
  while (r.canRead) {
    switch (r.current.kind) {
      case GlslTokenKind.Symbol: {
        r.skipUntilKind(GlslTokenKind.Semicolon)
        reset()
        r.next()
        break
      }
      case GlslTokenKind.Semicolon: {
        reset()
        r.next()
        break
      }
      case GlslTokenKind.Comment: {
        comment = r.readComments()
        break
      }
      case GlslTokenKind.Keyword: {
        const token = r.current.text

        if (Keywords.simpleTypes.has(token) || Keywords.samplerTypes.has(token)) {
          typeName = token
          r.next()
          break
        }

        if (Keywords.struct.has(token)) {
          const struct = r.readStruct()
          struct.comment = comment
          typeName = struct.name
          result.structs[struct.name] = struct
          break
        }

        qualifier[token] = true
        r.next()
        break
      }
      case GlslTokenKind.Identifier: {
        switch (r.peekKind()) {
          case GlslTokenKind.ParenOpen: {
            r.skipMethod()
            reset()
            break
          }
          case GlslTokenKind.BraceOpen: {
            const struct = r.readInterface()
            struct.comment = comment
            typeName = struct.name
            result.interfaces[struct.name] = struct
            if (struct.instance) {
              result.variables[struct.instance.name] = struct.instance
            }
            break
          }
          default: {
            const text = r.current.text
            r.next()

            if (!typeName) {
              typeName = text
            } else {
              result.variables[text] = {
                qualifier: qualifier,
                comment: comment,
                type: typeName,
                name: text,
                size: r.readArrayLength(),
              }
            }
          }
        }
        break
      }
      default: {
        r.next()
      }
    }
  }

  return result
}
