"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;

// module

describe("end & start", () => {

	it("should split frame with no start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"start": STX,
				"end": ETX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX ]));
			// valid frame to close tested frame
			splitter.write(Buffer.from([ STX, 0x01, ETX ]));

		});

	});

	it("should split frame with no end", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"start": STX,
				"end": ETX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, STX, 0x01, 0x04, 0x05, 0x06 ]));
			// close tested frame
			splitter.write(Buffer.from([ ETX ]));

		});

	});

	it("should split frame with one start & end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"start": STX,
				"end": ETX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x01, STX, 0x04, 0x05, ETX, 0x01 ]));

		});

	});

	it("should split frame with two start & end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const splitter = new SplitFrames({
				"start": STX,
				"end": ETX
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, STX, 0x04, 0x05, ETX, 0x01 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX, 0x01, ETX ]));

		});

	});

	it("should split frame with one bit start and two bits end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"start": STX,
				"end": Buffer.from([ DLE, ETX ])
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, 0x07, 0x08, 0x09, DLE, ETX ]));

		});

	});

	it("should split frame with two bits start and one bit end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"start": Buffer.from([ DLE, STX ]),
				"end": ETX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x01, DLE, STX, 0x04, 0x05, 0x06, ETX, 0x07, 0x08, 0x09, DLE, ETX ]));

		});

	});

	it("should split frame with escaped data", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"start": STX,
				"end": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX, ETX ]
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, STX, 0x04, 0x05, DLE, 0x06, 0x07, ETX, 0x08 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ STX, 0x01, DLE, STX, 0x04, 0x05, DLE, DLE, 0x06, 0x07, DLE, ETX, 0x08, ETX ]));

		});

	});

});
