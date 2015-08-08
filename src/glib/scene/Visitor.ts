module Glib {

  export interface EntityVisitor {
    visit(entity:Entity);
  }

  export class EntityDebugVisitor {
    data = [];
    result = "";

    constructor(){

    }

    start(node:Entity) {
      this.data = [];
      node.acceptVisitor(this);
      this.result = this.data.join("\n");
    }

    visit(entity:Entity) {
      this.data.push(entity.debug());
      this.data.push("");
    }
  }
}
