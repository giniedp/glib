(function(){

  describe("Glib.Content.BinaryReader", function() {
    var data;
    var reader;
    beforeEach(function() {
      data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      reader = new Glib.Content.BinaryReader(data);
    });

    it("readByte", function () {
      expect(reader.readByte()).toBe(1);
      expect(reader.readByte()).toBe(2);
      expect(reader.readByte()).toBe(3);
      expect(reader.readByte()).toBe(4);
    });

    it("readShort", function () {
      expect(reader.readShort()).toBe(1 | 2 << 8);
      expect(reader.readShort()).toBe(3 | 4 << 8);
    });

    it("readInt", function () {
      expect(reader.readInt()).toBe(1 | 2 << 8 | 3 << 16 | 4 << 24);
    });

    it("seekAbsolute", function () {
      reader.seekAbsolute(5);
      reader.seekAbsolute(5);
      expect(reader.readByte()).toBe(6);
    });

    it("seekRelative", function () {
      reader.seekRelative(2);
      reader.seekRelative(2);
      expect(reader.readByte()).toBe(5);
    });

    it("readBuffer", function () {
      var buffer = [0, 0, 0, 0];
      reader.readBuffer(buffer, 1, 2);
      expect(buffer).toEqual([0, 1, 2, 0]);
    });
  });
}());
