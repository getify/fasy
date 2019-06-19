(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("FA",this,function DEF(name,context){
	"use strict";

	var cachedConcurrentAPI = {};
	var never = new Promise(function c(){});

	var serial = {
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

	// complete serial API definition
	Object.assign(serial,defineConcurrentAPI(1));
	serial.filter = serial.filterIn;

	var publicAPI = {
		concurrent: defineConcurrentAPI,
		serial,
		transducers,
	};

	return publicAPI;


	// ***************************************
	// Private

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
				reduce: serial.reduce,
				reduceRight: serial.reduceRight,
				pipe: serial.pipe,
				compose: serial.compose,
			};
		}

		return cachedConcurrentAPI[cacheKey];
	}

	function concurrentMap(batchSize,minActive) {
		return async function map(mapperFn,arr = []){
			mapperFn = _runner(mapperFn);

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
