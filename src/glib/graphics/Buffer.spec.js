(function(){

  var Graphics = Glib.Graphics;
  var Buffer = Glib.Graphics.Buffer;
  var BufferUsage = Glib.Graphics.BufferUsage;
  var BufferUsageName = Glib.Graphics.BufferUsageName;
  var BufferType = Glib.Graphics.BufferType;
  var BufferTypeName = Glib.Graphics.BufferTypeName;
  
  var DataType = Glib.Graphics.DataType;
  var DataTypeName = Glib.Graphics.DataTypeName;

  describe("Glib.Graphics.Buffer", function() {

    var device = new Graphics.Device();
    
    beforeEach(function() {
      
    });

    describe("new", function() {
      it("usage option", function() {
        var buffer;

        buffer = new Buffer(device)
        expect(buffer.usage).toBe(BufferUsage.Static);
        expect(buffer.usageName).toBe(BufferUsageName.Static);

        buffer = new Buffer(device, { usage: BufferUsage.Static })
        expect(buffer.usage).toBe(BufferUsage.Static);
        expect(buffer.usageName).toBe(BufferUsageName.Static);

        buffer = new Buffer(device, { usage: BufferUsage.Dynamic })
        expect(buffer.usage).toBe(BufferUsage.Dynamic);
        expect(buffer.usageName).toBe(BufferUsageName.Dynamic);

        buffer = new Buffer(device, { usage: BufferUsage.Stream })
        expect(buffer.usage).toBe(BufferUsage.Stream);
        expect(buffer.usageName).toBe(BufferUsageName.Stream);
      });

      it("type", function() {
        var buffer;

        buffer = new Buffer(device)
        expect(buffer.type).toBe(BufferType.IndexBuffer);
        expect(buffer.typeName).toBe(BufferTypeName.IndexBuffer);

        ['IndexBuffer', BufferType.IndexBuffer].forEach(function(type) {
          buffer = new Buffer(device, { type: type })
          expect(buffer.type).toBe(BufferType.IndexBuffer);
          expect(buffer.typeName).toBe(BufferTypeName.IndexBuffer);
        });
        
        ['VertexBuffer', BufferType.VertexBuffer].forEach(function(type) {
          buffer = new Buffer(device, { type: type })
          expect(buffer.type).toBe(BufferType.VertexBuffer);
          expect(buffer.typeName).toBe(BufferTypeName.VertexBuffer);
        });
      });

      it("dataType", function() {
        var buffer;

        // no dataType option
        buffer = new Buffer(device)
        expect(buffer.dataType).toBe(DataType.UNSIGNED_SHORT);
        expect(buffer.dataTypeName).toBe('UNSIGNED_SHORT');

        // specific dataType option
        buffer = new Buffer(device, { dataType: 'float' })
        expect(buffer.dataType).toBe(DataType.FLOAT);
        expect(buffer.dataTypeName).toBe('FLOAT');

        // no dataType but layout
        buffer = new Buffer(device, { 
          layout: {
            position: { type: 'float' },
            normal: { type: 'float' }
          } 
        })
        expect(buffer.dataType).toBe(DataType.UNSIGNED_BYTE);
        expect(buffer.dataTypeName).toBe('UNSIGNED_BYTE');

        // no dataType but layout with different element types
        buffer = new Buffer(device, { 
          layout: {
            position: { type: 'float' },
            color: { type: 'uint' }
          } 
        })
        expect(buffer.dataType).toBe(DataType.UNSIGNED_BYTE);
        expect(buffer.dataTypeName).toBe('UNSIGNED_BYTE');
      });

    });
    
  });
}());
