(function(){

  describe("Glib.Content.Parser.MTL", function() {
    describe("#parse", function () {
      var parser;
      beforeEach(function() {
        parser = new Glib.Content.Parser.MTL();
      });

      it("reads newmtl", function () {
        expect(parser.parse('newmtl the name')[0].name).toBe('the name');
      });

      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1 2 3')[0].Ka).toEqual([1, 2, 3]);
      });
      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1 2')[0].Ka).toEqual([1, 2, 1]);
      });
      it("reads Ka", function () {
        expect(parser.parse('newmtl name\nKa 1')[0].Ka).toEqual([1, 1, 1]);
      });

      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1 2 3')[0].Kd).toEqual([1, 2, 3]);
      });
      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1 2')[0].Kd).toEqual([1, 2, 1]);
      });
      it("reads Kd", function () {
        expect(parser.parse('newmtl name\nKd 1')[0].Kd).toEqual([1, 1, 1]);
      });

      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1 2 3')[0].Ks).toEqual([1, 2, 3]);
      });
      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1 2')[0].Ks).toEqual([1, 2, 1]);
      });
      it("reads Ks", function () {
        expect(parser.parse('newmtl name\nKs 1')[0].Ks).toEqual([1, 1, 1]);
      });

      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1 2 3')[0].Tf).toEqual([1, 2, 3]);
      });
      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1 2')[0].Tf).toEqual([1, 2, 1]);
      });
      it("reads Tf", function () {
        expect(parser.parse('newmtl name\nTf 1')[0].Tf).toEqual([1, 1, 1]);
      });

      it("reads illum", function () {
        expect(parser.parse('newmtl name\nillum 10')[0].illum).toEqual('10');
      });

      it("reads d", function () {
        expect(parser.parse('newmtl name\nd 10')[0].d).toEqual(10);
      });
      it("reads Tr", function () {
        expect(parser.parse('newmtl name\nTr 10')[0].d).toEqual(10);
      });

      it("reads Ns", function () {
        expect(parser.parse('newmtl name\nNs 10')[0].Ns).toEqual(10);
      });

      it("reads sharpness", function () {
        expect(parser.parse('newmtl name\nsharpness 10')[0].sharpness).toEqual(10);
      });

      it("reads Ni", function () {
        expect(parser.parse('newmtl name\nNi 10')[0].Ni).toEqual(10);
      });

      it("reads map_Ka", function () {
        expect(parser.parse('newmtl name\nmap_Ka file.png')[0].map_Ka.file).toEqual('file.png');
      });

    });
  });
}());
