"use strict";

QUnit.test( "concurrent: API methods", function test(assert){
	assert.expect( 6 );

	assert.ok( _hasProp( FA, "concurrent" ), "FA.concurrent" ),
	assert.ok( _isFunction( FA.concurrent.filterIn ), "filterIn()" );
	assert.ok( _isFunction( FA.concurrent.filterOut ), "filterOut()" );
	assert.ok( _isFunction( FA.concurrent.forEach ), "forEach()" );
	assert.ok( _isFunction( FA.concurrent.map ), "map()" );
	assert.ok( _isFunction( FA.concurrent.flatMap ), "flatMap()" );
} );

QUnit.test( "serial: API methods", function test(assert){
	assert.expect( 10 );

	assert.ok( _hasProp( FA, "serial" ), "FA.serial" ),
	assert.ok( _isFunction( FA.serial.filterIn ), "filterIn()" );
	assert.ok( _isFunction( FA.serial.filterOut ), "filterOut()" );
	assert.ok( _isFunction( FA.serial.forEach ), "forEach()" );
	assert.ok( _isFunction( FA.serial.map ), "map()" );
	assert.ok( _isFunction( FA.serial.flatMap ), "flatMap()" );
	assert.ok( _isFunction( FA.serial.reduce ), "reduce()" );
	assert.ok( _isFunction( FA.serial.reduceRight ), "reduceRight()" );
	assert.ok( _isFunction( FA.serial.pipe ), "pipe()" );
	assert.ok( _isFunction( FA.serial.compose ), "compose()" );
} );

QUnit.test( "API method aliases", function test(assert){
	assert.expect( 6 );

	assert.strictEqual( FA.concurrent.filter, FA.concurrent.filterIn, "concurrent: filter -> filterIn" );
	assert.strictEqual( FA.serial.filter, FA.serial.filterIn, "serial: filter -> filterIn" );
	assert.strictEqual( FA.concurrent.reduce, FA.serial.reduce, "concurrent.reduce -> serial.reduce" );
	assert.strictEqual( FA.concurrent.reduceRight, FA.serial.reduceRight, "concurrent.reduceRight -> serial.reduceRight" );
	assert.strictEqual( FA.concurrent.pipe, FA.serial.pipe, "concurrent.pipe -> serial.pipe" );
	assert.strictEqual( FA.concurrent.compose, FA.serial.compose, "concurrent.compose -> serial.compose" );
} );

QUnit.test( "concurrent.filterIn()", async function test(assert){
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
		"filterIn:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1", "delayedIsOdd @ start: 2", "delayedIsOdd @ start: 3", "delayedIsOdd @ start: 4", "delayedIsOdd @ start: 5",
		"filterIn:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1", "delayedIsOdd @ end: 2", "delayedIsOdd @ end: 3", "delayedIsOdd @ end: 4", "delayedIsOdd @ end: 5",
		"filterIn:delayedIsOdd @ resolved"
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.concurrent.filterIn( delayedIsEven, list );
		assert.step( "filterIn:delayedIsOdd @ start" );
		var pActual = FA.concurrent.filterIn( delayedIsOdd, list );
		assert.step( "filterIn:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.concurrent.filterIn( checkParams, list );
		var sActual = FA.concurrent.filterIn( () => true );
		var uActual = FA.concurrent.filterIn( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "filterIn:delayedIsOdd @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.filterIn()", async function test(assert){
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
		"filterIn:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1",
		"filterIn:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1",
		"delayedIsOdd @ start: 2", "delayedIsOdd @ end: 2",
		"delayedIsOdd @ start: 3", "delayedIsOdd @ end: 3",
		"delayedIsOdd @ start: 4", "delayedIsOdd @ end: 4",
		"delayedIsOdd @ start: 5", "delayedIsOdd @ end: 5",
		"filterIn:delayedIsOdd @ resolved",
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.filterIn( delayedIsEven, list );
		assert.step( "filterIn:delayedIsOdd @ start" );
		var pActual = FA.serial.filterIn( delayedIsOdd, list );
		assert.step( "filterIn:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.serial.filterIn( checkParams, list );
		var sActual = FA.serial.filterIn( () => true );
		var uActual = FA.serial.filterIn( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "filterIn:delayedIsOdd @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "concurrent.filterOut()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return true;
		}
		return false;
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

	var rExpected = [1,3,5];
	var pExpected = [2,4];
	var qExpected = [
		"filterOut:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1", "delayedIsOdd @ start: 2", "delayedIsOdd @ start: 3", "delayedIsOdd @ start: 4", "delayedIsOdd @ start: 5",
		"filterOut:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1", "delayedIsOdd @ end: 2", "delayedIsOdd @ end: 3", "delayedIsOdd @ end: 4", "delayedIsOdd @ end: 5",
		"filterOut:delayedIsOdd @ resolved"
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.concurrent.filterOut( delayedIsEven, list );
		assert.step( "filterOut:delayedIsOdd @ start" );
		var pActual = FA.concurrent.filterOut( delayedIsOdd, list );
		assert.step( "filterOut:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.concurrent.filterOut( checkParams, list );
		var sActual = FA.concurrent.filterOut( () => false );
		var uActual = FA.concurrent.filterOut( () => false, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "filterOut:delayedIsOdd @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.filterOut()", async function test(assert){
	function checkParams(v,i,arr) {
		if (
			arr === list &&
			typeof v == "number" && typeof i == "number" && _isArray( arr ) &&
			v === (i + 1) && arr[i] === v
		) {
			return true;
		}
		return false;
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

	var rExpected = [1,3,5];
	var pExpected = [2,4];
	var qExpected = [
		"filterOut:delayedIsOdd @ start",
		"delayedIsOdd @ start: 1",
		"filterOut:delayedIsOdd @ end",
		"delayedIsOdd @ end: 1",
		"delayedIsOdd @ start: 2", "delayedIsOdd @ end: 2",
		"delayedIsOdd @ start: 3", "delayedIsOdd @ end: 3",
		"delayedIsOdd @ start: 4", "delayedIsOdd @ end: 4",
		"delayedIsOdd @ start: 5", "delayedIsOdd @ end: 5",
		"filterOut:delayedIsOdd @ resolved",
	];
	var tExpected = [];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.filterOut( delayedIsEven, list );
		assert.step( "filterOut:delayedIsOdd @ start" );
		var pActual = FA.serial.filterOut( delayedIsOdd, list );
		assert.step( "filterOut:delayedIsOdd @ end" );
		// qActual;
		var tActual = FA.serial.filterOut( checkParams, list );
		var sActual = FA.serial.filterOut( () => true );
		var uActual = FA.serial.filterOut( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "filterOut:delayedIsOdd @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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
		"forEach:delayedEach @ start",
		"delayedEach @ start: 1", "delayedEach @ start: 2", "delayedEach @ start: 3", "delayedEach @ start: 4", "delayedEach @ start: 5",
		"forEach:delayedEach @ end",
		"delayedEach @ end: 1", "delayedEach @ end: 2", "delayedEach @ end: 3", "delayedEach @ end: 4", "delayedEach @ end: 5",
		"forEach:delayedEach @ resolved",
	];
	var qExpected = undefined;
	var tExpected = undefined;
	var sExpected = undefined;

	try {
		assert.step( "forEach:delayedEach @ start" );
		// 1. make calls that create promises
		var rActual = FA.concurrent.forEach( delayedEach, list );
		assert.step( "forEach:delayedEach @ end" );
		// pActual;
		var qActual = FA.concurrent.forEach( checkParams, list );
		var tActual = FA.concurrent.forEach( () => true );
		var sActual = FA.concurrent.forEach( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		assert.step( "forEach:delayedEach @ resolved" );
		// pActual;
		qActual = await qActual;
		tActual = await tActual;
		sActual = await sActual;
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
		"forEach:delayedEach @ start",
		"delayedEach @ start: 1",
		"forEach:delayedEach @ end",
		"delayedEach @ end: 1",
		"delayedEach @ start: 2", "delayedEach @ end: 2",
		"delayedEach @ start: 3", "delayedEach @ end: 3",
		"delayedEach @ start: 4", "delayedEach @ end: 4",
		"delayedEach @ start: 5", "delayedEach @ end: 5",
		"forEach:delayedEach @ resolved",
	];
	var qExpected = undefined;
	var tExpected = undefined;
	var sExpected = undefined;

	try {
		assert.step( "forEach:delayedEach @ start" );
		// 1. make calls that create promises
		var rActual = FA.serial.forEach( delayedEach, list );
		assert.step( "forEach:delayedEach @ end" );
		// pActual;
		var qActual = FA.serial.forEach( checkParams, list );
		var tActual = FA.serial.forEach( () => true );
		var sActual = FA.serial.forEach( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		assert.step( "forEach:delayedEach @ resolved" );
		// pActual;
		qActual = await qActual;
		tActual = await tActual;
		sActual = await sActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 18 ); // note: 5 assertions + 10 `step(..)` calls
	assert.strictEqual( rActual, rExpected, "serial check: result" );
	assert.verifySteps( pExpected, "serial check: steps" );
	assert.strictEqual( qActual, qExpected, "predicate params check" );
	assert.strictEqual( tActual, tExpected, "array undefined" );
	assert.strictEqual( sActual, sExpected, "array empty" );

	done();
} );

QUnit.test( "concurrent.map()", async function test(assert){
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

	async function delayedDouble(v) {
		await _delay( 10 );
		return v * 2;
	}

	async function delayedIncrement(v) {
		try {
			assert.step( `delayedIncrement @ start: ${v}` );
			await _delay( 10 );
			return v + 1;
		}
		finally {
			assert.step( `delayedIncrement @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,4,6,8,10];
	var pExpected = [2,3,4,5,6];
	var qExpected = [
		"map:delayedIncrement @ start",
		"delayedIncrement @ start: 1", "delayedIncrement @ start: 2", "delayedIncrement @ start: 3", "delayedIncrement @ start: 4", "delayedIncrement @ start: 5",
		"map:delayedIncrement @ end",
		"delayedIncrement @ end: 1", "delayedIncrement @ end: 2", "delayedIncrement @ end: 3", "delayedIncrement @ end: 4", "delayedIncrement @ end: 5",
		"map:delayedIncrement @ resolved"
	];
	var tExpected = [false,false,false,false,false];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.concurrent.map( delayedDouble, list );
		assert.step( "map:delayedIncrement @ start" );
		var pActual = FA.concurrent.map( delayedIncrement, list );
		assert.step( "map:delayedIncrement @ end" );
		// qActual;
		var tActual = FA.concurrent.map( checkParams, list );
		var sActual = FA.concurrent.map( () => true );
		var uActual = FA.concurrent.map( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "map:delayedIncrement @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.map()", async function test(assert){
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

	async function delayedDouble(v) {
		await _delay( 10 );
		return v * 2;
	}

	async function delayedIncrement(v) {
		try {
			assert.step( `delayedIncrement @ start: ${v}` );
			await _delay( 10 );
			return v + 1;
		}
		finally {
			assert.step( `delayedIncrement @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,4,6,8,10];
	var pExpected = [2,3,4,5,6];
	var qExpected = [
		"map:delayedIncrement @ start",
		"delayedIncrement @ start: 1",
		"map:delayedIncrement @ end",
		"delayedIncrement @ end: 1",
		"delayedIncrement @ start: 2", "delayedIncrement @ end: 2",
		"delayedIncrement @ start: 3", "delayedIncrement @ end: 3",
		"delayedIncrement @ start: 4", "delayedIncrement @ end: 4",
		"delayedIncrement @ start: 5", "delayedIncrement @ end: 5",
		"map:delayedIncrement @ resolved",
	];
	var tExpected = [false,false,false,false,false];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.map( delayedDouble, list );
		assert.step( "map:delayedIncrement @ start" );
		var pActual = FA.serial.map( delayedIncrement, list );
		assert.step( "map:delayedIncrement @ end" );
		// qActual;
		var tActual = FA.serial.map( checkParams, list );
		var sActual = FA.serial.map( () => true );
		var uActual = FA.serial.map( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "map:delayedIncrement @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "concurrent.flatMap()", async function test(assert){
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

	async function delayedDoubleTriple(v) {
		await _delay( 10 );
		return [v * 2,v * 3];
	}

	async function delayedIncrementDecrement(v) {
		try {
			assert.step( `delayedIncrementDecrement @ start: ${v}` );
			await _delay( 10 );
			return [v + 1,v - 1];
		}
		finally {
			assert.step( `delayedIncrementDecrement @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,3,4,6,6,9,8,12,10,15];
	var pExpected = [2,0,3,1,4,2,5,3,6,4];
	var qExpected = [
		"flatMap:delayedIncrementDecrement @ start",
		"delayedIncrementDecrement @ start: 1", "delayedIncrementDecrement @ start: 2", "delayedIncrementDecrement @ start: 3", "delayedIncrementDecrement @ start: 4", "delayedIncrementDecrement @ start: 5",
		"flatMap:delayedIncrementDecrement @ end",
		"delayedIncrementDecrement @ end: 1", "delayedIncrementDecrement @ end: 2", "delayedIncrementDecrement @ end: 3", "delayedIncrementDecrement @ end: 4", "delayedIncrementDecrement @ end: 5",
		"flatMap:delayedIncrementDecrement @ resolved"
	];
	var tExpected = [false,false,false,false,false];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.concurrent.flatMap( delayedDoubleTriple, list );
		assert.step( "flatMap:delayedIncrementDecrement @ start" );
		var pActual = FA.concurrent.flatMap( delayedIncrementDecrement, list );
		assert.step( "flatMap:delayedIncrementDecrement @ end" );
		// qActual;
		var tActual = FA.concurrent.flatMap( checkParams, list );
		var sActual = FA.concurrent.flatMap( () => true );
		var uActual = FA.concurrent.flatMap( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "flatMap:delayedIncrementDecrement @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.flatMap()", async function test(assert){
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

	async function delayedDoubleTriple(v) {
		await _delay( 10 );
		return [v * 2,v * 3];
	}

	async function delayedIncrementDecrement(v) {
		try {
			assert.step( `delayedIncrementDecrement @ start: ${v}` );
			await _delay( 10 );
			return [v + 1,v - 1];
		}
		finally {
			assert.step( `delayedIncrementDecrement @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [2,3,4,6,6,9,8,12,10,15];
	var pExpected = [2,0,3,1,4,2,5,3,6,4];
	var qExpected = [
		"flatMap:delayedIncrementDecrement @ start",
		"delayedIncrementDecrement @ start: 1",
		"flatMap:delayedIncrementDecrement @ end",
		"delayedIncrementDecrement @ end: 1",
		"delayedIncrementDecrement @ start: 2", "delayedIncrementDecrement @ end: 2",
		"delayedIncrementDecrement @ start: 3", "delayedIncrementDecrement @ end: 3",
		"delayedIncrementDecrement @ start: 4", "delayedIncrementDecrement @ end: 4",
		"delayedIncrementDecrement @ start: 5", "delayedIncrementDecrement @ end: 5",
		"flatMap:delayedIncrementDecrement @ resolved",
	];
	var tExpected = [false,false,false,false,false];
	var sExpected = [];
	var uExpected = [];

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.flatMap( delayedDoubleTriple, list );
		assert.step( "flatMap:delayedIncrementDecrement @ start" );
		var pActual = FA.serial.flatMap( delayedIncrementDecrement, list );
		assert.step( "flatMap:delayedIncrementDecrement @ end" );
		// qActual;
		var tActual = FA.serial.flatMap( checkParams, list );
		var sActual = FA.serial.flatMap( () => true );
		var uActual = FA.serial.flatMap( () => true, [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "flatMap:delayedIncrementDecrement @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.reduce()", async function test(assert){
	function checkParams(acc,v,i,arr) {
		if (
			arr === list &&
			typeof acc == "string" && typeof v == "string" &&
			typeof i == "number" && _isArray( arr ) &&
			Number( v ) === (i + 1) && arr[i] === v
		) {
			return acc + v;
		}
		return NaN;
	}

	async function delayedConcat(acc,v) {
		await _delay( 10 );
		return acc + v;
	}

	async function delayedHyphenate(acc,v) {
		try {
			assert.step( `delayedHyphenate @ start: ${v}` );
			await _delay( 10 );
			return acc + "-" + v;
		}
		finally {
			assert.step( `delayedHyphenate @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = ["1","2","3","4","5"];

	var rExpected = "12345";
	var pExpected = "0-1-2-3-4-5";
	var qExpected = [
		"reduce:delayedHyphenate @ start",
		"delayedHyphenate @ start: 1",
		"reduce:delayedHyphenate @ end",
		"delayedHyphenate @ end: 1",
		"delayedHyphenate @ start: 2", "delayedHyphenate @ end: 2",
		"delayedHyphenate @ start: 3", "delayedHyphenate @ end: 3",
		"delayedHyphenate @ start: 4", "delayedHyphenate @ end: 4",
		"delayedHyphenate @ start: 5", "delayedHyphenate @ end: 5",
		"reduce:delayedHyphenate @ resolved",
	];
	var tExpected = "12345";
	var sExpected = "";
	var uExpected = "";

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.reduce( delayedConcat, "", list );
		assert.step( "reduce:delayedHyphenate @ start" );
		var pActual = FA.serial.reduce( delayedHyphenate, "0", list );
		assert.step( "reduce:delayedHyphenate @ end" );
		// qActual;
		var tActual = FA.serial.reduce( checkParams, "", list );
		var sActual = FA.serial.reduce( () => true, "" );
		var uActual = FA.serial.reduce( () => true, "", [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "reduce:delayedHyphenate @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.reduceRight()", async function test(assert){
	function checkParams(acc,v,i,arr) {
		if (
			arr === list &&
			typeof acc == "string" && typeof v == "string" &&
			typeof i == "number" && _isArray( arr ) &&
			Number( v ) === (i + 1) && arr[i] === v
		) {
			return acc + v;
		}
		return NaN;
	}

	async function delayedConcat(acc,v) {
		await _delay( 10 );
		return acc + v;
	}

	async function delayedHyphenate(acc,v) {
		try {
			assert.step( `delayedHyphenate @ start: ${v}` );
			await _delay( 10 );
			return acc + "-" + v;
		}
		finally {
			assert.step( `delayedHyphenate @ end: ${v}` );
		}
	}

	var done = assert.async();

	var list = ["1","2","3","4","5"];

	var rExpected = "54321";
	var pExpected = "6-5-4-3-2-1";
	var qExpected = [
		"reduceRight:delayedHyphenate @ start",
		"delayedHyphenate @ start: 5",
		"reduceRight:delayedHyphenate @ end",
		"delayedHyphenate @ end: 5",
		"delayedHyphenate @ start: 4", "delayedHyphenate @ end: 4",
		"delayedHyphenate @ start: 3", "delayedHyphenate @ end: 3",
		"delayedHyphenate @ start: 2", "delayedHyphenate @ end: 2",
		"delayedHyphenate @ start: 1", "delayedHyphenate @ end: 1",
		"reduceRight:delayedHyphenate @ resolved",
	];
	var tExpected = "54321";
	var sExpected = "";
	var uExpected = "";

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.reduceRight( delayedConcat, "", list );
		assert.step( "reduceRight:delayedHyphenate @ start" );
		var pActual = FA.serial.reduceRight( delayedHyphenate, "6", list );
		assert.step( "reduceRight:delayedHyphenate @ end" );
		// qActual;
		var tActual = FA.serial.reduceRight( checkParams, "", list );
		var sActual = FA.serial.reduceRight( () => true, "" );
		var uActual = FA.serial.reduceRight( () => true, "", [] );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		assert.step( "reduceRight:delayedHyphenate @ resolved" );
		// qActual;
		tActual = await tActual;
		sActual = await sActual;
		uActual = await uActual;
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

QUnit.test( "serial.pipe()", async function test(assert){
	async function delayedAdd(x,y) {
		await _delay( 10 );
		return x + y;
	}

	async function delayedIncrement(v) {
		return delayedAdd( v, 1 );
	}

	async function delayedDouble(v) {
		await _delay( 10 );
		return v * 2;
	}

	async function delayedDiv3(v) {
		await _delay( 10 );
		return v / 3;
	}

	function increment(v) { return v + 1; }
	function double(v) { return v * 2; }
	function div3(v) { return v / 3; }

	var done = assert.async();

	var fns1 = [delayedIncrement,delayedDouble,delayedDiv3];
	var fns2 = [delayedAdd,...fns1];
	var fns3 = [increment,double,div3];

	var rExpected = 4;
	var pExpected = 6;
	var qExpected = 8;
	var tExpected = 11;
	var sExpected = 11;

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.pipe( fns1 )( 5 );
		var pActual = FA.serial.pipe( fns2 )( 5, 3 );
		var qActual = FA.serial.pipe( fns3 )( 11 );
		var tActual = FA.serial.pipe()( 11 );
		var sActual = FA.serial.pipe( [] )( 11 );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		qActual = await qActual;
		tActual = await tActual;
		sActual = await sActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 5 );
	assert.deepEqual( rActual, rExpected, "normal unary pipe" );
	assert.deepEqual( pActual, pExpected, "multiple arguments to first function" );
	assert.deepEqual( qActual, qExpected, "all synchronous functions" );
	assert.deepEqual( tActual, tExpected, "fns undefined" );
	assert.deepEqual( sActual, sExpected, "fns empty" );

	done();
} );

QUnit.test( "serial.compose()", async function test(assert){
	async function delayedAdd(x,y) {
		await _delay( 10 );
		return x + y;
	}

	async function delayedIncrement(v) {
		return delayedAdd( v, 1 );
	}

	async function delayedDouble(v) {
		await _delay( 10 );
		return v * 2;
	}

	async function delayedDiv3(v) {
		await _delay( 10 );
		return v / 3;
	}

	function increment(v) { return v + 1; }
	function double(v) { return v * 2; }
	function div3(v) { return v / 3; }

	var done = assert.async();

	var fns1 = [delayedDiv3,delayedDouble,delayedIncrement];
	var fns2 = [...fns1,delayedAdd];
	var fns3 = [div3,double,increment];

	var rExpected = 4;
	var pExpected = 6;
	var qExpected = 8;
	var tExpected = 11;
	var sExpected = 11;

	try {
		// 1. make calls that create promises
		var rActual = FA.serial.compose( fns1 )( 5 );
		var pActual = FA.serial.compose( fns2 )( 5, 3 );
		var qActual = FA.serial.compose( fns3 )( 11 );
		var tActual = FA.serial.compose()( 11 );
		var sActual = FA.serial.compose( [] )( 11 );

		// 2. await to unwrap the promises
		rActual = await rActual;
		pActual = await pActual;
		qActual = await qActual;
		tActual = await tActual;
		sActual = await sActual;
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 5 );
	assert.deepEqual( rActual, rExpected, "normal unary compose" );
	assert.deepEqual( pActual, pExpected, "multiple arguments to first function" );
	assert.deepEqual( qActual, qExpected, "all synchronous functions" );
	assert.deepEqual( tActual, tExpected, "fns undefined" );
	assert.deepEqual( sActual, sExpected, "fns empty" );

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
		"nope: 1", "nope: delay-throw", "nope: 2", "nope: delay-reject",
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

QUnit.test( "processing synchronous function", async function test(assert){
	function doStep(v) {
		assert.step( `doStep: ${v}` );
	}

	function doThrow(v) {
		throw `nope: ${v}`;
	}

	function doReject(v) {
		return Promise.reject( `nope: ${v}` );
	}

	var done = assert.async();

	var list = [1,2,3,4,5];

	var rExpected = [
		"doStep: 1", "doStep: 2", "doStep: 3", "doStep: 4", "doStep: 5",
		"nope: 1", "nope: 2",
	];

	try {
		await FA.concurrent.forEach( doStep, list );

		try { await FA.concurrent.forEach( doThrow, [1] ); }
		catch (err) { assert.step( err.toString() ); }

		try { await FA.concurrent.forEach( doReject, [2] ); }
		catch (err) { assert.step( err.toString() ); }
	}
	catch (err) {
		assert.expect( 1 );
		assert.pushResult( { result: false, message: (err.stack ? err.stack : err.toString()) } );
		done();
		return;
	}

	assert.expect( 8 ); // note: 1 assertions + 7 `step(..)` calls
	assert.verifySteps( rExpected, "sync function steps" );

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
