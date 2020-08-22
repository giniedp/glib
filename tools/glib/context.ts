import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'

export class GlibBuildContext {
  /**
   * Project root directory
   */
  public root = process.cwd()

  /**
   * Project source code directory where all packages are located
   */
  public packagesDir = path.join(this.root, 'packages')

  /**
   * The package json
   */
  public get rootPackageJson() {
    return require(path.join(this.root, 'package.json'))
  }

  public get glibPackages() {
    if (this.cashedPackages) {
      return this.cashedPackages
    }
    this.cashedPackages = glob
      .sync(path.join(this.packagesDir, '*', 'package.json'))
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
}

export class GlibPackageContext {
  get packageJsonPath() {
    return this.subPath('packahe.json')
  }

  /**
   * Gets the base name of the package (name of directory)
   */
  get baseName() {
    return path.basename(this.pkgDir)
  }

  /**
   * Gets the package name, as it should appear in package.json
   */
  get packageName() {
    return `@gglib/${this.baseName}`
  }

  /**
   * Gets the UMD global name
   */
  get globalName() {
    const prefix = 'Gglib'
    if (this.baseName === 'gglib') {
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

  /**
   * Resolves all references gglib packages
   */
  get glibReferences(): string[] {
    if (this.cachedReferences) {
      return this.cachedReferences
    }

    const result = new Set<string>()
    glob.sync(`${this.pkgDir}/**/*.ts`).forEach((file) => {
      fs.readFileSync(file)
        .toString()
        .match(/from ["']@gglib\/(\w+([\-/_]\w+)*)["']/g)
        ?.forEach((value) => {
          const m = value.match(/from ["'](@gglib\/\w+([\-/_]\w+)*)["']/)
          if (m && m[1] !== this.packageName) {
            result.add(m[1])
          }
        })
    })
    return this.cachedReferences = Array.from(result.values())
  }
  private cachedReferences: string[] = null

  constructor(private context: GlibBuildContext, public readonly pkgDir: string) {}

  /**
   * Gets a sub path of this package
   */
  public subPath(...sub: string[]) {
    return path.join(this.pkgDir, ...sub)
  }

  /**
   * Gets a sub path of the package dist directory
   */
  public distDir(...sub: string[]) {
    return this.subPath('dist', ...sub)
  }

  /**
   * Gets a sub path of the package src directory
   */
  public srcDir(...sub: string[]) {
    return this.subPath('src', ...sub)
  }
}

export default new GlibBuildContext()
