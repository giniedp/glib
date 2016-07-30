(function(){
  'use strict';

  var fs = require('fs');
  var path = require("path");
  var util = require('gulp-util');
  var through = require('through');
  var inflect = require('inflection');

  function extractMeta(content) {
    var result = {};
    content = content.trim().split("\n");
    var regex = /\/\/-\s*(\w+)\s*:\s*(.+)/
    for (var i = 0; i < content.length; i++) {
      var line = content[i].trim();
      if (line.substr(0, 2) != "//") break;
      var match = line.match(regex);
      if (!match) continue;
      result['$' + match[1]] = match[2]
    }
    return result;
  }

  function makeFileTitle(file) {
    var extName = path.extname(file);
    var baseName = path.basename(file, extName);
    return inflect.humanize(baseName.replace('-', '_'));
  }

  function makeFileHref(file, dir) {
    file = path.relative(dir, file);
    var extName = path.extname(file);
    var baseName = path.basename(file, extName);
    var dirName = path.dirname(file);
    return path.join(dirName, baseName + '.html');
  }

  function processFiles(files, dir, result) {
    files.forEach(function(file) {
      if (!file.startsWith(dir)) return;

      var content = fs.readFileSync(file, 'UTF-8').toString();
      var meta = extractMeta(content);
      if (meta.ignore) return; 
      meta.$title = meta.$title || makeFileTitle(file);
      meta.$href = meta.$href || makeFileHref(file, dir);
      
      var tokens =  file.substring(dir.length, file.length).split("/");
      var fileName = tokens.pop()
      var group = result;
      tokens.forEach(function(name) {
        if (!name) return;
        group[name] = group[name] || {};
        group = group[name];
        group.$title = group.$title || makeFileTitle(name);
      });
      group.$files = group.$files || [];
      group.$files.push(meta);
    });
    return result;
  }
  
  function Mod() {
    this.samples = {};
  }
  Mod.prototype.clear = function() {
    Object.keys(this.samples).forEach(function(key) {
      delete this.samples[key];
    }, this);
  } 
  Mod.prototype.sampler = function(samplesDir) {
    this.clear();
    if (!samplesDir) {
      throw new util.PluginError('glib-samples', 'Missing samplesDir parameter');
    }
    samplesDir = path.join(process.cwd(), samplesDir);
    var sampleFiles = [];
    var files = [];
    var that = this;
    
    function bufferContents(file) {
      files.push(file);
      if (file.isNull()) return;
      if (file.path.startsWith(samplesDir)) {
        sampleFiles.push(file.path);
      }
    }

    function endStream() {
      processFiles(sampleFiles, samplesDir, that.samples);
      files.forEach(function(file) {
        this.emit('data', file);
      }, this);
      this.emit('end');
    }

    return through(bufferContents, endStream);
  }

  module.exports = new Mod();
}());
