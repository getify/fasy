"use strict";

QUnit.test( "concurrent: API methods", function test(assert){
	assert.expect( 2 );

	assert.ok( _hasProp( FA, "concurrent" ), "concurrent.*" ),
	assert.ok( _isFunction( FA.concurrent.forEach ), "forEach()" );
} );

QUnit.test( "serial: API methods", function test(assert){
	assert.expect( 2 );

	assert.ok( _hasProp( FA, "serial" ), "serial.*"),
	assert.ok( _isFunction( FA.serial.forEach ), "forEach()" );
} );

// QUnit.test( "API method aliases", function test(assert){
// 	assert.expect( 2 );

// 	assert.strictEqual( FA.concurrent.reduce, FA.serial.reduce, "reduce" );
// 	assert.strictEqual( FA.concurrent.reduceRight, FA.serial.reduceRight, "reduceRight" );
// } );

// QUnit.test( "identity()", function test(assert){
// 	var rExpected = 2;
// 	var pExpected = undefined;
// 	var qExpected = 3;

// 	var rActual = FPO.identity( {v: 2} );
// 	var pActual = FPO.identity()( {} )( { v: undefined } );
// 	var qActual = FPO.identity()( {} )( {v: 3} );

// 	assert.expect( 3 );
// 	assert.strictEqual( rActual, rExpected, "regular call" );
// 	assert.strictEqual( pActual, pExpected, "curried with undefined" );
// 	assert.strictEqual( qActual, qExpected, "curried with value" );
// } );






function _hasProp(obj,prop) {
	return Object.hasOwnProperty.call( obj, prop );
}

function _isFunction(v) {
	return typeof v == "function";
}

function _isObject(v) {
	return v && typeof v == "object" && !_isArray( v );
}

function _isArray(v) {
	return Array.isArray( v );
}
