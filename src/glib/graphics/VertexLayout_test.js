(function(){

  var VertexLayout = Glib.Graphics.VertexLayout;
  const littleEndian = true
  describe("Glib.Graphics.VertexLayout", function() {

    beforeEach(function() {
      
    });

    describe("convertArrayArrayBuffer", function() {
      it("single channel bytes", function() {
        var layout = {
          channel1: { offset: 0, type: 'byte', elements: 2 },
        }
        var data = [-127, -1, 0, 0, 1, 127]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getInt8(i, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel ubytes", function() {
        var layout = {
          channel1: { offset: 0, type: 'ubyte', elements: 2 },
        }
        var data = [0, 1, 254, 255]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getUint8(i, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel short", function() {
        var layout = {
          channel1: { offset: 0, type: 'short', elements: 2 },
        }
        var data = [-32768, -1, 0, 0, 1, 32767]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getInt16(i * 2, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel ushort", function() {
        var layout = {
          channel1: { offset: 0, type: 'ushort', elements: 2 },
        }
        var data = [0, 1, 65534, 65535]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getUint16(i * 2, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel int", function() {
        var layout = {
          channel1: { offset: 0, type: 'int', elements: 2 },
        }
        var data = [-0x80000000, -1, 0, 0, 1, 0x7FFFFFFF]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getInt32(i * 4, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel uint", function() {
        var layout = {
          channel1: { offset: 0, type: 'uint', elements: 2 },
        }
        var data = [0, 1, 0xFFFFFFFF-1, 0xFFFFFFFF]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getUint32(i * 4, littleEndian)).toBe(data[i]);
        }
      });

      it("single channel float", function() {
        var layout = {
          channel1: { offset: 0, type: 'float', elements: 2 },
        }
        var data = [-1.5, -1, -0.25, 0.25, 1, 1.5]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        for (var i = 0; i < data.length; i++) {
          expect(view.getFloat32(i * 4, littleEndian)).toBe(data[i]);
        }
      });

      it("multi channel mixed data", function() {
        var layout = {
          channel1: { offset: 0, type: 'float', elements: 3 },
          channel2: { offset: 12, type: 'float', elements: 3 },
          channel3: { offset: 24, type: 'int', elements: 2 },
          channel4: { offset: 32, type: 'byte', elements: 2 },
        }
        var data = [
          1.0, 2.0, 3.0,
          4.5, 5.5, 6.5,
          -0x80000000, 0x7FFFFFFF,
          -127, 127
        ]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        
        for (var i = 0; i < 3; i++) {
          expect(view.getFloat32(i * 4, littleEndian)).toBe(data[i]);
          expect(view.getFloat32(12 + i * 4, littleEndian)).toBe(data[3 + i]);
        }
        for (var i = 0; i < 2; i++) {
          expect(view.getInt32(24 + i * 4, littleEndian)).toBe(data[6 + i]);
          expect(view.getInt8(32 + i, littleEndian)).toBe(data[8 + i]);
        }
      });

      it("multi channel packed data", function() {
        var layout = {
          channel1: { offset: 0, type: 'float', elements: 3 },
          channel4: { offset: 12, type: 'byte', elements: 4, packed: true },
        }
        var data = [
          1.0, 2.0, 3.0, 0xFF0000FF,
          3.0, 4.0, 5.0, 0x00FF00FF,
          6.0, 7.0, 8.0, 0x0000FFFF,
        ]

        var result = VertexLayout.convertArrayArrayBuffer(data, layout)
        var view = new DataView(result)
        
        for (var i = 0; i < 3; i++) {
          expect(view.getFloat32(i * 16 + 0, littleEndian)).toBe(data[i * 4 + 0]);
          expect(view.getFloat32(i * 16 + 4, littleEndian)).toBe(data[i * 4 + 1]);
          expect(view.getFloat32(i * 16 + 8, littleEndian)).toBe(data[i * 4 + 2]);
          expect(view.getUint32(i * 16 + 12, littleEndian)).toBe(data[i * 4 + 3]);
        }
      });
    });
    
  });
}());
