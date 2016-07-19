
'use strict';

var fs = require('fs');
var del = require('del');
var path = require('path');
var merge = require('merge');
var karma = require('karma');
var gulp = require('gulp');
var tsc = require('gulp-typescript');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var typedoc = require('gulp-typedoc');
var webserver = require('gulp-webserver');
var livereload = require('gulp-livereload');
var glibAssets = require('./tools/glib-assets.js');
var glibEnums = require('./tools/glib-enums.js');
var glibPages = require('./tools/glib-pages.js');
var tsconfig = require("./tools/tsconfig");

var PATHS = {
  dist: 'dist',
  assets: [
    'src/assets/**/*'
  ],
  page: {
    pages: [
      '!src/page/layouts/*.jade',
      '!src/page/includes/*.jade',
      'src/page/**/*.jade'
    ],
    scripts: [
      'src/page/**/*.js'
    ],
    styles: [
      'src/page/style.scss'
    ],
    stylesWatch: [
      'src/page/**/*.scss'
    ],
  },
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

var tsconfigJson = {
  target: "es5",
  noResolve: true,
  out: PATHS.dist + "/scripts/glib.js",
  outDir: PATHS.dist + "/scripts",
  sourceMap: true,
  sourceRoot: "src",
  newLine: "LF",
  experimentalDecorators: false
}

var es5Project = tsc.createProject({
  target: "es5",
  declaration: true,        // Generates corresponding .d.ts files
  noExternalResolve: true,  // Do not resolve files that are not in the input
  typescript: require('typescript')
});

var es6Project = tsc.createProject({
  target: "es6",
  declaration: true,        // Generates corresponding .d.ts files
  noExternalResolve: true,  // Do not resolve files that are not in the input
  typescript: require('typescript')
});

function src(){
  return gulp.src.apply(gulp, arguments)
  .pipe(plumber(function (err) {
    console.error(err.message || err);
  }))
}

gulp.task('clean', function(){
  return del([
    PATHS.dist,
    'src/glib/graphics/enums/*.ts'
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
  return src(PATHS.assets)
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
  return src(tscSource).pipe(tsconfig("tsconfig.json", tsconfigJson));
});

gulp.task('precompile', ['precompile:enums', 'precompile:tsconfig']);

//
// TS COMPILATION TASKS
//

gulp.task('compile:es5', function(){
  var tscResult = src(tscSource)
    .pipe(sourcemaps.init())
    .pipe(tsc(es5Project));

  return merge([
    tscResult.dts.pipe(dest("es5/typedefs")),
    tscResult.js
      .pipe(concat('es5/glib.js'))
      .pipe(sourcemaps.write('.',{includeContent:false, sourceRoot:'../src/glib'}))
      .pipe(dest())
      .pipe(livereload())
  ]);
});

gulp.task('compile:es6', function(){
  var tscResult = src(tscSource)
    .pipe(sourcemaps.init())
    .pipe(tsc(es6Project));

  return merge([
    tscResult.dts.pipe(dest("es6/typedefs")),
    tscResult.js
      .pipe(concat('es6/glib.js'))
      .pipe(sourcemaps.write('.',{includeContent:false, sourceRoot:'../src/glib'}))
      .pipe(dest())
      .pipe(livereload())
  ]);
});

gulp.task('compile', ['compile:es5', 'compile:es6']);

//
// DOCS & PAGES TASKS
//

gulp.task('docs', function(){
  return gulp.src(tscSource).pipe(typedoc({
    target: "ES5",
    out: "dist/docs/",
    mode: "file",
    name: "Glib",
    entryPoint: "Glib",
    excludeExternals: true
  }));
});

gulp.task('page:scss', function(){
  return src(PATHS.page.styles)
    .pipe(sass({
      includePaths: ["node_modules/foundation-apps/scss"]
    }).on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(dest())
    .pipe(livereload());
});

gulp.task('page:jade', function(){
  return glibPages(PATHS.page.pages)
    .pipe(dest())
    .pipe(concat('views.html'))
    .pipe(livereload());
});

gulp.task('page:scripts', function(){
  return src(PATHS.page.scripts)
    .pipe(dest())
    .pipe(livereload());
});

gulp.task('page', ['page:scss', 'page:jade']);

//
// WATCHER TASKS
//

gulp.task('watch:pages', ['page'], function() {
  gulp.watch(PATHS.page.pages, ['page']);
  gulp.watch(PATHS.page.stylesWatch, ['page:scss']);
});

gulp.task('watch', ['compile', 'page', 'assets'], function() {
  livereload.listen();
  gulp.watch(['gulpfile.js'], ['compile', 'page', 'assets']);
  gulp.watch(tscSource, ['precompile:tsconfig', 'compile:es5']);
  gulp.watch(PATHS.page.pages, ['page:jade']);
  gulp.watch(PATHS.page.stylesWatch, ['page:scss']);
  gulp.watch(PATHS.assets, ['assets']);
});

gulp.task('serve', function() {
  gulp.src('dist')
    .pipe(webserver({
      //host: "0.0.0.0",
      port: 3000,
      livereload: true,
      directoryListing: false,
      open: false
    }));
});

gulp.task('test', function (done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('watch:test', ['watch'], function (done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('build', ['precompile', 'compile', 'assets', 'page', 'docs']);
gulp.task('dev', ['watch', 'serve'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});
gulp.task('default', ['build']);
