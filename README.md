# split-frames
Split Buffer frames from streams

[![Build Status](https://api.travis-ci.org/Psychopoulet/split-frames.svg?branch=master)](https://travis-ci.org/Psychopoulet/split-frames)
[![Coverage Status](https://coveralls.io/repos/github/Psychopoulet/split-frames/badge.svg?branch=master)](https://coveralls.io/github/Psychopoulet/split-frames)
[![Dependency Status](https://david-dm.org/Psychopoulet/split-frames/status.svg)](https://david-dm.org/Psychopoulet/split-frames)
[![Dev dependency Status](https://david-dm.org/Psychopoulet/split-frames/dev-status.svg)](https://david-dm.org/Psychopoulet/split-frames?type=dev)

## Installation

```bash
$ npm install split-frames
```

## Doc

> Works very well with, for example, [serialport](https://www.npmjs.com/package/serialport) for industrial protocols like Concert

### Methods

  * inherited from [stream.Transform](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams)
  * constructor ([ options: object ]): split-frames instance

### Options

> All these options are optionnal

```typescript
type ControlBits = "none" | "end+1" | "end+2";
iTag: number|Buffer|Array<number|Buffer>
```

  * "startWith": iTag
  * "endWith": iTag
  * "escapeWith": iTag
  * "escaped": Array<iTag>
  * "specifics": object
  * "controlBits": ControlBits (default: "none")

> "specifics" is a [ key: string => value: iTag ] object which fire a "key" event when a "value" tag is found out of the message and not escaped

> ex : { "specifics": { "nak": 0x03 } } will fire an "nak" event when 0x03 bit is encountered

## Examples

In the following exemples, "Splitter" and "Readable" classes are defined like that :

```typescript
// typescript
import Splitter = require("split-frames");
import { Readable } from "stream";
```

```javascript
// javascript
const Splitter = require("split-frames");
const { Readable } = require("stream");
```

The "createReadStream" function is defined like that :

```javascript
function createReadStream () {
	return new Readable({
		read () { }
	});
}
```

And the "STX", "DLE" and "ETX" constants are defined like that :

```javascript
const STX = 0x02, ETX = 0x03, DLE = 0x10, ACK = 0x06, NAK = 0x15, WAK = 0x13;
```

### want to split frames content on a start bit ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": STX
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
	"endWith": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x01, 0x04, 0x05, 0x06 ])
});

stream.push(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX, 0x04, 0x05 ]));
```

### want both ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": STX, "endWith": ETX
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ]
});

stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, ETX, STX, 0x04, 0x05 ]));
```

### what about two end bits (works with start one as well) ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": STX, "endWith": Buffer.from([ DLE, ETX ])
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x05, 0x06 ])
});

stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, STX, 0x04, 0x05 ]));
```

### Do you need to parse escaped bits ?

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": STX, "endWith": ETX,
	"escapeWith": DLE, "escaped": [ DLE, STX, ETX ]
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x02, 0x05, 0x06, 0x10, 0x07, 0x03, 0x08 ])
});

stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, STX, 0x04, 0x05 ]));
```

### And what do you think about multiple start (or end !) bits possibilities ?

For even parity in seriaport, for example

```javascript
const STX2 = 0x82;
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": [ STX, STX2 ], "endWith": ETX,
	"escapeWith": DLE, "escaped": [ DLE, STX, ETX ]
})).on("data", (chunk) => {
	// Buffer([ 0x04, 0x02, 0x05, 0x06, 0x10, 0x07, 0x03, 0x08 ]) (x2)
});

stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));
stream.push(Buffer.from([ STX2, 0x04, DLE, STX, 0x05, 0x06 ]));
stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));
```

### Want to extract specific tags ?

> positive acknowledgement, negative acknowledgement, waiting for acknowledgement, whatever...
> only with no tags || start AND end tags

```javascript
const stream = createReadStream();

stream.pipe(new Splitter({
	"startWith": STX, "endWith": ETX,
	"specifics": {
		"ack": ACK, "nak": NAK, "wak": WAK, "whatever": 0x51
	},
	"escapeWith": DLE, "escaped": [ DLE, ACK, NAK, WAK ]
})).on("ack", () => {
	console.log("ack received"); // (only 1x) -> good, escaped, in data
}).on("nak", () => {
	console.log("nak received"); // (only 1x) -> in data, good, escaped
}).on("wak", () => {
	console.log("wak received"); // (only 1x) -> in data, good, escaped
}).on("whatever", () => {
	console.log("whatever received"); // (only 1x)
}).on("data", (chunk) => {
	// Buffer([ 0x20, 0x21, 0x22, ACK, NAK, WAK, 0x23 ]) (x1)
});

stream.push(Buffer.from([ 0x51, 0x01, ACK, DLE, ACK, STX, 0x20, 0x21, 0x22, ACK, NAK, WAK ]));
stream.push(Buffer.from([ 0x23, ETX, NAK, DLE, NAK, WAK, DLE, WAK, 0x20, 0x21 ]));
```

### Want to use control bits ?

> used to compute LRC, MSB, LSB, etc...
> this example is for a structure like STX <data> ETX LRC, where LRC compute all <data> bits

```javascript

function computeLRC (frame) {

	let lrc = 0x00;

		for (let i = 0; i < frame.length; ++i) {
			lrc ^= frame[i];
		}

	return lrc;

}

const stream = createReadStream();
const splitter = new Splitter({
	"startWith": STX, "endWith": ETX
	"controlBits": "end+1"
});

splitter.on("data", function (chunk) { // not an arrow function to change "this" scope to splitter

	// Buffer([ 0x20, 0x21, 0x22, 0x24 ]) (x1)

	this.once("controls", (chunkControls) => {

		// Buffer([ 0x07 ]) (x1)

		if (computeLRC(data) === chunkControls) {
			this.push(data);
		}
		else {
			this.emit("error", new Error("not well-computed data :" + chunk.toString("hex") + "|" + chunkControls.toString("hex")));
		}

	});

});

stream.pipe(splitter).on("data", (chunk) => {

	// Buffer([ 0x20, 0x21, 0x22, 0x24 ]) (x1)

});

stream.push(Buffer.from([ 0x51, 0x01, STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x01 ]));
```

## Tests

```bash
$ gulp tests
```

## License

[ISC](LICENSE)
