import * as fs from 'fs'
import * as ts from 'typescript'
import project from '../../project'

export default function transpileExample(file: string) {
  const out = ts.transpileModule(fs.readFileSync(file).toString(), {
    transformers: {
      before: [(context) => {
        const visit: ts.Visitor = (node) => {
          if (ts.isImportDeclaration(node) &&
              node.importClause &&
              node.importClause.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings)) {

            if (ts.isNamedImports(node.importClause.namedBindings)) {
              const module = node.moduleSpecifier.getText().replace(/['"]/gi, '')
              const gglibPackage = project.packages.find((pkg) => project.pkgName(pkg) === module)
              if (gglibPackage) {
                return ts.createVariableStatement([], ts.createVariableDeclarationList([
                  ts.createVariableDeclaration(
                    ts.createObjectBindingPattern([
                      ...node.importClause.namedBindings.elements.map((el) => {
                        return ts.createBindingElement(undefined, el.propertyName, el.name)
                      }),
                    ]),
                    undefined,
                    ts.createIdentifier(project.pkgGlobalName(gglibPackage)),
                  ),
                ], ts.NodeFlags.Const))
              }
            }
          }
          return ts.visitEachChild(node, (child) => visit(child), context)
        }
        return {
          transformBundle: (bundle) => bundle,
          transformSourceFile: (sourceFile) => ts.visitNode(sourceFile, visit),
        }
      }],
    },
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  })

  if (out.diagnostics) {
    for (const it of out.diagnostics) {
      if (Array.isArray(it.messageText)) {
        it.messageText.forEach((msg) => console.warn(msg.messageText)  )
      } else {
        console.warn(it.messageText)
      }
    }
  }

  // TODO: remove replacer
  return out.outputText.replace(/^import.*from.*;$/gm, '').trim()
}
