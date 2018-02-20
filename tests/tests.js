"use strict";

// deps

	const { join } = require("path");
	const assert = require("assert");

	const SplitFrames = require(join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;

// module

describe("split", () => {

	it("should split frame without options", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames().on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]), "The chunk is not as expected");

				resolve();

			}).write(Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]));

		});

	});

	it("should split empty frame", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames().on("error", reject).on("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ 0x01 ]), "The chunk is not as expected");

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

	});

	describe("end only", () => {

		it("should split frame with no end", () => {

			return new Promise((resolve, reject) => {

				const splitter = new SplitFrames({
					"end": ETX
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
					"end": ETX
				}).on("error", reject).on("data", (chunk) => {

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
					"end": ETX
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
					"end": ETX
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
					"end": Buffer.from([ DLE, ETX ])
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

	});

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

	});

});
