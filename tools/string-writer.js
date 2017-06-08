'use strict';

module.exports = class StringWriter {

  static begin() {
    return new StringWriter();
  }

  constructor() {
    this.buffer = [];
  }

  clear() {
    this.buffer.length = 0;
    return this;
  }

  write(str) {
    this.buffer.push(str);
    return this;
  }

  writeLine(str) {
    if (str && str.length) {
      this.write(str);
    }
    return this.write('\n');
  }

  toString() {
    return this.buffer.join('');
  }
};
