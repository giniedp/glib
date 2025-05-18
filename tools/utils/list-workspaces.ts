import * as cp from 'child_process'

export interface WorkspaceInfo {
  name: string
  path: string
}

export function listWorkspaces(): WorkspaceInfo[] {
  const json = cp.execSync('pnpm m ls --depth=-1 --json').toString()
  return JSON.parse(json.trim())
}
