"use strict";

var { runner } = require("./internals.js");
var { reduce: serialReduce, } = require("./serial.js");

var transducers = {
	filter,
	map,
	transduce,
	into,
	string,
	number,
	booleanAnd,
	booleanOr,
	array,
	identity,
	default: identity,
};
module.exports = transducers;
module.exports.filter = filter;
module.exports.map = map;
module.exports.transduce = transduce;
module.exports.into = into;
module.exports.string = string;
module.exports.number = number;
module.exports.booleanAnd = booleanAnd;
module.exports.booleanOr = booleanOr;
module.exports.array = array;
module.exports.identity = identity;


// **********************************

function filter(predicateFn) {
	return function curried(combinationFn){
		return async function reducer(acc,v,idx,arr){
			if (await runner(predicateFn)(v,idx,arr)) return runner(combinationFn)(acc,v);
			return acc;
		};
	};
}

function map(mapperFn) {
	return function curried(combinationFn){
		return async function reducer(acc,v,idx,arr){
			return runner(combinationFn)(acc,await runner(mapperFn)(v,idx,arr));
		};
	};
}

async function transduce(transducer,combinationFn,initialValue,arr = []) {
	var reducer = await transducer(combinationFn);
	return serialReduce(reducer,initialValue,arr);
}

async function into(transducer,initialValue,arr = []) {
	var combinationFn =
		(typeof initialValue == "string") ? transducers.string :
		(typeof initialValue == "number") ? transducers.number :
		(typeof initialValue == "boolean") ? transducers.booleanAnd :
		Array.isArray( initialValue ) ? transducers.array :
		transducers.default;

	return transducers.transduce(transducer,combinationFn,initialValue,arr);
}

function string(acc,v) {
	return acc + v;
}

function number(acc,v) {
	return acc + v;
}

function booleanAnd(acc,v) {
	return acc && v;
}

function booleanOr(acc,v) {
	return acc || v;
}

function array(acc,v) {
	acc.push(v);
	return acc;
}

function identity(v) {
	return v;
}
