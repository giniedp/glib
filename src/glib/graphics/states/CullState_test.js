(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.CullState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      culling: false,
      cullMode: Graphics.CullMode.Back,
      frontFace: Graphics.FrontFace.CounterClockWise
    };
    var paramsB = {
      culling: true,
      cullMode: Graphics.CullMode.Front,
      frontFace: Graphics.FrontFace.ClockWise
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.CullState(device, paramsA);
      stateB = new Graphics.CullState(device, stateB);
      stateC = new Graphics.CullState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.culling).toBe(paramsA.culling);
        expect(stateC.cullMode).toBe(paramsA.cullMode);
        expect(stateC.frontFace).toBe(paramsA.frontFace);
        expect(stateC.hasChanged).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.culling).toBe(paramsB.culling);
        expect(stateC.cullMode).toBe(paramsB.cullMode);
        expect(stateC.frontFace).toBe(paramsB.frontFace);
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
