module Glib {

  export interface EntityVisitor {
    visit(entity: Entity)
  }

  export class EntityDebugVisitor {
    public data = []
    public result = ''

    constructor() {
      //
    }

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
}
