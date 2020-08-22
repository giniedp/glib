import * as fs from 'fs'
import * as path from 'path'

import { yarnWorkspaces } from './tools/utils'
import { task, TaskFunction } from 'gulp'

const workspaces = yarnWorkspaces()
Object.keys(workspaces).forEach((wsName) => {
  const ws = workspaces[wsName]
  const tasksDir = path.resolve(path.join(ws.location, 'tasks'))
  if (fs.existsSync(tasksDir)) {
    const tasks = require(tasksDir) as { [k: string]: TaskFunction }
    Object.entries(tasks).forEach(([key, fn]) => {
      task(`${path.basename(ws.location)}:${key}`, fn)
    })
  }
})
