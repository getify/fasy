"use strict";

module.exports.runner = function runner(fn){
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
};
