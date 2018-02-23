"use strict";

// deps

	const assert = require("assert");
	const { Readable } = require("stream");

	const Splitter = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;
	const ACK = 0x06;
	const NAK = 0x15;

// module

describe("documentation", () => {

	/**
	* Create Readable stream
	* @returns {Readable} stream
	*/
	function createReadStream () {

		return new Readable({
			read () {
				// nothing to do here
			}
		});

	}

	it("should test start", () => {

		return new Promise((resolve) => {

			let dataCount = 0;

			const stream = createReadStream();

			stream.pipe(new Splitter({
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

			stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, STX, 0x04, 0x05 ]));
			stream.push(Buffer.from([ 0x06, STX ]));

		});

	});

	it("should test end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"end": ETX
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			stream.push(Buffer.from([ 0x01, 0x04, 0x05, 0x06, ETX, 0x04, 0x05 ]));

		});

	});

	it("should test start & end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"start": STX,
				"end": ETX
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, ETX, STX, 0x04, 0x05 ]));

		});

	});

	it("should test start & escaped end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"start": STX,
				"end": Buffer.from([ DLE, ETX ])
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, 0x05, 0x06 ]), "The chunk is not as expected");

				resolve();

			});

			stream.push(Buffer.from([ 0x01, STX, 0x04, 0x05, 0x06, DLE, ETX, STX, 0x04, 0x05 ]));

		});

	});

	it("should test escaped start & end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
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

			stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, STX, 0x04, 0x05 ]));

		});

	});

	it("should test escaped start & end with multiples start", () => {

		return new Promise((resolve) => {

			let dataCount = 0;

			const STX2 = 0x82;
			const stream = createReadStream();

			stream.pipe(new Splitter({
				"start": [ STX, STX2 ],
				"end": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX, ETX ]
			})).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x04, STX, 0x05, 0x06, DLE, 0x07, ETX, 0x08 ]), "The chunk is not as expected");

				if (2 === dataCount) {
					resolve();
				}

			});

			stream.push(Buffer.from([ 0x01, STX, 0x04, DLE, STX, 0x05, 0x06 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));
			stream.push(Buffer.from([ STX2, 0x04, DLE, STX, 0x05, 0x06 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x07, DLE, ETX, 0x08, ETX, 0x06, 0x04, 0x05 ]));

		});

	});

	it("should test ack & nak", () => {

		return new Promise((resolve) => {

			let dataCount = 0;
			const stream = createReadStream();

			stream.pipe(new Splitter({
				"ack": ACK,
				"nak": NAK,
				"escapeWith": DLE,
				"escaped": [ DLE, ACK, NAK ]
			})).on("ack", () => {
				++dataCount;
			}).on("nak", () => {

				++dataCount;

				assert.strictEqual(dataCount, 2, "Results count is not as expected");

				resolve();

			});

			stream.push(Buffer.from([ 0x01, ACK, 0x02, DLE, ACK, 0x03, 0x04 ]));
			stream.push(Buffer.from([ 0x01, NAK, 0x02, DLE, NAK, 0x03, 0x04 ]));

		});

	});

});
