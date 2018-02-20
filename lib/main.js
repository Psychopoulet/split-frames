/*
	eslint no-implicit-globals: 0
*/

"use strict";

// consts

	const DEBUG = false;

// private

	/**
	* Print debug data in console if debug mode
	* @param {Array} msg : data to print
	* @returns {void}
	*/
	function _debug (...msg) {
		return DEBUG ? (0, console).log(...msg) : null;
	}

// module

module.exports = class SplitFrames extends require("stream").Transform {

	constructor (options) {

		super(options);

		this.frame = Buffer.from([]);
		this.digesting = false;

		// @TODO : escape

		if ("object" !== typeof options) {

			this.start = null;
			this.end = null;
			// this.escapeWith = null;
			// this.escaped = [];

		}
		else {

			this.start = options.start ? options.start : null;
			this.end = options.end ? options.end : null;
			// this.escapeWith = options.escapeWith ? options.escapeWith : null;
			// this.escaped = options.escaped ? options.escaped : [];

		}

		_debug("constructor", "start", this.start, "end", this.end);
		// _debug("constructor", "start", this.start, "end", this.end, "escapeWith", this.escapeWith, "escaped", this.escaped);

	}

	_digestNoStartNoEnd () {

		_debug("neither start or end");

		this.push(Buffer.from(this.frame.slice(0, this.frame.length)));
		this.frame = Buffer.from([]);

		this.digesting = false;

	}

	_digestStartOnly () {

		_debug("only start");

		const firstStartAt = this.frame.indexOf(this.start);

		// no start tag detected
		if (-1 >= firstStartAt) {

			_debug("no start tag detected");

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// first start tag detected
		else {

			_debug("first start tag detected at", firstStartAt);

			let nextStartAt = this.frame.indexOf(this.start, firstStartAt + 1);

			// second start tag not detected
			if (-1 >= nextStartAt) {

				_debug("second start tag not detected");

				// remove useless bits
				if (0 < firstStartAt) {
					this.frame = Buffer.from(this.frame.slice(firstStartAt, this.frame.length));
				}

				this.digesting = false;

			}

			// second start tag detected
			else {

				_debug("second start tag detected at", nextStartAt);

				const startSize = "object" === typeof this.start && this.start instanceof Buffer ? this.start.length : 1;

				this.push(Buffer.from(this.frame.slice(firstStartAt + startSize, nextStartAt)));
				this.frame = Buffer.from(this.frame.slice(nextStartAt, this.frame.length));

				nextStartAt = this.frame.indexOf(this.start, 1);

				// second full frame detected
				if (-1 < nextStartAt) {

					_debug("second full frame detected");

					this._digest();

				}
				else {
					this.digesting = false;
				}

			}

		}

	}

	_digestEndOnly () {

		_debug("only end");

		const firstEndAt = this.frame.indexOf(this.end);

		// no end tag detected
		if (-1 >= firstEndAt) {

			_debug("no end tag detected");
			this.digesting = false;

		}

		// first end tag detected
		else {

			_debug("first end tag detected at", firstEndAt);

			const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

			this.push(Buffer.from(this.frame.slice(0, firstEndAt)));
			this.frame = Buffer.from(this.frame.slice(firstEndAt + endSize, this.frame.length));

			const nextEndAt = this.frame.indexOf(this.end, 1);

			// second full frame detected
			if (-1 < nextEndAt) {

				_debug("second full frame detected");

				this._digest();

			}
			else {
				this.digesting = false;
			}

		}

	}

	_digestStartAndEndOnly () {

		_debug("start & end");

		const startAt = this.frame.indexOf(this.start);

		// no start tag detected
		if (-1 >= startAt) {

			_debug("no start tag detected");

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// start tag detected
		else {

			_debug("start tag detected at", startAt);

			const endAt = this.frame.indexOf(this.end, startAt + 1);

			// end tag not detected
			if (-1 >= endAt) {

				_debug("end tag not detected");

				// remove useless bits
				if (0 < startAt) {
					this.frame = Buffer.from(this.frame.slice(startAt, this.frame.length));
				}

				this.digesting = false;

			}

			// end tag detected
			else {

				_debug("end tag detected at", endAt);

				const startSize = "object" === typeof this.start && this.start instanceof Buffer ? this.start.length : 1;
				const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

				this.push(Buffer.from(this.frame.slice(startAt + startSize, endAt)));
				this.frame = Buffer.from(this.frame.slice(endAt + endSize, this.frame.length));

				const nextStartAt = this.frame.indexOf(this.end, 1);

				// start frame detected
				if (-1 < nextStartAt) {

					_debug("second full frame detected");

					this._digest();

				}
				else {
					this.digesting = false;
				}

			}

		}

	}

	_digest () {

		if (!this.frame.length) {
			this.digesting = false;
		}
		else {

			this.digesting = true;

			try {

				_debug("_digest", this.frame);

				// neither start or end
				if (null === this.start && null === this.end) {
					this._digestNoStartNoEnd();
				}

				// only start
				else if (null !== this.start && null === this.end) {
					this._digestStartOnly();
				}

				// only end
				else if (null === this.start && null !== this.end) {
					this._digestEndOnly();
				}

				// start & end
				else {
					this._digestStartAndEndOnly();
				}

			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		_debug("_transform", chunk);

		this.frame = chunk.length ? Buffer.concat([ this.frame, chunk ]) : this.frame;

		if (!this.digesting) {
			this._digest();
		}

		cb();

	}

};
