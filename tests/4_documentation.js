"use strict";

// deps

	const assert = require("assert");
	const { Readable } = require("stream");

	const Spliter = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;

// module

describe("split", () => {

	describe("documentation", () => {

		it("should test start", () => {

			return new Promise((resolve) => {

				let dataCount = 0;

				const streamStart = new Readable({
					read () {
						// nothing to do here
					}
				});

				streamStart.pipe(new Spliter({
					"start": STX
				})).on("data", (chunk) => {

					++dataCount;

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					if (2 === dataCount) {
						resolve();
					}

				});

				streamStart.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, STX, 0x04, 0x05 ]));
				streamStart.push(Buffer.from([ 0x06, STX ]));

			});

		});

		it("should test end", () => {

			return new Promise((resolve) => {

				const streamEnd = new Readable({
					read () {
						// nothing to do here
					}
				});

				streamEnd.pipe(new Spliter({
					"end": ETX
				})).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				});
				streamEnd.push(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX, 0x04, 0x05 ]));

			});

		});

		it("should test start & end", () => {

			return new Promise((resolve) => {

				const streamStartAndEnd = new Readable({
					read () {
						// nothing to do here
					}
				});

				streamStartAndEnd.pipe(new Spliter({
					"start": STX,
					"end": ETX
				})).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				});
				streamStartAndEnd.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, ETX, STX, 0x04, 0x05 ]));

			});

		});

		it("should test start & escaped end", () => {

			return new Promise((resolve) => {

				const streamStartAndEscapedEnd = new Readable({
					read () {
						// nothing to do here
					}
				});

				streamStartAndEscapedEnd.pipe(new Spliter({
					"start": STX,
					"end": Buffer.from([ DLE, ETX ])
				})).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

					resolve();

				});
				streamStartAndEscapedEnd.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, STX, 0x04, 0x05 ]));

			});

		});

		it("should test escaped start & end", () => {

			return new Promise((resolve) => {

				const streamStartAndEndAndEscape = new Readable({
					read () {
						// nothing to do here
					}
				});

				streamStartAndEndAndEscape.pipe(new Spliter({
					"start": STX,
					"end": ETX,
					"escapeWith": DLE,
					"escaped": [ DLE, STX, ETX ]
				})).on("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ 0x04, STX, 0x05, 0x06, DLE, 0x07, ETX, 0x08 ]), "The chunk is not as expected");

					resolve();

				});
				streamStartAndEndAndEscape.push(
					Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06, DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, STX, 0x04, 0x05 ])
				);

			});

		});

	});


});
