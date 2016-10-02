# Kaiser - Node.js web crawler

<img src="logo/kaiser.png" alt="Kaiser Logo" width="222" height="220" />

[![NPM](https://nodei.co/npm/kaiser.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/kaiser/)

[![Build status](https://travis-ci.org/Kashio/kaiser.svg?branch=master)](https://travis-ci.org/Kashio/kaiser)
[![Coverage Status](https://coveralls.io/repos/github/Kashio/kaiser/badge.svg?branch=master)](https://coveralls.io/github/Kashio/kaiser?branch=master)
[![Dependency Status](https://david-dm.org/Kashio/kaiser.svg)](https://david-dm.org/Kashio/kaiser)
[![devDependency Status](https://david-dm.org/Kashio/kaiser/dev-status.svg)](https://david-dm.org/Kashio/kaiser#info=devDependencies)

## Basic usage

```js
var Crawler = require('kaiser').Crawler;
new Crawler({
    uri: 'http://www.google.com'
}).start();
```

## Table of contents

- [Crawler Pipeline](#crawler-pipeline)
- [Basic Pipline Components](#basic-pipiline-components)
- [Plugin Custom Components](#plugin-custom-components)
- [Events](#events)
- [Options](#options)
- [Pitfalls](#pitfalls)

---

## Crawler Pipeline

The crawler pipline is a sequence of steps that kaiser takes when crawling.
This overview will provide a high-level description of the steps in the pipeline.

### Compose
This step is responsible of taking uris to be crawled and map them to a `Resource` object,
the basic object 

### Fetch
This step is responsible of taking the `Resource` objects produced in the previous step
and enrich them with `content` and `encoding` by fetching them using HTTP requests.

### Discover
This step is responsible of taking the enriched `Resource` from the previous step
and find more links to be launched in a new crawling pipeline.

### Transform
This step is responsible for taking the `Resource` objects from the previous step
and applying all sorts of transformations on the `content` of a `Resource`.

### Cache
This step is responsible for caching the `Resource` objects (or parts of it) using some caching mechanism.

## Basic Pipline Components
The crawler is supplied with basic components for each step of the pipeline.
Each component has its own strategy and goal.
This is an overview of each of the basic components, supplied by the crawler,
that have a reason for their goal or strategy to change.

#### Basic Discoverer
> ##### Goal
> Find more links to be launched in a new crawling pipeline.
> ##### Strategy
> Links are found using regex to match any url between `src` or `href` tags, a `url` css property's value (such as of `background` property), or any valid url that appears
in the documents.

#### Basic Transformer
> ##### Goal
> Transform the `content` of a `Resource` so that all links found will be relative paths
to where they would've been if they were stored on the filesystem.
> ##### Strategy
> Links are found using regex to match any url between `src` or `href` tags, a `url` css property's value (such as of `background` property), or any valid url that appears
in the documents, and there relative paths are being calulcated (Different calculations are applied for fetched and not fetched uris, depending on the crawler rules).

#### Memory Cache
> ##### Goal
> Store `Resource` objects in the memory.
> ##### Strategy
> `Resource` objects are stored in a dictionary using their unique url, for easy retrival later.

#### Fs Cache
> ##### Goal
> Store `Resource` objects in the filesystem.
> ##### Strategy
> `Resource` objects are stored in the correct hierarchy in the filesystem.

## Plugin Custom Components
The crawler was built around the idea of pipeline and components so other custom made components
could be used instead of the basic one, achieving different goals.

### Create a custom component
Each component is a `ResourceWorker`, meaning it process a `Resource` object in someway.
In-order to create a custom component we would create a class that extends it.
```js
function TextInserterTransformer(crawler, options) {
	var self = this;
	TextInserterTransformer.init.call(self, crawler, options);
}

// Transformer is already extending ResourceWorker
util.inherits(TextInserterTransformer, Transformer);

TextInserterTransformer.init = function(crawler, options) {
	var self = this;
	Transformer.init.call(self, crawler);
	self.text = options.text;
};

// we must implmenet logic function, this function is called in each step
// it's the core of your component
TextInserterTransformer.prototype.logic = function(resource, callback) {
	var self = this;
	if (self.canTransform(resource)) {
		// do logic
		resource.content = self.text + resource.content;
	}
	// logic needs to call the callback with an error and the processed Reosurce
	// to let the pipeline continue to the next step
	callback(null, resource);
};

TextInserterTransformer.prototype.canTransform = function(resource) {
	var self = this;
	return true;
};
```

> Class to extend when creating custom components:
> * Composer
> * Fetcher
> * Discoverer
> * Transformer
> * Cache

### Usage of the created component
To inject the custom component we will aquire it and inject it to the options passed to the crawler.
```js
var Crawler = require('kaiser').Crawler;
var TextInserterTransformer = require('TextInserterTransformer');

// Option A - the crawler will take care of injecting it-self to the component
new Crawler({
    uri: 'http://www.google.com',
    transformer: new TextInserterTransformer(null, {
    	text: 'Hello world'
    })
}).start();

// Option B - we take care of injecting the crawler to the constructor of the component
var crawler = new Crawler({
    uri: 'http://www.google.com'
})
var transformer = new TextInserterTransformer(crawler, {
	text: 'Hello world'
});
crawler.transformer = transformer;
crawler.start();
```

## Events
* `crawlstart()` - fires when the crawler starts.
* `crawlcomplete()` - fires when the crawler finishes.
* `crawlbulkstart(uris, originator)` - fires when a bulk of uris are starting the crawling pipeline.
`uris` are the uris that about to start the crawling pipeline, `originator` is the `Resource` the uris
were found in.
* `crawlbulkcomplete(resources, originator)` - fires when a bulk of uris have finished the crawling pipeline.
`resources` are the `Resource` objects that made it successfully through the bulk pipeline, `originator` is the `Resource`
the `resources` were found.
* `composestart(originator, uris)` - fires when the compose component starts. `uris` are the uris
to that are about to be composed into `Resource` objects, `originatgor` is the `Resource` object
those uris were discovered from.
* `composecomplete(resources)` - fires when the compose component finishes. `resources` are the `Resource`
objects that were composed in the process.
* `fetchstart(resource)` - fires when the fetch component starts. `resource` is the `Resource` object
that is about to be fetched.
* `fetchcomplete(resource)` - fires when the fetch component finishes. `resource` is the `Resource` object
that was fetched in the process.
* `fetcherror(resource, error)` - fires when the **basic fetch** component can't fetch a resource.
`resource` is the `Resource` object that can't be fetched, `error` is the error object (error specific to the implementation of the component logic).
* `discoverstart(resource)` - fires when the discover component starts. `resource` is the `Resource` object
that is about to be searched for more uris.
* `discovercomplete(resource, uris)` - fires when the discover component finishes. `resource` is the `Resource` object
that was searched for more uris in the process, `uris` are the found uris.
* `discovererror(resource, uri, error)` - fires when the **basic disocver** component can't format a found link.
`resource` is the `Resource` object that the `uri` was found in, `error` is the error object
(error specific to the implementation of the component logic).
* `transformstart(resource)` - fires when the fetch transform starts. `resource` is the `Resource` object
that is about to be transformed.
* `transformcomplete(resource)` - fires when the transform component finishes. `resource` is the `Resource` object
that was transformed in the process.
* `transformerror(resource, uri, error)` - fires when the **basic transform** component can't replace a found link.
`resource` is the `Resource` object that the `uri` was found in, `error` is the error object
(error specific to the implementation of the component logic).
* `storestart(resource)` - fires when the cache component starts. `resource` is the `Resource` object
that is about to be cached.
* `storecomplete(resource)` - fires when the cache component finishes. `resource` is the `Resource` object
that was cached in the process.
* `storeerror(resource, error)` - fires when the **fs cache** component can't store a resource in the filysystem.
`resource` is the `Resource` object that can't be saved, `error` is the error object (error specific to the implementation of the component logic).

## Options
* `uri` - The uri we want to start crawling from.
* `followRobotsTxt` - if `true`, follows robots.txt rules. Defaults to `false`.
* `maxDepth` - The maximum depth of resource to still crawl links for the same resource domain as the original resource.
Defaults to `1`.
* `maxExternalDepth` - The maximum depth of resource to still crawl links for external resource domain as the original resource.
Defaults to `0`.
* `maxFileSize` - The maximum file size that is allowed to be crawled.
Defaults to `1024 * 1024 * 16`.
* `maxLinkNumber` - The maximum number of links to crawl before stopping.
Defaults to `Number.POSITIVE_INFINITY`.
* `siteSizeLimit` - The maximum total of bytes to be crawled. This number can be passed but not by a large margin,
because this check is only being applied before fetching new resources but not after,
meaning that if we allow 10 byts to be fetched and now we're at 9, and the next resource is 10 bytes, then we will fetch a total
of 19 bytes and then stop.
Defaults to `maxFileSize * maxLinkNumber`.
* `maxTimeOverall` - The maximum time to crawl. Do no depend on this restriction too much,
resources inside the crawler pipeline would continue to be processed, new links found in the discover step won't.
Defaults to `Number.POSITIVE_INFINITY`.
* `allowedProtocols` - Array of allowed protocols to be fetched. Defaults to
  * http
  * https
* `allowedFileTypes` - Array of allowed file types to be fetched. Defaults to
  * html
  * htm
  * css
  * js
  * xml
  * gif
  * jpg
  * jpeg
  * png
  * tif
  * bmp
  * eot
  * svg
  * ttf
  * woff
  * txt
  * htc
  * php
  * asp
  * (blank) for files without extensions
* `allowedMimeTypes` - Regex array of allowed mime types to be fetched. Defaults to
  * ^text/.+$
  * ^application\/(?:x-)?javascript$
  * ^application\/(?:rss|xhtml)(?:\+xml)?
  * \/xml$
  * ^image\/.+$
  * application\/octet-stream
* `disallowedHostnames` - Array of blacklist hostnames not to be crawled. Defaults to empty array.
* `allowedLinks` - Regex array of allowed links to be crawled. Defaults to
  * .* 
* `composer` - The `composer` component to be used. Defaults to `BasicComposer`.
* `fetcher` - The `fetcher` component to be used. Defaults to `BasicFetcher`
(These are [Request](https://github.com/request/request) options, because it used in the basic fetcher).
  * `maxAttempts` - The number of attempts to try fetch a resource that couldn't be fetched.
  * `retryDelay` - The delay in milliseconds between each retry.
  * `maxConcurrentRequests` - The maximum number of concurrent requests.
  * `proxy` - Proxy the requests through this uri.
  * `auth` - Authentication if needed.
  * `acceptCookies` - If `true` use cookies. Defaults to `true`.
  * `userAgent` - User agent string. Defaults to `Node/kaiser <version> (https://github.com/Kashio/kaiser.git)`
  * `maxSockets` - The maximum number of sockets to be used by the underlying http agent.
  * `timeout` - The timeount in milliseconds to wait for a server to send response headers before aborting requests.
  * `strictSSL` - If `true`, requires SSL certificates be valid. Defaults to `true`.
* `discoverer` - The `discoverer` component to be used. Defaults to `BasicDiscoverer`.
* `transformer` - The `transformer` component to be used. Defaults to `BasicTransformer`.
  * `rewriteLinksFileTypes` - Array of file types to rewrite only links with these types. Defaults to
    * html
    * htm
    * css
    * js
    * php
    * asp
    * txt
    * (blank) for files without extensions
* `cache` - The `cache` component to be used. Defaults to `FsCache`.
  * `rootDir` - Path to the directory of where to save the resources if `FsCache` is used as the `cache` component.
  
> Note the the options passed to the components can also be passed directly to the crawler
and they will be injected to the components. These options are valid only for the basic components supplied with kaiser.

## Pitfalls
### Alot of `ETIMEDOUT` and `ESOCKETTIMEDOUT` errors
This might be due to the server blocking alot of requests from your ip in a short amount of time.
Another cause might be by the low number of workers Node.js have for resolving DNS queries, try to increase it.
```js
process.env.UV_THREADPOOL_SIZE = 128;
```

### Applicaiton is slowed down by the crawler
Because the crawler allows you to plugin components as you wish, some might be hindering the applicaiton
by their logic, and might block the event loop. Even the supplied components are somewhat CPU intensive,
therefore it is recommended to launch the crawler in a new process.
```js
// crawler_process.js
var Crawler = require('kaiser').Crawler;
new Crawler({
    uri: 'http://www.google.com'
}).start();

// app.js
var fork = require('child_process').fork;
fork('./crawler_process');
...
```

## Tests
Run tests with <br/>
`$ npm run test`

## License

kaiser is licensed under the [GPL V3 License](https://raw.githubusercontent.com/Kashio/kaiser/master/LICENSE).