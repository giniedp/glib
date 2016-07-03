(function(){
  'use strict';

  var fs = require('fs');
  var glob = require("simple-glob");
  var gulp = require("gulp");
  var path = require("path");
  var jade = require('gulp-jade');
  var inflect = require('inflection');

  function parseMetaComment(content) {
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

  function makeTitle(token) {
    return inflect.humanize(token.replace('-', '_'));
  }

  function makeFileTitle(file) {
    return makeTitle(path.basename(file, path.extname(file)))
  }

  function makeFileHref(file) {
    return file.replace(/^src\/page/, '').replace(/.jade$/, '.html');
  }

  module.exports = function(src){
    var files = glob(src);
    var examples = {};
    files.forEach(function(file) {
      if (!/^src\/page\/examples/.test(file)) return;
      var content = fs.readFileSync(file, 'UTF-8').toString();
      var meta = parseMetaComment(content);
      if (meta.ignore) return; 
      meta.$title = meta.$title || makeFileTitle(file);
      meta.$href = meta.$href || makeFileHref(file);
      
      var tokens =  file.replace(/^src\/page\/examples/, '').split("/");
      var fileName = tokens.pop()

      var group = examples
      tokens.forEach(function(name) {
        if (!name) return;
        group[name] = group[name] || {};
        group = group[name];
        group.$title = group.$title || makeTitle(name);
      });
      group.$files = group.$files || [];
      group.$files.push(meta);
      group.$files.sort(function(a, b) {
        return a.$title > b.$title ? 1 : 0; 
      })
    })
    
    return gulp.src(src).pipe(jade({
      pretty: true,
      locals: {
        examples: examples
      }
    }));
  };
}());
