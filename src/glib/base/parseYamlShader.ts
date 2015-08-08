module Glib.utils {

  var charNewLine = '\n';

  /**
   * Loads a shader effect from yaml file. A valid yaml file looks like this
   * ``` yaml
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
   * @method loadYamlShader
   * @param {string} source The source file
   * @param {object} [options]
   */
  export function parseYamlShader(source:string, options?:any):{ techniques: { name: string, passes: any[]}[] } {

    options = options || {};
    var data = parseYaml(source);

    // resolve the sourcecode of the effect program
    // must be a string or an array of strings
    var pSource = data.program;
    if (isArray(pSource)) {
      pSource = pSource.join(charNewLine);
    }
    if (!isString(pSource) || !pSource) {
      throw 'Invalid effect file. "program" is missing.';
    }

    // get the implemented techniques
    // must be an object or an array of objects
    var techniques = data.technique;
    if (isObject(techniques) && techniques) {
      techniques = [techniques];
    }
    if (!isArray(techniques)) {
      throw 'Invalid effect file. "technique" is missing.';
    }

    var opts, passes, vSource, fSource, program, result = [];
    techniques.forEach(function (technique:any, index) {
      // resolve effect pass definitions
      // must be a string or an array of strings
      passes = technique.pass;
      if (isObject(passes) && passes) {
        passes = [passes];
      }
      if (!isArray(passes)) {
        throw 'Invalid effect file. "pass" is missing.';
      }

      var programs = [];

      // for each pass, generate a valid program definition that
      // contains a vertex and a fragment shader code
      passes.forEach(function (pass:any, index) {
        opts = extend({}, options);

        vSource = pSource;
        if (isString(pass.vertexShader)) {
          vSource = [pSource, pass.vertexShader].join(charNewLine);
        }

        fSource = pSource;
        if (isString(pass.fragmentShader)) {
          fSource = [pSource, pass.fragmentShader].join(charNewLine);
        }

        // solve all preprocessor directives
        vSource = preProcessShader(vSource, opts);
        fSource = preProcessShader(fSource, opts);

        // attribute declaration is only allowed in vertex shader
        fSource = fSource.replace(/attribute.*;/g, '');

        // create program definition
        program = {
          editor: data.property || [],
          vertexShader: vSource,
          fragmentShader: fSource
        };

        // inspect the source code for uniforms attribute definitions
        // add the definitions to the program object, so the engine can
        // use them for binding purpose
        var vInspects = inspectShader(vSource);
        var fInspects = inspectShader(fSource);
        program.attributes = extend({}, vInspects.attributes, fInspects.attributes);
        program.uniforms = extend({}, vInspects.uniforms, fInspects.uniforms);
        program.varying = extend({}, vInspects.varying, fInspects.varying);
        program.name = pass.name || ("PASS" + index);
        programs.push(program);
      });

      result.push({
        name: technique.name || ("TECHNIQUE" + index),
        passes: programs
      });
    });

    return {
      techniques: result
    };
  }
}