
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
var glibPages = require('./tools/glib-samples.js');

var PATHS = {
  dist: 'dist',
  distPage: '../page',
  assets: [
    'src/assets/**/*'
  ],
  page: {
    pages: [
      '!src/page/_layouts/*.jade',
      '!src/page/_includes/*.jade',
      '!src/page/**/_*.jade',
      'src/page/**/*.jade'
    ],
    fonts: [
      'bower_components/mdi/fonts/*',
    ],
    scripts: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/prism/prism.js',
      'bower_components/prism/components/prism-glsl.js',
      'bower_components/prism/components/prism-css.js',
      'bower_components/prism/components/prism-markup.js',
      'bower_components/prism/components/prism-javascript.js',
      'bower_components/prism/plugins/autolinker.js',
      'bower_components/prism/plugins/line-numbers.js',
      'src/page/**/*.js'
    ],
    styleIncludes: [
      'bower_components'
    ],
    styles: [
      'src/page/page.scss'
    ],
    stylesWatch: [
      'src/page/**/*.scss'
    ],
  },
  glib: {
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

function dest(){
  var target = PATHS.dist;
  if (arguments.length) {
    var join = path.join;
    target = join(target, path.join.apply(path, arguments));
  }
  return gulp.dest(target);
}

gulp.task('clean', function(){
  return del([PATHS.dist]);
});

//
// ASSETS COMPILATION TASKS
//

gulp.task('assets', function(){
  return src(PATHS.assets)
    .pipe(dest(PATHS.distPage + '/assets'))
    .pipe(glibAssets('package.json'))
    .pipe(dest(PATHS.distPage + '/assets'));
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

gulp.task('precompile', ['precompile:enums']);

//
// TS COMPILATION TASKS
//

gulp.task('compile:es5', function(){
  var tscResult = src(tscSource)
    .pipe(sourcemaps.init())
    .pipe(tsc(es5Project));

  return merge([
    tscResult.dts.pipe(dest("typedefs")),
    tscResult.js
      .pipe(concat('glib.js'))
      .pipe(dest())
      .pipe(sourcemaps.write('.',{includeContent:false, sourceRoot:'src/glib'}))
      .pipe(dest(PATHS.distPage))
      .pipe(livereload())
  ]);
});

gulp.task('compile:es6', function(){
  var tscResult = src(tscSource)
    .pipe(tsc(es6Project));
  return tscResult.js
    .pipe(concat('glib.es6.js'))
    .pipe(dest());
});

gulp.task('compile', ['compile:es5', 'compile:es6']);

//
// DOCS & PAGES TASKS
//

gulp.task('docs', function(){
  return gulp.src(tscSource).pipe(typedoc({
    target: "ES5",
    out: "page/docs/",
    mode: "file",
    name: "Glib",
    readme: 'none',
    //entryPoint: "Glib",
    excludeExternals: true
  }));
});

gulp.task('page:fonts', function(){
  return src(PATHS.page.fonts)
    .pipe(dest(PATHS.distPage, 'fonts'));
});

gulp.task('page:scss', function(){
  return src(PATHS.page.styles)
    .pipe(sass({
      includePaths: PATHS.page.styleIncludes
    }).on('error', sass.logError))
    .pipe(concat('page.css'))
    .pipe(dest(PATHS.distPage))
    .pipe(livereload());
});

gulp.task('page:jade', function(){
  return src(PATHS.page.pages)
    .pipe(glibPages.sampler('src/page/samples'))
    .pipe(jade({
      pretty: true,
      locals: {
        samples: glibPages.samples
      }
    }))
    .pipe(dest(PATHS.distPage))
    .pipe(concat('views.html'))
    .pipe(livereload());
});

gulp.task('page:scripts', function(){
  return src(PATHS.page.scripts)
    .pipe(concat('page.js'))
    .pipe(dest(PATHS.distPage))
    .pipe(livereload());
});

gulp.task('page', ['page:fonts', 'page:scripts', 'page:scss', 'page:jade']);

//
// WATCHER TASKS
//

gulp.task('watch:pages', ['page'], function() {
  gulp.watch(PATHS.page.pages, ['page']);
  gulp.watch(PATHS.page.stylesWatch, ['page:scss']);
});
gulp.task('watch:docs', ['docs'], function (done) {
  gulp.watch(tscSource, ['docs']);
});
gulp.task('watch', ['compile', 'page', 'assets'], function() {
  livereload.listen();
  gulp.watch(PATHS.assets, ['assets']);
  gulp.watch(tscSource, ['compile:es5']);
  gulp.watch(PATHS.page.pages, ['page:jade']);
  gulp.watch(PATHS.page.scripts, ['page:scripts']);
  gulp.watch(PATHS.page.stylesWatch, ['page:scss']);
});

gulp.task('serve', function() {
  gulp.src('page')
    .pipe(webserver({
      host: "0.0.0.0",
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
