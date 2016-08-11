/**
 * Created by Roy on 11/05/2016.
 */

// npm modules
var gulp  = require('gulp'),
	mocha = require('gulp-mocha');

gulp.task('run-tests', function () {
	return gulp.src('test/*.spec.js', {read: false})
		.pipe(mocha({reporter: 'spec'}));
});