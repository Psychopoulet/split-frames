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

## Examples

```javascript
const Spliter = require("split-frames");

const STX = 0x02;
const ETX = 0x03;
const DLE = 0x10;

streamStart.pipe(new Spliter({
	"start": STX
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ]) (3x)
});
streamStart.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, STX, 0x04, 0x05 ]));
streamStart.push(Buffer.from([ 0x06, STX ]));

streamEnd.pipe(new Spliter({
	"end": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x01, 0x04, 0x05, 0x06 ])
});
streamStart.push(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX, 0x04, 0x05 ]));

streamStartAndEnd.pipe(new Spliter({
	"start": STX,
	"end": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ]
});
streamStartAndEnd.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, ETX, STX, 0x04, 0x05 ]));

streamStartAndEscapedEnd.pipe(new Spliter({
	"start": STX,
	"end": Buffer.from([ DLE, ETX ])
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ])
});
streamStartAndEscapedEnd.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, STX, 0x04, 0x05 ]));

/*
	// @TODO
	streamStartAndEndAndEscape.pipe(new Spliter({
		"start": STX,
		"end": ETX,
		"escapeWith": DLE,
		"escaped": [ DLE, STX, ETX ]
	})).on("data", (chunk) => {
		// Buffer([ 0x04, STX, 0x05, 0x06, DLE, 0x07, ETX, 0x08 ])
	});
	streamStartAndEscapedEnd.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06, DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, STX, 0x04, 0x05 ]));
*/
```

## Tests

```bash
$ mocha tests/tests.js
```

## License

[ISC](LICENSE)
