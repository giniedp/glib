import { Entity } from './Entity'

export interface Visitor<T> {
  visit(entity: T): void
}

export class DebugVisitor implements Visitor<Entity> {
  public data: any[] = []
  public result = ''

  public start(node: Entity) {
    this.data = []
    node.acceptVisitor(this)
    this.result = this.data.join('\n')
  }

  public visit(entity: Entity) {
    this.data.push(entity.debug())
    this.data.push('')
  }
}
