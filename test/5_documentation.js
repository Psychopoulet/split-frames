/*
	eslint no-implicit-globals: 0, no-bitwise: 0
*/

"use strict";

// deps

	// natives
	const assert = require("node:assert");
	const { Readable } = require("node:stream");
	const { join } = require("node:path");

	// locals
	const Splitter = require(join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;
	const ACK = 0x06;
	const WAK = 0x13;
	const NAK = 0x15;

// private

	// methods

		/**
		* Compute LRC
		* @param {Buffer} chunk : frame to compute
		* @returns {number} LRC
		*/
		function _computeLRC (chunk) {

			let lrc = 0x00;

				for (let i = 0; i < chunk.length; ++i) {
					lrc ^= chunk[i];
				}

			return lrc;

		}

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

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX
			})).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26 ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25 ]), "The chunk is not as expected");
					resolve();
				}

			});

			stream.push(Buffer.from([ 0x20, STX, 0x24, 0x25, 0x26, STX, 0x24 ]));
			stream.push(Buffer.from([ 0x25, STX ]));

		});

	});

	it("should test end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"endWith": ETX
			})).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, 0x26, ETX ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ 0x24, 0x25, ETX ]), "The chunk is not as expected");
					resolve();
				}

			});

			stream.push(Buffer.from([ 0x24, 0x25, 0x26, ETX, 0x24, 0x25 ]));
			stream.push(Buffer.from([ ETX ]));

		});

	});

	it("should test start & end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX,
				"endWith": ETX
			})).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26, ETX ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, ETX ]), "The chunk is not as expected");
					resolve();
				}

			});

			stream.push(Buffer.from([ 0x20, STX, 0x24, 0x25, 0x26, ETX, 0x24, 0x25, STX ]));
			stream.push(Buffer.from([ 0x24, 0x25, ETX ]));

		});

	});

	it("should test start & escaped end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX,
				"endWith": Buffer.from([ DLE, ETX ])
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26, DLE, ETX ]), "The chunk is not as expected");

				resolve();

			});

			stream.push(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, DLE, ETX, STX, 0x24, 0x25 ]));

		});

	});

	it("should test escaped start & end", () => {

		return new Promise((resolve) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX,
				"endWith": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX, ETX ]
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				assert.deepStrictEqual(chunk,
					Buffer.from([ STX, 0x24, DLE, STX, 0x25, 0x26, DLE, DLE, 0x27, DLE, ETX, 0x28, ETX ]),
					"The chunk is not as expected"
				);

				resolve();

			});

			stream.push(Buffer.from([ 0x20, STX, 0x24, DLE, STX, 0x25, 0x26 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x27, DLE, ETX, 0x28, ETX, STX, 0x24, 0x25 ]));

		});

	});

	it("should test escaped start & end with multiples start", () => {

		return new Promise((resolve) => {

			let dataCount = 0;

			const STX2 = 0x82;
			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": [ STX, STX2 ],
				"endWith": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX, ETX ]
			})).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {

					assert.deepStrictEqual(chunk,
						Buffer.from([ STX, 0x24, DLE, STX, 0x25, 0x26, DLE, DLE, 0x27, DLE, ETX, 0x28, ETX ]),
						"The chunk is not as expected"
					);

				}
				else if (2 === dataCount) {

					assert.deepStrictEqual(chunk,
						Buffer.from([ STX2, 0x24, DLE, STX, 0x25, 0x26, DLE, DLE, 0x27, DLE, ETX, 0x28, ETX ]),
						"The chunk is not as expected"
					);

					resolve();

				}

			});

			stream.push(Buffer.from([ 0x20, STX, 0x24, DLE, STX, 0x25, 0x26 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x27, DLE, ETX, 0x28, ETX, 0x26, 0x24, 0x25 ]));
			stream.push(Buffer.from([ STX2, 0x24, DLE, STX, 0x25, 0x26 ]));
			stream.push(Buffer.from([ DLE, DLE, 0x27, DLE, ETX, 0x28, ETX, 0x26, 0x24, 0x25 ]));

		});

	});

	it("should test ack & nak", () => {

		return new Promise((resolve) => {

			let ackFound = false;
			let nakFound = false;
			let whateverFound = false;

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX,
				"endWith": ETX,
				"specifics": {
					"ack": ACK,
					"nak": NAK,
					"wak": WAK,
					"whatever": 0x51
				},
				"escapeWith": DLE,
				"escaped": [ DLE, ACK, NAK ]
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x20, 0x21, 0x22, ACK, NAK, WAK, 0x23, ETX ]), "The chunk is not as expected");

			}).on("ack", () => {
				ackFound = true;
			}).on("nak", () => {
				nakFound = true;
			}).on("whatever", () => {
				whateverFound = true;
			}).on("wak", () => {

				assert.strictEqual(ackFound, true, "There is no \"ack\" found");
				assert.strictEqual(nakFound, true, "There is no \"nak\" found");
				assert.strictEqual(whateverFound, true, "There is no \"whatever\" found");

				resolve();

			});

			stream.push(Buffer.from([ 0x51, 0x24, ACK, DLE, ACK, STX, 0x20, 0x21, 0x22, ACK, NAK, WAK ]));
			stream.push(Buffer.from([ 0x23, ETX, NAK, DLE, NAK, WAK, DLE, WAK, 0x20, 0x21 ]));

		});

	});

	it("should start & end with LRC", () => {

		return new Promise((resolve, reject) => {

			const stream = createReadStream();

			stream.pipe(new Splitter({
				"startWith": STX,
				"endWith": ETX,
				"controlBits": "end+1"
			})).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07 ]), "The chunk is not as expected");

				const data = chunk.slice(1, chunk.length - 2);
				const LRC = chunk[chunk.length - 1];

				if (_computeLRC(data) === LRC) {
					resolve();
				}
				else {

					reject(
						new Error(
							"not well-computed data :" + data.toString("hex") + "|" + Buffer.from([ LRC ]).toString("hex")
						)
					);

				}

			});

			stream.push(Buffer.from([ 0x51, 0x24, STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x24 ]));

		});

	});

});
