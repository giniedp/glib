module Glib.Content.Pipeline {

  importer('.json', 'Effect', function(context:Context):IPromise {
    context.intermediate = Parser.JSON.parse(context.raw.content)
    return context.manager.process(context)
  })

  processor('Effect', function(context:Context):IPromise {
    context.result = new Graphics.ShaderEffect(context.manager.device, context.intermediate)
    return Promise.resolve(context)
  })

  preprocessor('Effect', function(context:Context):IPromise {
    
    let json:any = context.intermediate

    // get the shared source code (if any)
    let sharedCode:string = getProgram(json)
    // get technique specifications
    let techniques:any[] = getTechniques(json)

    // 
    techniques.forEach(function (technique, index) {
      convertTechnique(sharedCode, technique, index)
    })

    // the include hanlder to solve #include<> directives
    if (!context.options.includeHandler) {
      context.options.includeHandler = createIncludeHandler(context)
    }

    return Promise.all(techniques.map(function (technique:any) {
      return Promise.all(technique.passes.map(function (pass:any, index: number) {
        return processPass(pass, context)
      }))
    })).then(function () {
      // delete processed data
      delete json.program
      delete json.programs
      delete json.technique
      // attach processed data
      json.techniques = techniques
    })
  })

  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;

  let regInclude = /#include\s+<(.*)>/;
  let charNewLine = '\n';

  function isObject(item) {
    return item != null && typeof item === 'object';
  }

  function getLines(value:string):string[] {
    return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n');
  }

  function getProgram(content:any):string {
    if (!content.program) return ''

    let result = content.program
    if (Array.isArray(result)) {
      result = result.join(charNewLine)
    }
    if (typeof result !== 'string') {
      throw 'Invalid effect file. "program" property is not a string.'
    }
    return result
  }

  function getTechniques(content:any) {
    let result:any[] = content.technique || content.techniques
    if (!result) {
      throw 'Invalid effect file. "techniques" property is missing.'
    }
    if (!Array.isArray(result)) {
      result = [result]
    }
    return result
  }

  function convertTechnique(source:string, technique, index) {
    let passes = technique.pass || technique.passes
    if (isObject(passes) && passes) {
      passes = [passes]
    }
    if (!Array.isArray(passes)) {
      throw 'Invalid effect file. "passes" property in technique is missing.'
    }
    delete technique.pass
    technique.name = technique.name || "TECHNIQUE" + index
    technique.passes = passes
    technique.passes.forEach(function(pass, index) {
      convertPass(source, pass, index)
    })
    return technique
  }

  function convertPass(source:string, pass, index) {
    if (pass.program) return pass

    let vertexSource = pass.vertexShader || ''
    let fragmentSource = pass.fragmentShader || ''
    if (source && typeof vertexSource === 'string') {
      vertexSource = ['#define VERTEX_SHADER', source, vertexSource].join(charNewLine)
    }
    if (source && typeof fragmentSource === 'string') {
      fragmentSource = ['#define FRAGMENT_SHADER',source, fragmentSource].join(charNewLine)
    }
    pass.name = pass.name || "PASS" + index
    pass.program = {
      vertexShader: vertexSource,
      fragmentShader: fragmentSource
    }
    delete pass.vertexShader
    delete pass.fragmentShader
    return pass
  }

  function processPass(pass, context:Context) {
    
    // solve all preprocessor directives
    return Promise.all([
      processShader(pass.program.vertexShader, context),
      processShader(pass.program.fragmentShader, context)
    ]).then(function (res) {
      let vSource = res[0];
      let fSource = res[1];

      // attribute declaration is only allowed in vertex shader
      fSource = fSource.replace(/attribute.*;/g, '')

      pass.program.vertexShader = vSource
      pass.program.fragmentShader = fSource
      return pass
    });
  }

  function processShader(source:string, context:Context):IPromise {
    return Promise.all(getLines(source).map(function (line) {
      let includeMatch = line.match(regInclude)
      return includeMatch ? context.options.includeHandler(includeMatch[1]) : line
    })).then(function (lines) {
      return lines.join(charNewLine)
    })
  }

  function createIncludeHandler(context:Context):(p:string)=>IPromise {
    return function (path:string) {
      let url = utils.path.merge(context.path, path)
      let cache = context.options.includeCache || {}
      context.options.includeCache = cache
      return cache[url] = cache[url] ? cache[url] : context.manager.download(url).then(function(res){
        return res.content;
      })
    }
  }

}
