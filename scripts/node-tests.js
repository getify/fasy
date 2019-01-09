#!/usr/bin/env node

var path = require("path");

/* istanbul ignore next */
if (process.env.TEST_DIST) {
	global.FA = require(path.join("..","dist","fasy.js"));
}
/* istanbul ignore next */
else if (process.env.TEST_PACKAGE) {
	global.FA = require(path.join(".."));
}
else {
	global.FA = require(path.join("..","src","fasy.src.js"));
}

global.QUnit = require("qunit");

require("../tests/qunit.config.js");
require("../tests/tests.js");

QUnit.start();
