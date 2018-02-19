
"use strict";

// deps

	const { join } = require("path");
	const assert = require("assert");

	const SplitFrames = require(join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	// const ETX = 0x03;
	// const DLE = 0x10;

// module

describe("split", () => {

	it("should split frame without options", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames().on("error", reject).on("data", (chunk) => {

				assert.strictEqual("object", typeof chunk, "The chunk is not an object");
				assert.strictEqual(true, chunk instanceof Buffer, "The chunk is not a Buffer");
				assert.deepStrictEqual(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]), chunk, "The chunk is not as expected");

				resolve();

			}).write(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]));

		});

	});

	it("should split empty frame", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames().on("error", reject).on("data", (chunk) => {

				assert.strictEqual("object", typeof chunk, "The chunk is not an object");
				assert.strictEqual(true, chunk instanceof Buffer, "The chunk is not a Buffer");
				assert.deepStrictEqual(Buffer.from([ 0x01 ]), chunk, "The chunk is not as expected");

				resolve();

			});

			splitter.write(Buffer.from([ ]));
			splitter.write(Buffer.from([ 0x01 ]));

		});

	});

	describe("start only", () => {

		it("should split frame with no start", () => {

			return new Promise((resolve, reject) => {

				const splitter = new SplitFrames({
					"start": STX
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual("object", typeof chunk, "The chunk is not an object");
					assert.strictEqual(true, chunk instanceof Buffer, "The chunk is not a Buffer");
					assert.deepStrictEqual(Buffer.from([ STX ]), chunk, "The chunk is not as expected");

					resolve();

				});

				splitter.write(Buffer.from([ 0x01, 0x03, 0x04, 0x05, 0x06 ]));
				splitter.write(Buffer.from([ 0x02 ]));

			});

		});

		it("should split frame with one start", () => {

			return new Promise((resolve, reject) => {

				new SplitFrames({
					"start": STX
				}).on("error", reject).on("data", (chunk) => {

					assert.strictEqual("object", typeof chunk, "The chunk is not an object");
					assert.strictEqual(true, chunk instanceof Buffer, "The chunk is not a Buffer");
					assert.deepStrictEqual(Buffer.from([ STX, 0x03, 0x04, 0x05, 0x06 ]), chunk, "The chunk is not as expected");

					resolve();

				}).write(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 ]));

			});

		});

		it("should split frame with two start", () => {

			return new Promise((resolve, reject) => {

				new SplitFrames({
					"start": STX
				}).on("error", reject).on("data", (chunk) => {

					(0, console).log(chunk);

					assert.strictEqual("object", typeof chunk, "The chunk is not an object");
					assert.strictEqual(true, chunk instanceof Buffer, "The chunk is not a Buffer");
					assert.deepStrictEqual(Buffer.from([ STX, 0x03, 0x04, 0x05, 0x06, 0x01 ]), chunk, "The chunk is not as expected");

					resolve();

				}).write(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 ]));

			});

		});

	});

});
