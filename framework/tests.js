'use strict';

Error['stackTraceLimit'] = Infinity;
window.HeadlessGL = require('gl'); // jshint ignore:line
var appContext = require.context('./', true, /\.(test|spec).ts$/);
appContext.keys().forEach(appContext);
