/*
	eslint no-implicit-globals: 0
*/

"use strict";

// private

	// methods

		/**
		* Test tag validity
		* @param {number|Array} tag : tag checked
		* @returns {bool} Tag alidity
		*/
		function _checkStartOrEndTag (tag) {

			let result = true;

				if (
					"number" !== typeof tag && "object" !== typeof tag && !(tag instanceof Array || tag instanceof Buffer)
				) {
					result = false;
				}
				else if ("object" === typeof tag && tag instanceof Array) {

					for (let i = 0; i < tag.length; ++i) {

						if ("number" !== typeof tag[i]) {
							result = false; break;
						}

					}

				}

			return result;

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

		else if ("undefined" !== typeof options.start && !_checkStartOrEndTag(options.start)) {
			throw new Error("start parameter sended is not a number, or an Array of numbers");
		}
		else if ("undefined" !== typeof options.end && !_checkStartOrEndTag(options.end)) {
			throw new Error("end parameter sended is not a number, or an Array of numbers");
		}
		else if ("undefined" !== typeof options.escapeWith && "number" !== typeof options.escapeWith) {
			throw new Error("escapeWith parameter sended is not a number");
		}

		else {

			this.start = "undefined" !== typeof options.start ? options.start : null;
			this.end = "undefined" !== typeof options.end ? options.end : null;
			this.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : null;
			this.escaped = "undefined" !== typeof options.escaped ? options.escaped : [];

		}

		this.frame = Buffer.from([]);
		this.digesting = false;

	}

	_searchTag (isThereEscape, tag, beginAt = 0) {

		// if not concerned by escape
		if (!isThereEscape) {

			if ("object" === typeof tag && tag instanceof Array) {

				// @TODO : different starters
				// (0, console).log("not concerned by escape");
				// (0, console).log(isThereEscape, tag, beginAt);

				let foundAt = -1;

					for (let i = 0; i < tag.length; ++i) {

						foundAt = this._searchTag(isThereEscape, tag[i], beginAt);

						if (-1 < foundAt) {
							break;
						}

					}

				return foundAt;

			}
			else {
				return this.frame.indexOf(tag, beginAt);
			}

		}

		// if concerned by escape
		else {

			let foundAt = -1;

				if ("number" === typeof tag) {

					foundAt = this.frame.indexOf(tag, beginAt);

					if (
						// if not found, nothing to do
						0 < foundAt &&
						// if first one not escaped, nothing to do
						this.frame[foundAt - 1] === this.escapeWith
					) {
						foundAt = this._searchTag(isThereEscape, tag, foundAt + 1);
					}

				}
				else {

					// @TODO : different starters
					// (0, console).log("concerned by escape");
					// (0, console).log(isThereEscape, tag, beginAt);

					for (let i = 0; i < tag.length; ++i) {

						foundAt = this._searchTag(isThereEscape, tag[i], beginAt);

						if (-1 < foundAt) {
							break;
						}

					}

				}

			return foundAt;

		}

	}

	_removeEscapeTag (msg) {

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

		return Buffer.from(content);

	}

	_digestNoStartNoEnd (isThereEscape) {

		this.push(
			isThereEscape ?
				this._removeEscapeTag(this.frame.slice(0, this.frame.length)) :
				Buffer.from(this.frame.slice(0, this.frame.length))
		);

		this.frame = Buffer.from([]);

		this.digesting = false;

	}

	_digestStartOnly (isThereEscape) {

		const firstStartAt = this._searchTag(isThereEscape, this.start);

		// no start tag detected
		if (-1 >= firstStartAt) {

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// first start tag detected
		else {

			let nextStartAt = this._searchTag(isThereEscape, this.start, firstStartAt + 1);

			// second start tag not detected
			if (-1 >= nextStartAt) {

				// remove useless bits
				if (0 < firstStartAt) {
					this.frame = Buffer.from(this.frame.slice(firstStartAt, this.frame.length));
				}

				this.digesting = false;

			}

			// second start tag detected
			else {

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
					this._digest();
				}
				else {
					this.digesting = false;
				}

			}

		}

	}

	_digestEndOnly (isThereEscape) {

		const firstEndAt = this._searchTag(isThereEscape, this.end);

		// no end tag detected
		if (-1 >= firstEndAt) {
			this.digesting = false;
		}

		// first end tag detected
		else {

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
				this._digest();
			}
			else {
				this.digesting = false;
			}

		}

	}

	_digestStartAndEndOnly (isThereEscape) {

		const startAt = this._searchTag(isThereEscape, this.start);

		// no start tag detected
		if (-1 >= startAt) {

			this.frame = Buffer.from([]);
			this.digesting = false;

		}

		// start tag detected
		else {

			const endAt = this._searchTag(isThereEscape, this.end, startAt + 1);

			// end tag not detected
			if (-1 >= endAt) {

				// remove useless bits
				if (0 < startAt) {
					this.frame = Buffer.from(this.frame.slice(startAt, this.frame.length));
				}

				this.digesting = false;

			}

			// end tag detected
			else {

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

				if (null === this.start && null === this.end) {
					this._digestNoStartNoEnd("undefined" !== typeof this.escapeWith && null !== this.escapeWith);
				}
				else if (null !== this.start && null === this.end) {
					this._digestStartOnly("undefined" !== typeof this.escapeWith && null !== this.escapeWith);
				}
				else if (null === this.start && null !== this.end) {
					this._digestEndOnly("undefined" !== typeof this.escapeWith && null !== this.escapeWith);
				}
				else {
					this._digestStartAndEndOnly("undefined" !== typeof this.escapeWith && null !== this.escapeWith);
				}

			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		this.frame = chunk.length ? Buffer.concat([ this.frame, chunk ]) : this.frame;

		if (!this.digesting) {
			this._digest();
		}

		cb();

	}

};
