import * as cp from 'child_process'

export interface YarnWorkspaceInfo {
  location: string,
  workspaceDependencies: string[],
  mismatchedWorkspaceDependencies: any[],
}
export interface YarnWorkspaceNamedInfo {
  name: string,
  location: string,
  workspaceDependencies: string[],
  mismatchedWorkspaceDependencies: any[],
}
export interface YarnWorkspacesInfo {
  [key: string]: YarnWorkspaceInfo
}

export function yarnWorkspaces(): YarnWorkspacesInfo {
  return JSON.parse(cp.execSync('yarn workspaces info --json').toString())
}
