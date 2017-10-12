(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("FA",this,function DEF(name,context){
	"use strict";

	var concurrent = {
		async forEach(arr,fn) {
			await Promise.all(arr.map(run(fn)));
		},
		async map(arr,fn) {
			return Promise.all(arr.map(run(fn)));
		},
		async filter(arr,fn) {
			fn = run(fn);
			return (
				await Promise.all(arr.map(async function mapper(v,idx,arr) {
					return [v,await fn(v,idx,arr)];
				}))
			)
			.filter(function filterer([v,keep]) { return !!keep; })
			.map(function mapper([v,keep]) { return v; });
		},
		async reduce(...args) {
			return serial.reduce(...args);
		},
		async reduceRight(...args) {
			return serial.reduceRight(...args);
		},
	};

	var serial = {
		async forEach(arr,fn) {
			fn = run(fn);
			for (let [idx,v] of arr.entries()) {
				await fn(v,idx,arr);
			}
		},
		async map(arr,fn) {
			fn = run(fn);
			var ret = [];
			for (let [idx,v] of arr.entries()) {
				ret.push(await fn(v,idx,arr));
			}
			return ret;
		},
		async filter(arr,fn) {
			fn = run(fn);
			var ret = [];
			for (let [idx,v] of arr.entries()) {
				if (await fn(v,idx,arr)) {
					ret.push(v);
				}
			}
			return ret;
		},
		async reduce(arr,initial,fn) {
			fn = run(fn);
			var ret = initial;
			for (let [idx,v] of arr.entries()) {
				ret = await fn(ret,v,idx,arr);
			}
			return ret;
		},
		async reduceRight(arr,initial,fn) {
			fn = run(fn);
			var ret = initial;
			for (let [idx,v] of [...arr.entries()].reverse()) {
				ret = await fn(ret,v,idx,arr);
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
