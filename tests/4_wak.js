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
	const WAK = 0x13;

// module

describe("wak", () => {

	describe("without tags", () => {

		it("should test wak without tags", () => {

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": WAK
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 3, "The amount of wak received is not as expected");

					resolve();

				}).on("wak", () => {
					++wakCount;
				});

				splitter.write(Buffer.from([ WAK, 0x01, DLE, WAK, 0x02, WAK ]));

			});

		});

		it("should test wak with two bits", () => {

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": Buffer.from([ DLE, WAK ])
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 3, "The amount of wak received is not as expected");

					resolve();

				}).on("wak", () => {
					++wakCount;
				});

				splitter.write(Buffer.from([ DLE, WAK, 0x01, DLE, WAK, 0x02, DLE, WAK ]));

			});

		});

		it("should test escaped wak", () => {

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": WAK,
					"escapeWith": DLE,
					"escaped": [ DLE, WAK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, WAK, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 2, "The amount of wak received is not as expected");

					resolve();

				}).on("wak", () => {
					++wakCount;
				});

				splitter.write(Buffer.from([ WAK, 0x01, DLE, WAK, 0x02, WAK ]));

			});

		});

		it("should test array wak without tags", () => {

			const NAK2 = 0x85;

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": [ WAK, NAK2 ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, DLE, 0x02 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 3, "The amount of wak received is not as expected");

					resolve();

				}).on("wak", () => {
					++wakCount;
				});

				splitter.write(Buffer.from([ WAK, 0x01, DLE, NAK2, 0x02, WAK ]));

			});

		});

	});

	describe("with tags", () => {

		it("should test ack with start and end tags", () => {

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": WAK,
					"start": STX,
					"end": ETX,
					"escapeWith": DLE,
					"escaped": [ DLE, WAK ]
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x27 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 3, "The amount of wak received is not as expected");

				}).on("wak", () => {

					++wakCount;

					if (4 === wakCount) {
						resolve();
					}

				});

				splitter.write(Buffer.from([ WAK, 0x21, WAK, 0x21, 0x21, WAK, 0x21, DLE, WAK, STX, 0x24, 0x25, 0x27, ETX, WAK ]));

			});

		});

		it("should test wak with two bits and start and end tags", () => {

			return new Promise((resolve, reject) => {

				let wakCount = 0;

				const splitter = new SplitFrames({
					"wak": Buffer.from([ DLE, WAK ]),
					"start": STX,
					"end": ETX
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x27 ]), "The chunk is not as expected");

					assert.strictEqual(wakCount, 3, "The amount of wak received is not as expected");

				}).on("wak", () => {

					++wakCount;

					if (4 === wakCount) {
						resolve();
					}

				});

				splitter.write(Buffer.from([ DLE, WAK, 0x21, DLE, WAK, 0x21, 0x21, DLE, WAK, 0x21, STX, 0x24, 0x25, 0x27, ETX, DLE, WAK ]));

			});

		});

	});

});
