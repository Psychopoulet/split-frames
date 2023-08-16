/*
	eslint no-new: 0
*/

"use strict";

// deps

	// natives
	const assert = require("node:assert");
	const { join } = require("node:path");

	// locals
	const SplitFrames = require(join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const STX2 = 0x82;
	const DLE = 0x10;

// module

describe("start only", () => {

	it("should split frame with no start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"startWith": STX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x24, 0x25, 0x26 ]));
			// valid frame to close tested frame
			splitter.write(Buffer.from([ STX, 0x24 ]));
			splitter.write(Buffer.from([ STX ]));

		});

	});

	it("should split frame with no second start bit", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"startWith": STX,
				"startTimeout": 200
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ STX, 0x24 ]));

		});

	});

	it("should split frame with one start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"startWith": STX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26 ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX ]));

		});

	});

	it("should split frame with two start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const splitter = new SplitFrames({
				"startWith": STX
			}).once("error", reject).on("data", (chunk) => {

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

			// tested frame
			splitter.write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, STX, 0x24, 0x25 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX ]));

		});

	});

	it("should split frame with three start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"startWith": STX
			}).once("error", reject).on("data", (chunk) => {

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

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, STX, 0x24, 0x25, STX ]));

		});

	});

	it("should split frame with two bits start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"startWith": Buffer.from([ DLE, STX ])
			}).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ DLE, STX, 0x24, 0x25, 0x26 ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ DLE, STX, 0x24, 0x25 ]), "The chunk is not as expected");
					resolve();
				}

			// tested frame
			}).write(Buffer.from([ 0x24, DLE, STX, 0x24, 0x25, 0x26, DLE, STX, 0x24, 0x25, DLE, STX ]));

		});

	});

	it("should split frame with array of two bits start", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"startWith": [ Buffer.from([ DLE, STX ]) ]
			}).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ DLE, STX, 0x24, 0x25, 0x26 ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ DLE, STX, 0x24, 0x25 ]), "The chunk is not as expected");
					resolve();
				}

			// tested frame
			}).write(Buffer.from([ 0x24, DLE, STX, 0x24, 0x25, 0x26, DLE, STX, 0x24, 0x25, DLE, STX ]));

		});

	});

	it("should split frame with escaped data", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": STX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX ]
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk,
					Buffer.from([ STX, 0x24, DLE, STX, 0x24, 0x25, DLE, DLE, 0x24, 0x25, 0x26, DLE, DLE ]),
					"The chunk is not as expected"
				);

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, DLE, STX, 0x24, 0x25, DLE, DLE, 0x24, 0x25, 0x26, DLE, DLE, STX ]));

		});

	});

	it("should split frame with two start and different starters", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"startWith": [ STX, STX2 ]
			}).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26 ]), "The chunk is not as expected");
				}
				else if (2 === dataCount) {
					assert.deepStrictEqual(chunk, Buffer.from([ STX2, 0x24, 0x25 ]), "The chunk is not as expected");
					resolve();
				}

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, STX2, 0x24, 0x25, STX ]));

		});

	});

	it("should split frame with two start and different starters and escaped data", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			new SplitFrames({
				"startWith": [ STX, STX2 ],
				"escapeWith": DLE,
				"escaped": [ DLE, STX, STX2 ]
			}).once("error", reject).on("data", (chunk) => {

				++dataCount;

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				if (1 === dataCount) {

					assert.deepStrictEqual(chunk,
						Buffer.from([ STX, 0x24, DLE, STX, 0x25, 0x26, DLE, DLE, 0x24, 0x25, 0x26 ]),
						"The chunk is not as expected"
					);

				}
				else if (2 === dataCount) {

					assert.deepStrictEqual(chunk,
						Buffer.from([ STX2, 0x24, DLE, STX, 0x25, 0x26, DLE, DLE, 0x24, 0x25, 0x26 ]),
						"The chunk is not as expected"
					);

					resolve();

				}

			// tested frame
			}).write(Buffer.from([
				0x24,
				STX,
				0x24,
				DLE,
				STX,
				0x25,
				0x26,
				DLE,
				DLE,
				0x24,
				0x25,
				0x26,
				STX2,
				0x24,
				DLE,
				STX,
				0x25,
				0x26,
				DLE,
				DLE,
				0x24,
				0x25,
				0x26,
				STX
			]));

		});

	});

});
