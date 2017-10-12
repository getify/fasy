# Concurrent API

* [`concurrent.filter(..)`](#concurrentfilter)
* [`concurrent.forEach(..)`](#concurrentforeach)
* [`concurrent.map(..)`](#concurrentmap)
* [`concurrent.reduce(..)`](#concurrentreduce)
* [`concurrent.reduceRight(..)`](#concurrentreduceright)

----

### `concurrent.filter(..)`

([back to top](#concurrent-api))

Iterate through items in a list (`arr`), checking each item with a predicate function (`fn`), producing a new list of items. To include an item in the filtered list, the predicate function should eventually resolve to `true` (or a truthy value); `false` or a falsy value will ignore/exclude the item. Returns a promise for overall completion of the async filtering; the fulfillment value is the new list.

All predicate functions are processed concurrently (aka "in parallel"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#filter(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the predicate function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce `true` for inclusion of the item or `false` for exclusion of the item
    - `arr`: list to iterate over

* **Returns:** *Promise<array>*

* **Example:**

    ```js
    checkImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function checkImages(imageUrls) {
        var availableImgUrls = await FA.concurrent.filter( imgExists, imageUrls );
        console.log( `Images available: ${availableImgUrls}` );
    }

    async function imgExists(url) { /*..*/ }
    ```

----

### `concurrent.forEach(..)`

([back to top](#concurrent-api))

Iterate through items in a list (`arr`), executing a function (`fn`) for each item. Returns a promise for overall completion of the async iteration; the fulfillment value is `undefined`.

All functions are processed concurrently (aka "in parallel"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#forEach(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
	- `fn`: the iteration function; called each time with `v` (value), `i` (index), and `arr` (list) arguments
    - `arr`: list to iterate over

* **Returns:** *Promise<undefined>*

* **Example:**

	```js
    preloadImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function preloadImages(imageUrls) {
        await FA.concurrent.forEach( preloadImg, imageUrls );
        console.log( "All images preloaded." );
    }

    async function preloadImg(url) { /*..*/ }
	```

----

### `concurrent.map(..)`

([back to top](#concurrent-api))

Iterate through items in a list (`arr`), mapping each item to a new value with a function (`fn`), producing a new list of items. Returns a promise for overall completion of the async iteration; the fulfillment value is the new list.

All mapper functions are processed concurrently (aka "in parallel"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#map(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the mapper function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce a new mapped item value
    - `arr`: list to iterate over

* **Returns:** *Promise<array>*

* **Example:**

    ```js
    fetchImagesData( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function fetchImagesData(imageUrls) {
        var imgDataList = await FA.concurrent.map( extractImgData, imageUrls );
        console.log( `Images data: ${imgDataList}` );
    }

    async function extractImgData(url) { /*..*/ }
    ```

----

### `concurrent.reduce(..)`
### `concurrent.reduceRight(..)`

([back to top](#concurrent-api))

These methods have no rational concurrent definition; they're the same as calling [`serial.reduce(..)`](serial-API.md#serialreduce) / [`serial.reduceRight(..)`](serial-API.md#serialreduceright), respectively.
