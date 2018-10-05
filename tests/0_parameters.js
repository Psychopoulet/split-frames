/*
	eslint no-new: 0
*/

"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const STX = 0x02;
	const ETX = 0x03;
	const ACK = 0x06;
	const WAK = 0x13;
	const NAK = 0x15;

// module

describe("parameters", () => {

	it("should check with wrong options", () => {

		assert.throws(() => {
			new SplitFrames(false);
		}, TypeError);

	});

	describe("basic validations", () => {

		describe("start tag", () => {

			it("should check with wrong parameter", () => {

				assert.throws(() => {
					new SplitFrames({
						"startWith": "test"
					});
				}, TypeError);

				assert.throws(() => {
					new SplitFrames({
						"startWith": [ "test" ]
					});
				}, TypeError);

			});

			it("should check with right parameter", () => {

				assert.doesNotThrow(() => {
					new SplitFrames({
						"startWith": 0x02
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"startWith": [ 0x02, 0x03 ]
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"startWith": [ Buffer.from([ 0x02 ]) ]
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"startWith": [ Buffer.from([ 0x02 ]), Buffer.from([ 0x03 ]) ]
					});
				});

			});

		});

		describe("start timeout tag", () => {

			it("should check with wrong parameter", () => {

				assert.throws(() => {
					new SplitFrames({
						"startTimeout": "test"
					});
				}, TypeError);

			});

			it("should check with right parameter", () => {

				assert.doesNotThrow(() => {
					new SplitFrames({
						"startTimeout": 200
					});
				});

			});

		});

		describe("end tag", () => {

			it("should check with wrong parameter", () => {

				assert.throws(() => {
					new SplitFrames({
						"endWith": "test"
					});
				}, TypeError);

				assert.throws(() => {
					new SplitFrames({
						"endWith": [ "test" ]
					});
				}, TypeError);

			});

			it("should check with right parameter", () => {

				assert.doesNotThrow(() => {
					new SplitFrames({
						"endWith": 0x02
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"endWith": [ 0x02, 0x03 ]
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"endWith": [ Buffer.from([ 0x02 ]) ]
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"endWith": [ Buffer.from([ 0x02 ]), Buffer.from([ 0x03 ]) ]
					});
				});

			});

		});

		describe("escapeWith tag", () => {

			it("should check with wrong parameter", () => {

				assert.throws(() => {
					new SplitFrames({
						"escapeWith": "test"
					});
				}, TypeError);

				assert.throws(() => {
					new SplitFrames({
						"escapeWith": [ "test" ]
					});
				}, TypeError);

			});

			it("should check with right parameter", () => {

				assert.doesNotThrow(() => {
					new SplitFrames({
						"escapeWith": 0x02
					});
				});

			});

		});

		describe("specifics tag", () => {

			it("should check with wrong parameter", () => {

				assert.throws(() => {
					new SplitFrames({
						"specifics": "test"
					});
				}, TypeError);

				assert.throws(() => {
					new SplitFrames({
						"specifics": {
							"nak": "test"
						}
					});
				}, Error);

				assert.throws(() => {
					new SplitFrames({
						"specifics": {
							"nak": [ "test" ]
						}
					});
				}, Error);

			});

			it("should check with right parameter", () => {

				assert.doesNotThrow(() => {
					new SplitFrames({
						"specifics": {
							"nak": 0x02
						}
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"specifics": {
							"nak": [ 0x02, 0x03 ]
						}
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"specifics": {
							"nak": [ Buffer.from([ 0x02 ]) ]
						}
					});
				});

				assert.doesNotThrow(() => {
					new SplitFrames({
						"specifics": {
							"nak": [ Buffer.from([ 0x02 ]), Buffer.from([ 0x03 ]) ]
						}
					});
				});

			});

		});

	});

	describe("specific tag validations with start and/or end", () => {

		it("should check ack tag with start only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"ack": ACK
					},
					"startWith": STX
				});
			}, Error);

		});

		it("should check ack tag with end only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"ack": ACK
					},
					"endWith": ETX
				});
			}, Error);

		});

		it("should check nak tag with start only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"nak": NAK
					},
					"startWith": STX
				});
			}, Error);

		});

		it("should check nak tag with end only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"nak": NAK
					},
					"endWith": ETX
				});
			}, Error);

		});

		it("should check wak tag with start only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"wak": WAK
					},
					"startWith": STX
				});
			}, Error);

		});

		it("should check wak tag with end only", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"wak": WAK
					},
					"endWith": ETX
				});
			}, Error);

		});

	});

	describe("control bits", () => {

		it("should check controlBits type", () => {

			assert.throws(() => {
				new SplitFrames({
					"controlBits": false
				});
			}, TypeError);

		});

		it("should check controlBits value", () => {

			assert.throws(() => {
				new SplitFrames({
					"controlBits": "end+3"
				});
			}, Error);

		});

	});

});
