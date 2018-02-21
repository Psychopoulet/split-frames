# split-frames
Split Buffer frames from streams

[![Build Status](https://api.travis-ci.org/Psychopoulet/split-frames.svg?branch=master)](https://travis-ci.org/Psychopoulet/split-frames)
[![Coverage Status](https://coveralls.io/repos/github/Psychopoulet/split-frames/badge.svg?branch=master)](https://coveralls.io/github/Psychopoulet/split-frames)
[![Dependency Status](https://img.shields.io/david/Psychopoulet/split-frames/master.svg)](https://github.com/Psychopoulet/split-frames)

## Installation

```bash
$ npm install split-frames
```

## Doc

  * inherited from [stream.Transform](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams)
  * works very well with, for example, [serialport](https://www.npmjs.com/package/serialport) for industrial protocols

## Examples

In the following exemples, "Splitter" and "Readable" classes are defined like that :

```javascript
const Splitter = require("split-frames");
const { Readable } = require("stream");
```

The "createReadStream" function is defined like that :

```javascript
function createReadStream () { return new Readable({ read () { } }); }
```

And the "STX", "DLE" and "ETX" constants are defined like that :

```javascript
const STX = 0x02, ETX = 0x03, DLE = 0x10;
```

### want to split frames content on a start bit ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"start": STX
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ]) (2x)
});

stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, STX, 0x04, 0x05 ]));
stream.push(Buffer.from([ 0x06, STX ]));
```

### prefere an end bit ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"end": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x01, 0x04, 0x05, 0x06 ])
});

stream.push(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX, 0x04, 0x05 ]));
```

### want both ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"start": STX,
	"end": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ]
});

stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, ETX, STX, 0x04, 0x05 ]));
```

### what about two end bits (works with start one as well) ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"start": STX,
	"end": Buffer.from([ DLE, ETX ])
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ])
});

stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, STX, 0x04, 0x05 ]));
```

### Do you need to parse escaped bits ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"start": STX,
	"end": ETX,
	"escapeWith": DLE,
	"escaped": [ DLE, STX, ETX ]
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x02, 0x05, 0x06, 0x10, 0x07, 0x03, 0x08 ])
});

stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, STX, 0x04, 0x05 ]));
```

### And what do you think about multiple start (or end !) bits ?

For even parity in seriaport, for example

```javascript
const STX2 = 0x82;
const stream = createReadStream();

stream.pipe(new Splitter({
	"start": [ STX, STX2 ],
	"end": ETX,
	"escapeWith": DLE,
	"escaped": [ DLE, STX, ETX ]
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x02, 0x05, 0x06, 0x10, 0x07, 0x03, 0x08 ]) (x2)
});

stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));
stream.push(Buffer.from([ STX2, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));
```

## Tests

```bash
$ mocha tests/tests.js
```

## License

[ISC](LICENSE)
