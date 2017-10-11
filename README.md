# fasy

[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)
[![Dependencies](https://david-dm.org/getify/fasy.svg)](https://david-dm.org/getify/fasy)
[![devDependencies](https://david-dm.org/getify/fasy/dev-status.svg)](https://david-dm.org/getify/fasy)
[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)

**fasy** is a utility library of FP array iteration helpers (like `map(..)`, `filter(..)`, etc) that are capable of handling `async function` functions and `function*` generators. **fasy** supports both concurrent and serial iterations.

## Environment Support

This library uses ES2017 (and ES6) features. If you need to support environments prior to ES2017, transpile it first (with Babel, etc).

## At A Glance

Here's a quick example:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.concurrent.map( users, getOrders )
.then( userOrders => console.log( userOrders ) );
```

This would work fine with any implementation of `map(..)` if `getOrders(..)` was synchronous. But `concurrent.map(..)` is different in that it handles/expects asynchronously completing functions, like `async function` functions or `function*` generators.

`concurrent.map(..)` will run each call to `getOrders(..)` concurrently (aka "in parallel"), and once all are complete, fulfill its returned promise with the final result of the mapping.

But what if you wanted to run each `getOrders(..)` call one at a time, in succession? Use `FA.serial.map(..)`:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.serial.map( users, getOrders )
.then( userOrders => console.log( userOrders ) );
```

As with `concurrent.map(..)`, once all mappings are complete, the returned promise is fulfilled with the final result of the mapping.

**fasy** handles `function*` generators via a [generator-runner](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#promise-aware-generator-runner) that's built-in, similar to utilities provided by various async libraries (e.g., [`asynquence#runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin), [`Q.spawn(..)`](https://github.com/kriskowal/q/wiki/API-Reference#qspawngeneratorfunction)).:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.serial.map( users, function *getOrders(username){
	var user = yield lookupUser( username );
	return yield lookupOrders( user.id );
} )
.then( userOrders => console.log( userOrders ) );
```

## Overview

Functional helpers like `map(..)` / `filter(..)` / `reduce(..)` are quite handy for iterating through a list of operations:

```js
[1,2,3,4,5].filter(v => v % 2 == 0);
// [2,4]
```

The sync-async pattern of `async function` functions offers much more readable asynchronous flow control code:

```js
async function getOrders(username) {
	var user = await lookupUser( username );
	return await lookupOrders( user.id );
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

Alternately, you could use a `function*` generator along with a [generator-runner](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#promise-aware-generator-runner) (`run(..)` in the below snippet):

```js
run( function *getOrders(username){
	var user = yield lookupUser( username );
	return yield lookupOrders( user.id );
}, "getify" )
.then( orders => console.log( orders ) );
```

The problem is, mixing FP-style iteration like `map(..)` with `async function` functions / `function*` generators doesn't quite work:

```js
async function getAllOrders() {
	var users = [ "bzmau", "getify", "frankz" ];

	var userOrders = users.map( function getOrders(username){
		// `await` won't work here inside this inner function
		var user = await lookupUser( username );
		return await lookupOrders( user.id );
	} );

	// everything is messed up now, since `map(..)` works synchronously
	console.log( userOrders );
}
```

The `await` isn't valid inside the inner function `getOrders(..)` since that's a normal function, not an `async function` function. Also, `map(..)` here is the standard array method that operates synchronously, so it doesn't wait for all the lookups to finish.

If it's OK to run the `getOrders(..)` calls concurrently -- in this particular example, it quite possibly is -- then you could use `Promise.all(..)` along with an inner `async function` function:

```js
async function getAllOrders() {
	var users = [ "bzmau", "getify", "frankz" ];

	var userOrders = await Promise.all( users.map( async function getOrders(username){
		var user = await lookupUser( username );
		return await lookupOrders( user.id );
	} ) );

	// this works
	console.log( userOrders );
}
```

Unfortunately, aside from being more verbose, this "fix" is fairly limited. It really only works for `map(..)` and not for something like `filter(..)`. Also, since it assumes concurrency, there's no way to do the iterations serially (for any of various reasons).

With **fasy**, you can do either concurrent or serial iterations of asynchronous operations:

```js
// concurrent iteration:
async function getAllOrders() {
	var users = [ "bzmau", "getify", "frankz" ];

	var userOrders = await FA.concurrent.map( users, async function getOrders(username){
		var user = await lookupUser( username );
		return await lookupOrders( user.id );
	} );

	console.log( userOrders );
}

// serial iteration:
async function getAllOrders() {
	var users = [ "bzmau", "getify", "frankz" ];

	var userOrders = await FA.serial.map( users, async function getOrders(username){
		var user = await lookupUser( username );
		return await lookupOrders( user.id );
	} );

	console.log( userOrders );
}
```

Let's look at a `filter(..)` example:

```js
async function getActiveUsers() {
	var users = [ "bzmau", "getify", "frankz" ];

	return await FA.concurrent.filter( users, async function userIsActive(username){
		var user = await lookupUser( username );
		return user.isActive;
	} );
}
```

The equivalent of this would be much more verbose/awkward than just a simple `Promise.all(..)` "fix" as above. And of course, you can also use `serial.filter(..)` to process the operations serially if necessary.

Some operations are naturally serial, like `reduce(..)`, and thus wouldn't make any sense as concurrent operations. As such, `concurrent.reduce(..)` / `concurrent.reduceRight(..)` delegate respectively to `serial.reduce(..)` / `serial.reduceRight(..)`.

For example, consider modeling an asynchronous function composition as a serial `reduce(..)`:

```js
// `prop(..)` is a standard FP helper for extracting a
// property from an object
var prop = p => o => o[p];

// ***************************

async function getOrders(username) {
	return await FA.serial.reduce(
		[ lookupUser, prop( "id" ), lookupOrders ],
		username,
		async (ret,fn) => fn( ret )
	);
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

**Note:** In this composition, the second call (from `prop("id")` -- a standard FP helper) is **synchronous**, while the first and third calls are **asynchronous**. That's OK, because promises automatically lift non-promise values.

As you can see, these composed steps absolutely need to be executed serially; `serial.reduce(..)` is quite helpful in that task.

## API

// TODO

## Builds

[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)

The distribution library file (`dist/fasy.js`) comes pre-built with the npm package distribution, so you shouldn't need to rebuild it under normal circumstances.

However, if you download this repository via Git:

1. The included build utility (`scripts/build-core.js`) builds (and ~~minifies~~) `dist/fasy.js` from source. **Note:** Minification is currently disabled. **The build utility expects Node.js version 6+.**

2. To install the build and test dependencies, run `npm install` from the project root directory.

3. Because of how npm lifecycle events (currently: npm v4) work, `npm install` will have the side effect of automatically running the build and test utilities for you. So, no further action should be needed on your part. Starting with npm v5, the build utility will still be run automatically on `npm install`, but the test utility will not.

To run the build utility with npm:

```
npm run build
```

To run the build utility directly without npm:

```
node scripts/build-core.js
```

## Tests

A comprehensive test suite is included in this repository, as well as the npm package distribution. The default test behavior runs the test suite using `src/fasy.src.js`.

1. You can run the tests in a browser by opening up `tests/index.html` (**requires ES6+ browser environment**).

2. The included Node.js test utility (`scripts/node-tests.js`) runs the test suite. **This test utility expects Node.js version 6+.**

3. Ensure the Node.js test utility dependencies are installed by running `npm install` from the project root directory.

4. Because of how npm lifecycle events (currently: npm v4) work, `npm install` will have the side effect of automatically running the build and test utilities for you. So, no further action should be needed on your part. Starting with npm v5, the build utility will still be run automatically on `npm install`, but the test utility will not.

To run the test utility with npm:

```
npm test
```

Other npm test scripts:

* `npm run test:dist` will run the test suite against `dist/fasy.js`.

* `npm run test:package` will run the test suite as if the package had just been installed via npm. This ensures `package.json`:`main` properly references `dist/fasy.js` for inclusion.

* `npm run test:all` will run all three modes of the test suite. This is what's automatically run when you first `npm install` the build and test dependencies.

To run the test utility directly without npm:

```
node scripts/node-tests.js
```

### Test Coverage

[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)

If you have [Istanbul](https://github.com/gotwarlost/istanbul) already installed on your system (requires v1.0+), you can use it to check the test coverage:

```
npm run coverage
```

Then open up `coverage/lcov-report/index.html` in a browser to view the report.

To run Istanbul directly without npm:

```
istanbul cover scripts/node-tests.js
```

**Note:** The npm script `coverage:report` is only intended for use by project maintainers. It sends coverage reports to [Coveralls](https://coveralls.io/).

## License

All code and documentation are (c) 2017 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
