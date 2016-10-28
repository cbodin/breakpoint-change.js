var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var pkg = require('./package.json');

var fileHeader = '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.homepage %> */\n';

gulp.task('js', function () {
  return gulp.src('./lib/breakpoint-change.js')
    .pipe(header(fileHeader, { pkg: pkg }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('jsmin', function () {
  return gulp.src('./lib/breakpoint-change.js')
    .pipe(rename({ suffix: '.min' }))
    .pipe(header(fileHeader, { pkg: pkg }))
    .pipe(uglify({ preserveComments: 'some' }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', [ 'js', 'jsmin' ]);
