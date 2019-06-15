(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("FA",this,function DEF(name,context){
	"use strict";

	var cachedConcurrentAPI = {};

	var serial = {
		async forEach(eachFn,arr = []) {
			eachFn = _runner(eachFn);
			for (let [idx,v,] of arr.entries()) {
				await eachFn(v,idx,arr);
			}
		},
		async map(mapperFn,arr = []) {
			mapperFn = _runner(mapperFn);
			var ret = [];
			for (let [idx,v,] of arr.entries()) {
				ret.push(await mapperFn(v,idx,arr));
			}
			return ret;
		},
		async flatMap(mapperFn,arr = []) {
			mapperFn = _runner(mapperFn);
			var ret = [];
			await serial.forEach(async function eacher(v,idx,arr){
				ret = ret.concat(await mapperFn(v,idx,arr));
			},arr);
			return ret;
		},
		async filterIn(predicateFn,arr = []) {
			predicateFn = _runner(predicateFn);
			var ret = [];
			for (let [idx,v,] of arr.entries()) {
				if (await predicateFn(v,idx,arr)) {
					ret.push(v);
				}
			}
			return ret;
		},
		async filterOut(predicateFn,arr = []) {
			predicateFn = _runner(predicateFn);
			return serial.filterIn(async function filterer(v,idx,arr){
				return !(await predicateFn(v,idx,arr));
			},arr);
		},
		async reduce(reducerFn,initial,arr = []) {
			reducerFn = _runner(reducerFn);
			var ret = initial;
			for (let [idx,v,] of arr.entries()) {
				ret = await reducerFn(ret,v,idx,arr);
			}
			return ret;
		},
		async reduceRight(reducerFn,initial,arr = []) {
			reducerFn = _runner(reducerFn);
			var ret = initial;
			for (let [idx,v,] of [...arr.entries(),].reverse()) {
				ret = await reducerFn(ret,v,idx,arr);
			}
			return ret;
		},
		pipe(fns = []) {
			// at a minimum, ensure we have the identity function in the pipe
			if (fns.length == 0) {
				fns = [v => v,];
			}
			return function piped(...args){
				return serial.reduce(
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
		},
		compose(fns = []) {
			// at a minimum, ensure we have the identity function in the composition
			if (fns.length == 0) {
				fns = [v => v,];
			}
			return function composed(...args){
				return serial.reduceRight(
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
		},
	};

	var transducers = {
		filter(predicateFn) {
			return function curried(combinationFn){
				return async function reducer(acc,v,idx,arr){
					if (await _runner(predicateFn)(v,idx,arr)) return _runner(combinationFn)(acc,v);
					return acc;
				};
			};
		},
		map(mapperFn) {
			return function curried(combinationFn){
				return async function reducer(acc,v,idx,arr){
					return _runner(combinationFn)(acc,await _runner(mapperFn)(v,idx,arr));
				};
			};
		},
		async transduce(transducer,combinationFn,initialValue,arr = []) {
			var reducer = await transducer(combinationFn);
			return serial.reduce(reducer,initialValue,arr);
		},
		async into(transducer,initialValue,arr = []) {
			var combinationFn =
				(typeof initialValue == "string") ? transducers.string :
				(typeof initialValue == "number") ? transducers.number :
				(typeof initialValue == "boolean") ? transducers.booleanAnd :
				Array.isArray( initialValue ) ? transducers.array :
				transducers.default;

			return transducers.transduce(transducer,combinationFn,initialValue,arr);
		},
		string(acc,v) { return acc + v; },
		number(acc,v) { return acc + v; },
		booleanAnd(acc,v) { return acc && v; },
		booleanOr(acc,v) { return acc || v; },
		array(acc,v) { acc.push(v); return acc; },
		default(acc,v) { return acc; },
	};

	// define base concurrent API
	Object.assign(defineConcurrentAPI,defineConcurrentAPI(Number.MAX_SAFE_INTEGER));

	// define alias
	serial.filter = serial.filterIn;

	var publicAPI = {
		concurrent: defineConcurrentAPI,
		serial,
		transducers,
	};

	return publicAPI;


	// ***************************************
	// Private

	function defineConcurrentAPI(batchSize = 5) {
		batchSize = Number(batchSize);
		if (!(batchSize >= 1)) {
			throw new Error("Batch limit size must be 1 or higher.");
		}

		if (!(batchSize in cachedConcurrentAPI)) {
			let map = concurrentMap(batchSize);
			let filterIn = concurrentFilterIn(map);

			cachedConcurrentAPI[batchSize] = {
				forEach: concurrentForEach(map),
				map,
				flatMap: concurrentFlatMap(map),
				filter: filterIn,
				filterIn,
				filterOut: concurrentFilterOut(filterIn),
				reduce: serial.reduce,
				reduceRight: serial.reduceRight,
				pipe: serial.pipe,
				compose: serial.compose,
			};
		}

		return cachedConcurrentAPI[batchSize];
	}

	function concurrentMap(batchSize) {
		return async function map(mapperFn,arr = []){
			// return Promise.all(arr.map(_runner(mapperFn)));
			return runChunks(batchSize,arr,_runner(mapperFn));
		};
	}

	function concurrentForEach(map) {
		return async function forEach(eachFn,arr = []){
			// await Promise.all(arr.map(_runner(eachFn)));
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
			predicateFn = _runner(predicateFn);
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
			predicateFn = _runner(predicateFn);
			return filterIn(async function filterer(v,idx,arr){
				return !(await predicateFn(v,idx,arr));
			},arr);
		};
	}

	async function runChunks(batchSize,arr,fn) {
		var results = [];
		var arrIterator = arr.entries();

		while (results.length < arr.length) {
			let batchProcessed = 0;
			for (let [idx,v,] of arrIterator) {
				results.push(fn(v,idx,arr));
				batchProcessed++;
				if (batchProcessed >= batchSize) {
					break;
				}
			}
			await Promise.all(results.slice(-batchSize));
		}

		return Promise.all(results);
	}

	function _runner(fn) {
		return async function getArgs(...args) {
			var ret = fn(...args);

			if (ret && typeof ret.next == "function" && typeof ret[Symbol.iterator] == "function") {
				// return a promise for the generator completing
				return Promise.resolve()
					.then(function handleNext(value){
						// run to the next yielded value
						var next = ret.next(value);

						return (function handleResult(next){
							// generator has completed running?
							if (next.done) {
								return next.value;
							}
							// otherwise keep going
							else {
								return Promise.resolve(next.value)
									.then(
										// resume the async loop on
										// success, sending the resolved
										// value back into the generator
										handleNext,

										// if `value` is a rejected
										// promise, propagate error back
										// into the generator for its own
										// error handling
										function handleErr(err) {
											return Promise.resolve(
												ret.throw(err)
											)
											.then(handleResult);
										}
									);
							}
						})(next);
					});
			}
			else return ret;
		};
	}

});
