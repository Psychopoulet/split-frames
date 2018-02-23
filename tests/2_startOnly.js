/*
	eslint no-new: 0
*/

"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const STX2 = 0x82;
	const DLE = 0x10;

// module

describe("start only", () => {

	it("should split frame with no start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"start": STX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, 0x03, 0x04, 0x05, 0x06 ]));
			// valid frame to close tested frame
			splitter.write(Buffer.from([ STX, 0x01, STX ]));

		});

	});

	it("should split frame with one start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"start": STX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, STX, 0x03, 0x04, 0x05, 0x06 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX ]));

		});

	});

	it("should split frame with two start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const splitter = new SplitFrames({
				"start": STX
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06, 0x01 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, STX, 0x03, 0x04, 0x05, 0x06, 0x01, STX, 0x03, 0x04, 0x05, 0x06 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX ]));

		});

	});

	it("should split frame with three start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"start": STX
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06, 0x01 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([ 0x01, STX, 0x03, 0x04, 0x05, 0x06, 0x01, STX, 0x03, 0x04, 0x05, 0x06, STX ]));

		});

	});

	it("should split frame with two bits start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"start": Buffer.from([ DLE, STX ])
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06, 0x01 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x09, 0x10, 0x01, 0x02 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([ 0x01, DLE, STX, 0x03, 0x04, 0x05, 0x06, 0x01, DLE, STX, 0x09, 0x10, 0x01, 0x02, DLE, STX ]));

		});

	});

	it("should split frame with escaped data", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"start": STX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX ]
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, STX, 0x04, 0x05, DLE, 0x06, 0x07, 0x08 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x01, STX, 0x01, DLE, STX, 0x04, 0x05, DLE, DLE, 0x06, 0x07, 0x08, STX ]));

		});

	});

	it("should split frame with two start and different starters", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"start": [ STX, STX2 ]
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x03, 0x04, 0x05, 0x06, 0x01 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x09, 0x10, 0x01 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([
				0x01,
				STX, 0x03, 0x04, 0x05, 0x06, 0x01,
				STX2, 0x09, 0x10, 0x01,
				STX
			]));

		});

	});

	it("should split frame with two start and different starters and escaped data", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"start": [ STX, STX2 ],
				"escapeWith": DLE,
				"escaped": [ DLE, STX, STX2 ]
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, STX, 0x04, 0x05, DLE, 0x06, 0x07, 0x08 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, STX, 0x04, 0x05, DLE, 0x06, 0x07, 0x08 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([
				0x01,
				STX, 0x01, DLE, STX, 0x04, 0x05, DLE, DLE, 0x06, 0x07, 0x08,
				STX2, 0x01, DLE, STX, 0x04, 0x05, DLE, DLE, 0x06, 0x07, 0x08,
				STX
			]));

		});

	});

});
