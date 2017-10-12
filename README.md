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

FA.concurrent.map( getOrders, users )
.then( userOrders => console.log( userOrders ) );
```

This would work fine with any implementation of `map(..)` if `getOrders(..)` was synchronous. But `concurrent.map(..)` is different in that it handles/expects asynchronously completing functions, like `async function` functions or `function*` generators.

`concurrent.map(..)` will run each call to `getOrders(..)` concurrently (aka "in parallel"), and once all are complete, fulfill its returned promise with the final result of the mapping.

But what if you wanted to run each `getOrders(..)` call one at a time, in succession? Use `FA.serial.map(..)`:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.serial.map( getOrders, users )
.then( userOrders => console.log( userOrders ) );
```

As with `concurrent.map(..)`, once all mappings are complete, the returned promise is fulfilled with the final result of the mapping.

**fasy** handles `function*` generators via its own [generator-runner](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#promise-aware-generator-runner), similar to utilities provided by various async libraries (e.g., [`asynquence#runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin), [`Q.spawn(..)`](https://github.com/kriskowal/q/wiki/API-Reference#qspawngeneratorfunction)).:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.serial.map(
    function *getOrders(username){
       var user = yield lookupUser( username );
        return lookupOrders( user.id );
    },
    users
)
.then( userOrders => console.log( userOrders ) );
```

## Overview

Functional helpers like `map(..)` / `filter(..)` / `reduce(..)` are quite handy for iterating through a list of operations:

```js
[1,2,3,4,5].filter(v => v % 2 == 0);
// [2,4]
```

The [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises) of `async function` functions offers much more readable asynchronous flow control code:

```js
async function getOrders(username) {
    var user = await lookupUser( username );
    return lookupOrders( user.id );
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

Alternately, you could use a `function*` generator along with a [generator-runner](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#promise-aware-generator-runner) (named `run(..)` in the below snippet):

```js
run( function *getOrders(username){
    var user = yield lookupUser( username );
    return lookupOrders( user.id );
}, "getify" )
.then( orders => console.log( orders ) );
```

The problem is, mixing FP-style iteration like `map(..)` with `async function` functions / `function*` generators doesn't quite work:

```js
// BROKEN CODE -- DON'T COPY!!

async function getAllOrders() {
    var users = [ "bzmau", "getify", "frankz" ];

    var userOrders = users.map( function getOrders(username){
        // `await` won't work here inside this inner function
        var user = await lookupUser( username );
        return lookupOrders( user.id );
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
        return lookupOrders( user.id );
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

    var userOrders = await FA.concurrent.map(
        async function getOrders(username){
            var user = await lookupUser( username );
            return lookupOrders( user.id );
        },
        users
    );

    console.log( userOrders );
}

// serial iteration:
async function getAllOrders() {
    var users = [ "bzmau", "getify", "frankz" ];

    var userOrders = await FA.serial.map(
        async function getOrders(username){
            var user = await lookupUser( username );
            return lookupOrders( user.id );
        },
        users
    );

    console.log( userOrders );
}
```

Let's look at a `filter(..)` example:

```js
async function getActiveUsers() {
    var users = [ "bzmau", "getify", "frankz" ];

    return FA.concurrent.filter(
        async function userIsActive(username){
            var user = await lookupUser( username );
            return user.isActive;
        },
        users
    );
}
```

The equivalent of this would be much more verbose/awkward than just a simple `Promise.all(..)` "fix" as above. And of course, you can also use `serial.filter(..)` to process the operations serially if necessary.

### Serial Asynchrony

Some operations are naturally serial. For example, `reduce(..)` wouldn't make any sense processing as concurrent operations; it naturally runs left-to-right through the list. As such, `concurrent.reduce(..)` / `concurrent.reduceRight(..)` delegate respectively to `serial.reduce(..)` / `serial.reduceRight(..)`.

For example, consider modeling an asynchronous function composition as a serial `reduce(..)`:

```js
// `prop(..)` is a standard curried FP helper for extracting a property from an object
var prop = p => o => o[p];

// ***************************

async function getOrders(username) {
    return FA.serial.reduce(
        async (ret,fn) => fn( ret ),
        username,
        [ lookupUser, prop( "id" ), lookupOrders ]
    );
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

**Note:** In this composition, the second call (from `prop("id")` -- a standard FP helper) is **synchronous**, while the first and third calls are **asynchronous**. That's OK, because promises automatically lift non-promise values. [More on that](#syncasync-normalization) below.

Instead of `async (ret,fn) => fn(ret)` as the reducer, you can provide a `function*` generator and it works the same:

```js
async function getOrders(username) {
    return FA.serial.reduce(
        function *composer(ret,fn) { return fn( ret ); },
        username,
        [ lookupUser, prop( "id" ), lookupOrders ]
    );
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

Specifying the reducer as an `async function` function or a `function*` generator gives you the flexibility to do inner `await` / `yield` flow control as necessary.

### Sync/Async Normalization

In this specific running example, there's no inner asynchronous flow control necessary in the reducer, so it can actually just be a regular function:

```js
async function getOrders(username) {
    return FA.serial.reduce(
        (ret,fn) => fn( ret ),
        username,
        [ lookupUser, prop( "id" ), lookupOrders ]
    );
}

getOrders( "getify" )
.then( orders => console.log( orders ) );
```

There's an important principle illustrated here that many developers don't realize.

A regular function that returns a promise has the same external behavioral interface as an `async function` function. From the external perspective, when you call a function and get back a promise, it doesn't matter if the function manually created and returned that promise, or whether that promise came automatically from the `async function` invocation. In both cases, you get back a promise, and you wait on it before moving on. The *interface* is the same.

In the first step of this example's reduction, the `fn(ret)` call is effectively `lookupUser(username)`, which is returning a promise. What's different between `serial.reduce(..)` and a standard synchronous implementation of `reduce(..)` as provided by various other FP libraries, is that if `serial.reduce(..)` receives back a promise from a reducer call, it pauses to wait for that promise to resolve.

But what about the second step of the reduction, where `fn(ret)` is effectively `prop("id")(user)`? The return from *that* call is an immediate value (the user's ID), not a promise (future value).

**fasy** uses promises internally to normalize both immediate and future values, so the iteration behavior is consistent regardless.

## API

* See [Concurrent API](docs/concurrent-API.md) for documentation on the methods in the `FA.concurrent.*` namespace.
* See [Serial API](docs/serial-API.md) for documenation on the methods in the `FA.serial.*` namespace.

## Builds

[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)

The distribution library file (`dist/fasy.js`) comes pre-built with the npm package distribution, so you shouldn't need to rebuild it under normal circumstances.

However, if you download this repository via Git:

1. The included build utility (`scripts/build-core.js`) builds (and ~~minifies~~) `dist/fasy.js` from source. **Note:** Minification is currently disabled. **The build utility expects Node.js version 6+.**

2. To install the build and test dependencies, run `npm install` from the project root directory.

    - **Note:** This `npm install` has the effect of running the build for you, so no further action should be needed on your part.

4. To manually run the build utility with npm:

    ```
    npm run build
    ```

5. To run the build utility directly without npm:

    ```
    node scripts/build-core.js
    ```

## Tests

A comprehensive test suite is included in this repository, as well as the npm package distribution. The default test behavior runs the test suite using `src/fasy.src.js`.

1. You can run the tests in a browser by opening up `tests/index.html` (**requires ES6+ browser environment**).

2. The included Node.js test utility (`scripts/node-tests.js`) runs the test suite. **This test utility expects Node.js version 6+.**

3. Ensure the test dependencies are installed by running `npm install` from the project root directory.

    - **Note:** Starting with npm v5, the test utility is **not** run automatically during this `npm install`. With npm v4, the test utility automatically runs at this point.

4. To run the test utility with npm:

    ```
    npm test
    ```

    Other npm test scripts:

    * `npm run test:dist` will run the test suite against `dist/fasy.js` instead of the default of `src/fasy.src.js`.

    * `npm run test:package` will run the test suite as if the package had just been installed via npm. This ensures `package.json`:`main` properly references `dist/fasy.js` for inclusion.

    * `npm run test:all` will run all three modes of the test suite.

5. To run the test utility directly without npm:

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
