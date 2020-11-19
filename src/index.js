"use strict";

var concurrent = require("./concurrent.js");
var serial = require("./serial.js");
var transducers = require("./transducers.js");

module.exports = {
	concurrent,
	serial,
	transducers,
};
module.exports.concurrent = concurrent;
module.exports.serial = serial;
module.exports.transducers = transducers;
