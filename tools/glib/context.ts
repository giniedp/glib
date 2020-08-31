import * as glob from 'glob'
import * as path from 'path'
import { WorkspacesRootContext, WorkspacePackageContext } from '@tools/utils'

export class GlibBuildContext extends WorkspacesRootContext {

  public get glibPackages() {
    if (this.cashedPackages) {
      return this.cashedPackages
    }
    this.cashedPackages = glob
      .sync(this.packagesDir('*', 'package.json'))
      .map((it) => new GlibPackageContext(this, path.dirname(it)))
      .sort((a, b) => {
        if (b.glibReferences.indexOf(a.packageName) === -1) {
          return 1
        }
        if (a.glibReferences.indexOf(b.packageName) === -1) {
          return -1
        }
        return a.packageName.localeCompare(b.packageName)
      })
    return this.cashedPackages
  }

  private cashedPackages: GlibPackageContext[]

  public packagesDir(...subPath: string[]) {
    return this.subPath('packages', ...subPath)
  }

  public toolsDir(...subPath: string[]) {
    return this.subPath('tools', 'glib', ...subPath)
  }
}

export class GlibPackageContext extends WorkspacePackageContext {
  /**
   * Gets the package name as it appers in the package.json
   */
  public get packageName() {
    return `@gglib/${this.baseName}`
  }

  /**
   * Gets the UMD global name
   */
  public get globalName() {
    const prefix = 'Gglib'
    if (this.isRootModule) {
      return prefix
    }
    return (
      prefix +
      '.' +
      this.baseName
        .split(/[\/\\-]/)
        .map((it) => it[0].toUpperCase() + it.substr(1))
        .join('.')
    )
  }

  public get isRootModule() {
    return this.baseName === 'gglib'
  }

  public get tsconfigPath() {
    return this.subPath('tsconfig.json')
  }

  constructor(private context: GlibBuildContext, public readonly pkgDir: string) {
    super(context, pkgDir)
  }

  /**
   * Returns a path into the typescript output directory
   */
  public tscOutDir(...subPath: string[]) {
    return this.distDir(this.baseName, 'src', ...subPath)
  }

  /**
   * Returns a path into the rollup output directory
   */
  public rollupOutDir(...subPath: string[]) {
    return this.distDir('bundles', ...subPath)
  }
}

export default new GlibBuildContext(process.cwd())
