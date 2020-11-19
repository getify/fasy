"use strict";

var { runner } = require("./internals.js");

var cachedConcurrentAPI = {};
var never = new Promise(function c(){});

Object.assign(defineConcurrentAPI,defineConcurrentAPI(Number.MAX_SAFE_INTEGER));

module.exports = defineConcurrentAPI;
module.exports.reduce = defineConcurrentAPI.reduce;
module.exports.reduceRight = defineConcurrentAPI.reduceRight;
module.exports.pipe = defineConcurrentAPI.pipe;
module.exports.compose = defineConcurrentAPI.compose;
module.exports.filter = defineConcurrentAPI.filter;
module.exports.filterIn = defineConcurrentAPI.filterIn;
module.exports.filterOut = defineConcurrentAPI.filterOut;
module.exports.forEach = defineConcurrentAPI.forEach;
module.exports.map = defineConcurrentAPI.map;
module.exports.flatMap = defineConcurrentAPI.flatMap;


// **********************************

function defineConcurrentAPI(batchSize = 5,minActive = batchSize) {
	batchSize = Number(batchSize);
	minActive = Number(minActive);
	if (!(batchSize >= 1)) {
		throw new Error("Batch size limit must be at least 1.");
	}
	if (!(
		minActive >= 1 &&
		minActive <= batchSize
	)) {
		throw new Error(`Minimum active threshold must be between 1 and ${batchSize}.`);
	}
	var cacheKey = `${batchSize}:${minActive}`;

	if (!(cacheKey in cachedConcurrentAPI)) {
		let map = concurrentMap(batchSize,minActive);
		let filterIn = concurrentFilterIn(map);

		cachedConcurrentAPI[cacheKey] = {
			forEach: concurrentForEach(map),
			map,
			flatMap: concurrentFlatMap(map),
			filter: filterIn,
			filterIn,
			filterOut: concurrentFilterOut(filterIn),
			reduce: concurrentReduce,
			reduceRight: concurrentReduceRight,
			pipe: concurrentPipe,
			compose: concurrentCompose,
		};
	}

	return cachedConcurrentAPI[cacheKey];
}

function concurrentMap(batchSize,minActive) {
	return async function map(mapperFn,arr = []){
		mapperFn = runner(mapperFn);

		var arrIterator = arr.entries();
		var curActive = 0;
		var results = [];
		var pending = [];

		while (true) {
			if (curActive < minActive) {
				let res = arrIterator.next();
				if (!res.done) {
					let [idx,v,] = res.value;
					curActive++;
					pending[idx] = results[idx] =
						mapperFn(v,idx,arr)
						.then(function mapped(v){
							curActive--;
							pending[idx] = never;
							return v;
						});
				}
				else {
					return Promise.all(results);
				}
			}
			else {
				await Promise.race(pending);
			}
		}
	};
}

function concurrentForEach(map) {
	return async function forEach(eachFn,arr = []){
		await map(eachFn,arr);
	};
}

function concurrentFlatMap(map) {
	return async function flatMap(mapperFn,arr = []){
		return (
				await map(mapperFn,arr)
			)
			// note: normal array#reduce
			.reduce(function reducer(ret,v){ return ret.concat(v); },[]);
	};
}

function concurrentFilterIn(map) {
	return async function filterIn(predicateFn,arr = []){
		predicateFn = runner(predicateFn);
		return (
				await map(async function mapper(v,idx,arr) {
					return [v,await predicateFn(v,idx,arr),];
				},arr)
			)
			// note: normal array#reduce
			.reduce(function reducer(ret,[v,keep,]){
				if (keep) return [...ret,v,];
				return ret;
			},[]);
	};
}

function concurrentFilterOut(filterIn) {
	return async function filterOut(predicateFn,arr = []){
		predicateFn = runner(predicateFn);
		return filterIn(async function filterer(v,idx,arr){
			return !(await predicateFn(v,idx,arr));
		},arr);
	};
}

async function concurrentReduce(reducerFn,initial,arr = []) {
	reducerFn = runner(reducerFn);
	var ret = initial;
	for (let [idx,v,] of arr.entries()) {
		ret = await reducerFn(ret,v,idx,arr);
	}
	return ret;
}

async function concurrentReduceRight(reducerFn,initial,arr = []) {
	reducerFn = runner(reducerFn);
	var ret = initial;
	for (let [idx,v,] of [...arr.entries(),].reverse()) {
		ret = await reducerFn(ret,v,idx,arr);
	}
	return ret;
}

function concurrentPipe(fns = []) {
	// at a minimum, ensure we have the identity function in the pipe
	if (fns.length == 0) {
		fns = [v => v,];
	}
	return function piped(...args){
		return concurrentReduce(
			function reducer(ret,fn){
				// special handling only the first iteration, to pass
				// along all the `args`
				if (ret === args) {
					return fn( ...ret );
				}
				// otherwise, in the general case, only pass along
				// single return value from previous iteration's call
				return fn( ret );
			},
			args,
			fns
		);
	};
}

function concurrentCompose(fns = []) {
	// at a minimum, ensure we have the identity function in the composition
	if (fns.length == 0) {
		fns = [v => v,];
	}
	return function composed(...args){
		return concurrentReduceRight(
			function reducer(ret,fn){
				// special handling only the first iteration, to pass
				// along all the `args`
				if (ret === args) {
					return fn( ...ret );
				}
				// otherwise, in the general case, only pass along
				// single return value from previous iteration's call
				return fn( ret );
			},
			args,
			fns
		);
	};
}
