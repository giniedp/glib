
'use strict';

var fs = require('fs');
var del = require('del');
var path = require('path');
var merge = require('merge');
var karma = require('karma');
var gulp = require('gulp');
var tsc = require('gulp-typescript');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var symlink = require('gulp-sym')
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var typedoc = require('gulp-typedoc');
var webserver = require('gulp-webserver');
var livereload = require('gulp-livereload');
var glibAssets = require('./tools/glib-assets.js');
var glibEnums = require('./tools/glib-enums.js');
var glibPages = require('./tools/glib-samples.js');
var remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
var relativeSourcemapsSource = require('gulp-relative-sourcemaps-source');

var PATHS = {
  dist: 'dist',
  distPage: '../page',
  assets: [
    'src/assets/**/*'
  ],
  page: {
    pages: [
      '!src/page/_layouts/*.pug',
      '!src/page/_includes/*.pug',
      '!src/page/**/_*.pug',
      'src/page/*/introduction/*.pug',
      'src/page/*/graphics-*/*.pug',
      'src/page/*/input/**/*.pug',
      'src/page/*/content/**/*.pug',
      'src/page/*/**/*.pug',
      'src/page/**/*.pug'
    ],
    fonts: [
      'bower_components/mdi/fonts/*',
    ],
    scripts: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/dat-gui/build/dat.gui.js',
      'bower_components/prism/prism.js',
      'bower_components/prism/components/prism-glsl.js',
      'bower_components/prism/components/prism-css.js',
      'bower_components/prism/components/prism-markup.js',
      'bower_components/prism/components/prism-javascript.js',
      'bower_components/prism/plugins/autolinker/prism-autolinker.js',
      'bower_components/prism/plugins/line-numbers/prism-line-numbers.js',
      'bower_components/prism/plugins/normalize-whitespace/prism-normalize-whitespace.js',
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
    math: [
      "!src/**/*.test.ts",
      "src/glib-math/**/*.ts"
    ],
    base: [
      "!src/**/*.test.ts",
      "src/glib/utils/**/*.ts",
      "src/glib/*.ts"
    ],
    graphics: [
      "!src/**/*.test.ts",
      "src/glib/graphics/enums/*.ts",
      "src/glib/graphics/states/*.ts",
      "src/glib/graphics/*.ts",
      "src/glib/graphics/geometry/*.ts",
      "src/glib/graphics/geometry/**/*.ts"
    ],
    content: [
      "!src/**/*.test.ts",
      "src/glib/content/*.ts",
      "src/glib/content/**/*.ts"
    ],
    input: [
      "!src/**/*.test.ts",
      "src/glib/input/*.ts",
      "src/glib/input/**/*.ts"
    ],
    render: [
      "!src/**/*.test.ts",
      "src/glib/render/*.ts",
      "src/glib/render/**/*.ts"
    ],
    ecs: [
      "!src/**/*.test.ts",
      "src/glib-ecs/**/*.ts"
    ],
    terrain: [
      "!src/**/*.test.ts",
      "src/glib/terrain/**/*.ts"
    ]
  }
};

var tscSource = [].concat.apply([], [
  PATHS.glib.math,
  PATHS.glib.base,
  PATHS.glib.graphics,
  PATHS.glib.input,
  PATHS.glib.content,
  PATHS.glib.render,
  PATHS.glib.ecs,
  PATHS.glib.terrain
]);

var es5Project = tsc.createProject({
  rootDir: path.join(__dirname, "src"),
  target: "es5",
  declaration: true,
  noResolve: true
});

var es6Project = tsc.createProject({
  rootDir: path.join(__dirname, "src"),
  target: "es6",
  declaration: true,
  noResolve: true
});

function src(){
  return gulp.src.apply(gulp, arguments)
  .pipe(plumber(function (err) {

    console.error(err.message || err);
    if (err.backtrace) {
      console.log(err.backtrace)
    }
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
    //src('src')
    //.pipe(symlink('dist/src', { force: true }))
    //.pipe(symlink('page/src', { force: true }))

  var tscResult = src(tscSource)
    .pipe(sourcemaps.init())
    .pipe(es5Project());

  tscResult.dts.pipe(dest("typedefs"))

  return merge([
    // types
    tscResult.dts.pipe(dest("typedefs")),

    tscResult.js
      .pipe(concat('glib.js'))
      .pipe(minify({ ext: { src: '.js', min: '.min.js' } }))
      //.pipe(relativeSourcemapsSource({ dest: PATHS.dist }))
      .pipe(sourcemaps.write('.'))
      .pipe(dest())
      .pipe(dest(PATHS.distPage))
      .pipe(livereload())
  ]);
});

gulp.task('compile:es6', function(){
  var tscResult = src(tscSource)
    .pipe(es6Project());
  return tscResult.js
    .pipe(concat('glib.es6.js'))
    .pipe(dest())
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
      jade: require('pug'),
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
gulp.task('watch:script', ['compile:es5'], function() {
  gulp.watch(tscSource, ['compile:es5']);
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

gulp.task('watch:test', ['watch:script'], function (done) {
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

gulp.task('remap', function(done) {
  return gulp
    .src('coverage/**/coverage-final.json')
    .pipe(remapIstanbul({
      reports: {
        //'json': 'coverage/coverage.json',
        //'lcovonly': 'lcov.info',
        text: undefined
      }
    }));
});
