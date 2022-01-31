# Fasy

[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)
[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)
[![Modules](https://img.shields.io/badge/modules-ESM%2BUMD%2BCJS-a1356a)](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)
[![License](https://img.shields.io/badge/license-MIT-a1356a)](LICENSE.txt)

**Fasy** (/ˈfāsē/) is a utility library of FP array iteration helpers (like `map(..)`, `filter(..)`, etc), as well as function composition and transducing.

What's different from other FP libraries is that its methods are capable of operating asynchronously, via `async function` functions and/or `function*` generators. **Fasy** supports both concurrent and serial asynchrony.

For concurrent asynchrony, **Fasy** also supports limiting the batch size to avoid overloading resources.

## Environment Support

This library uses ES2017 (and ES6) features. If you need to support environments prior to ES2017, transpile it first (with Babel, etc).

## At A Glance

Here's a quick example:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.concurrent.map( getOrders, users )
.then( userOrders => console.log( userOrders ) );
```

This would work fine with any implementation of `map(..)` if `getOrders(..)` was synchronous. But `concurrent.map(..)` is different in that it handles/expects asynchronously completing functions, like `async function` functions or `function*` generators. Of course, you can *also* use normal synchronous functions as well.

`concurrent.map(..)` will run each call to `getOrders(..)` concurrently (aka "in parallel"), and once all are complete, fulfill its returned promise with the final result of the mapping.

But what if you wanted to run each `getOrders(..)` call one at a time, in succession? Use `serial.map(..)`:

```js
var users = [ "bzmau", "getify", "frankz" ];

FA.serial.map( getOrders, users )
.then( userOrders => console.log( userOrders ) );
```

As with `concurrent.map(..)`, once all mappings are complete, the returned promise is fulfilled with the final result of the mapping.

**Fasy** handles `function*` generators via its own [generator-runner](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/async%20%26%20performance/ch4.md#promise-aware-generator-runner), similar to utilities provided by various async libraries (e.g., [`asynquence#runner(..)`](https://github.com/getify/asynquence/tree/master/contrib#runner-plugin), [`Q.spawn(..)`](https://github.com/kriskowal/q/wiki/API-Reference#qspawngeneratorfunction)).:

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

## Background/Motivation

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

Unfortunately, aside from being more verbose, this "fix" is fairly limited. It really only works for `map(..)` and not for something like `filter(..)`. Also, as that fix assumes concurrency, there's no good way to do the FP-style iterations serially.

## Overview

With **Fasy**, you can do either concurrent or serial iterations of asynchronous operations.

### Concurrent Asynchrony

For example, consider this [`concurrent.map(..)`](docs/concurrent-API.md#concurrentmap) operation:

```js
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
```

Now let's look at the same task, but with a [`serial.map(..)`](docs/serial-API.md#serialmap) operation:

```js
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

The equivalent of this would be much more verbose/awkward than just a simple `Promise.all(..)` "fix" as described earlier. And of course, you can also use [`serial.filter(..)`](docs/serial-API.md#serialfilter) to process the operations serially if necessary.

#### Limiting Concurrency

To limit the concurrency (aka, parallelism) of your operations, there are two modes to select from: *continuous pooling* (default) and *batch*.

**Note:** Such limitations on concurrency are often useful when the operations involve finite system resources, like OS file handles or network connection ports, and as such you want to avoid exhausting those resources and creating errors or over-burdening the system.

To illustrate, *continuous pooling* mode:

```js
async function getAllURLs(urls) {
    var responses = await FA.concurrent(5).map(fetch,urls);

    // .. render responses
}
```

In this example, the `(5)` part of `FA.concurrent(5)` limits the concurrency to only (up to) five active `fetch(..)` calls at any given moment. As soon as one finishes, if there are any more calls waiting, the next one is activated. This argument must be greater than zero.

The `concurrent(5)` call is actually a shorthand for `concurrent(5,5)`, which includes a second argument: minimum active threshold. In other words, the way *continuous pooling* mode works is, the first five `fetch(..)` calls are activated, and when the first one finishes, the active count is now down to `4`, which is below that specified `5` threshold, so the next one (if any are waiting) is activated.

In contrast to *continuous pooling* mode, *batch* mode is activated by explicitly specifying a number for this second argument that is lower than the first argument (but still greater than zero).

For example, `concurrent(5,1)` runs a batch of five concurrent `fetch(..)` calls, but doesn't start the next batch of calls until the active count falls below `1` (aka, the whole batch finishes):

```js
async function getAllURLs(urls) {
    var responses = await FA.concurrent(5,1).map(fetch,urls);

    // .. render responses
}
```

And `concurrent(5,3)` would run a batch of five active calls, then refill the active batch set (to five) once the active count gets below `3`.

With these two limit arguments, you have complete control to fine tune how much concurrent activity is appropriate.

You can safely call `concurrent(..)` multiple times with the same arguments -- the resulting concurrency-limited API is internally cached -- or with any different arguments, as necessary. You can also store the concurrency-limited API object and re-use it, if you prefer:

```js
FA.concurrent(5).map(..);
FA.concurrent(5).filter(..);
FA.concurrent(12).forEach(..);

var FAc5 = FA.concurrent(5);
FAc5.map(..);
FAc5.filter(..);
```

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

The async composition being shown here is only for illustration purposes. **Fasy** provides [`serial.compose(..)`](docs/serial-API.md#serialcompose) and [`serial.pipe(..)`](docs/serial-API.md#serialpipe) for performing async compositions ([see below](#async-composition)); these methods should be preferred over doing it manually yourself.

By the way, instead of `async (ret,fn) => fn(ret)` as the reducer, you can provide a `function*` generator and it works the same:

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

**Fasy** uses promises internally to normalize both immediate and future values, so the iteration behavior is consistent regardless.

### Async Composition

In addition to traditional iterations like `map(..)` and `filter(..)`, **Fasy** also supports serial-async composition, which is really just a serial-async reduction under the covers.

Consider:

```js
async function getFileContents(filename) {
    var fileHandle = await fileOpen( filename );
    return fileRead( fileHandle );
}
```

That is fine, but it can also be recognized as an async composition. We can use [`serial.pipe(..)`](docs/serial-API.md#serialpipe) to define it in point-free style:

```js
var getFileContents = FA.serial.pipe( [
    fileOpen,
    fileRead
] );
```

FP libraries traditionally provide synchronous composition with `pipe(..)` and `compose(..)` (sometimes referred to by other names, like `flow(..)` and `flowRight(..)`, respectively). But asynchronous composition can be quite helpful!

### Async Transducing

Transducing is another flavor of FP iteration; it's a combination of composition and list/data-structure reduction. Multiple `map(..)` and `filter(..)` calls can be composed by transforming them as reducers. Again, many FP libraries support traditional synchronous transducing, but since **Fasy** has serial-async reduction, you can do serial-async transducing as well!

Consider:

```js
async function getFileContents(filename) {
    var exists = await fileExists( filename );
    if (exists) {
        var fileHandle = await fileOpen( filename );
        return fileRead( fileHandle );
    }
}
```

We could instead model these operations FP-style as a `filter(..)` followed by two `map(..)`s:

```js
async function getFileContents(filename) {
    return FA.serial.map(
        fileRead,
        FA.serial.map(
            fileOpen,
            FA.serial.filter(
                fileExists,
                [ filename ]
            )
        )
    );
}
```

Not only is this a bit more verbose, but if we later wanted to be able to get/combine contents from many files, we'd be iterating over a list three times (once each for the `filter(..)` and two `map(..)` calls). That extra iteration is not just a penalty in terms of more CPU cycles, but it also creates an intermediate array in between each step, which is then thrown away, so memory churn becomes a concern.

This is where transducing shines! If we transform the `filter(..)` and `map(..)` calls into a composition-compatible form (reducers), we can then combine them into one reducer; that means we can do all the steps at once! So, we'll only have to iterate through the list once, and we won't need to create and throw away any intermediate arrays.

While this obviously can work for any number of values in a list, we'll keep our running example simple and just process one file:

```js
async function getFileContents(filename) {
    var transducer = FA.serial.compose( [
        FA.transducers.filter( fileExists ),
        FA.transducers.map( fileOpen ),
        FA.transducers.map( fileRead )
    ] );

    return FA.transducers.into(
        transducer,
        "", // empty string as initial value
        [ filename ]
    );
}
```

**Note:** For simplicity, we used the [`transducers.into(..)`](docs/transducers-API.md#transducersinto) convenience method, but the same task could also have used the more general [`transducers.transduce(..)`](docs/transducers-API.md#transducerstransduce) method.

## npm Package

To install this package from `npm`:

```
npm install fasy
```

And to require it in a node script:

```js
var FA = require("fasy");
```

You can also require any of the three sub-namespaces of this library directly:

```js
// like this:
var concurrent = require("fasy/concurrent");

// or like this:
var { serial } = require("fasy");
```

As of version 9.0.0, the package (and its sub-namespaces) are also available as ES Modules, and can be imported as so:

```js
import FA from "fasy";

// or:

import concurrent from "fasy/concurrent";

// or:

import { serial } from "fasy";
```

**Note:** Starting in version 8.x, **Fasy** was also available in ESM format, but required an ESM import specifier segment `/esm` in **Fasy** `import` paths. This has been deprecated as of version 9.0.0 (and will eventually be removed), in favor of unified import specifier paths via [Node Conditional Exports](https://nodejs.org/api/packages.html#packages_conditional_exports). For ESM `import` statements, always use the specifier style `"fasy"` or `"fasy/concurrent"`, instead of `"fasy/esm"` and `"fasy/esm/concurrent"`, respectively.

## API Documentation

* See [Concurrent API](docs/concurrent-API.md) for documentation on the methods in the `FA.concurrent.*` namespace.
* See [Serial API](docs/serial-API.md) for documenation on the methods in the `FA.serial.*` namespace.
* See [Transducers API](docs/transducers-API.md) for documentation on the methods in the `FA.transducers.*` namespace.

## Builds

[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)
[![Modules](https://img.shields.io/badge/modules-ESM%2BUMD%2BCJS-a1356a)](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)

The distribution library files (`dist/*`) come pre-built with the npm package distribution, so you shouldn't need to rebuild them under normal circumstances.

However, if you download this repository via Git:

1. The included build utility (`scripts/build-core.js`) builds (and minifies) `dist/*` files (both UMD and ESM formats) from source.

2. To install the build and test dependencies, run `npm install` from the project root directory.

3. To manually run the build utility with npm:

    ```
    npm run build
    ```

4. To run the build utility directly without npm:

    ```
    node scripts/build-core.js
    ```

## Tests

A test suite is included in this repository, as well as the npm package distribution. The default test behavior runs the test suite using the files in `src/`.

1. The tests are run with QUnit.

2. You can run the tests in a browser by opening up `tests/index.html`.

3. To run the test utility with npm:

    ```
    npm test
    ```

    Other npm test scripts:

    * `npm run test:dist` will run the test suite against `dist/umd/bundle.js` instead of the default of `src/*` files.

    * `npm run test:package` will run the test suite as if the package had just been installed via npm. This ensures `package.json`:`main` properly references the correct file for inclusion.

    * `npm run test:all` will run all three modes of the test suite.

4. To run the test utility directly without npm:

    ```
    node scripts/node-tests.js
    ```

### Test Coverage

[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)

If you have [NYC (Istanbul)](https://github.com/istanbuljs/nyc) already installed on your system (requires v14.1+), you can use it to check the test coverage:

```
npm run coverage
```

Then open up `coverage/lcov-report/index.html` in a browser to view the report.

**Note:** The npm script `coverage:report` is only intended for use by project maintainers. It sends coverage reports to [Coveralls](https://coveralls.io/).

## License

[![License](https://img.shields.io/badge/license-MIT-a1356a)](LICENSE.txt)

All code and documentation are (c) 2021 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
