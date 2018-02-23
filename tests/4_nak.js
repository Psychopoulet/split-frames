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
	const NAK = 0x15;

// module

describe("nak", () => {

	describe("without tags", () => {

		it("should test nak without tags", () => {

			return new Promise((resolve, reject) => {

				let nakCount = 0;

				const splitter = new SplitFrames({
					"nak": NAK
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(nakCount, 3, "The amount of nak received is not as expected");

					resolve();

				}).on("nak", () => {
					++nakCount;
				});

				splitter.write(Buffer.from([ NAK, 0x01, DLE, NAK, 0x02, NAK ]));

			});

		});

		it("should test escaped nak", () => {

			return new Promise((resolve, reject) => {

				let nakCount = 0;

				const splitter = new SplitFrames({
					"nak": NAK,
					"escapeWith": DLE,
					"escaped": [ DLE, NAK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, NAK, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(nakCount, 2, "The amount of nak received is not as expected");

					resolve();

				}).on("nak", () => {
					++nakCount;
				});

				splitter.write(Buffer.from([ NAK, 0x01, DLE, NAK, 0x02, NAK ]));

			});

		});

		it("should test array nak without tags", () => {

			const NAK2 = 0x85;

			return new Promise((resolve, reject) => {

				let nakCount = 0;

				const splitter = new SplitFrames({
					"nak": [ NAK, NAK2 ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(nakCount, 3, "The amount of nak received is not as expected");

					resolve();

				}).on("nak", () => {
					++nakCount;
				});

				splitter.write(Buffer.from([ NAK, 0x01, DLE, NAK2, 0x02, NAK ]));

			});

		});

	});

	describe("with tags", () => {

		it("should test ack with start and end tags", () => {

			return new Promise((resolve, reject) => {

				let nakCount = 0;

				const splitter = new SplitFrames({
					"nak": NAK,
					"start": STX,
					"end": ETX,
					"escapeWith": DLE,
					"escaped": [ DLE, NAK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x27 ]), "The chunk is not as expected");

					assert.strictEqual(nakCount, 3, "The amount of nak received is not as expected");

				}).on("nak", () => {

					++nakCount;

					if (4 === nakCount) {
						resolve();
					}

				});

				splitter.write(Buffer.from([ NAK, 0x21, NAK, 0x21, 0x21, NAK, 0x21, DLE, NAK, STX, 0x24, 0x25, 0x27, ETX, NAK ]));

			});

		});

	});

});
