(function(){

  var utils = Glib.utils;

  describe("Gulp.utils.copy", function() {

    describe("array", function() {

      var simple = void 0;
      var nested = void 0;

      beforeEach(function() {
        simple = [1, 2, 3];
        nested = [4, ["foo"]];
        result = void 0;
      });

      it("the result is an array", function() {
        var result = utils.copy(simple);
        expect(Array.isArray(result)).toBe(true);
      });

      it("the result equals the source", function() {
        var result = utils.copy(simple);
        expect(result).toEqual(simple);
      });

      it("the result is a copy", function() {
        var result = utils.copy(simple);
        result[0] = 5;
        expect(simple[0]).not.toBe(result[0]);
      });

      it("nested objects are not cloned in shallow mode", function() {
        var result = utils.copy(nested);
        result[1][0] = 5;
        expect(nested[1][0]).toBe(5);
      });

      it("nested objects are cloned in shallow mode", function() {
        var result = utils.copy(true, nested);
        result[1][0] = 5;
        expect(nested[1][0]).not.toBe(5);
      });
    });

    describe("object", function() {

      var simple = void 0;
      var nested = void 0;

      beforeEach(function() {
        simple = { foo: "foo", bar: "bar" };
        nested = { foo: "foo", bar: {baz: "baz" } };
      });

      it("the result is an object", function() {
        var result = utils.copy(simple);
        expect(result != null && typeof result === 'object').toBe(true);
      });

      it("the result equals the source", function() {
        var result = utils.copy(simple);
        expect(result).toEqual(simple);
      });

      it("the result is a copy", function() {
        var result = utils.copy(simple);
        result.foo = "foo foo";
        expect(simple.foo).toBe("foo");
      });

      it("nested objects are not cloned in shallow mode", function() {
        var result = utils.copy(nested);
        result.bar.baz = "baz baz";
        expect(nested.bar.baz).toBe("baz baz");
      });

      it("nested objects are cloned in shallow mode", function() {
        var result = utils.copy(true, nested);
        result.bar.baz = "baz baz";
        expect(nested.bar.baz).toBe("baz");
      });
    });
  });


}());
