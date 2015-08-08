(function () {

  'use strict';

  var through = require('through');
  var util = require('gulp-util');
  var path = require('path');

  module.exports = function (file) {
    if (!file) {
      throw new util.PluginError('glib-export', 'Missing file option for glib-export');
    }

    var firstFile, files = [];

    function bufferContents(file) {
      if (file.isNull()) {
        return; // ignore
      }
      if (!firstFile) {
        firstFile = file;
      }
      files.push(file);
    }

    function endStream() {
      var data = [];
      files.forEach(function(item){
        var p = item.path.replace(item.base, '');
        var dir = path.dirname(p);
        var ext = path.extname(p);
        var name = path.basename(p, ext);
        if (ext == '.ts' && name.match(/^[A-Z]/)) {
          data.push('export * from "' + [dir, name].join('/') + '";');
        }
      });

      if (firstFile) {
        var target = firstFile.clone({ contents: false });
        target.path = path.join(firstFile.base, file);
        target.contents = new Buffer(data.join("\n"));
        console.log(target.path );
        this.emit('data', target);
      }

      this.emit('end');
    }

    return through(bufferContents, endStream);
  }

}());
