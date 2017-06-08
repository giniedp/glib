
'use strict';

var StringWriter = require('./string-writer.js');

var fs = require('fs');
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

function writeProperty(w, key, value, cache) {
  if (!cache.hasOwnProperty(key)) {
    w.writeLine(`  ${key}: ${value},`);
    cache[key] = true;
  }
}

function generateEnum(data, constants) {
  var w = StringWriter.begin();

  // export FooOption = 'foo' | 'bar' | 'yeah'
  w.writeLine(`export type ${data.enum}Option =`);
  w.write('    ');
  w.writeLine(Object.keys(data.properties).map((it) => `'${it}'`).join('\n  | '));
  if (data.isGlConstant) {
    w.write('  | ');
    w.writeLine(Object.values(data.properties).map((it) => `'${it}'`).join('\n  | '));
  }
  if (data.glaliases && ! data.isGlConstant) {
    w.write('  | ');
    w.writeLine(Object.values(data.glaliases).map((it) => `'${it}'`).join('\n  | '));
  }
  w.writeLine(`  | ${data.type || 'number'}`);

  // export FooValue = 'foo' | 'bar' | 'yeah'
  // w.writeLine(`export type ${data.enum}Value =`);
  // w.write('    ');
  // w.writeLine(Object.keys(data.properties).map((key) => {
  //   return data.isGlConstant ? constants[data.properties[key]] : data.properties[key];
  // }).join('\n  | '));

  w.writeLine();
  w.writeLine( `export const ${data.enum} = Object.freeze({`);
  var cache = {};
  for (const key of Object.keys(data.properties)) {
    const constant = data.properties[key];
    const value = data.isGlConstant ? constants[constant] : constant;
    writeProperty(w, key, value, cache);
    writeProperty(w, constant, value, cache);
    writeProperty(w, value, value, cache);
    if (data.glaliases && data.glaliases[key]){
      writeProperty(w, data.glaliases[key], value, cache);
      writeProperty(w, constants[data.glaliases[key]], value, cache);
    }
  }

  if (data.enumName) {
    w.writeLine(`  nameOf: (name: string|number): string => map${data.enumName}[name],`);
  }
  w.writeLine( '})' );

  if (!data.enumName) {
    return w.toString();
  }

  w.writeLine( `const map${data.enumName} = Object.freeze({`);
  cache = {};
  for (const key of Object.keys(data.properties)) {
    const constant = data.properties[key];
    const value = data.isGlConstant ? constants[constant] : constant;
    writeProperty(w, key, `'${constant}'`, cache);
    writeProperty(w, constant, `'${constant}'`, cache);
    writeProperty(w, value, `'${constant}'`, cache);
    if (data.glaliases && data.glaliases[key]){
      writeProperty(w, data.glaliases[key], `'${constant}'`, cache);
      writeProperty(w, constants[data.glaliases[key]], `'${constant}'`, cache);
    }
  }
  w.writeLine( '})' );

  return w.toString();
}

var constants = loadConstants();
var data = '\n' + require('./enums.json').map((meta) => generateEnum(meta, constants)).join('');

fs.writeFile(path.join(process.cwd(), 'framework/graphics/src/enums/Enums.ts'), data, function(err) {
  if(err) {
    console.log(err);
    process.exit(1);
  }
});
