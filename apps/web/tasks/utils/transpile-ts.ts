import * as fs from 'fs'
import * as ts from 'typescript'
import glib from 'glib/context'
import { Transform } from 'stream'
import { default as File } from 'vinyl'
import { replaceExtName } from '@tools/utils'

export function gulpTranspileTs() {
  return new Transform({
    objectMode: true,
    transform: (file, encoding, cb) => {
      cb(null, new File({
        cwd: file.cwd,
        base: file.base,
        path: replaceExtName(file.path, ".js"),
        contents: Buffer.from(transpileTs(file.path)),
      }))
    },
    flush: (cb) => cb(),
  })
}

export function transpileTs(file: string, content?: string, compilerOptions?: ts.CompilerOptions) {
  content = content || fs.readFileSync(file).toString()
  const out = ts.transpileModule(content, {
    reportDiagnostics: true,
    transformers: {
      before: [
        (context) => {
          const visit: ts.Visitor = (node) => {
            return transformTsNode(node) || ts.visitEachChild(node, (child) => visit(child), context)
          }
          return {
            transformBundle: (bundle) => bundle,
            transformSourceFile: (sourceFile) => ts.visitNode(sourceFile, visit),
          }
        },
      ],
    },
    compilerOptions: compilerOptions || {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  })

  // TODO: remove replacer
  return out.outputText
    .replace(/^import.*from.*;$/gm, '')
    .replace(/^export {};$/gm, '')
    .trim()
}

function transformTsNode(node: ts.Node) {
  if (!ts.isImportDeclaration(node)) return
  if (!node.importClause) return
  if (!node.importClause.namedBindings) return
  if (!ts.isNamedImports(node.importClause.namedBindings)) return

  const module = node.moduleSpecifier.getText().replace(/['"]/gi, '')
  const gglibPackage = glib.glibPackages.find((pkg) => pkg.packageName === module)
  if (!gglibPackage) return

  return ts.createVariableStatement(
    [],
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          ts.createObjectBindingPattern([
            ...node.importClause.namedBindings.elements.map((el) => {
              return ts.createBindingElement(undefined, el.propertyName, el.name)
            }),
          ]),
          undefined,
          ts.createIdentifier(gglibPackage.globalName),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  )
}
