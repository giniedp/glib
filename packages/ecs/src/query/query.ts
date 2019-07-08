import { Entity } from '../Entity'

export class Query {

  private input: Entity
  private output: Entity[]

  private batch = new Set<Entity>()
  private batchBack = new Set<Entity>()
  private name: string

  public index: number = 0
  public text: string

  private get canRead() {
    return this.index < this.text.length
  }

  private get char(): string {
    return this.text[this.index]
  }

  private next(): string {
    const i = this.index
    while (this.canRead && this.char !== '/') {
      this.index++
    }
    const result = this.text.substr(i, this.index - i)
    this.skip()
    return result
  }

  private skip() {
    while (this.char === '/' && this.canRead) {
      this.index++
    }
  }

  private collectSelf = (it: Entity) => {
    this.batchBack.add(it)
  }

  private collectParents = (it: Entity) => {
    if (it.parent) {
      this.batchBack.add(it.parent)
    }
  }

  private collectChildren = (it: Entity) => {
    it.children.forEach(this.collectSelf)
  }

  private collectDescendants = (it: Entity) => {
    it.children.forEach(this.collectDescendantsAndSelf)
  }

  private collectDescendantsAndSelf = (it: Entity) => {
    this.batchBack.add(it)
    it.children.forEach(this.collectDescendantsAndSelf)
  }

  private collectChildrenByName = (it: Entity) => {
    it.children.forEach(this.collectByName)
  }

  private collectByName = (it: Entity) => {
    if (it.name === this.name) {
      this.batchBack.add(it)
    }
  }

  private fillOutput = (it: Entity) => {
    this.output.push(it)
  }

  public findOne(entry: Entity, query: string): Entity | null {
    this.input = entry
    this.text = query
    this.run()
    if (this.batch.size) {
      return this.batch.entries().next().value[0]
    }
    return null
  }

  public findAll(entry: Entity, query: string, result: Entity[] = []): Entity[] {
    this.input = entry
    this.output = result
    this.text = query
    this.run()
    this.batch.forEach(this.fillOutput)
    return result
  }

  private run() {
    this.index = 0
    this.batch.clear()
    this.batchBack.clear()

    if (this.char === '/') {
      this.skip()
      this.batch.add(this.input.root)
    } else {
      this.batch.add(this.input)
    }

    while (this.canRead && this.batch.size) {
      const cmd = this.next()
      this.batchBack.clear()
      switch (cmd) {
        case '.':
          // self, no-op
          continue
        case '..':
          this.batch.forEach(this.collectParents)
          break
        case '*':
          this.batch.forEach(this.collectChildren)
          break
        case '**':
          this.batch.forEach(this.collectDescendantsAndSelf)
          break
        default:
          // by name
          this.name = cmd
          this.batch.forEach(this.collectChildrenByName)
          break
      }
      [this.batch, this.batchBack] = [this.batchBack, this.batch]
    }
  }
}
