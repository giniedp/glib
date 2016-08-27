(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.StencilState", function() {

    var device = new Graphics.Device({ contextAttributes: { depth: true, stencil: true} });
    var stateA, stateB, stateC;
    var paramsA = {
      enable: false,

      // front face stencil
      stencilFunction: Graphics.CompareFunction.Never,
      stencilReference: 1,
      stencilMask: 0xffffff00,

      stencilFail: Graphics.StencilOperation.Decrement,
      stencilDepthFail: Graphics.StencilOperation.Increment,
      stencilDepthPass: Graphics.StencilOperation.Invert,

      // back face stencil
      stencilBackFunction: Graphics.CompareFunction.Never,
      stencilBackReference: 2,
      stencilBackMask: 0x00ffffff,

      stencilBackFail: Graphics.StencilOperation.Keep,
      stencilBackDepthFail: Graphics.StencilOperation.Replace,
      stencilBackDepthPass: Graphics.StencilOperation.Zero
    };
    var paramsB = {
      enable: true,

      // front face stencil
      stencilFunction: Graphics.CompareFunction.Always,
      stencilReference: 3,
      stencilMask: 0xffff00ff,

      stencilFail: Graphics.StencilOperation.Increment,
      stencilDepthFail: Graphics.StencilOperation.Invert,
      stencilDepthPass: Graphics.StencilOperation.Decrement,

      // back face stencil
      stencilBackFunction: Graphics.CompareFunction.Equal,
      stencilBackReference: 4,
      stencilBackMask: 0xff00ffff,

      stencilBackFail: Graphics.StencilOperation.DecrementWrap,
      stencilBackDepthFail: Graphics.StencilOperation.IncrementWrap,
      stencilBackDepthPass: Graphics.StencilOperation.Replace
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.StencilState(device, paramsA);
      stateB = new Graphics.StencilState(device, stateB);
      stateC = new Graphics.StencilState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.enable).toBe(paramsA.enable);
        expect(stateC.stencilFunction).toBe(paramsA.stencilFunction);
        expect(stateC.stencilReference).toBe(paramsA.stencilReference);
        expect(stateC.stencilMask).toBe(paramsA.stencilMask);

        expect(stateC.stencilFail).toBe(paramsA.stencilFail);
        expect(stateC.stencilDepthFail).toBe(paramsA.stencilDepthFail);
        expect(stateC.stencilDepthPass).toBe(paramsA.stencilDepthPass);

        expect(stateC.stencilBackFunction).toBe(paramsA.stencilBackFunction);
        expect(stateC.stencilBackReference).toBe(paramsA.stencilBackReference);
        expect(stateC.stencilBackMask).toBe(paramsA.stencilBackMask);

        expect(stateC.stencilBackFail).toBe(paramsA.stencilBackFail);
        expect(stateC.stencilBackDepthFail).toBe(paramsA.stencilBackDepthFail);
        expect(stateC.stencilBackDepthPass).toBe(paramsA.stencilBackDepthPass);

        expect(stateC.hasChanged).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.enable).toBe(paramsB.enable);
        expect(stateC.stencilFunction).toBe(paramsB.stencilFunction);
        expect(stateC.stencilReference).toBe(paramsB.stencilReference);
        expect(stateC.stencilMask).toBe(paramsB.stencilMask);

        expect(stateC.stencilFail).toBe(paramsB.stencilFail);
        expect(stateC.stencilDepthFail).toBe(paramsB.stencilDepthFail);
        expect(stateC.stencilDepthPass).toBe(paramsB.stencilDepthPass);

        expect(stateC.stencilBackFunction).toBe(paramsB.stencilBackFunction);
        expect(stateC.stencilBackReference).toBe(paramsB.stencilBackReference);
        expect(stateC.stencilBackMask).toBe(paramsB.stencilBackMask);

        expect(stateC.stencilBackFail).toBe(paramsB.stencilBackFail);
        expect(stateC.stencilBackDepthFail).toBe(paramsB.stencilBackDepthFail);
        expect(stateC.stencilBackDepthPass).toBe(paramsB.stencilBackDepthPass);

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
