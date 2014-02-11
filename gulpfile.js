
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename');

// Build dist & test versions

gulp.task('build', function(){

    var content = gulp.src('source/js/helios-audio-mixer.js');

    gulp.src(['source/js/wrapper.standalone.js'])
        .pipe(replace('%%% REPLACE %%%', content))
        .pipe(gulp.dest('./helios-audio-mixer.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./'))

    gulp.src(['source/js/wrapper.angular.js'])
        .pipe(replace(/ /g, content))
        .pipe(gulp.dest('./helios-audio-mixer.angular.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./'))

})


gulp.task('default', ['build']);

