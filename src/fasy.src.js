(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("FA",this,function DEF(name,context){
	"use strict";

	var concurrent = {
		async forEach(eachFn,arr = []) {
			await Promise.all(arr.map(run(eachFn)));
		},
		async map(mapperFn,arr = []) {
			return Promise.all(arr.map(run(mapperFn)));
		},
		async flatMap(mapperFn,arr = []) {
			var ret = await concurrent.map(mapperFn,arr);
			return ret.reduce(function reducer(list,v){ return list.concat(v); },[]);
		},
		async filter(predicateFn,arr = []) {
			predicateFn = run(predicateFn);
			return (
				await Promise.all(arr.map(async function mapper(v,idx,arr) {
					return [v,await predicateFn(v,idx,arr)];
				}))
			)
			.reduce(function reducer(ret,[v,keep]){
				if (keep) return ret.concat(v);
				return ret;
			},[]);
		},
		async reduce(...args) {
			return serial.reduce(...args);
		},
		async reduceRight(...args) {
			return serial.reduceRight(...args);
		},
	};

	var serial = {
		async forEach(eachFn,arr = []) {
			eachFn = run(eachFn);
			for (let [idx,v] of arr.entries()) {
				await eachFn(v,idx,arr);
			}
		},
		async map(mapperFn,arr = []) {
			mapperFn = run(mapperFn);
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
		async filter(predicateFn,arr = []) {
			predicateFn = run(predicateFn);
			var ret = [];
			for (let [idx,v] of arr.entries()) {
				if (await predicateFn(v,idx,arr)) {
					ret.push(v);
				}
			}
			return ret;
		},
		async reduce(reducerFn,initial,arr = []) {
			reducerFn = run(reducerFn);
			var ret = initial;
			for (let [idx,v] of arr.entries()) {
				ret = await reducerFn(ret,v,idx,arr);
			}
			return ret;
		},
		async reduceRight(reducerFn,initial,arr = []) {
			reducerFn = run(reducerFn);
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

	return publicAPI;


	// ***************************************

	function run(fn) {
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
