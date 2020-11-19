#!/usr/bin/env node

var path = require("path");

/* istanbul ignore next */
if (process.env.TEST_DIST) {
	({ FA: global.FA } = require(path.join("..","dist","umd","bundle.js")));
}
/* istanbul ignore next */
else if (process.env.TEST_PACKAGE) {
	global.FA = require(path.join(".."));
}
else {
	global.FA = require(path.join("..","src","index.js"));
}

global.QUnit = require("qunit");

require("../tests/qunit.config.js");
require("../tests/tests.js");

QUnit.start();
