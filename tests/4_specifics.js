/*
	eslint no-new: 0
*/

"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;
	const ACK = 0x06;

// module

describe("specifics", () => {

	describe("without tags", () => {

		it("should test \"ack\" without tags", () => {

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": ACK
					}
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(count, 3, "The amount of \"ack\" received is not as expected");

					resolve();

				}).on("ack", () => {
					++count;
				});

				splitter.write(Buffer.from([ ACK, 0x01, DLE, ACK, 0x02, ACK ]));

			});

		});

		it("should test \"ack\" with two bits", () => {

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": Buffer.from([ DLE, ACK ])
					}
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(count, 3, "The amount of \"ack\" received is not as expected");

					resolve();

				}).on("ack", () => {
					++count;
				});

				splitter.write(Buffer.from([ DLE, ACK, 0x01, DLE, ACK, 0x02, DLE, ACK ]));

			});

		});

		it("should test escaped \"ack\"", () => {

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": ACK
					},
					"escapeWith": DLE,
					"escaped": [ DLE, ACK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, ACK, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(count, 2, "The amount of \"ack\" received is not as expected");

					resolve();

				}).on("ack", () => {
					++count;
				});

				splitter.write(Buffer.from([ ACK, 0x01, DLE, ACK, 0x02, ACK ]));

			});

		});

		it("should test array \"ack\" without tags", () => {

			const ACK2 = 0x86;

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": [ ACK, ACK2 ]
					}
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(count, 3, "The amount of \"ack\" received is not as expected");

					resolve();

				}).on("ack", () => {
					++count;
				});

				splitter.write(Buffer.from([ ACK, 0x01, DLE, ACK2, 0x02, ACK ]));

			});

		});

	});

	describe("with tags", () => {

		it("should test \"ack\" with start and end tags", () => {

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": ACK
					},
					"start": STX,
					"end": ETX,
					"escapeWith": DLE,
					"escaped": [ DLE, ACK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x27 ]), "The chunk is not as expected");

					assert.strictEqual(count, 3, "The amount of \"ack\" received is not as expected");

				}).on("ack", () => {

					++count;

					if (4 === count) {
						resolve();
					}

				});

				splitter.write(Buffer.from([ ACK, 0x21, ACK, 0x21, 0x21, ACK, 0x21, DLE, ACK, STX, 0x24, 0x25, 0x27, ETX, ACK ]));

			});

		});

		it("should test \"ack\" with two bits and start and end tags", () => {

			return new Promise((resolve, reject) => {

				let count = 0;

				const splitter = new SplitFrames({
					"specifics": {
						"ack": Buffer.from([ DLE, ACK ])
					},
					"start": STX,
					"end": ETX
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x27 ]), "The chunk is not as expected");

					assert.strictEqual(count, 3, "The amount of \"ack\" received is not as expected");

				}).on("ack", () => {

					++count;

					if (4 === count) {
						resolve();
					}

				});

				splitter.write(Buffer.from([ DLE, ACK, 0x21, DLE, ACK, 0x21, 0x21, DLE, ACK, 0x21, STX, 0x24, 0x25, 0x27, ETX, DLE, ACK ]));

			});

		});

	});

});
