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

		if ("undefined" !== typeof options && "object" !== typeof options) {
			throw new Error("parameter sended is not an object");
		}
		else if ("undefined" === typeof options) {

			this.start = null;
			this.end = null;
			this.escapeWith = null;
			this.escaped = [];

		}
		else {

			this.start = "undefined" !== typeof options.start ? options.start : null;
			this.end = "undefined" !== typeof options.end ? options.end : null;
			this.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : null;
			this.escaped = "undefined" !== typeof options.escaped ? options.escaped : [];

		}

		this.frame = Buffer.from([]);
		this.digesting = false;

		_debug("constructor", "start", this.start, "end", this.end, "escapeWith", this.escapeWith, "escaped", this.escaped);

	}

	_searchTag (isThereEscape, tag, beginAt = 0) {

		_debug("_searchTag", isThereEscape, tag, beginAt);

		// if not concerned by escape
		if (!isThereEscape || !this.escaped.includes(tag)) {
			return this.frame.indexOf(tag, beginAt);
		}

		// if concerned by escape
		else {

			let foundAt = this.frame.indexOf(tag, beginAt);

				_debug(
					foundAt, 0 < foundAt,
					this.frame[foundAt - 1] === this.escapeWith
				);

				if (
					// if not found, nothing to do
					0 < foundAt &&
					// if first one not escaped, nothing to do
					this.frame[foundAt - 1] === this.escapeWith
				) {
					foundAt = this._searchTag(isThereEscape, tag, foundAt + 1);
				}

				_debug("result", foundAt);

			return foundAt;

		}

	}

	_removeEscapeTag (msg) {

		_debug("_removeEscapeTag");

		const content = [];

			for (let i = 0; i < msg.length; ++i) {

				// end of message or not escaper
				if (i === msg.length - 1 || this.escapeWith !== msg[i]) {
					content.push(msg[i]);
				}

				// escaper with escaped character
				else if (this.escaped.includes(msg[i + 1])) {
					content.push(msg[i + 1]); ++i;
				}

				// escaper without escaped character
				else {
					content.push(msg[i]);
				}

			}

			_debug(Buffer.from(content));

		return Buffer.from(content);

	}

	_digestNoStartNoEnd (isThereEscape) {

		_debug("neither start or end");

		this.push(
			isThereEscape ?
				this._removeEscapeTag(this.frame.slice(0, this.frame.length)) :
				Buffer.from(this.frame.slice(0, this.frame.length))
		);

		this.frame = Buffer.from([]);

		this.digesting = false;

	}

	_digestStartOnly (isThereEscape) {

		_debug("only start");

		const firstStartAt = this._searchTag(isThereEscape, this.start);

		// no start tag detected
		if (-1 >= firstStartAt) {

			_debug("no start tag detected");

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// first start tag detected
		else {

			_debug("first start tag detected at", firstStartAt);

			let nextStartAt = this._searchTag(isThereEscape, this.start, firstStartAt + 1);

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

				this.push(
					isThereEscape ?
						this._removeEscapeTag(this.frame.slice(firstStartAt + startSize, nextStartAt)) :
						Buffer.from(this.frame.slice(firstStartAt + startSize, nextStartAt))
				);

				this.frame = Buffer.from(this.frame.slice(nextStartAt, this.frame.length));

				nextStartAt = this._searchTag(isThereEscape, this.start, 1);

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

	_digestEndOnly (isThereEscape) {

		_debug("only end");

		const firstEndAt = this._searchTag(isThereEscape, this.end);

		// no end tag detected
		if (-1 >= firstEndAt) {

			_debug("no end tag detected");
			this.digesting = false;

		}

		// first end tag detected
		else {

			_debug("first end tag detected at", firstEndAt);

			const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

			this.push(
				isThereEscape ?
					this._removeEscapeTag(this.frame.slice(0, firstEndAt)) :
					Buffer.from(this.frame.slice(0, firstEndAt))
			);

			this.frame = Buffer.from(this.frame.slice(firstEndAt + endSize, this.frame.length));

			const nextEndAt = this._searchTag(isThereEscape, this.end, 1);

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

	_digestStartAndEndOnly (isThereEscape) {

		_debug("start & end");

		const startAt = this._searchTag(isThereEscape, this.start);

		// no start tag detected
		if (-1 >= startAt) {

			_debug("no start tag detected");

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// start tag detected
		else {

			_debug("start tag detected at", startAt);

			const endAt = this._searchTag(isThereEscape, this.end, startAt + 1);

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

				this.push(
					isThereEscape ?
						this._removeEscapeTag(this.frame.slice(startAt + startSize, endAt)) :
						Buffer.from(this.frame.slice(startAt + startSize, endAt))
				);

				this.frame = Buffer.from(this.frame.slice(endAt + endSize, this.frame.length));

				const nextStartAt = this._searchTag(isThereEscape, this.end, 1);

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

				if (null === this.start && null === this.end) {
					this._digestNoStartNoEnd("undefined" !== typeof this.escapeWith);
				}
				else if (null !== this.start && null === this.end) {
					this._digestStartOnly("undefined" !== typeof this.escapeWith);
				}
				else if (null === this.start && null !== this.end) {
					this._digestEndOnly("undefined" !== typeof this.escapeWith);
				}
				else {
					this._digestStartAndEndOnly("undefined" !== typeof this.escapeWith);
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
