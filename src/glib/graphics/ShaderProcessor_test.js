(function(){

  describe("Glib.Graphics.ShaderInspector", function() {
    var inspector = Glib.Graphics.ShaderInspector;

    describe("define", function() {
      it("inspect #define", function () {
        source = `
          #define DEFINED
          #define DEFINED1 value
          #define DEFINED2 some value
        `
        var result = inspector.preprocess(source)
        expect(result.DEFINED).toEqual(void 0);
        expect(result.DEFINED1).toEqual('value');
        expect(result.DEFINED2).toEqual('some value');
      });

      it("inspect #undef", function () {
        source = `
          #define DEFINED1 value1
          #define DEFINED2 value2

          #undef DEFINED
          #undef DEFINED1
        `
        var result = inspector.preprocess(source)

        expect('DEFINED' in result).toEqual(false);
        expect('DEFINED1' in result).toEqual(false);
        expect('DEFINED2' in result).toEqual(true);
      });

      it("inspect #ifdef", function () {
        source = `
          #define AAA

          #ifdef AAA
            #define BBB
          #endif

          #ifdef CCC
            #define DDD
          #endif
        `
        var result = inspector.preprocess(source)

        expect('AAA' in result).toEqual(true);
        expect('BBB' in result).toEqual(true);
        expect('CCC' in result).toEqual(false);
        expect('DDD' in result).toEqual(false);
      });

      it("inspect #ifndef", function () {
        source = `
          #define AAA

          #ifndef AAA
            #define BBB
          #endif

          #ifndef CCC
            #define DDD
          #endif
        `
        var result = inspector.preprocess(source)

        expect('AAA' in result).toEqual(true);
        expect('BBB' in result).toEqual(false);
        expect('CCC' in result).toEqual(false);
        expect('DDD' in result).toEqual(true);
      });

      it("inspect #if", function () {
        source = `
          #define AAA true
          #define BBB false

          #if AAA
            #define CCC
          #endif

          #if BBB
            #define DDD
          #endif
        `
        var result = inspector.preprocess(source)

        expect(result.AAA).toEqual('true');
        expect(result.BBB).toEqual('false');
        expect('CCC' in result).toEqual(true);
        expect('DDD' in result).toEqual(false);
      });

      it("inspect #if #elsif", function () {
        source = `
          #define AAA false
          #define BBB true
          #define CCC true

          #if AAA
            #define DDD
          #elif BBB
            #define EEE
          #elif CCC
            #define FFF
          #else
            #define GGG
          #endif
        `
        var result = inspector.preprocess(source)
        
        expect(result.AAA).toEqual('false');
        expect(result.BBB).toEqual('true');
        expect(result.CCC).toEqual('true');
        expect('DDD' in result).toEqual(false);
        expect('EEE' in result).toEqual(true);
        expect('FFF' in result).toEqual(false);
        expect('GGG' in result).toEqual(false);
      });

      it ("evaluate if", function() {
        source = `

          #define AAA false
          #define BBB true

          #if defined(AAA) && defined(BBB)
            #define CCC
          #endif
        `
        var result = inspector.preprocess(source)
        expect(result.AAA).toEqual('false');
        expect(result.BBB).toEqual('true');
        expect(result.CCC).toEqual(undefined);
        expect('CCC' in result).toEqual(true);
      })
    });

  });
}());
