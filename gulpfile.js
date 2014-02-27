/*

    wtf is this?

        edit source/helios-audio-mixer.js using gulp watch.
        It'll auto-compile into standalone and angular versions.

*/

var gulp        = require('gulp'),
    uglify      = require('gulp-uglify'),
    replace     = require('gulp-replace'),
    rename      = require('gulp-rename'),
    fs          = require('fs'),
    refresh     = require('gulp-livereload'),
    live_reload = require('tiny-lr');

var lr_server   = live_reload();

var content = function(){
    return fs.readFileSync('source/helios-audio-mixer.js', 'utf8');
}

gulp.task('build', function(){
    return gulp.src(['source/wrapper.standalone.js'])
        .pipe(replace('%%% REPLACE %%%', content() ))
        .pipe(rename({ basename: 'helios-audio-mixer' }))
        .pipe(gulp.dest('.'))
        .pipe(uglify({ mangle: false }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('.'))
        .pipe(refresh(lr_server))
})

gulp.task('build-ng', function(){
    return gulp.src(['source/wrapper.angular.js'])
        .pipe(replace('%%% REPLACE %%%', content() ))
        .pipe(rename({
            basename: 'helios-audio-mixer.angular'
        }))
        .pipe(gulp.dest('.'))
})

gulp.task('build-require', function(){
    return gulp.src(['source/wrapper.require.js'])
        .pipe(replace('%%% REPLACE %%%', content() ))
        .pipe(rename({
            basename: 'helios-audio-mixer.require'
        }))
        .pipe(gulp.dest('.'))
        .pipe(uglify({ mangle: false }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('.'))
})


gulp.task('default', ['build', 'build-ng', 'build-require', 'watch']);

gulp.task('watch',function(){

    // lr_server.listen(35729);

    gulp.watch('source/*.js', ['build', 'build-ng', 'build-require']);

})