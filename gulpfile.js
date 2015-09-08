
'use strict';

var fs = require("fs");
var gulp = require('gulp');
var path = require('path');
var merge = require('merge');
var tsc = require('gulp-typescript');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var serve = require('gulp-serve');
var karma = require('karma');
var plumber = require('gulp-plumber');
var typedoc = require("gulp-typedoc");

var glibAssets = require('./tools/glib-assets.js');
var glibEnums = require('./tools/glib-enums.js');
var glibPages = require('./tools/glib-pages.js');

var PATHS = {
  dist: 'dist',
  pages: [
    '!src/pages/layouts/*.jade',
    'src/**/*.jade'
  ],
  styles: [
    'src/pages/style.scss'
  ],
  stylesWatch: [
    'src/pages/**/*.scss'
  ],
  assets: [
    'src/assets/**/*'
  ],
  glib: {
    excludes: [
      "!src/**/*_test.ts"
    ],
    base: [
      "!src/**/*_test.ts",
      "src/glib/base/**/*.ts"
    ],
    content: [
      "src/glib/content/*.ts",
      "src/glib/content/**/*.ts"
    ],
    rendering: [
      "src/glib/render/**/*.ts"
    ],
    graphics: [
      "src/glib/graphics/enums/*.ts",
      "src/glib/graphics/states/*.ts",
      "src/glib/graphics/*.ts",
      "src/glib/graphics/geometry/*.ts",
      "src/glib/graphics/geometry/**/*.ts"
    ],
    input: [
      "src/glib/input/**/*.ts"
    ],
    components: [
      "src/glib/scene/**/*.ts"
    ],
    other: [
      "src/glib/terrain/**/*.ts"
    ],
    math: [
      "src/glib/*.ts"
    ]
  }
};

var tscSource = [].concat.apply([], [
  //PATHS.excludes,
  PATHS.glib.math,
  PATHS.glib.base,
  PATHS.glib.input,
  PATHS.glib.graphics,
  PATHS.glib.content,
  PATHS.glib.rendering,
  PATHS.glib.components,
  PATHS.glib.other
]);

var es5Project = tsc.createProject({
  target: "es5",
  declaration: true,
  noExternalResolve: true,
  typescript: require('typescript')
});

var es6Project = tsc.createProject({
  target: "es6",
  declaration: true,
  noExternalResolve: true,
  typescript: require('typescript')
});

function src(){
  return gulp.src.apply(gulp, arguments).pipe(plumber())
}

gulp.task('clean', function(){
  return merge([
    src(PATHS.dist).pipe(clean()),
    src('src/glib/graphics/enums/*.ts').pipe(clean())
  ]);
});

function dest(){
  var target = PATHS.dist;
  if (arguments.length) {
    var join = path.join;
    target = join(target, path.join.apply(path, arguments));
  }
  return gulp.dest(target);
}

//
// ASSETS COMPILATION TASKS
//

gulp.task('assets', function(){
  src(PATHS.assets)
    .pipe(dest('assets'))
    .pipe(glibAssets('package.json'))
    .pipe(dest('assets'));
});

//
// PRE COMPILATION TASKS
//

gulp.task('precompile:enums', function(){
  return gulp
    .src("tools/enums.json")
    .pipe(glibEnums())
    .pipe(concat('Enums.ts'))
    .pipe(gulp.dest('src/glib/graphics/enums/'));
});

gulp.task('precompile:tsconfig', function(){
  var glob = require("globby");
  //console.log(tscSource);
  glob(tscSource, function(err, files){
    var config = JSON.parse(fs.readFileSync("tsconfig.json"));
    var equals = (config.files || []).every(function(entry, index) {
      return entry === files[index];
    });
    if (!equals) {
      config.files = files;
      var result = JSON.stringify(config, null, 2);
      fs.writeFileSync("tsconfig.json", result);
    }
  });
});


gulp.task('precompile', ['precompile:enums', 'precompile:tsconfig']);

//
// TS COMPILATION TASKS
//

gulp.task('compile:es5', function(){
  var tscResult = src(tscSource).pipe(tsc(es5Project));
  return merge([
    tscResult.dts.pipe(dest("typedefs")),
    tscResult.js
      .pipe(concat('glib.js'))
      .pipe(dest("scripts"))
  ]);
});

gulp.task('compile:es6', function(){
  var tscResult = src(tscSource).pipe(tsc(es6Project));
  return tscResult.dts.pipe(dest("typedefs"));
});

gulp.task('compile', ['compile:es5', 'compile:es6']);

//
// DOCS & PAGES TASKS
//

gulp.task('docs', function(){
  return gulp.src(tscSource).pipe(typedoc({
    target: "ES5",
    out: "dist/docs/",
    name: "Glib"
  }));
});

gulp.task('pages:scss', function(){
  return src(PATHS.styles)
    .pipe(sass({
      includePaths: ["node_modules/foundation-apps/scss"]
    }).on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(dest());
});

gulp.task('pages:jade', function(){
  return glibPages(PATHS.pages).pipe(dest());
});

gulp.task('pages', ['pages:scss', 'pages:jade']);

//
// WATCHER TASKS
//

gulp.task('watch:pages', ['pages'], function(){
  gulp.watch(PATHS.pages, ['pages']);
});

gulp.task('watch', ['compile', 'pages', 'assets'], function(){
  gulp.watch(tscSource, ['compile:es5', 'precompile:tsconfig']);
  gulp.watch(PATHS.pages, ['pages:jade']);
  gulp.watch(PATHS.stylesWatch, ['pages:scss']);
  gulp.watch(PATHS.assets, ['assets']);
});

gulp.task('serve', serve({
  root: ['dist'],
  port: 3000
}));

gulp.task('default', ['watch', 'serve', 'watch:test']);


//
//
//
gulp.task('test', function (done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('watch:test', function (done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});
