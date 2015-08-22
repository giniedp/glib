(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.ViewportState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      zMin: 0.1,
      zMax: 0.2
    };
    var paramsB = {
      x: 7,
      y: 8,
      width: 9,
      height: 10,
      zMin: 0.3,
      zMax: 0.4
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.ViewportState(device, paramsA);
      stateB = new Graphics.ViewportState(device, stateB);
      stateC = new Graphics.ViewportState(device);

      stateA.commit();
      stateC.resolve();
    });

    describe("commit/resolve", function() {
      it("own state", function() {
        stateA.commit();
        stateC.resolve();

        expect(stateC.enable).toBe(paramsA.enable);
        expect(stateC.x).toBe(paramsA.x);
        expect(stateC.y).toBe(paramsA.y);
        expect(stateC.width).toBe(paramsA.width);
        expect(stateC.height).toBe(paramsA.height);
        expect(stateC.zMin).toBeCloseTo(paramsA.zMin);
        expect(stateC.zMax).toBeCloseTo(paramsA.zMax);
        expect(stateC._changed).toBe(false);
      });

      it("given state", function() {
        stateA.commit(paramsB);
        stateC.resolve();

        expect(stateC.enable).toBe(paramsB.enable);
        expect(stateC.x).toBe(paramsB.x);
        expect(stateC.y).toBe(paramsB.y);
        expect(stateC.width).toBe(paramsB.width);
        expect(stateC.height).toBe(paramsB.height);
        expect(stateC.zMin).toBeCloseTo(paramsB.zMin);
        expect(stateC.zMax).toBeCloseTo(paramsB.zMax);
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
