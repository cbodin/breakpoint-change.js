var gulp = require('gulp');
var umd = require('gulp-umd');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var pkg = require('./package.json');

var fileHeader = '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.homepage %> */\n';
var umdOptions = {
  exports: function () {
    return 'BreakpointChange';
  },
  namespace: function () {
    return 'BreakpointChange';
  },
  templateName: 'amdNodeWeb'
};

gulp.task('js', function () {
  return gulp.src('./lib/breakpoint-change.js')
    .pipe(umd(umdOptions))
    .pipe(header(fileHeader, { pkg: pkg }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('jsmin', function () {
  return gulp.src('./lib/breakpoint-change.js')
    .pipe(umd(umdOptions))
    .pipe(rename({ suffix: '.min' }))
    .pipe(header(fileHeader, { pkg: pkg }))
    .pipe(uglify({ preserveComments: 'some' }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', [ 'js', 'jsmin' ]);
