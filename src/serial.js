"use strict";

var defineConcurrentAPI = require("./concurrent.js");

// the serial API is just the concurrent API with
// batch size limited to 1
var serial = defineConcurrentAPI(1);

module.exports = serial;
module.exports.reduce = serial.reduce;
module.exports.reduceRight = serial.reduceRight;
module.exports.pipe = serial.pipe;
module.exports.compose = serial.compose;
module.exports.filter = serial.filter;
module.exports.filterIn = serial.filterIn;
module.exports.filterOut = serial.filterOut;
module.exports.forEach = serial.forEach;
module.exports.map = serial.map;
module.exports.flatMap = serial.flatMap;
