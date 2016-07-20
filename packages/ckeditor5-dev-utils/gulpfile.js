/* jshint browser: false, node: true, strict: true */

'use strict';

const gulp = require( 'gulp' );

const config = {
	ROOT_DIR: '.',
	WORKSPACE_DIR: '..',

	// Files ignored by jshint and jscs tasks. Files from .gitignore will be added automatically during tasks execution.
	IGNORED_FILES: [
		'src/lib/**'
	]
};

require( './dev/tasks/lint/tasks' )( config ).register();

gulp.task( 'pre-commit', [ 'lint-staged' ] );
