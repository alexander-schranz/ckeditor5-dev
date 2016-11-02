/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const mockery = require( 'mockery' );
const gutil = require( 'gulp-util' );

describe( 'Tests', () => {
	let sandbox, tasks, seriesSpy;
	let takerTasks = {};
	let karmaConfig, karmaCallback;

	beforeEach( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		sandbox = sinon.sandbox.create();

		// Mock of Undertaker is used to check whether `tests.test()` works properly.
		mockery.registerMock( 'undertaker', class {
			on() {}

			task( name, fn ) {
				// "compile" task is not defined in `tests.js` module.
				// We don't want to call him so we use a spy.
				if ( name === 'compile' ) {
					fn = sinon.spy();
				}

				takerTasks[ name ] = fn;
			}

			// Runs given tasks or functions one after another.
			series( ...tasksOrFunctions ) {
				for ( const taskOrFn of tasksOrFunctions ) {
					if ( taskOrFn instanceof Function ) {
						taskOrFn();
					} else {
						takerTasks[ taskOrFn ]();
					}
				}

				seriesSpy = sinon.spy();

				return seriesSpy;
			}
		} );

		// Mock of Karma Server is used to check whether `testa.runTests()` works properly.
		mockery.registerMock( 'karma', {
			Server: class {
				constructor( options, callback ) {
					karmaConfig = options;
					karmaCallback = callback;
				}

				start() {
					// Similation of running the tests.
					setTimeout( karmaCallback );
				}
			}
		} );

		tasks = require( '../lib/tasks' );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
	} );

	describe( 'tasks.runTests()', () => {
		it( 'runs the tests', () => {
			const utils = require( '../lib/utils' );
			const logStub = sandbox.stub( gutil, 'log' );

			// Config which returns "utils.getKarmaConfig()" method.
			const karmaOptions = {
				browsers: [ 'Chrome' ],
				singleRun: true
			};

			// Stub the "utils.getKarmaConfig()" method. Will return prepared config for Karma.
			const karmaConfigStub = sandbox.stub( utils, 'getKarmaConfig' )
				.returns( karmaOptions );

			// Options which are required by "utils.getKarmaConfig()" method.
			const karmaConfigUtilsOptions = {
				sourcePath: 'foo',
				coverage: true
			};

			// Run the tests.
			return tasks.runTests( karmaConfigUtilsOptions )
				.then( () => {
					// Checks whether "utils.getKarmaConfig()" was called...
					expect( karmaConfigStub.calledOnce ).to.equal( true );

					// ...with the proper arguments.
					expect( karmaConfigStub.firstCall.args[ 0 ] ).to.equal( karmaConfigUtilsOptions );

					// Checks whether Karma.Server constructor was called with proper arguments.
					expect( karmaConfig ).to.deep.equal( karmaOptions );

					// Checks whether a path to the coverage report has been showed.
					expect( logStub.calledOnce ).to.equal( true );
				} );
		} );
	} );

	describe( 'tasks.test()', () => {
		it( 'compile sources and run compiled files', () => {
			tasks.runTests = sinon.spy();

			const options = {
				packages: [ './ckeditor5-package/' ],
				foo: 'bar'
			};

			// Check whether the task returned a Promise.
			return tasks.test( options )
				.then( () => {
					// Check whether the tasks have been registered (in Undertaker registry).
					expect( takerTasks.compile ).to.be.a( 'function' );
					expect( takerTasks.runTests ).to.be.a( 'function' );

					// Check whether the tasks have been called.
					expect( takerTasks.compile.calledOnce ).to.equal( true );

					expect( tasks.runTests.calledOnce ).to.equal( true );
					expect( tasks.runTests.firstCall.args[ 0 ] ).to.deep.equal( options );

					// Check whether the whole task has called.
					expect( seriesSpy.calledOnce ).to.equal( true );
				} );
		} );
	} );
} );
