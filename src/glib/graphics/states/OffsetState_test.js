(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.OffsetState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      offsetEnable: false,
      offsetFactor: 1,
      offsetUnits: 2
    };
    var paramsB = {
      offsetEnable: true,
      offsetFactor: 3,
      offsetUnits: 4
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.OffsetState(device, paramsA);
      stateB = new Graphics.OffsetState(device, stateB);
      stateC = new Graphics.OffsetState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.offsetEnable).toBe(paramsA.offsetEnable);
        expect(stateC.offsetFactor).toBe(paramsA.offsetFactor);
        expect(stateC.offsetUnits).toBe(paramsA.offsetUnits);
        expect(stateC.hasChanged).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.offsetEnable).toBe(paramsB.offsetEnable);
        expect(stateC.offsetFactor).toBe(paramsB.offsetFactor);
        expect(stateC.offsetUnits).toBe(paramsB.offsetUnits);
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
