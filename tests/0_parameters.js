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

	it("should check with inexistant option", () => {

		assert.throws(() => {
			new SplitFrames({
				"test": "test"
			});
		}, Error);

	});

	describe("basic validations", () => {

		it("should check with wrong start tag", () => {

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

		it("should check with wrong end tag", () => {

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

		it("should check with wrong escapeWith tag", () => {

			assert.throws(() => {
				new SplitFrames({
					"escapeWith": "test"
				});
			}, Error);

			assert.throws(() => {
				new SplitFrames({
					"escapeWith": [ "test" ]
				});
			}, Error);

		});

		it("should check with wrong specifics tag", () => {

			assert.throws(() => {
				new SplitFrames({
					"specifics": "test"
				});
			}, Error);

			assert.throws(() => {
				new SplitFrames({
					"specifics": {
						"nak": "test"
					}
				});
			}, Error);

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
			}, Error);

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
