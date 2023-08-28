/// <reference path="../../lib/index.d.ts" />

import SplitFrames = require("../../lib/cjs/main.cjs");
import { Readable } from "node:stream";

const STX = 0x02, ETX = 0x03, DLE = 0x10, ACK = 0x06, NAK = 0x15, WAK = 0x13;

const stream = new Readable({
	read () { }
});

stream.pipe(new SplitFrames({
    "startWith": STX,
    "endWith": ETX,
    "specifics": {
        "ack": ACK,
        "nak": NAK,
        "wak": WAK,
        "whatever": 0x51
    },
    "escapeWith": DLE,
    "escaped": [ DLE, ACK, NAK, WAK ],
    "controlBits": "end+1"
})).on("ack", () => {
    console.log("ack received"); // (only 1x) -> good, escaped, in data
}).on("nak", () => {
    console.log("nak received"); // (only 1x) -> in data, good, escaped
}).on("wak", () => {
    console.log("wak received"); // (only 1x) -> in data, good, escaped
}).on("whatever", () => {
    console.log("whatever received"); // (only 1x)
}).on("data", (chunk) => {
	console.log(chunk);
    // Buffer([ STX, 0x20, 0x21, 0x22, ACK, NAK, WAK, 0x23, ETX, 0x01 ]) (x1)
});

stream.push(Buffer.from([ 0x51, 0x01, ACK, DLE, ACK, STX, 0x20, 0x21, 0x22, ACK, NAK, WAK ]));
stream.push(Buffer.from([ 0x23, ETX, 0x01, NAK, DLE, NAK, WAK, DLE, WAK, 0x20, 0x21 ]));
