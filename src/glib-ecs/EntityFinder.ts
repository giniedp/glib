module Glib {

  import log = Glib.utils.log;

  function collectItem(item, collection) {
    if (item && collection.indexOf(item) < 0) {
      collection.push(item);
    }
  }

  function collectChildren(node, collection) {
    for (var child of node.children) {
      collectItem(child, collection);
    }
  }

  function collectChildrenAndSelf(node, collection) {
    collectItem(node, collection);
    for (var child of node.children) {
      collectItem(child, collection);
    }
  }

  function collectDescendants(node, result) {
    node.descendants(false, result);
  }

  function collectDescendantsAndSelf(node, result) {
    node.descendants(true, result);
  }

  function collectChildrenByName(node, name, result) {
    for (var child of node.children) {
      if (child.name === name) {
        result.push(child);
      }
    }
  }

  function collectParent(node, collection) {
    collectItem(node.parent, collection);
  }

  function collectServices(node, collection) {
    for (var component of node.components) {
      if (component.service) {
        collectItem(component, collection);
      }
    }
  }

  function collectServicesByName(node, name, collection) {
    collectItem(node.s[name], collection);
  }

  function collectComponents(node, collection) {
    for (var component of node.components) {
      collectItem(component, collection);
    }
  }

  function collectComponentsByName(node, name, collection) {
    for (var component of node.components) {
      if (component.name === name) {
        collectItem(component, collection);
      }
    }
  }

  function onInvalidExpression(state:EntityFinder) {
    throw new Error("Invalid expression");
  }
  
  var expressions = {
    service: /^::/,
    component: /^:/,

    absolute: /^\//,
    relative: /^\.\/|(self::)/,
    parent: /^\.\.\//,
    children: /^\*|(child::\*)|(child::)/,
    descendants: /^\/\//,
    named: /^[a-zA-Z0-9]+(\|[a-zA-Z0-9]+)*/
  };

  interface ConsumeFunction {
    (state:EntityFinder): void
  }

  interface Consumer {
    service: ConsumeFunction
    component: ConsumeFunction

    absolute: ConsumeFunction
    relative: ConsumeFunction
    parent: ConsumeFunction
    children: ConsumeFunction
    descendants: ConsumeFunction
    named: ConsumeFunction
  }


  export class EntityFinder {
    query:string;
    match:string;
    context:any[] = [];
    collection:any[] = [];
    start:Entity;
    parser;

    swapContext() {
      var tmp = this.context;
      this.context = this.collection;
      this.collection = tmp;
      this.collection.length = 0;
    }

    find(query, node) {
      this.query = query;
      this.match = null;
      this.context = [];
      this.collection = [];
      this.start = node;
      this.parser = startConsumer;
      var reg = expressions;

      var order = ['absolute', 'relative', 'parent', 'children', 'descendants', 'named', 'service', 'component'];
      while(query) {
        var consumed = false;
        for (var directive of order) {
          var exp = reg[directive];
          var match = query.match(exp);
          if (match) {
            query = query.replace(exp, '');
            this.match = match[0];
            this.parser[directive](this);
            consumed = true;
          }
        }
        this.swapContext();
        if (!consumed) {
          onInvalidExpression(this);
          return this.context;
        }
      }
      return this.context;
    }
  }

  var startConsumer:Consumer = {
    service: onInvalidExpression,
    component: onInvalidExpression,
    absolute: function (state:EntityFinder) {
      collectItem(state.start.root, state.context);
      state.parser = nodeConsumer;
    },
    relative: function (state:EntityFinder) {
      collectItem(state.start, state.context);
      state.parser = nodeConsumer;
    },
    parent: function (state:EntityFinder) {
      for (var node of state.context) {
        collectParent(node, state.collection);
      }
    },
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: onInvalidExpression,
  };

  var nodeConsumer:Consumer = {
    service: function (state:EntityFinder) {
      state.parser = serviceConsumer;
    },
    component: function (state:EntityFinder) {
      state.parser = componentConsumer;
    },
    absolute: function (state:EntityFinder) {
      for (var node of state.context) {
        collectItem(node, state.collection);
      }
    },
    relative: onInvalidExpression,
    parent: function (state:EntityFinder) {
      collectItem(state.start.parent, state.context);
    },
    children: function (state:EntityFinder) {
      for (var node of state.context) {
        collectChildren(node, state.collection);
      }
    },
    descendants: function (state:EntityFinder) {
      for (var node of state.context) {
        collectDescendants(node, state.collection);
      }
    },
    named: function(state:EntityFinder){
      for (var node of state.context) {
        collectChildrenByName(node, state.match, state.collection);
      }
    }
  };

  var componentConsumer:Consumer = {
    service: onInvalidExpression,
    component: onInvalidExpression,
    absolute: onInvalidExpression,
    relative: onInvalidExpression,
    parent: onInvalidExpression,
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: function(state:EntityFinder){
      for (var node of state.context) {
        collectComponentsByName(node, state.match, state.collection);
      }
    }
  };

  var serviceConsumer:Consumer = {
    service: onInvalidExpression,
    component: onInvalidExpression,
    absolute: onInvalidExpression,
    relative: onInvalidExpression,
    parent: onInvalidExpression,
    children: onInvalidExpression,
    descendants: onInvalidExpression,
    named: function(state:EntityFinder){
      for (var node of state.context) {
        collectServicesByName(node, state.match, state.collection);
      }
    }
  };

}
