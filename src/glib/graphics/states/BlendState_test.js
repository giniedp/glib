(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.BlendState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      colorBlendFunction: Graphics.BlendFunction.Add,
      alphaBlendFunction: Graphics.BlendFunction.Subtract,

      colorSrcBlend: Graphics.Blend.SrcColor,
      alphaSrcBlend: Graphics.Blend.SrcAlpha,
      colorDstBlend: Graphics.Blend.DstColor,
      alphaDstBlend: Graphics.Blend.DstAlpha,

      constantR: 1,
      constantG: 2,
      constantB: 3,
      constantA: 4,
      enabled: true
    };
    var paramsB = {
      colorBlendFunction: Graphics.BlendFunction.Subtract,
      alphaBlendFunction: Graphics.BlendFunction.Add,

      colorSrcBlend: Graphics.Blend.DstColor,
      alphaSrcBlend: Graphics.Blend.DstAlpha,
      colorDstBlend: Graphics.Blend.SrcColor,
      alphaDstBlend: Graphics.Blend.SrcAlpha,

      constantR: 4,
      constantG: 3,
      constantB: 2,
      constantA: 1,
      enabled: false
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.BlendState(device, paramsA);
      stateB = new Graphics.BlendState(device, stateB);
      stateC = new Graphics.BlendState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.colorBlendFunction).toBe(paramsA.colorBlendFunction);
        expect(stateC.alphaBlendFunction).toBe(paramsA.alphaBlendFunction);

        expect(stateC.colorSrcBlend).toBe(paramsA.colorSrcBlend);
        expect(stateC.alphaSrcBlend).toBe(paramsA.alphaSrcBlend);
        expect(stateC.colorDstBlend).toBe(paramsA.colorDstBlend);
        expect(stateC.alphaDstBlend).toBe(paramsA.alphaDstBlend);

        expect(stateC.constantR).toBe(paramsA.constantR);
        expect(stateC.constantG).toBe(paramsA.constantG);
        expect(stateC.constantB).toBe(paramsA.constantB);
        expect(stateC.constantA).toBe(paramsA.constantA);

        expect(stateC.enabled).toBe(paramsA.enabled);

        expect(stateC.hasChanged).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.colorBlendFunction).toBe(paramsB.colorBlendFunction);
        expect(stateC.alphaBlendFunction).toBe(paramsB.alphaBlendFunction);

        expect(stateC.colorSrcBlend).toBe(paramsB.colorSrcBlend);
        expect(stateC.alphaSrcBlend).toBe(paramsB.alphaSrcBlend);
        expect(stateC.colorDstBlend).toBe(paramsB.colorDstBlend);
        expect(stateC.alphaDstBlend).toBe(paramsB.alphaDstBlend);

        expect(stateC.constantR).toBe(paramsB.constantR);
        expect(stateC.constantG).toBe(paramsB.constantG);
        expect(stateC.constantB).toBe(paramsB.constantB);
        expect(stateC.constantA).toBe(paramsB.constantA);

        expect(stateC.enabled).toBe(paramsB.enabled);

        expect(stateC.hasChanged).toBe(false);
      });
    });

    keys.forEach(function(key){
      describe(key, function() {
        it ("is a getter", function(){
          expect(stateA[key]).toBe(paramsA[key]);
        });
        it ("is a setter", function(){
          stateA[key] = paramsB[key];
          expect(stateA[key]).toBe(paramsB[key]);
        });
        it ("marks as changed", function(){
          expect(stateC.hasChanged).toBe(false);
          stateC[key] = paramsB[key];
          expect(stateC.hasChanged).toBe(true);
        });
      });
    });
  });
}());
