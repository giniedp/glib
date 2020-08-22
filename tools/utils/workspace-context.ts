import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'globby'
import { glibReferences } from './glib-references'

export class WorkspaceBaseContext {

  /**
   * Directory of this context
   */
  public readonly dir: string

  /**
   * Gets the package json object
   *
   * @remarks
   * will be an empty object if a package json does not exist
   */
  public get packageJson() {
    if (this.cachedPackageJson) {
      return this.cachedPackageJson
    }
    if (fs.existsSync(this.packageJsonPath)) {
      this.cachedPackageJson = require(this.packageJsonPath)
    } else {
      this.cachedPackageJson = {}
    }
    return this.cachedPackageJson
  }
  private cachedPackageJson: any

  /**
   * Path to the package.json file
   */
  public get packageJsonPath(): string {
    return this.subPath('package.json')
  }

  /**
   * Gets the base name of the package directory
   */
  public get baseName(): string {
    return path.basename(this.dir)
  }

  /**
   * Gets the package name as it appers in the package.json
   */
  public get packageName() {
    return this.packageJson.name
  }

  constructor(dir: string) {
    this.dir = dir
  }

  /**
   * Gets a sub path of this package
   */
  public subPath(...sub: string[]): string {
    return path.join(this.dir, ...sub)
  }

  /**
   * Gets a sub path of the package `dist` directory
   */
  public distDir(...sub: string[]): string {
    return this.subPath('dist', ...sub)
  }

  /**
   * Gets a sub path of the package `src` directory
   */
  public srcDir(...sub: string[]): string {
    return this.subPath('src', ...sub)
  }
}

export class WorkspacesRootContext extends WorkspaceBaseContext {

  public get workspaces() {
    if (this.cachedWorkspaces) {
      return this.cachedWorkspaces
    }
    const workspaces: string[] = this.packageJson.workspaces
    if (!workspaces) {
      throw new Error(`no workspaces declared in ${this.packageJsonPath}`)
    }
    this.cachedWorkspaces = glob
      .sync(workspaces.map((it) => this.subPath(it, "package.json")))
      .map((it) => new WorkspacePackageContext(this, path.dirname(it)))

    return this.cachedWorkspaces
  }

  private cachedWorkspaces: WorkspacePackageContext[]

  constructor(rootDir: string) {
    super(rootDir)
  }
}

export class WorkspacePackageContext extends WorkspaceBaseContext {
  /**
   * Resolves all references gglib packages
   */
  public get glibReferences(): string[] {
    if (!this.cachedReferences) {
      this.cachedReferences = glibReferences(this.dir)
    }
    return this.cachedReferences
  }
  private cachedReferences: string[] = null

  constructor(public readonly root: WorkspacesRootContext, dir: string) {
    super(dir)
  }
}
