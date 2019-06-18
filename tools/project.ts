import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'

const peerCache = new Map<string, string[]>()
let packages: string[] = null

class Project {

  /**
   * Project root directory
   */
  public root = process.cwd()

  /**
   * The compilation destination directory
   */
  public dist = path.join(this.root, 'dist')

  /**
   * Project source code directory where all packages are located
   */
  public pkgSrc = path.join(this.root, 'packages')

  /**
   * The compilation directory for the packages
   */
  public pkgDist = path.join(this.dist, 'packages')

  /**
   * Project source code directory where all examples are located
   */
  public sampleSrc = path.join(this.root, 'examples')

  /**
   * The compilation directory for all examples
   */
  public sampleDist = path.join(this.dist, 'examples')

  /**
   * The package json
   */
  public get packageJson() {
    return require('./../package.json')
  }
  /**
   * Lists all package base names
   */
  public get packages(): string[] {
    if (!packages) {
      packages = glob
      .sync(path.join(this.pkgSrc, '*'))
      .filter((it) => it.indexOf('.') === -1)
      .map((it) => path.basename(it))
      .sort((a, b) => {
        const nameOfA = this.pkgName(a)
        const peersOfA = this.pkgPeerDependencies(a)

        const nameOfB = this.pkgName(b)
        const peersOfB = this.pkgPeerDependencies(b)

        if (peersOfB.indexOf(nameOfA) === -1) {
          return 1
        }
        if (peersOfA.indexOf(nameOfB) === -1) {
          return -1
        }
        return a.localeCompare(b)
      })
    }
    return [...packages]
  }

  /**
   * Gets a package name as it will appear in package.json
   */
  public pkgName(pkg: string) {
    return `@gglib/${pkg}`
  }

  /**
   * Gets the path to the package source directory
   */
  public pkgSrcDir(pkg: string, ...sub: string[]) {
    return path.join(this.pkgSrc, pkg, ...sub)
  }

  /**
   * Gets the path to the package destination directory where it is compiled to
   */
  public pkgDstDir(pkg: string, ...sub: string[]) {
    return path.join(this.dist, 'packages', pkg, ...sub)
  }

  /**
   * Lists all peer dependencies of a package
   */
  public pkgPeerDependencies(pkg: string) {
    if (peerCache.has(pkg)) {
      return [...peerCache.get(pkg)]
    }

    const src = path.join(this.pkgSrc, pkg)
    const result = []
    glob.sync(`${src}/**/*.ts`).forEach((file) => {
      const match = fs.readFileSync(file).toString().match(/from '@gglib\/(\w+)'/g);

      (match || []).forEach((value) => {
        const m = value.match(/from '@gglib\/(\w+)'/)
        if (!m || !m[1]) {
          return
        }
        const name = m[1].split('/').shift()
        if (result.indexOf(name) === -1 && name !== path.basename(src)) {
          result.push(name)
        }
      })
    })
    peerCache.set(pkg, result.map((it) => `@gglib/${it}`))
    return [...peerCache.get(pkg)]
  }

  /**
   * Gets a global package name as it will be used by rollup umd
   */
  public pkgGlobalName(pkg: string) {
    return 'Gglib' + (pkg === 'gglib' ? '' : '.' + pkg[0].toUpperCase() + pkg.substr(1))
  }
}

export default new Project()
