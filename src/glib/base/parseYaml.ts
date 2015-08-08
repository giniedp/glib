module Glib.utils {

  class Block {
    indent:string = '';
    lines:string[] = [];
    object:any = null;

    constructor(val?:string) {
      this.lines = [];
      this.object = null;
      if (typeof val === 'string') {
        this.lines.push(trim(val));
      } else {
        this.object = val;
      }
    }

    finalize() {
      if (this.object) {
        return this.object;
      } else {
        return trim(this.lines.join("\n"));
      }
    }
  }

  var flatten = function (result) {
    var item;
    Object.keys(result).forEach(function (key) {
      item = result[key];
      if (item instanceof Block) {
        result[key] = item.finalize();
      } else if (isObject(item)) {
        result[key] = flatten(item);
      }
    });
    return result;
  };

  // regular expression matching key value pairs separated by a colon
  // e.g.
  //     key: some value
  //     example: another value
  var regex = /^(\s*)(\w+)\s*:(.*)/;

  function parse(state, indent) {
    var line, match, result = {}, key, value, lineIndent, block: Block = null;

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
          return flatten(result);
        }
        else if (lineIndent > indent) {
          // indent in this line is greater than previous indent
          // begin recursion, open a new level
          // go one line up, it needs to be re-processed
          state.index -= 1;
          block.object = parse(state, lineIndent);
        }
        else {
          // indent in this line is same as previous indent
          // keep going in this level
          block = new Block();
          block.lines.push(trim(value));

          if (!result.hasOwnProperty(key)) {
            result[key] = block;
          } else {
            if (result[key] instanceof Block) {
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

    return flatten(result);
  }

  /**
   * Parses a yaml formatted string and returns a object.
   * This does not support the full yaml format, only the following limited subset
   * ```
   *
   *
   * ```
   * @method parseYaml
   * @param {String} source
   * @return {Object}
   */
  export function parseYaml(source:string):any {
    // replace tabs with space
    source = source.replace(/\t/i, ' ');
    var lines = getLines(source);

    // go to first non blank line
    var index = 0;
    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }

    if (index == lines.length) {
      return {}
    }

    // detect indentation of first line
    // that is our indentation reference value
    var indent = lines[index].match(/^(\s*)/)[1];

    // build initials state holding all ines and current line index
    var state = {lines: lines, index: index};

    return parse(state, indent);
  }
}
