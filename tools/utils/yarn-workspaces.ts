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
  let json = cp.execSync('yarn workspaces info --json').toString()
  // TODO: remove hotfix
  // when executed under 'concurrently' the output has a prefix making the json invalid
  json = json.substr(json.indexOf("{"))
  return JSON.parse(json.trim())
}
