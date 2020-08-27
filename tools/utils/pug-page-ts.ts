import * as fs from 'fs'
import * as path from 'path'
import { Transform, TransformOptions } from 'stream'
import * as ts from 'typescript'
import vinyl from 'vinyl'
import glib from '../glib/context'

export function transform(options: TransformOptions) {
  return new Transform({
    objectMode: true,
    ...options,
  })
}

export function pugPageTS() {
  return new Transform({
    objectMode: true,
    transform: function (file: any, encoding, cb) {
      if (path.extname(file.path) === '.ts') {
        this.push(
          new vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(path.dirname(file.path), path.basename(file.path, '.ts')) + '.js',
            contents: Buffer.from(transpileTsFile(file.path)),
          }),
        )
      }
      cb(null, file)
    },
    flush: (cb) => cb(null, null),
  })
}

function transpileTsFile(file: string) {
  const out = ts.transpileModule(fs.readFileSync(file).toString(), {
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
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  })

  if (out.diagnostics) {
    for (const it of out.diagnostics) {
      if (typeof it.messageText === 'string') {
        console.warn(it.messageText)
      } else if (it.messageText) {
        console.warn(JSON.stringify(it.messageText, null, 2))
        // let chain = it.messageText
        // while (chain) {
        //   console.warn(chain.messageText)
        //   chain = chain.next
        // }
      }
    }
  }

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
