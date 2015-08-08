(function(){
  'use strict';

  var fs = require("fs");
  var gulp = require('gulp');
  var path = require('path');
  var merge = require('merge');
  var tsc = require('gulp-typescript');
  var concat = require('gulp-concat');
  var jade = require('gulp-jade');

  var typedoc = require("gulp-typedoc");

  var glibAssets = require('./tools/glib-assets.js');
  var glibEnums = require('./tools/glib-enums.js');
  var glibPages = require('./tools/glib-pages.js');

  var distDir = 'dist';

  var PATHS = {
    dist: 'dist',
    pages: [
      '!src/pages/layouts/*.jade',
      'src/**/*.jade'
    ],
    assets: [
      'src/assets/**/*'
    ],
    vlib: ["src/vlib/*.ts"],
    glib: {
      base: [
        "src/glib/base/**/*.ts"
      ],
      rendering: [
        "src/glib/rendering/**/*.ts"
      ],
      graphics: [
        "src/glib/graphics/enums/*.ts",
        "src/glib/graphics/states/*.ts",
        "src/glib/graphics/*.ts"
      ],
      input: [
        "src/glib/input/**/*.ts"
      ],
      components: [
        "src/glib/scene/**/*.ts"
      ]
    }
  };

  var tscSource = [].concat.apply([], [
    PATHS.vlib,
    PATHS.glib.base,
    PATHS.glib.input,
    PATHS.glib.graphics,
    PATHS.glib.rendering,
    PATHS.glib.components
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

  gulp.task('clean', function(){
    return merge([
      gulp.src(PATHS.dist).pipe(clean()),
      gulp.src('src/glib/graphics/enums/*.ts').pipe(clean())
    ]);
  });

  //
  // ASSETS COMPILATION TASKS
  //

  gulp.task('assets', function(){
    gulp.src(PATHS.assets)
      .pipe(gulp.dest(distDir + '/assets'))
      .pipe(glibAssets('package.json'))
      .pipe(gulp.dest(distDir + '/assets'));
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
    var tscResult = gulp.src(tscSource).pipe(tsc(es5Project));
    return merge([
      tscResult.dts.pipe(gulp.dest("dist/typedefs")),
      tscResult.js
        .pipe(concat('glib.js'))
        .pipe(gulp.dest("dist/scripts"))
    ]);
  });

  gulp.task('compile:es6', function(){
    var tscResult = gulp.src(tscSource).pipe(tsc(es6Project));
    return tscResult.dts.pipe(gulp.dest("dist/typedefs"));
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

  gulp.task('pages', function(){
    glibPages(PATHS.pages).pipe(gulp.dest('dist'));
  });

  //
  // WATCHER TASKS
  //

  gulp.task('watch:pages', ['pages'], function(){
    gulp.watch(PATHS.pages, function(){
      gulp.run('pages');
    });
  });

  gulp.task('watch', ['compile', 'pages', 'assets'], function(){
    gulp.watch(tscSource, function(){
      gulp.run('compile:es5');
    });

    gulp.watch(PATHS.pages, function(){
      gulp.run('pages');
    });

    gulp.watch(PATHS.assets, function(){
      gulp.run('assets');
    });
  });
}());
