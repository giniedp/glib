'use strict';

Error['stackTraceLimit'] = Infinity;

var appContext = require.context('./', true, /\.(test|spec).ts$/);
appContext.keys().forEach(appContext);
