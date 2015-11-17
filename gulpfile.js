var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var livereload   = require('gulp-livereload');

var entry = {
  standalone: './src/bundle-standalone.js',
  browserify: './src/bundle-browserify.js',
};

/*

  Watch

*/

function handleError(e){
  console.log(e);
}


gulp.task('default', function(){
  livereload.listen();

  var b = browserify({
    debug: true,
    entries: [entry.standalone]
  });

  var w = watchify(b);

  function bundle() {
    return w.bundle()
      .on('error', handleError)
      .pipe(source(entry.standalone))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(rename('./helios-audio-mixer.js'))
        .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./'))
      .pipe(livereload());
  }

  w.on('update', bundle);
  w.on('log', gutil.log);

  bundle();
});






/*

  Build

*/

// gulp.task('build-browserify', function(){
//   var b = browserify({
//     debug: false,
//     entries: entry.browserify
//   });
//   return b.bundle()
//     .pipe(source(entry.browserify))
//     .pipe(buffer())
//       .pipe(uglify(uglifyOpts))
//       .pipe(rename('./helios-audio-mixer.browserify.min.js'))
//     .pipe(gulp.dest('./'));
// });

gulp.task('build', function(){
  var b = browserify({
    debug: false,
    entries: entry.standalone
  });
  return b.bundle()
    .pipe(source(entry.standalone))
    .pipe(buffer())
      .pipe(uglify({}))
      .pipe(rename('./helios-audio-mixer.min.js'))
    .pipe(gulp.dest('./'));
});

// gulp.task('build', ['build-standalone', 'build-browserify']);