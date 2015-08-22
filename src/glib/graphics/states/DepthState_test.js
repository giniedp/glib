(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.DepthState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      depthEnable: true,
      depthFunction: Graphics.CompareFunction.Always,
      depthWriteEnable: false
    };
    var paramsB = {
      depthEnable: false,
      depthFunction: Graphics.CompareFunction.Never,
      depthWriteEnable: true
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.DepthState(device, paramsA);
      stateB = new Graphics.DepthState(device, stateB);
      stateC = new Graphics.DepthState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.depthEnable).toBe(paramsA.depthEnable);
        expect(stateC.depthFunction).toBe(paramsA.depthFunction);
        expect(stateC.depthWriteEnable).toBe(paramsA.depthWriteEnable);
        expect(stateC._changed).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.depthEnable).toBe(paramsB.depthEnable);
        expect(stateC.depthFunction).toBe(paramsB.depthFunction);
        expect(stateC.depthWriteEnable).toBe(paramsB.depthWriteEnable);
        expect(stateC._changed).toBe(false);

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
          expect(stateC._changed).toBe(false);
          stateC[key] = paramsB[key];
          expect(stateC._changed).toBe(true);
        });
      });
    });
  });
}());
