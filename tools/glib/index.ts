import { program } from 'commander'
import { project } from './context'
import * as tasks from './tasks'

for (const task in tasks) {
  const taskFn = tasks[task]
  program.command(task).action(taskFn)
}

program.command('tasks').action(() => {
  console.log('Tasks:')
  for (const task in tasks) {
    console.log(task)
  }
  console.log('Packages:')
  for (const pkg of project.glibPackages) {
    console.log(pkg.tsconfigPath)
  }
})

program.parse(process.argv)
