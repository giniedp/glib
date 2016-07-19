(function () {

  'use strict';

  var through = require('through');
  var util = require('gulp-util');
  var path = require('path');
  var fs = require("fs");

  module.exports = function (file, compilerOptions) {
    if (!file) throw new util.PluginError('tsconfig', 'Missing file option');

    var workdir = process.cwd();
    var files = [];

    function bufferContents(file) {
      if (!file.isNull()) {
        // collect file path relative to working directory
        files.push("." + file.path.replace(workdir, ""));
      }
    }

    function endStream() {
      var oldConfig = {
        compilerOptions: {},
        files: []
      }
      if (fs.existsSync(file)) {
        oldConfig = JSON.parse(fs.readFileSync(file)) || {}
      }
      var oldFiles = oldConfig.files || []
      var oldOptions = oldConfig.compilerOptions || {}

      var newFiles = files;
      var newOptions = compilerOptions || oldOptions || {};

      var filesChanged = (oldFiles.length != newFiles.length) || oldFiles.some(function(entry, index) {
        return newFiles.indexOf(entry) < 0;
      });
      var optsChanged = JSON.stringify(newOptions) !== JSON.stringify(oldOptions)
      
      if (filesChanged || optsChanged) {
        console.log("updating " + file)
        var result = JSON.stringify({
          compilerOptions: newOptions,
          files: newFiles
        }, null, 2);
        fs.writeFileSync(file, result);
      }
      this.emit('end');
    }

    return through(bufferContents, endStream);
  }

}());
