# Transducers API

* [`transducers.filter(..)`](#transducersfilter)
* [`transducers.into(..)`](#transducersinto)
* [`transducers.map(..)`](#transducersmap)
* [`transducers.transduce(..)`](#transducerstransduce)
* **Built-in Reducers:**
	- [`transducers.array(..)`](#transducersarray)
	- [`transducers.booleanAnd(..)`](#transducersbooleanand)
	- [`transducers.booleanOr(..)`](#transducersbooleanor)
	- [`transducers.default(..)`](#transducersdefault)
	- [`transducers.number(..)`](#transducersnumber)
	- [`transducers.string(..)`](#transducersstring)

----

### `transducers.filter(..)`

([back to top](#transducers-api))

For transducing purposes, wraps a predicate function as a filter-transducer.

A transducer is not a reducer itself; it's a function that's expecting a reducer as input, and produces a new reducer as output. Transducers can be composed with each other using normal composition (like [`serial.compose(..)`](serial-API.md#serialcompose) or [`serial.pipe(..)`](serial-API.md#serialpipe)).

A transducer (or composition of transducers) is generally passed to [`transducers.transduce(..)`](#transducerstransduce) or [`transducers.into(..)`](#transducersinto).

**Note:** As with all **fasy** methods, the predicate function and subsequently provided reducer can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
	- `fn`: the predicate function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce `true` for inclusion of the item or `false` for exclusion of the item

* **Returns:** *function* (filter-transducer)

* **Example:**

	```js
	var nums = [1,2,3,4,5];

	var filterTransducer = FA.transducers.filter( function isOdd(v) { return v % 2 == 1; } );

	FA.transducers.transduce( filterTransducer, FA.transducers.array, [], nums )
	.then( v => console.log( v ) );
	// [1,3,5]

	// ******************

	var filterReducer = filterTransducer( FA.transducers.array );

	filterReducer( [], 3 );
	// [3]

	filterReducer( [], 4 );
	// []

	serial.reduce( filterReducer, [], nums )
	.then( v => console.log( v ) );
	// [1,3,5]
	```

* **See Also:** [`transducers.map(..)`](#transducersmap)

----

### `transducers.into(..)`

([back to top](#transducers-api))

This is a convenience method as a shortcut to slightly simplify the usage of [`transducers.transduce(..)`](#transducerstransduce) in many cases.

Takes as input a transducer, initial value, and a list. Based on the value type of the initial value, an appropriate reducer for that value type is selected. All four of these values are then passed to [`transducers.transduce(..)`](#transducerstransduce) to perform the reduction.

**Note:** As with all **fasy** methods, the transducers and reducers can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
	- `transducer`: function waiting for a reducer, to produce a new reducer
	- `initialValue`: the initial value for the reduction
	- `arr`: list to iterate over

* **Returns:** *Promise<any>*

* **Example:**

	```js
	function double(v) { return v * 2; }
	function isOdd(v) { return v % 2 == 1; }

	var nums = [1,2,3,4,5];

	var transducer = FA.compose( [
		FA.transducers.filter( isOdd ),
		FA.transducers.map( double )
	] );

	FA.transducers.into( transducer, [], nums );
	// [2,6,10]

	FA.transducers.into( transducer, 0, nums );
	// 18

	FA.transducers.into( transducer, "", nums );
	// "2610"
	```

* **See Also:** [`transducers.transduce(..)`](#transducerstransduce)

----

### `transducers.map(..)`

([back to top](#transducers-api))

For transducing purposes, wraps a mapper function as a map-transducer.

A transducer is not a reducer itself; it's a function that's expecting a reducer as input, and produces a new reducer as output. Transducers can be composed with each other using normal composition (like [`serial.compose(..)`](serial-API.md#serialcompose) or [`serial.pipe(..)`](serial-API.md#serialpipe)).

A transducer (or composition of transducers) is generally passed to [`transducers.transduce(..)`](#transducerstransduce) or [`transducers.into(..)`](#transducersinto).

**Note:** As with all **fasy** methods, the mapper function and subsequently provided reducer can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
	- `fn`: the mapper function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce a new mapped item value

* **Returns:** *function* (map-transducer)

* **Example:**

	```js
	var nums = [1,2,3,4,5];

	var mapTransducer = FA.transducers.map( function double(v) { return v * 2; } );

	FA.transducers.transduce( mapTransducer, FA.transducers.array, [], nums )
	.then( v => console.log( v ) );
	// [2,4,6,8,10]

	// ******************

	var mapReducer = mapTransducer( FA.transducers.array );

	mapReducer( [], 3 );
	// [6]

	FA.serial.reduce( mapReducer, [], nums )
	.then( v => console.log( v ) );
	// [2,4,6,8,10]
	```

* **See Also:** [`transducers.filter(..)`](#transducersfilter)

----

### `transducers.transduce(..)`

([back to top](#transducers-api))

Performs a reduction over a list, starting with an initial value. Also takes a transducer and a reducer as inputs; the reducer is fed to the transducer, which produces a reducer to use for the reduction. Returns a promise whose fulfillment value is the result of the reduction.

A transducer is a function that's expecting a reducer as input, and produces a new reducer as output. Transducers can be composed with each other using normal composition (like [`serial.compose(..)`](serial-API.md#serialcompose) or [`serial.pipe(..)`](serial-API.md#serialpipe)).

Each step of the reduction will be processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

**Note:** As with all **fasy** methods, the transducers and reducers can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
	- `transducer`: function waiting to be fed a reducer
	- `reducer`: the reducer to feed to `transducer`, which then generates the reducer to use for the reduction
	- `initialValue`: the initial value for the reduction
	- `arr`: list to iterate over

* **Returns:** *Promise<any>*

* **Example:**

	```js
	function double(v) { return v * 2; }
	function isOdd(v) { return v % 2 == 1; }

	var nums = [1,2,3,4,5];

	var transducer = FA.serial.compose( [
		FA.transducers.filter( isOdd ),
		FA.transducers.map( double )
	] );

	FA.transducers.transduce( transducer, FA.transducers.array, [], nums );
	// [2,6,10]
	```

* **See Also:** [`transducers.into(..)`](#transducersinto)

----

### `transducers.array(..)`

([back to top](#transducers-api))

For transducing purposes, a reducer function that takes an array and a value, and mutates the array by pushing the value onto the end of it. The mutated array is returned.

**This function has side-effects**, for performance reasons. It should be used with caution.

* **Arguments:**
	- `acc`: acculumator
	- `v`: value

* **Returns:** *array*

* **Example:**

	```js
	var arr = [1,2,3];

	FA.transducers.array( arr, 4 );
	// [1,2,3,4]

	arr;
	// [1,2,3,4] <-- was mutated as a side-effect!
	```

* **See Also:** [`transducers.booleanAnd(..)`](#transducersbooleanand),
* [`transducers.booleanOr(..)`](#transducersbooleanor), [`transducers.default(..)`](#transducersdefault), [`transducers.number(..)`](#transducersnumber), [`transducers.string(..)`](#transducersstring)

----

### `transducers.booleanAnd(..)`

([back to top](#standard-api))

For transducing purposes, a reducer function that takes two booleans and *AND*s them together. The result is the logical *AND* of the two values.

* **Arguments:**
	- `acc`: acculumator
	- `v`: value

* **Returns:** *true/false*

* **Example:**

	```js
	FA.transducers.booleanAnd( true, true );
	// true

	FA.transducers.booleanAnd( false, true );
	// false
	```

* **Aliases:** `transducers.boolean(..)`

* **See Also:** [`transducers.array(..)`](#transducersarray), [`transducers.booleanOr(..)`](#transducersbooleanor), [`transducers.default(..)`](#transducersdefault), [`transducers.number(..)`](#transducersnumber), [`transducers.string(..)`](#transducersstring)

----

### `transducers.booleanOr(..)`

([back to top](#standard-api))

For transducing purposes, a reducer function that takes two booleans and *OR*s them together. The result is the logical *OR* of the two values.

* **Arguments:**
	- `acc`: acculumator
	- `v`: value

* **Returns:** *true/false*

* **Example:**

	```js
	FA.transducers.booleanOr( false, true );
	// true

	FA.transducers.booleanOr( false, false );
	// false
	```

* **See Also:** [`transducers.array(..)`](#transducersarray), [`transducers.booleanAnd(..)`](#transducersbooleanand), [`transducers.default(..)`](#transducersdefault), [`transducers.number(..)`](#transducersnumber), [`transducers.string(..)`](#transducersstring)

----

### `transducers.default(..)`

([back to top](#standard-api))

For transducing purposes, a reducer function that's a default placeholder. It returns the first parameter that's passed to it; basically this is the identity function from FP.

* **Arguments:**
	- `acc`: acculumator

* **Returns:** *-any-*

* **Example:**

	```js
	FA.transducers.default( 3, 1 );
	// 3
	```

* **See Also:** [`transducers.array(..)`](#transducersarray), [`transducers.booleanAnd(..)`](#transducersbooleanand), [`transducers.booleanOr(..)`](#transducersbooleanOr), [`transducers.number(..)`](#transducersnumber), [`transducers.string(..)`](#transducersstring), [`identity(..)`](#identity)

----

### `transducers.number(..)`

([back to top](#standard-api))

For transducing purposes, a reducer function that adds together the two numbers passed into it. The result is the sum.

* **Arguments:**
	- `acc`: acculumator
	- `v`: value

* **Returns:** *number*

* **Example:**

	```js
	FA.transducers.number( 3, 4 );
	// 7
	```

* **See Also:** [`transducers.array(..)`](#transducersarray), [`transducers.booleanAnd(..)`](#transducersbooleanand), [`transducers.booleanOr(..)`](#transducersbooleanOr), [`transducers.default(..)`](#transducersdefault), [`transducers.string(..)`](#transducersstring)

----

### `transducers.string(..)`

([back to top](#standard-api))

For transducing purposes, a reducer function that concats the two strings passed into it. The result is the concatenation.

* **Arguments:**
	- `acc`: acculumator
	- `v`: value

* **Returns:** *string*

* **Example:**

	```js
	FA.transducers.string( "hello", "world" );
	// "helloworld"
	```

* **See Also:** [`transducers.array(..)`](#transducersarray), [`transducers.booleanAnd(..)`](#transducersbooleanand), [`transducers.booleanOr(..)`](#transducersbooleanOr), [`transducers.default(..)`](#transducersdefault), [`transducers.number(..)`](#transducersnumber)
