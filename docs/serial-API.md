# Serial API

* [`serial.filter(..)`](#serialfilter)
* [`serial.forEach(..)`](#serialforeach)
* [`serial.map(..)`](#serialmap)
* [`serial.reduce(..)`](#serialreduce)
* [`serial.reduceRight(..)`](#serialreduceright)

----

### `serial.filter(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), checking each item with a predicate function (`fn`), producing a new list of items. To include an item in the filtered list, the predicate function should eventually resolve to `true` (or a truthy value); `false` or a falsy value will ignore/exclude the item. Returns a promise for overall completion of the async filtering; the fulfillment value is the new list.

All predicate functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#filter(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the predicate function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce `true` for inclusion of the item or `false` for exclusion of the item
    - `arr`: list to iterate over

* **Returns:** *Promise<array>*

* **Example:**

    ```js
    pickImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function pickImages(imageUrls) {
        var imgCount = 0;
        var avgBrightness = 0;

        var pickedImages = await FA.serial.filter(
            async function checkImg(url) {
                if (imgCount < 2 || avgBrightness < 20) {
                    var img = await preloadImg( url );
                    var imgBrightness = pixelBrightness( img );
                    var newAvgBrightness =
                        ((avgBrightness * imgCount) + imgBrightness) /
                        (imgCount + 1);

                    if (newAvgBrightness < 50) {
                        avgBrightness = newAvgBrightness;
                        imgCount++;
                        return true;
                    }
                }

                return false;
            },
            imageUrls
        );

        // standard built-in array#forEach
        pickedImages.forEach( url => console.log( `Picked image: ${url}` ) );
    }

    async function preloadImg(url) { /*..*/ }
    function pixelBrightness(img) { /*..*/ }
    ```

----

### `serial.forEach(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), executing a function (`fn`) for each item. Returns a promise for overall completion of the async iteration; the fulfillment value is `undefined`.

All functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#forEach(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the iteration function; called each time with `v` (value), `i` (index), and `arr` (list) arguments
    - `arr`: list to iterate over

* **Returns:** *Promise<undefined>*

* **Example:**

    ```js
    renderImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function renderImages(imageUrls) {
        // preload the images concurrently (in parallel)
        var imgs = await FA.concurrent.map( preloadImg, imageUrls );

        // render them serially (in order)
        await FA.serial.forEach( renderImg, imgs );

        console.log( "All images preloaded and rendered." );
    }

    async function preloadImg(url) { /*..*/ }
    async function renderImg(imgObj) { /*..*/ }
    ```

----

### `serial.map(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), mapping each item to a new value with a function (`fn`), producing a new list of items. Returns a promise for overall completion of the async iteration; the fulfillment value is the new list.

All mapper functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is the asynchronous equivalent of JavaScript's built-in [`Array#map(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the mapper function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce a new mapped item value
    - `arr`: list to iterate over

* **Returns:** *Promise<array>*

* **Example:**

    ```js
    cacheImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function cacheImages(imageUrls) {
        var imgFilenames = await FA.serial.map(
            async function getCacheFilename(url) {
                var filename = await checkCache( url );

                if (!filename) {
                    filename = await cacheImage( url );
                }

                return [url,filename];
            }
            imageUrls
        );

        // standard built-in array#forEach
        imgFilenames.forEach(
            ([url,filename]) => console.log( `${url} stored in: ${filename}` )
        );
    }

    async function checkCache(url) { /*..*/ }
    async function cacheImage(url) { /*..*/ }
    ```

----

### `serial.reduce(..)`
### `serial.reduceRight(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), performing a reduction, item by item, starting from an initial value. For `serial.reduce(..)`, the iteration order is left-to-right. For `serial.reduceRight(..)`, the iteration order is right-to-left. Returns a promise for overall completion of the async iteration; the fulfillment value is the final result of the reduction.

All mapper functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is (almost) the asynchronous equivalent of JavaScript's built-in [`Array#reduce(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) / [`Array#reduceRight(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight) methods. However, [unlike the built-in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Parameters) methods, the **initialValue** argument is not optional.

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the reducer function; called each time with `acc` (accumulator), `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce a new mapped item value
    - `initialValue`: the initial value for the accumulator
    - `arr`: list to iterate over

* **Returns:** *Promise<any>*

* **Example:**

    ```js
    pickImages( [
        "https://some.tld/image1.png",
        "https://other.tld/image2.png",
        "https://various.tld/image3.png"
    ] );

    async function pickImages(imageUrls) {
        var picked = await FA.serial.reduce(
            async function checkImg(pickedSoFar,url) {
                if (pickedSoFar.urls.length < 2 || pickedSoFar.avgBrightness < 20) {
                    var img = await preloadImg( url );
                    var imgBrightness = pixelBrightness( img );
                    var newAvgBrightness =
                        ((avgBrightness * imgCount) + imgBrightness) /
                        (imgCount + 1);

                    if (newAvgBrightness < 50) {
                        return {
                            urls: pickedSoFar.urls.concat( url ),
                            avgBrightness: newAvgBrightness
                        };
                    }
                }

                return pickedSoFar;
            },
            { urls: [], avgBrightness: 0 },
            imageUrls
        );

        // standard built-in array#forEach
        picked.urls.forEach( url => console.log( `Picked image: ${url}` ) );
    }

    async function preloadImg(url) { /*..*/ }
    function pixelBrightness(img) { /*..*/ }
    ```
