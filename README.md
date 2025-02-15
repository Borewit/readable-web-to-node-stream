[![Node.js CI](https://github.com/Borewit/readable-web-to-node-stream/actions/workflows/ci.yml/badge.svg)](https://github.com/Borewit/readable-web-to-node-stream/actions/workflows/ci.yml)
[![NPM version](https://badge.fury.io/js/readable-web-to-node-stream.svg)](https://npmjs.org/package/readable-web-to-node-stream)
[![npm downloads](http://img.shields.io/npm/dm/readable-web-to-node-stream.svg)](https://npmcharts.com/compare/readable-web-to-node-stream)
[![Known Vulnerabilities](https://snyk.io/test/github/Borewit/readable-web-to-node-stream/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Borewit/readable-web-to-node-stream?targetFile=package.json)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d4b511481b3a4634b6ca5c0724407eb9)](https://www.codacy.com/gh/Borewit/peek-readable/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Borewit/peek-readable&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/Borewit/readable-web-to-node-stream/badge.svg?branch=master)](https://coveralls.io/github/Borewit/readable-web-to-node-stream?branch=master)

# readable-web-to-node-stream

Converts a [Web-API readable stream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader) into a [Node.js readable stream](https://nodejs.org/api/stream.html#stream_readable_streams).

To covert the other way around, from [Node.js readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) to [Web-API readable stream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader), 
you may use [node-readable-to-web-readable-stream](https://github.com/Borewit/node-readable-to-web-readable-stream).

## Installation
Install via [npm](http://npmjs.org/):

```bash
npm install readable-web-to-node-stream
```
or [yarn](https://yarnpkg.com/):
```bash
yarn add readable-web-to-node-stream
```

## Compatibility

Version 4 migrated from CommonJS (CJS) to a pure ECMAScript module (ESM).
The ESM has a _Node_ and a _default_ entry point.
Source is written in TypeScript and compiled to [ECMAScript ES2020 (ES11)](https://en.wikipedia.org/wiki/ECMAScript_version_history#11th_Edition_%E2%80%93_ECMAScript_2020).
The _Node_ entry requires a [Node.js ≥ 18](https://nodejs.org/en/about/previous-releases) engine.

## Usage

Example, import readable-web-stream-to-node in JavaScript:
```js
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

async function download(url) {
    const response = await fetch(url);
    const readableWebStream = response.body;
    const nodeStream = new ReadableWebToNodeStream(readableWebStream);
}
```

For  [Node.js ≥ 22](https://nodejs.org/en/about/previous-releases), should also work in a CommonJS projects:
```js
const {ReadableWebToNodeStream} = require('readable-web-to-node-stream');

async function download(url) {
    const response = await fetch(url);
    const readableWebStream = response.body;
    const nodeStream = new ReadableWebToNodeStream(readableWebStream);
}
```

For TypeScript / CommonJS projects, not using Node.js ≥ 22, check [load-esm](https://github.com/Borewit/load-esm).

## API

**constructor(stream: ReadableStream): Promise<void>**

`stream: ReadableStream`: the [Web-API readable stream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader).

**close(): Promise<void>**
Will cancel close the Readable-node stream, and will release Web-API-readable-stream.

**waitForReadToComplete(): Promise<void>**
If there is no unresolved read call to Web-API Readable​Stream immediately returns, otherwise it will wait until the read is resolved.

## Licence

(The MIT License)

Copyright (c) 2025 Borewit

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
