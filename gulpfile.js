var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');

var entry = './src/bundle-standalone.js'

var opts = {
  debug: true,
  entries: [entry]
};
var b = watchify(browserify(opts));

gulp.task('js', bundle);
function bundle() {
  return b.bundle()
    .pipe(source(entry))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
      .pipe(rename('./helios-audio-mixer.js'))
      .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
}

b.on('update', bundle);
b.on('log', gutil.log)
