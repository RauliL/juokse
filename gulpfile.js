const gulp = require('gulp');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const pegjs = require('gulp-pegjs');

gulp.task('default', ['generate-parser', 'build']);

gulp.task('build', () => {
  return gulp.src('./src/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('./lib'));
});

gulp.task('generate-parser', () => {
  return gulp.src('./src/parser.pegjs')
    .pipe(pegjs({ format: 'commonjs' }))
    .pipe(gulp.dest('./lib'));
});

gulp.task('watch', ['generate-parser', 'build'], () => {
  gulp.watch('./src/*.js', ['build']);
  gulp.watch('./src/parser.pegjs', ['generate-parser']);
});
