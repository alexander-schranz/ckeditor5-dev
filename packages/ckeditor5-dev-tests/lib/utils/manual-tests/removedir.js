/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const del = require( 'del' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const gutil = require( 'gulp-util' );
/**
 * Removes directory
 * dir package protects you against deleting the current working directory and above.
 *
 * @param {String} dir Directory to remove.
 * @returns {Promise}
 */
module.exports = function removeDir( dir ) {
	return del( dir ).then( () => {
		logger().info( `Removed directory: '${ gutil.colors.cyan( dir ) }'` );
	} );
};
