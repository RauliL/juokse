const gulp = require('gulp');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const pegjs = require('gulp-pegjs');

gulp.task('default', ['build']);

gulp.task('build', () => {
  return gulp.src('./src/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('./lib'));
});

gulp.task('watch', ['build'], () => {
  gulp.watch('./src/*.js', ['build']);
});
