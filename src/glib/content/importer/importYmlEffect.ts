module Glib.Content.Importer {

  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;

  var regInclude = /#include\s+<(.*)>/;
  var charNewLine = '\n';

  function isObject(item) {
    return item != null && typeof item === 'object';
  }

  function getLines(value:string):string[] {
    return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n');
  }

  function getProgram(content:any):string {
    // resolve the sourcecode of the effect program
    // must be a string or an array of strings
    var result:string = content.program;
    if (Array.isArray(content.program)) {
      result = content.program.join(charNewLine);
    }
    if (typeof result !== 'string' || !result) {
      throw 'Invalid effect file. "program" is missing.';
    }
    return result;
  }

  function getTechniques(content:any) {
    var result:any[] = content.technique || content.techniques;
    if (isObject(result) && result && !Array.isArray(result)) {
      result = [result];
    }
    if (!Array.isArray(result)) {
      throw 'Invalid effect file. "technique" is missing.';
    }
    return result;
  }

  function convertTechnique(source:string, technique, index) {

    // resolve effect pass definitions
    // must be a string or an array of strings
    var passes = technique.pass || technique.passes;
    if (isObject(passes) && passes) {
      passes = [passes];
    }
    if (!Array.isArray(passes)) {
      console.log(technique);
      throw 'Invalid effect file. "pass" is missing.';
    }

    // for each pass, generate a valid program definition that
    // contains a vertex and a fragment shader code
    passes = passes.map(function (pass, index) {
      return convertPass(source, pass, index);
    });

    return {
      name: technique.name || "TECHNIQUE" + index,
      passes: passes
    };
  }

  function convertPass(source:string, pass, index) {
    var vertexSource = source;
    if (typeof pass.vertexShader === 'string') {
      vertexSource = [source, pass.vertexShader].join(charNewLine);
    }

    var fragmentSource = source;
    if (typeof pass.fragmentShader === 'string') {
      fragmentSource = [source, pass.fragmentShader].join(charNewLine);
    }

    return {
      name: pass.name || "PASS" + index,
      vertexShader: vertexSource,
      fragmentShader: fragmentSource
    };
  }

  function processPass(pass, includeHandler) {
    // solve all preprocessor directives
    return Promise.all([
      preProcessShader(pass.vertexShader, {includeHandler: includeHandler}),
      preProcessShader(pass.fragmentShader, {includeHandler: includeHandler})
    ]).then(function (res) {
      var vSource = res[0];
      var fSource = res[1];

      // attribute declaration is only allowed in vertex shader
      fSource = fSource.replace(/attribute.*;/g, '');

      var inspect = Graphics.Shader.inspectProgram(vSource, fSource);
      utils.extend(pass, inspect);
      pass.vertexShader = vSource;
      pass.fragmentShader = fSource;
      return pass;
    });
  }

  function preProcessShader(source:string, options:any = {}):IPromise {
    var includeHandler = options.includeHandler;
    return Promise.all(getLines(source).map(function (line) {
      var includeMatch = line.match(regInclude);
      return includeMatch ? includeHandler(includeMatch[1]) : line;
    })).then(function (lines) {
      return lines.join(charNewLine);
    });
  }

  function createIncludeHandler(data:AssetData, manager:Manager, lookup:any):(p:string)=>IPromise {
    return function (path:string) {
      let url = utils.path.merge(data.url, path)
      if (!lookup[url]) lookup[url] = manager.download(url)
      return lookup[url]
    }
  }

  /**
   * Loads a shader effect from yaml file. A valid yaml file looks like this
   * 
   * ```yaml
   *
   * program:
   *   // shader code that is shared between vertex and fragment shader
   *   precision highp float;
   *   precision highp int;
   *   attribute vec3 aVertexPosition;
   *   attribute vec2 aTextureCoord;
   *   uniform mat4 uMVMatrix;
   *   uniform mat4 uPMatrix;
   *   varying vec2 vTextureCoord;
   *   uniform sampler2D uSampler;
   * pass:
   *   vertexShader:
   *     // vertex shader specific code
   *     void main(void) {
   *       gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
   *       vTextureCoord = aTextureCoord;
   *     }
   * pass:
   *   fragmentShader:
   *     // fragment shader specific code
   *     void main(void) {
   *       gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
   *     }
   * ```
   */
  export function importYmlEffect(data:AssetData, manager:Manager):IPromise {
    //debug("[ImportYmlEffect]", data);

    var content:any = Parser.YML.parse(data.content);

    // resolve the sourcecode of the effect program
    // must be a string or an array of strings
    var source:string = getProgram(content);

    // get the implemented techniques
    // must be an object or an array of objects
    var techniques:any[] = getTechniques(content);

    techniques = techniques.map(function (technique, index) {
      return convertTechnique(source, technique, index);
    });

    var includeLookup = {}
    var includeHandler = createIncludeHandler(data, manager, includeLookup);

    return Promise.all(techniques.map(function (technique:any) {
      return Promise.all(technique.passes.map(function (pass:any, index:number) {
        return processPass(pass, includeHandler).then(function (pass) {
          return technique.passes[index] = pass;
        });
      }));
    })).then(function (res) {
      return {techniques: techniques};
    });
  }

  Manager.addImporter('yml', 'Effect', importYmlEffect);
  Manager.addImporter('glfx', 'Effect', importYmlEffect);
}
