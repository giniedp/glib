module Glib.utils {

  var charNewLine = '\n';
  var regInclude = /#include\s+<(.*)>/;

  function handleIncludes(lines:string[], includes?:any) {
    includes = includes || {};
    var index, line, match, i, key, keys = Object.keys(includes);
    for (index = 0; index < lines.length; index++) {
      line = lines[index];
      match = line.match(regInclude);
      if (!match) {
        continue;
      }

      for (i = 0; i < keys.length; i += 1) {
        key = keys[i];
        if (endsWith(key, match[1])) {
          lines[index] = includes[key].content;
          break;
        }
      }
    }
  }

  /**
   * Reads a string and handles the following pre process directives
   * * \#include
   */
  export function preProcessShader(source:string, options?:{ includes?: any }):string {
    debug("preProcessShader", source, options);
    options = options || {};
    // get values for #include directives
    var includes = options.includes;
    var lines = getLines(source);
    handleIncludes(lines, includes);
    return lines.join(charNewLine);
  }
}
