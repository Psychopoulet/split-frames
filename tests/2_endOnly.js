/*
	eslint no-new: 0
*/

"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const ETX = 0x03;
	const DLE = 0x10;

// module

describe("end only", () => {

	it("should split frame with no end", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"endWith": ETX
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, 0x02, 0x04, 0x05, 0x06 ]));
			// close tested frame
			splitter.write(Buffer.from([ ETX ]));

		});

	});

	it("should split frame with one end", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"endWith": ETX
			}).on("error", reject).on("fullFrame", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02, 0x04, 0x05, ETX ]), "The chunk is not as expected");

			}).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02, 0x04, 0x05 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, 0x02, 0x04, 0x05, ETX, 0x01 ]));
			// close tested frame
			splitter.write(Buffer.from([ ETX ]));

		});

	});

	it("should split frame with two end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const splitter = new SplitFrames({
				"endWith": ETX
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			});

			// tested frame
			splitter.write(Buffer.from([ 0x01, 0x02, ETX, 0x04, 0x05, 0x06, ETX, 0x04, 0x05, 0x06 ]));
			// close tested frame
			splitter.write(Buffer.from([ ETX ]));

		});

	});

	it("should split frame with three end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"endWith": ETX
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				}
				else if (3 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x07, 0x08, 0x09 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([ 0x01, 0x02, ETX, 0x04, 0x05, 0x06, ETX, 0x07, 0x08, 0x09, ETX ]));

		});

	});

	it("should split frame with two bits end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"endWith": Buffer.from([ DLE, ETX ])
			}).on("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02 ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				}
				else if (3 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x07, 0x08, 0x09 ]), "The chunk is not as expected");

					resolve();

				}
				else {
					reject(new Error("Too much frames"));
				}

			// tested frame
			}).write(Buffer.from([ 0x01, 0x02, DLE, ETX, 0x04, 0x05, 0x06, DLE, ETX, 0x07, 0x08, 0x09, DLE, ETX ]));

		});

	});

	it("should split frame with escaped data", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"endWith": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, ETX ]
			}).on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, ETX, 0x04, 0x05, DLE, 0x06, 0x07, 0x08 ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x01, DLE, ETX, 0x04, 0x05, DLE, DLE, 0x06, 0x07, 0x08, ETX ]));

		});

	});

});
