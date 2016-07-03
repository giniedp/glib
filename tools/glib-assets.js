(function () {

  'use strict';

  var through = require('through');
  var util = require('gulp-util');
  var path = require('path');

  module.exports = function (file) {
    if (!file) {
      throw new util.PluginError('glib-assets', 'Missing file option');
    }

    var firstFile, files = [];

    function bufferContents(file) {
      if (file.isNull()) return; // ignore
      if (!firstFile) firstFile = file;
      files.push(file.path);
    }

    function endStream() {
      if (firstFile) {
        var targetFile = firstFile.clone({contents: false});
        targetFile.path = path.join(firstFile.base, file);

        for (var i = 0; i < files.length; i += 1) {
          files[i] = path.relative(firstFile.base, files[i]);
        }
        targetFile.contents = new Buffer(JSON.stringify(files, null, 2));

        this.emit('data', targetFile);
      }
      this.emit('end');
    }

    return through(bufferContents, endStream);
  }

}());
