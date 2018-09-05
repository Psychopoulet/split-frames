/*
	eslint no-implicit-globals: 0, no-extra-parens: 0, complexity: [ "error", { "max": 25 } ]
*/

"use strict";

// deps

	const { join } = require("path");

	const _digestNoStartNoEnd = require(join(__dirname, "digesters", "digestNoStartNoEnd.js"));
	const _digestStartOnly = require(join(__dirname, "digesters", "digestStartOnly.js"));
	const _digestEndOnly = require(join(__dirname, "digesters", "digestEndOnly.js"));
	const _digestStartAndEnd = require(join(__dirname, "digesters", "digestStartAndEnd.js"));

	const _initData = require(join(__dirname, "checkers", "initData.js"));

	const _searchEscapedTags = require(join(__dirname, "searchers", "searchEscapedTags.js"));
	const _searchUnescapedTags = require(join(__dirname, "searchers", "searchUnescapedTags.js"));

// private

	// methods

		/**
		* Test tags compatibility
		* @param {number|Array} startWith : startWith tags
		* @param {number|Array} endWith : endWith tags
		* @returns {function} digester
		*/
		function _chooseDigester (startWith, endWith) {

			let digester = null;

				if (null === startWith && null === endWith) {
					digester = _digestNoStartNoEnd;
				}
				else if (null !== startWith && null === endWith) {
					digester = _digestStartOnly;
				}
				else if (null === startWith && null !== endWith) {
					digester = _digestEndOnly;
				}
				else {
					digester = _digestStartAndEnd;
				}

			return digester;

		}

// module

module.exports = class SplitFrames extends require("stream").Transform {

	constructor (options) {

		super(options);

		const validatedOptions = _initData(options);

		this._startWith = validatedOptions.startWith;
		this._endWith = validatedOptions.endWith;

		this._escapeWith = validatedOptions.escapeWith;
		this._escaped = validatedOptions.escaped;

		this._specifics = validatedOptions.specifics;

		this._frame = Buffer.from([]);
		this._digesting = false;

		this._digester = _chooseDigester(this._startWith, this._endWith);

		this._controlBits = validatedOptions.controlBits;

	}

	_searchFirstStart () {

		const startAt = this._searchTags(this._startWith);

		// no start tag detected
		if (-1 >= startAt) {
			return null;
		}
		else {

			const endAt = startAt + ("object" === typeof this._startWith && this._startWith instanceof Buffer ? this._startWith.length : 1);

			// start tag detected but without valid start bit length
			if (endAt > this._frame.length) {
				return null;
			}
			else {

				return {
					"start": startAt,
					"end": endAt
				};

			}

		}

	}

	_searchFirstEnd () {

		const startAt = this._searchTags(this._endWith);

		// no end tag detected
		if (-1 >= startAt) {
			return null;
		}
		else {

			let endAt = startAt + ("object" === typeof this._endWith && this._endWith instanceof Buffer ? this._endWith.length : 1);

			// end tag detected but without valid end bit length
			if (endAt > this._frame.length) {
				return null;
			}
			else {

				switch (this._controlBits) {

					case "end+1":
						endAt += 1;
					break;

					case "end+2":
						endAt += 2;
					break;

					default:
						endAt += 0;
					break;

				}

				// end tag detected but without valid control bits length
				if (endAt > this._frame.length) {
					return null;
				}
				else {

					return {
						"start": startAt,
						"end": endAt
					};

				}

			}

		}

	}

	_searchTags (tag, beginAt = 0) {

		// if not concerned by escape
		if (
			null === this._escapeWith ||
			("number" === typeof tag && !this._escaped.includes(tag)) ||
			("object" === typeof tag && tag instanceof Array && !tag.filter((_tag) => {
				return this._escaped.includes(_tag);
			}).length)
		) {

			return _searchUnescapedTags(this._frame, tag, beginAt);

		}

		// if concerned by escape
		else {

			return _searchEscapedTags(this._frame, tag, this._escapeWith, beginAt);

		}

	}

	_digest () {

		if (!this._frame.length) {
			this._digesting = false;
		}
		else {

			this._digesting = true;

			try {
				this._digester();
			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		if (chunk.length) {

			this._frame = Buffer.concat([ this._frame, chunk ]);

			if (!this._digesting) {
				this._digest();
			}

		}

		cb();

	}

};
