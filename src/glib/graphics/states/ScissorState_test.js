(function(){

  var Graphics = Glib.Graphics;

  describe("Glib.Graphics.ScissorState", function() {

    var device = new Graphics.Device;
    var stateA, stateB, stateC;
    var paramsA = {
      enable: false,
      x: 1,
      y: 2,
      width: 3,
      height: 4
    };
    var paramsB = {
      enable: true,
      x: 5,
      y: 6,
      width: 7,
      height: 8
    };

    var keys = Object.keys(paramsA);

    beforeEach(function() {
      stateA = new Graphics.ScissorState(device, paramsA);
      stateB = new Graphics.ScissorState(device, stateB);
      stateC = new Graphics.ScissorState(device);

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
