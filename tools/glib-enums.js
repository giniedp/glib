(function () {

  'use strict';

  var fs = require('fs');
  var through = require('through');
  var path = require('path');

  function loadConstants(){
    var result = {};

    var parse = function(lines, result){
      lines.forEach(function(line){
        var match = line.match(/^\s*const\s+GLenum\s+(.+)\s+\s*=\s*(.+)\s*;/);
        if (match){
          var name = match[1].replace(/(^\s*|\s*$)/g, '');
          var value = match[2];
          result[name] = value;
        }
      });
    };

    var data = fs.readFileSync(path.resolve(__dirname, 'webgl.v1.idl'), 'UTF-8').toString();
    var lines = data.replace(/\r\n/g, '\n').split('\n');
    parse(lines, result);

    data = fs.readFileSync(path.resolve(__dirname, 'webgl.v2.idl'), 'UTF-8').toString();
    lines = data.replace(/\r\n/g, '\n').split('\n');
    parse(lines, result);

    return result;
  }

  function writeProperty(data, options, ename){
    data.properties = data.properties || [];
    if (data.properties.indexOf(options.property) < 0) {
      data.properties.push(options.property );
      data.push("  " + options.property + " : " + options.value);
    }
  }

  function generateEnumFile(meta, constants) {
    var key, constant, value, prop;
    var properties = [];

    for (key in meta.properties){
      constant = meta.properties[key];
      value = meta.GLConstant ? constants[constant] : constant;
      prop = {
        property: key,
        type: 'number',
        default: value,
        value: value
      };
      if (meta.GLConstant){
        prop.default = value + " (const GLenum " + constant + ")";
      }

      writeProperty(properties, prop, meta.target);
      if (meta.aliases && meta.aliases[key]){
        prop.property = meta.aliases[key];
        writeProperty(properties, prop, meta.target);
      }
      if (meta.glaliases && meta.glaliases[key]){
        prop.property = meta.glaliases[key];
        writeProperty(properties, prop, meta.target);
        prop.property = constants[meta.glaliases[key]];
        prop.brackets = true;
        writeProperty(properties, prop, meta.target);
      }
      if (meta.GLConstant){
        prop.property = value;
        prop.brackets = true;
        writeProperty(properties, prop, meta.target);
      }
    }

    var data = [];
    data.push( "module Glib.Graphics {" );
    data.push( "  export var " + meta.target + " = {" );
    data.push( "  " + properties.join(",\n"));
    data.push( "  };" );
    data.push( "}" );
    data.push( "" );
    return data.join('\n');
  }

  function generateEnumNameFile(meta, constants){
    var key, constant, value, prop;
    var properties = [];

    for (key in meta.properties) {
      constant = meta.properties[key];
      value = meta.GLConstant ? constants[constant] : constant;
      prop = {
        property: key,
        type: 'String',
        default: "'" + constant + "'",
        value: "'" + constant + "'"
      };
      writeProperty(properties, prop, meta.targetName);

      if (meta.aliases && meta.aliases[key]){
        prop.property = meta.aliases[key];
        writeProperty(properties, prop, meta.targetName);
      }
      if ( meta.GLConstant){
        prop.property = value;
        prop.brackets = true;
        writeProperty(properties, prop, meta.targetName);
      }
    }

    var data = [];
    data.push( "module Glib.Graphics {" );
    data.push( "  export var " + meta.targetName + " = {" );
    data.push( "  " + properties.join(",\n"));
    data.push( "  };" );
    data.push( "}" );
    data.push( "" );
    return data.join('\n');
  }

  module.exports = function() {
    var constants = loadConstants();

    var files = [];
    function bufferContents(file) {
      files.push({
        file: file,
        data: JSON.parse(fs.readFileSync(file.path, 'UTF-8').toString())
      });
    }

    function endStream() {
      files.forEach(function(node){
        var file = node.file;
        var data = node.data;
        data.forEach(function(meta){
          var target = file.clone({ contents: false });
          target.path = path.join(file.base, meta.target + ".ts");
          target.contents = new Buffer(generateEnumFile(meta, constants));
          this.emit('data', target);

          if (!meta.targetName) return;

          target = file.clone({ contents: false });
          target.path = path.join(file.base, meta.targetName + ".ts");
          target.contents = new Buffer(generateEnumNameFile(meta, constants));
          this.emit('data', target);

        }, this);
      }, this);

      this.emit('end');
    }
    return through(bufferContents, endStream);
  }

}());
