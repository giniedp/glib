(function(){

  var path = Glib.utils.path;

  describe("Gulp.utils.path", function() {
    describe("isAbsolute", function() {
      it("is true for absolute path", function() {
        expect(path.isAbsolute("/foo/bar")).toBe(true);
      });
      it("is false for relative path", function() {
        expect(path.isAbsolute("foo/bar")).toBe(false);
      });
      it("is false for URLs", function() {
        expect(path.isAbsolute("http://example.comfoo/bar")).toBe(false);
      });
    });

    describe("hasProtocol", function() {
      it("is true for URLs with protocol", function() {
        expect(path.hasProtocol("http://example.com")).toBe(true);
        expect(path.hasProtocol("ftp://example.com")).toBe(true);
        expect(path.hasProtocol("whatever://example.com")).toBe(true);
      });
      it("is false for absolute path", function() {
        expect(path.hasProtocol("/foo/bar")).toBe(false);
      });
      it("is false for relative path", function() {
        expect(path.hasProtocol("foo/bar")).toBe(false);
      });
    });

    describe("dir", function() {
      it("returns the absolute directory path", function() {
        expect(path.dir("/example/path/file.ext")).toBe("/example/path/");
      });
      it("returns the the relative directory path", function() {
        expect(path.dir("example/path/file.ext")).toBe("example/path/");
      });
      it("returns the path until last /", function() {
        expect(path.dir("example/path/")).toBe("example/path/");
      });
      it("omits trailing file name, even if it has no extension", function() {
        expect(path.dir("example/path")).toBe("example/");
      });
      it("works with URLls", function() {
        expect(path.dir("http://example.com/example/path/file.ext")).toBe("/example/path/");
      });
    });

    describe("basename", function() {
      it("returns the file name", function() {
        expect(path.basename("file.ext")).toBe("file.ext");
      });
      it("works with absolute path", function() {
        expect(path.basename("/foo/bar/file.ext")).toBe("file.ext");
      });
      it("works with relative path", function() {
        expect(path.basename("foo/bar/file.ext")).toBe("file.ext");
      });
      it("works without extension", function() {
        expect(path.basename("foo/bar/file")).toBe("file");
      });
      it("works with URLs", function() {
        expect(path.basename("http://example.com/example/path/file.ext")).toBe("file.ext");
      });
    });

    describe("ext", function() {
      it("returns the extension", function() {
        expect(path.ext("file.ext")).toBe(".ext");
      });
      it("works with absolute path", function() {
        expect(path.ext("/example/path/file.ext")).toBe(".ext");
      });
      it("works with relative path", function() {
        expect(path.ext("example/path/file.ext")).toBe(".ext");
      });
      it("works with URLs", function() {
        expect(path.ext("http://example.com/example/path/file.ext")).toBe(".ext");
      });
      it("returns empty string for no extension", function() {
        expect(path.ext("example/path/file")).toBe("");
      });
    });

    describe("merge", function() {
      it("merges two pathes", function() {
        expect(path.merge("http://example.com/foo/bar/", "./../file.ext")).toBe("http://example.com/foo/file.ext");
      });
      it("merges two pathes", function() {
        expect(path.merge("http://example.com/foo/bar/", "file.ext")).toBe("http://example.com/foo/bar/file.ext");
      });
      it("merges two pathes", function() {
        expect(path.merge("http://example.com/foo/bar/", "/file.ext")).toBe("http://example.com/file.ext");
      });
      it("merges two pathes", function() {
        expect(path.merge("http://example.com:3000", "http://foo.com:3000/file.ext")).toBe("http://foo.com:3000/file.ext");
      });
    });
  });

}());
