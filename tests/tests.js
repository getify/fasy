"use strict";

QUnit.test( "concurrent: API methods", function test(assert){
	assert.expect( 6 );

	assert.ok( _hasProp( FA, "concurrent" ), "FA.concurrent" ),
	assert.ok( _isFunction( FA.concurrent.filter ), "filter()" );
	assert.ok( _isFunction( FA.concurrent.forEach ), "forEach()" );
	assert.ok( _isFunction( FA.concurrent.map ), "map()" );
	assert.ok( _isFunction( FA.concurrent.reduce ), "reduce()" );
	assert.ok( _isFunction( FA.concurrent.reduceRight ), "reduceRight()" );
} );

QUnit.test( "serial: API methods", function test(assert){
	assert.expect( 6 );

	assert.ok( _hasProp( FA, "serial" ), "FA.serial" ),
	assert.ok( _isFunction( FA.serial.filter ), "filter()" );
	assert.ok( _isFunction( FA.serial.forEach ), "forEach()" );
	assert.ok( _isFunction( FA.serial.map ), "map()" );
	assert.ok( _isFunction( FA.serial.reduce ), "reduce()" );
	assert.ok( _isFunction( FA.serial.reduceRight ), "reduceRight()" );
} );

QUnit.test( "concurrent.filter()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return false;
		}
		return true;
	}

	async function delayedIsEven(v) {
		await _delay( 10 );
		return v % 2 == 0;
	}

	async function delayedIsOdd(v) {
		try {
			assert.step( `delayedIsOdd @ start: ${v}` );
			await _delay( 10 );
			return v % 2 == 1;
		}
		finally {
			assert.step( `delayedIsOdd @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,4];
	var pExpected = [1,3,5];
	var qExpected = [
		"filter:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1", "delayedIsOdd @ start: 2", "delayedIsOdd @ start: 3", "delayedIsOdd @ start: 4", "delayedIsOdd @ start: 5",
		"filter:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1", "delayedIsOdd @ end: 2", "delayedIsOdd @ end: 3", "delayedIsOdd @ end: 4", "delayedIsOdd @ end: 5",
		"filter@delayedIsOdd @ resolved"
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		var rActual = FA.concurrent.filter( delayedIsEven, list );
		assert.step( "filter:delayedIsOdd @ start" );
		var pActual = FA.concurrent.filter( delayedIsOdd, list );
		assert.step( "filter:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.concurrent.filter( checkParams, list );
		var sActual = FA.concurrent.filter( () => true );
		var uActual = FA.concurrent.filter( () => true, [] );

		var rActual = await rActual;
		var pActual = await pActual;
		assert.step( "filter@delayedIsOdd @ resolved" );
		// qActual;
		var tActual = await tActual;
		var sActual = await sActual;
		var uActual = await uActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 19 ); // note: 6 assertions + 13 `step(..)` calls
	assert.deepEqual( rActual, rExpected, "normal delay" );
	assert.deepEqual( pActual, pExpected, "concurrency check: result" );
	assert.verifySteps( qExpected, "concurrency check: steps" );
	assert.deepEqual( tActual, tExpected, "predicate params check" );
	assert.deepEqual( sActual, sExpected, "array undefined" );
	assert.deepEqual( uActual, uExpected, "array empty" );

	done();
} );

QUnit.test( "serial.filter()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return false;
		}
		return true;
	}

	async function delayedIsEven(v) {
		await _delay( 10 );
		return v % 2 == 0;
	}

	async function delayedIsOdd(v) {
		try {
			assert.step( `delayedIsOdd @ start: ${v}` );
			await _delay( 10 );
			return v % 2 == 1;
		}
		finally {
			assert.step( `delayedIsOdd @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,4];
	var pExpected = [1,3,5];
	var qExpected = [
		"filter:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1",
		"filter:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1",
		"delayedIsOdd @ start: 2", "delayedIsOdd @ end: 2",
		"delayedIsOdd @ start: 3", "delayedIsOdd @ end: 3",
		"delayedIsOdd @ start: 4", "delayedIsOdd @ end: 4",
		"delayedIsOdd @ start: 5", "delayedIsOdd @ end: 5",
		"filter:delayedIsOdd @ resolved",
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		var rActual = FA.serial.filter( delayedIsEven, list );
		assert.step( "filter:delayedIsOdd @ start" );
		var pActual = FA.serial.filter( delayedIsOdd, list );
		assert.step( "filter:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.serial.filter( checkParams, list );
		var sActual = FA.serial.filter( () => true );
		var uActual = FA.serial.filter( () => true, [] );

		var rActual = await rActual;
		var pActual = await pActual;
		assert.step( "filter:delayedIsOdd @ resolved" );
		// qActual;
		var tActual = await tActual;
		var sActual = await sActual;
		var uActual = await uActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 19 ); // note: 6 assertions + 13 `step(..)` calls
	assert.deepEqual( rActual, rExpected, "normal delay" );
	assert.deepEqual( pActual, pExpected, "serial check: result" );
	assert.verifySteps( qExpected, "serial check: steps" );
	assert.deepEqual( tActual, tExpected, "predicate params check" );
	assert.deepEqual( sActual, sExpected, "array undefined" );
	assert.deepEqual( uActual, uExpected, "array empty" );

	done();
} );

QUnit.test( "processing function* generator", async function test(assert){
	function *doStep(v) {
		yield _delay( 10 );
		assert.step( `doStep: ${v}` );
	}

	function *doThrow(v) {
		if (v == "delay-throw") yield _delay( 10 );
		throw `nope: ${v}`;
	}

	function *doReject(v) {
		if (v == "delay-reject") yield _delay( 10 );
		yield Promise.reject( `nope: ${v}` );
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [
		"doStep: 1", "doStep: 2", "doStep: 3", "doStep: 4", "doStep: 5",
		"nope: 1", "nope: delay-throw", "nope: 2", "nope: delay-reject"
	];

	try {
		await FA.concurrent.forEach( doStep, list );

		try { await FA.concurrent.forEach( doThrow, [1] ); }
		catch (err) { assert.step( err.toString() ); }

		try { await FA.concurrent.forEach( doThrow, ["delay-throw"] ); }
		catch (err) { assert.step( err.toString() ); }

		try { await FA.concurrent.forEach( doReject, [2] ); }
		catch (err) { assert.step( err.toString() ); }

		try { await FA.concurrent.forEach( doReject, ["delay-reject"] ); }
		catch (err) { assert.step( err.toString() ); }
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 10 ); // note: 1 assertions + 9 `step(..)` calls
	assert.verifySteps( rExpected, "generator steps" );

	done();
} );

QUnit.test( "concurrent.forEach()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return;
		}
		throw "Wrong parameters";
	}

	async function delayedEach(v) {
		try {
			assert.step( `delayedEach @ start: ${v}` );
			await _delay( 10 );
		}
		finally {
			assert.step( `delayedEach @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = undefined;
	var pExpected = [
		"filter:delayedEach @ start",
		"delayedEach @ start: 1", "delayedEach @ start: 2", "delayedEach @ start: 3", "delayedEach @ start: 4", "delayedEach @ start: 5",
		"filter:delayedEach @ end",
		"delayedEach @ end: 1", "delayedEach @ end: 2", "delayedEach @ end: 3", "delayedEach @ end: 4", "delayedEach @ end: 5",
		"filter:delayedEach @ resolved",
	];
	var qExpected = undefined;
	var tExpected = undefined;
	var sExpected = undefined;

	try {
		assert.step( "filter:delayedEach @ start" );
		var rActual = FA.concurrent.forEach( delayedEach, list );
		assert.step( "filter:delayedEach @ end" );
		// pActual;
		var qActual = FA.concurrent.forEach( checkParams, list );
		var tActual = FA.concurrent.forEach( () => true );
		var sActual = FA.concurrent.forEach( () => true, [] );

		var rActual = await rActual;
		assert.step( "filter:delayedEach @ resolved" );
		// pActual;
		var qActual = await qActual;
		var tActual = await tActual;
		var sActual = await sActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 18 ); // note: 5 assertions + 10 `step(..)` calls
	assert.strictEqual( rActual, rExpected, "concurrency check: result" );
	assert.verifySteps( pExpected, "concurrency check: steps" );
	assert.strictEqual( qActual, qExpected, "predicate params check" );
	assert.strictEqual( tActual, tExpected, "array undefined" );
	assert.strictEqual( sActual, sExpected, "array empty" );

	done();
} );

QUnit.test( "serial.forEach()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return;
		}
		throw "Wrong parameters";
	}

	async function delayedEach(v) {
		try {
			assert.step( `delayedEach @ start: ${v}` );
			await _delay( 10 );
		}
		finally {
			assert.step( `delayedEach @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = undefined;
	var pExpected = [
		"filter:delayedEach @ start",
		"delayedEach @ start: 1",
		"filter:delayedEach @ end",
		"delayedEach @ end: 1",
		"delayedEach @ start: 2", "delayedEach @ end: 2",
		"delayedEach @ start: 3", "delayedEach @ end: 3",
		"delayedEach @ start: 4", "delayedEach @ end: 4",
		"delayedEach @ start: 5", "delayedEach @ end: 5",
		"filter:delayedEach @ resolved",
	];
	var qExpected = undefined;
	var tExpected = undefined;
	var sExpected = undefined;

	try {
		assert.step( "filter:delayedEach @ start" );
		var rActual = FA.serial.forEach( delayedEach, list );
		assert.step( "filter:delayedEach @ end" );
		// pActual;
		var qActual = FA.serial.forEach( checkParams, list );
		var tActual = FA.serial.forEach( () => true );
		var sActual = FA.serial.forEach( () => true, [] );

		var rActual = await rActual;
		assert.step( "filter:delayedEach @ resolved" );
		// pActual;
		var qActual = await qActual;
		var tActual = await tActual;
		var sActual = await sActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 18 ); // note: 5 assertions + 10 `step(..)` calls
	assert.strictEqual( rActual, rExpected, "concurrency check: result" );
	assert.verifySteps( pExpected, "concurrency check: steps" );
	assert.strictEqual( qActual, qExpected, "predicate params check" );
	assert.strictEqual( tActual, tExpected, "array undefined" );
	assert.strictEqual( sActual, sExpected, "array empty" );

	done();
} );





function _delay(ms) {
	return new Promise(res => setTimeout(res,ms));
}

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
