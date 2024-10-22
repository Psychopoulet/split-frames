"use strict";

// deps

	// natives
	const assert = require("node:assert");
	const { join } = require("node:path");
	const { Readable } = require("node:stream");

	// locals
	const SplitFrames = require(join(__dirname, "..", "lib", "cjs", "main.cjs"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const DLE = 0x10;

// module

describe("start & end", () => {

	it("should split frame with no start", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"startWith": STX,
				"endWith": ETX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, ETX ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ 0x24, 0x24, 0x25, 0x26, ETX ]));
			// valid frame to close tested frame
			splitter.write(Buffer.from([ STX, 0x24, ETX ]));

		});

	});

	it("should split frame with no end", () => {

		return new Promise((resolve, reject) => {

			const splitter = new SplitFrames({
				"startWith": STX,
				"endWith": ETX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x24, 0x25, 0x26, ETX ]), "The chunk is not as expected");

				resolve();

			});

			// tested frame
			splitter.write(Buffer.from([ STX, 0x24, 0x24, 0x25, 0x26 ]));
			// close tested frame
			splitter.write(Buffer.from([ ETX ]));

		});

	});

	it("should split frame with one start & end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": STX,
				"endWith": ETX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, ETX ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, 0x25, ETX, 0x24 ]));

		});

	});

	it("should split frame with two start & end", () => {

		return new Promise((resolve, reject) => {

			let dataCount = 0;

			const splitter = new SplitFrames({
				"startWith": STX,
				"endWith": ETX
			}).once("error", reject).on("data", (chunk) => {

				++dataCount;

				if (1 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, ETX ]), "The chunk is not as expected");

				}
				else if (2 === dataCount) {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, ETX ]), "The chunk is not as expected");

					resolve();

				}

			});

			// tested frame
			splitter.write(Buffer.from([ 0x24, STX, 0x24, 0x25, ETX, 0x24 ]));
			// close tested frame
			splitter.write(Buffer.from([ STX, 0x24, ETX ]));

		});

	});

	it("should split frame with one bit start and two bits end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": STX,
				"endWith": Buffer.from([ DLE, ETX ])
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26, DLE, ETX ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, DLE, ETX, 0x27, 0x28, 0x29, DLE, ETX ]));

		});

	});

	it("should split frame with two bits start and one bit end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": Buffer.from([ DLE, STX ]),
				"endWith": ETX
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ DLE, STX, 0x24, 0x25, 0x26, ETX ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, DLE, STX, 0x24, 0x25, 0x26, ETX, 0x27, 0x28, 0x29, DLE, ETX ]));

		});

	});

	it("should split frame with one bit start and two bits end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": STX,
				"endWith": Buffer.from([ DLE, ETX ])
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x24, 0x25, 0x26, DLE, ETX ]), "The chunk is not as expected");

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, STX, 0x24, 0x25, 0x26, DLE, ETX, 0x27, 0x28, 0x29, DLE, ETX ]));

		});

	});

	it("should split frame with two bits start and two bits end", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": Buffer.from([ DLE, STX ]),
				"endWith": Buffer.from([ DLE, ETX ])
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
				assert.deepStrictEqual(chunk,
					Buffer.from([ DLE, STX, 0x24, 0x25, 0x26, ETX, 0x27, 0x28, 0x29, DLE, ETX ]),
					"The chunk is not as expected"
				);

				resolve();

			// tested frame
			}).write(Buffer.from([ 0x24, DLE, STX, 0x24, 0x25, 0x26, ETX, 0x27, 0x28, 0x29, DLE, ETX ]));

		});

	});

	it("should split frame with escaped data", () => {

		return new Promise((resolve, reject) => {

			new SplitFrames({
				"startWith": STX,
				"endWith": ETX,
				"escapeWith": DLE,
				"escaped": [ DLE, STX, ETX ]
			}).once("error", reject).once("data", (chunk) => {

				assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
				assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");

				assert.deepStrictEqual(chunk,
					Buffer.from([ STX, 0x24, DLE, STX, 0x24, 0x25, DLE, DLE, 0x26, 0x27, DLE, ETX, 0x28, ETX ]),
					"The chunk is not as expected"
				);

				resolve();

			// tested frame
			}).write(Buffer.from([ STX, 0x24, DLE, STX, 0x24, 0x25, DLE, DLE, 0x26, 0x27, DLE, ETX, 0x28, ETX ]));

		});

	});

	describe("control bits", () => {

		it("should end with no control bit", () => {

			return new Promise((resolve, reject) => {

				new SplitFrames({
					"startWith": STX,
					"endWith": ETX,
					"controlBits": "none"
				}).once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x20, 0x21, 0x22, 0x24, ETX ]), "The chunk is not as expected");

					resolve();

				// tested frame
				}).write(Buffer.from([ 0x24, STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x24 ]));

			});

		});

		it("should end with one control bit", () => {

			return new Promise((resolve, reject) => {

				new SplitFrames({
					"startWith": STX,
					"endWith": ETX,
					"controlBits": "end+1"
				}).once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07 ]), "The chunk is not as expected");

					resolve();

				// tested frame
				}).write(Buffer.from([ 0x24, STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x24 ]));

			});

		});

		it("should end with two control bits", () => {

			return new Promise((resolve, reject) => {

				new SplitFrames({
					"startWith": STX,
					"endWith": ETX,
					"controlBits": "end+2"
				}).once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, Buffer.from([ STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x24 ]), "The chunk is not as expected");

					resolve();

				// tested frame
				}).write(Buffer.from([ 0x24, STX, 0x20, 0x21, 0x22, 0x24, ETX, 0x07, 0x24 ]));

			});

		});

	});

	// made by 07ke

	describe("with splitted chunks", () => {

		const startWith = Buffer.from([ 0x28, 0x54, 0x59, 0x50, 0x45, 0x3a ])
		const endWith = Buffer.from([ 0x29 ])

		const splitter = new SplitFrames({
			"startWith": startWith,
			"endWith": endWith
		});

		const readder = new Readable({
			read() {}
		});

		const piped = readder.pipe(splitter);

		it("should end with waited full chunk", () => {

			const fullFrame = Buffer.concat([ startWith, Buffer.from([ 0x30, 0x31, 0x31, 0x31 ]), endWith ]);

			return new Promise((resolve, reject) => {

				piped.once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, fullFrame, "The chunk is not as expected");

					resolve();

				});

				readder.push(fullFrame);

			});

		});

		it("should test splitted chunk", () => {

			const fullFrame = Buffer.concat([ startWith, Buffer.from([ 0x30, 0x31, 0x31, 0x32 ]), endWith ]);

			return new Promise((resolve, reject) => {

				piped.once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, fullFrame, "The chunk is not as expected");

					resolve();

				});

				readder.push(Buffer.from([ 0x28 ]));
				readder.push(Buffer.from([ 0x54, 0x59, 0x50, 0x45, 0x3a, 0x30, 0x31, 0x31, 0x32, 0x29 ]));

			});

		});

		it("should test splitted chunk", () => {

			const fullFrame = Buffer.concat([ startWith, Buffer.from([ 0x30, 0x31, 0x31, 0x33 ]), endWith ]);

			return new Promise((resolve, reject) => {

				piped.once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, fullFrame, "The chunk is not as expected");

					resolve();

				});

				readder.push(Buffer.from([0x28, 0x54]));
				readder.push(Buffer.from([0x59, 0x50, 0x45, 0x3a, 0x30, 0x31, 0x31, 0x33, 0x29]));

			});

		});

		it("should test splitted chunk", () => {

			const fullFrame = Buffer.concat([ startWith, Buffer.from([ 0x30, 0x31, 0x31, 0x34 ]), endWith ]);

			return new Promise((resolve, reject) => {

				piped.once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, fullFrame, "The chunk is not as expected");

					resolve();

				});

				readder.push(Buffer.from([0x28, 0x54, 0x59]));
				readder.push(Buffer.from([0x50, 0x45, 0x3a, 0x30, 0x31, 0x31, 0x34, 0x29]));

			});

		});

		it("should test splitted chunk", () => {

			const fullFrame = Buffer.concat([ startWith, Buffer.from([ 0x30, 0x31, 0x31, 0x35 ]), endWith ]);

			return new Promise((resolve, reject) => {

				piped.once("error", reject).once("data", (chunk) => {

					assert.strictEqual(typeof chunk, "object", "The chunk is not an object");
					assert.strictEqual(chunk instanceof Buffer, true, "The chunk is not a Buffer");
					assert.deepStrictEqual(chunk, fullFrame, "The chunk is not as expected");

					resolve();

				});

				readder.push(Buffer.from([0x28, 0x54, 0x59, 0x50, 0x45, 0x3a]));
				readder.push(Buffer.from([0x30, 0x31, 0x31, 0x35, 0x29]));

			});

		});

	});

});
