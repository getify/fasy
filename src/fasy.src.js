(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("FA",this,function DEF(name,context){
	"use strict";

	var concurrent = {
		async forEach(eachFn,arr = []) {
			await Promise.all(arr.map(_run(eachFn)));
		},
		async map(mapperFn,arr = []) {
			return Promise.all(arr.map(_run(mapperFn)));
		},
		async flatMap(mapperFn,arr = []) {
			return (
					await concurrent.map(mapperFn,arr)
				)
				// note: normal array#reduce
				.reduce(function reducer(ret,v){ return ret.concat(v); },[]);
		},
		async filterIn(predicateFn,arr = []) {
			predicateFn = _run(predicateFn);
			return (
					await Promise.all(arr.map(async function mapper(v,idx,arr) {
						return [v,await predicateFn(v,idx,arr)];
					}))
				)
				// note: normal array#reduce
				.reduce(function reducer(ret,[v,keep]){
					if (keep) return ret.concat(v);
					return ret;
				},[]);
		},
		async filterOut(predicateFn,arr = []) {
			predicateFn = _run(predicateFn);
			return concurrent.filterIn(async function filterer(v,idx,arr){
				return !(await predicateFn(v,idx,arr));
			},arr);
		},
	};

	var serial = {
		async forEach(eachFn,arr = []) {
			eachFn = _run(eachFn);
			for (let [idx,v] of arr.entries()) {
				await eachFn(v,idx,arr);
			}
		},
		async map(mapperFn,arr = []) {
			mapperFn = _run(mapperFn);
			var ret = [];
			for (let [idx,v] of arr.entries()) {
				ret.push(await mapperFn(v,idx,arr));
			}
			return ret;
		},
		async flatMap(mapperFn,arr = []) {
			var ret = [];
			await serial.forEach(async function eacher(v,idx,arr){
				ret = ret.concat(await mapperFn(v,idx,arr));
			},arr);
			return ret;
		},
		async filterIn(predicateFn,arr = []) {
			predicateFn = _run(predicateFn);
			var ret = [];
			for (let [idx,v] of arr.entries()) {
				if (await predicateFn(v,idx,arr)) {
					ret.push(v);
				}
			}
			return ret;
		},
		async filterOut(predicateFn,arr = []) {
			predicateFn = _run(predicateFn);
			return serial.filterIn(async function filterer(v,idx,arr){
				return !(await predicateFn(v,idx,arr));
			},arr);
		},
		async reduce(reducerFn,initial,arr = []) {
			reducerFn = _run(reducerFn);
			var ret = initial;
			for (let [idx,v] of arr.entries()) {
				ret = await reducerFn(ret,v,idx,arr);
			}
			return ret;
		},
		async reduceRight(reducerFn,initial,arr = []) {
			reducerFn = _run(reducerFn);
			var ret = initial;
			for (let [idx,v] of [...arr.entries()].reverse()) {
				ret = await reducerFn(ret,v,idx,arr);
			}
			return ret;
		},
	};

	var publicAPI = {
		concurrent,
		serial,
	};

	// method convenience aliases
	_setMethodAlias("filterIn","filter");
	concurrent.reduce = serial.reduce;
	concurrent.reduceRight = serial.reduceRight;

	return publicAPI;


	// ***************************************
	// Private

	function _setMethodAlias(origName,aliasName) {
		publicAPI.concurrent[aliasName] = publicAPI.concurrent[origName];
		publicAPI.serial[aliasName] = publicAPI.serial[origName];
	}

	function _run(fn) {
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
		}
	}

});
