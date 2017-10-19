# Serial API

* [`serial.compose(..)`](#serialcompose)
* [`serial.filterIn(..)`](#serialfilterin) (aliases: `serial.filter(..)`)
* [`serial.filterOut(..)`](#serialfilterout)
* [`serial.flatMap(..)`](#serialflatmap)
* [`serial.forEach(..)`](#serialforeach)
* [`serial.map(..)`](#serialmap)
* [`serial.pipe(..)`](#serialpipe)
* [`serial.reduce(..)`](#serialreduce)
* [`serial.reduceRight(..)`](#serialreduceright)

----

### `serial.compose(..)`

([back to top](#serial-api))

Creates (immediately) a composed function from a list of functions, any/all of which may be asynchronous. The composed function can take any number of arguments initially, and returns a promise for eventual completion of the overall async composition; the fulfillment value is the final return value from the last function in the composition.

Each step of the composition will be processed right-to-left, serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

**Note:** As with all **fasync** methods, the functions in `fns` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fns`: the list of functions to compose

* **Returns:** *function* (that returns *Promise<any>*)

* **Example:**

    ```js
    // define composed function
    var prepareImg = FA.serial.compose( [makeImgDOMElem,prefetchImage,imgURL] );

    renderImage( "image1" );

    async function renderImage(url) {
        var imgElem = await prepareImg( url, "png" );
        document.body.appendChild( imgElem );
    }

    function imgURL(name,ext) { return `https://some.tld/${name}.${ext}`; }
    async function prefetchImage(url) { /* .. */ }
    function makeImgDOMElem(img) { /* .. */ }
    ```

* **See Also:** [`serial.pipe(..)`](#serialpipe)

----

### `serial.filterIn(..)`

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

        var pickedImages = await FA.serial.filterIn(
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

* **Aliases:** `serial.filter(..)`

* **See Also:** [`serial.filterOut(..)`](#serialfilterout)

----

### `serial.filterOut(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), checking each item with a predicate function (`fn`), producing a new list of items. To exclude an item from the filtered list, the predicate function should eventually resolve to `true` (or a truthy value); `false` or a falsy value will keep the item. Returns a promise for overall completion of the async filtering; the fulfillment value is the new list.

All predicate functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is kind of like the asynchronous equivalent of JavaScript's built-in [`Array#filter(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter), except that the predicate check is inverted.

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the predicate function; called each time with `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce `true` for exclusion of the item or `false` for retention of the item
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

        var pickedImages = await FA.serial.filterOut(
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
                        return false;
                    }
                }

                return true;
            },
            imageUrls
        );

        // standard built-in array#forEach
        pickedImages.forEach( url => console.log( `Picked image: ${url}` ) );
    }

    async function preloadImg(url) { /*..*/ }
    function pixelBrightness(img) { /*..*/ }
    ```

* **See Also:** [`serial.filterIn(..)`](#serialfilterin)

----

### `serial.flatMap(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), mapping each item to a new value with a function (`fn`), producing a new list of items. If a mapped value is itself a list, this list is flattened (one level) into the overall return list. Returns a promise for overall completion of the async iteration; the fulfillment value is the new list.

All mapper functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is kind of like the asynchronous equivalent of JavaScript's built-in [`Array#map(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), except that additionally any mapped return values that are lists get flattened into the result.

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
        var urlsFiles = await FA.serial.flatMap(
            async function getCacheFilename(url) {
                var filename = await checkCache( url );

                if (!filename) {
                    filename = await cacheImage( url );
                }

                return [url,filename];
            }
            imageUrls
        );

        console.log( `URLs / filenames: ${urlsFiles}` );
        // example output:
        // https://some.tld/image1.png,/tmp/3232bc2b2b3789.png,https://other.tld/image2.png,
        // /tmp/423343aab328903.png,https://various.tld/image3.png,/tmp/673472adde3f558.png
    }

    async function checkCache(url) { /*..*/ }
    async function cacheImage(url) { /*..*/ }
    ```

* **See Also:** [`serial.map(..)`](#serialmap)

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
        var urlsFiles = await FA.serial.map(
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
        urlsFiles.forEach(
            ([url,filename]) => console.log( `${url} stored in: ${filename}` )
        );
        // example output:
        // https://some.tld/image1.png stored in: /tmp/3232bc2b2b3789.png
        // https://other.tld/image2.png stored in: /tmp/423343aab328903.png
        // https://various.tld/image3.png stored in: /tmp/673472adde3f558.png
    }

    async function checkCache(url) { /*..*/ }
    async function cacheImage(url) { /*..*/ }
    ```

* **See Also:** [`serial.flatMap(..)`](#serialflatmap)

----

### `serial.pipe(..)`

([back to top](#serial-api))

Creates (immediately) a piped function from a list of functions, any/all of which may be asynchronous. The piped function can take any number of arguments initially, and returns a promise for eventual completion of the overall async piping-composition; the fulfillment value is the final return value from the last function in the piping-composition.

Each step of the piping-composition will be processed left-to-right, serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

**Note:** As with all **fasync** methods, the functions in `fns` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fns`: the list of functions to pipe

* **Returns:** *function* (that returns *Promise<any>*)

* **Example:**

    ```js
    // define piped function
    var prepareImg = FA.serial.pipe( [imgURL,prefetchImage,makeImgDOMElem] );

    renderImage( "image1" );

    async function renderImage(url) {
        var imgElem = await prepareImg( url, "png" );
        document.body.appendChild( imgElem );
    }

    function imgURL(name,ext) { return `https://some.tld/${name}.${ext}`; }
    async function prefetchImage(url) { /* .. */ }
    function makeImgDOMElem(img) { /* .. */ }
    ```

* **See Also:** [`serial.compose(..)`](#serialcompose)

----

### `serial.reduce(..)`
### `serial.reduceRight(..)`

([back to top](#serial-api))

Iterate through items in a list (`arr`), performing a reduction, item by item, starting from an initial value. For `serial.reduce(..)`, the iteration order is left-to-right. For `serial.reduceRight(..)`, the iteration order is right-to-left. Returns a promise for overall completion of the async iteration; the fulfillment value is the final result of the reduction.

All mapper functions are processed serially (aka "sequentially, in order"); whenever all of them finish, the completion will be signaled.

This is (almost) the asynchronous equivalent of JavaScript's built-in [`Array#reduce(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) / [`Array#reduceRight(..)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight) methods. However, [unlike the built-in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Parameters) methods, the **initialValue** argument is not optional.

**Note:** As with all **fasync** methods, `fn(..)` can be any of: `function`, `async function`, or `function*`. If it's a `function`, and it needs to perform asynchronous actions before being considered complete, make sure a promise is returned. `async function`s automatically return promises for their completion, so no extra effort is necessary there. If `fn(..)` is a `function*` generator, its iterator will be driven according to the [sync-async pattern](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch4.md#generators--promises), meaning `yield`ed promises delay the generator until they're resolved. Moreover, if the final `yield` / `return` value is a promise, it will be waited on before allowing completion.

* **Arguments:**
    - `fn`: the reducer function; called each time with `acc` (accumulator), `v` (value), `i` (index), and `arr` (list) arguments; should (eventually) produce a new accumulator value
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
