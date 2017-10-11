# fasy

<!--[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)
[![Dependencies](https://david-dm.org/getify/fasy.svg)](https://david-dm.org/getify/fasy)
[![devDependencies](https://david-dm.org/getify/fasy/dev-status.svg)](https://david-dm.org/getify/fasy)
[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)-->

**fasy** is a utility library of FP array iteration helpers (like `map(..)`, `filter(..)`, etc) that are capable of handling `async function` and `function*` (generator) functions.

## Environment Support

This library uses ES2017 (and ES6) features. If you need to support environments prior to ES2017, transpile it first (with Babel, etc).

## At A Glance

// TODO

## API

// TODO

## Builds

<!--[![Build Status](https://travis-ci.org/getify/fasy.svg?branch=master)](https://travis-ci.org/getify/fasy)
[![npm Module](https://badge.fury.io/js/fasy.svg)](https://www.npmjs.org/package/fasy)-->

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

<!--[![Coverage Status](https://coveralls.io/repos/github/getify/fasy/badge.svg?branch=master)](https://coveralls.io/github/getify/fasy?branch=master)-->

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
