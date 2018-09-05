// /*
// 	eslint no-new: 0
// */

// "use strict";

// // deps

// 	const assert = require("assert");
// 	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// // consts

// 	const STX = 0x02;
// 	const DLE = 0x10;

// // module

// describe("without tags", () => {

// 	it("should split frame without options", () => {

// 		return new Promise((resolve, reject) => {

// 			new SplitFrames().once("error", reject).once("data", (chunk) => {

// 				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
// 				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
// 				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]), "The chunk is not as expected");

// 				resolve();

// 			}).write(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]));

// 		});

// 	});

// 	it("should split empty frame", () => {

// 		return new Promise((resolve, reject) => {

// 			const splitter = new SplitFrames().once("error", reject).once("data", (chunk) => {

// 				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
// 				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
// 				assert.deepStrictEqual(chunk, Buffer.from([ 0x01 ]), "The chunk is not as expected");

// 				resolve();

// 			});

// 			splitter.write(Buffer.from([ ]));
// 			splitter.write(Buffer.from([ 0x01 ]));

// 		});

// 	});

// 	it("should split frame with escaped data", () => {

// 		return new Promise((resolve, reject) => {

// 			new SplitFrames({
// 				"escapeWith": DLE,
// 				"escaped": [ DLE, STX ]
// 			}).once("error", reject).once("data", (chunk) => {

// 				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
// 				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
// 				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x04, 0x05, DLE, DLE, 0x06, 0x07, DLE, STX ]), "The chunk is not as expected");

// 				resolve();

// 			}).write(Buffer.from([ 0x01, DLE, 0x04, 0x05, DLE, DLE, 0x06, 0x07, DLE, STX ]));

// 		});

// 	});

// });
