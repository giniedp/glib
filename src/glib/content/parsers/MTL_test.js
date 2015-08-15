(function(){

  describe("Glib.Content.Parsers.MTL", function() {
    describe("#parse", function () {
      var parser;
      beforeEach(function() {
        parser = new Glib.Content.Parsers.MTL();
      });

      it("reads newmtl", function () {
        expect(parser.parse('newmtl the name').material.name).toBe('the name');
      });

      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1 2 3').material.Ka).toEqual([1, 2, 3]);
      });
      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1 2').material.Ka).toEqual([1, 2, 1]);
      });
      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1').material.Ka).toEqual([1, 1, 1]);
      });

      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1 2 3').material.Kd).toEqual([1, 2, 3]);
      });
      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1 2').material.Kd).toEqual([1, 2, 1]);
      });
      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1').material.Kd).toEqual([1, 1, 1]);
      });

      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1 2 3').material.Ks).toEqual([1, 2, 3]);
      });
      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1 2').material.Ks).toEqual([1, 2, 1]);
      });
      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1').material.Ks).toEqual([1, 1, 1]);
      });

      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1 2 3').material.Tf).toEqual([1, 2, 3]);
      });
      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1 2').material.Tf).toEqual([1, 2, 1]);
      });
      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1').material.Tf).toEqual([1, 1, 1]);
      });

      it("reads illum", function () {
        expect(parser.parse('newmtl name\nillum 10').material.illum).toEqual('10');
      });

      it("reads d", function () {
        expect(parser.parse('newmtl name\nd 10').material.d).toEqual(10);
      });
      it("reads Tr", function () {
        expect(parser.parse('newmtl name\nTr 10').material.d).toEqual(10);
      });

      it("reads Ns", function () {
        expect(parser.parse('newmtl name\nNs 10').material.Ns).toEqual(10);
      });

      it("reads sharpness", function () {
        expect(parser.parse('newmtl name\nsharpness 10').material.sharpness).toEqual(10);
      });

      it("reads Ni", function () {
        expect(parser.parse('newmtl name\nNi 10').material.Ni).toEqual(10);
      });

      it("reads map_Ka", function () {
        expect(parser.parse('newmtl name\nmap_Ka file.png').material.map_Ka.file).toEqual('file.png');
      });

    });
  });
}());
