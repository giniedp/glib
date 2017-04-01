module Glib.Content.Parser {

  function trim(value:string):string {
    return value.replace(/(^\s*|\s*$)/g, '');
  }

  function getLines(value:string):string[] {
    return value.replace(/\r/g, '\n').split('\n');
  }

  function chompLeft(value:string, prefix:string):string {
    if (value.indexOf(prefix) === 0) {
      return value.slice(prefix.length);
    } else {
      return value;
    }
  }

  function isObject(value:any): boolean {
    return value !== null && typeof value === 'object';
  }

  // regular expression matching key value pairs separated by a colon
  // e.g.
  //     key: some value
  //     example: another value
  let regex = /^(\s*)(\w+)\s*:\s*\|?(.*)/;

  class Node {
    indent:string = '';
    lines:string[] = [];
    object:any = null;

    constructor(val?:string) {
      this.lines = [];
      this.object = null;
      if (typeof val === 'string') {
        this.lines.push(Glib.utils.trim(val));
      } else {
        this.object = val;
      }
    }

    get result() {
      if (this.object) {
        return this.object;
      } else {
        return Glib.utils.trim(this.lines.join("\n"));
      }
    }
  }

  export let YML = {
    _peel: function (tree) {
      Object.keys(tree).forEach(function (key) {
        let item = tree[key];
        if (item instanceof Node) {
          tree[key] = item.result;
        } else if (isObject(item)) {
          tree[key] = YML._peel(item);
        }
      });
      return tree;
    },

    _parse: function (state, indent) {
      let line, match, result = {}, key, value, lineIndent, block:Node = null;

      while (state.index < state.lines.length) {
        // grab next line and update state
        line = state.lines[state.index];
        state.index += 1;

        match = line.match(regex);
        if (match) {
          // we've got a key value pair
          // e.g.
          //  key: value
          lineIndent = match[1];
          key = match[2];
          value = match[3];

          if (lineIndent < indent) {
            // indent in this line is lesser than previous indent
            // end recursion, step one level back
            // go one line up, it needs to be re-processed
            state.index -= 1;
            return YML._peel(result);
          }
          else if (lineIndent > indent) {
            // indent in this line is greater than previous indent
            // begin recursion, open a new level
            // go one line up, it needs to be re-processed
            state.index -= 1;
            block.object = YML._parse(state, lineIndent);
          }
          else {
            // indent in this line is same as previous indent
            // keep going in this level
            block = new Node();
            block.lines.push(trim(value));

            if (!result.hasOwnProperty(key)) {
              result[key] = block;
            } else {
              if (result[key] instanceof Node) {
                result[key] = [result[key]];
              }
              result[key].push(block);
            }
          }
        } else {
          // no key value pair, just a plain line
          // skip lines, when no block has been opened
          // this is usually the file header
          if (block) {
            if (block.indent == null) {
              block.indent = line.match(/^(\s*)/)[1];
            }
            block.lines.push(chompLeft(line, block.indent));
          }

        }
      }

      return YML._peel(result);
    },

    /**
     * Parses a yaml formatted string and returns an object. This supports only a very limited subset of YAML.
     * Basically it reads the yaml tree and collects the values. Values are kept as strings. There is no
     * conversion to numbers or booleans or any other data type. Multi line string values are supported.
     * If multiple keys with same name occur, all the values are collected in an array for that key.
     *
     * @method parse
     * @param {String} content
     * @return {Object}
     */
    parse(content:string):any {
      // replace tabs with space
      content = content.replace(/\t/i, ' ');
      let lines = getLines(content);

      // skip blank lines
      let index = 0;
      while (index < lines.length && !lines[index].trim()) {
        index += 1;
      }

      // do nothing. content seems to be empty
      if (index == lines.length) {
        return {}
      }

      // detect starting indentation depth
      let indent = lines[index].match(/^(\s*)/)[1];

      // build initial state holding all lines and current line index
      let state = {lines: lines, index: index};

      return YML._parse(state, indent);
    }
  };
}
