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
    content = content.split("\n");
    for (var i = 0; i < content.length; i++) {
      var line = content[i];
      if (line.indexOf("//-") != 0) return result;
      if (line.indexOf(":") < 0) continue;
      line = line.replace("//-", '').split(":");
      result[line[0].trim()] = line[1].trim();
    }
    return result;
  }

  function makeFileTitle(file) {
    return inflect.humanize(path.basename(file, path.extname(file)).replace('-', '_'));
  }

  function makeFileHref(file) {
    return file.replace(/^src/, '').replace(/.jade$/, '.html');
  }

  function makeFileSection(file) {
    var tokens = file.split("/");
    while (tokens[0] == "src" || tokens[0] == "pages") {
      tokens.shift()
    }
    var result = tokens.shift();
    if (path.extname(result)) {
      result = "";
    }

    return result
  }

  function getSectionPages(sections, name) {
    var section = sections[name] || { title: inflect.humanize(name), pages: [] };
    sections[name] = section;
    return section.pages;
  }

  module.exports = function(src){
    var files = glob(src);
    var sections = {};
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      var content = fs.readFileSync(file, 'UTF-8').toString();
      var meta = parseMetaComment(content);
      if (meta.ignore) continue;
      meta.title = meta.title || makeFileTitle(file);
      meta.href = meta.href || makeFileHref(file);

      var section = makeFileSection(file) || 'glib';
      var pages = getSectionPages(sections, section);
      pages.push(meta);
    }

    return gulp.src(src).pipe(jade({
      pretty: true,
      locals: {
        sections: sections
      }
    }));
  };
}());
