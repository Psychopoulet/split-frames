/*
	eslint no-new: 0
*/

"use strict";

// deps

	const assert = require("assert");
	const SplitFrames = require(require("path").join(__dirname, "..", "lib", "main.js"));

// consts

	const ACK = 0x06;
	const NAK = 0x15;
	const STX = 0x02;
	const ETX = 0x03;

// module

describe("parameters", () => {

	it("should check with wrong options", () => {

		assert.throws(() => {
			new SplitFrames(false);
		}, Error);

	});

	it("should check with wrong start tag", () => {

		assert.throws(() => {
			new SplitFrames({
				"start": "test"
			});
		}, Error);

		assert.throws(() => {
			new SplitFrames({
				"start": [ "test" ]
			});
		}, Error);

	});

	it("should check with wrong end tag", () => {

		assert.throws(() => {
			new SplitFrames({
				"end": "test"
			});
		}, Error);

		assert.throws(() => {
			new SplitFrames({
				"end": [ "test" ]
			});
		}, Error);

	});

	it("should check with wrong ack tag", () => {

		assert.throws(() => {
			new SplitFrames({
				"ack": "test"
			});
		}, Error);

		assert.throws(() => {
			new SplitFrames({
				"ack": [ "test" ]
			});
		}, Error);

	});

	it("should check with wrong nak tag", () => {

		assert.throws(() => {
			new SplitFrames({
				"nak": "test"
			});
		}, Error);

		assert.throws(() => {
			new SplitFrames({
				"nak": [ "test" ]
			});
		}, Error);

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

	it("should check ack tag with start only", () => {

		assert.throws(() => {
			new SplitFrames({
				"ack": ACK,
				"start": STX
			});
		}, Error);

	});

	it("should check ack tag with end only", () => {

		assert.throws(() => {
			new SplitFrames({
				"ack": ACK,
				"end": ETX
			});
		}, Error);

	});

	it("should check nak tag with start only", () => {

		assert.throws(() => {
			new SplitFrames({
				"nak": NAK,
				"start": STX
			});
		}, Error);

	});

	it("should check nak tag with end only", () => {

		assert.throws(() => {
			new SplitFrames({
				"nak": NAK,
				"end": ETX
			});
		}, Error);

	});

});
